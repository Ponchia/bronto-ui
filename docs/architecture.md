# Architecture & Decisions

Status: accepted · 2026-05-15 · applies from v0.2.0

## Context

`@ponchia/ui` is the shared design layer for several projects on
different stacks: Astro, SvelteKit, and an
open-ended set of future apps (React, Solid, plain HTML, server-rendered
templates). The question driving this document: is plain CSS the right
universal substrate, or should the framework ship per-framework components?

## Decision

**Plain, class-based CSS is the canonical and only universal layer.** It is
the single artifact every target consumes natively with zero adapter. A
per-framework component library would make every non-chosen framework a
second-class citizen and multiply the maintenance surface for the same button.

The known gaps of a pure-CSS framework — contract visibility, a home for
unavoidable JS, and distribution — are addressed as **thin, optional layers
on top of the CSS, none of which require a framework commitment**:

```
@ponchia/ui
├── css/         canonical universal layer (the framework)         [required]
├── tokens/      design tokens as JS/JSON, for JS/canvas/tooling    [optional]
├── classes/     typed class-name contract + recipe builders         [optional]
└── behaviors/   vanilla, SSR-safe JS for the few stateful widgets  [optional]
```

### Consequences of each layer

- **css/** — wrapped in a single `@layer bronto`. Any un-layered CSS in a
  consumer wins the cascade without specificity wars or `!important`. This is
  a deliberate behavioural change vs. unlayered v0.1.0; consumers pin a tag
  so it ships only on the next version bump.
- **Fonts** — `@font-face` moved out of `tokens.css` into `css/fonts.css`
  with URLs relative to the package (`../fonts/*`), so font hosting is
  decoupled from the token layer and resolves through bundlers or static
  serving without an absolute `/fonts` assumption.
- **tokens/** — `index.js` is the single source; `index.json` is generated.
  `scripts/check-tokens.mjs` fails CI if it drifts from `css/tokens.css`
  (and incidentally guards the intentional dark-palette duplication).
- **classes/** — `cls` is the flat registry; recipes only emit from it;
  `scripts/check-classes.mjs` enforces a bidirectional match with the
  stylesheet's `.ui-*` selectors. The class contract cannot silently rot.
- **behaviors/** — vanilla, dependency-free, side-effect-free on import,
  SSR-safe. Chosen over Web Components (SSR/hydration friction with Astro
  islands and SvelteKit) and over per-framework packages (maintenance
  multiplier). Revisit Web Components only if stateful widgets accumulate.

## Drift control

Every data mirror is backed by a check wired into `npm run check`, run by CI
on every push/PR and again by `release.yml` before publish (see "Release
gating" below), so a version that fails any invariant never reaches npm.

| Invariant                                       | Enforced by         |
| ----------------------------------------------- | ------------------- |
| exports / import graph / `files` consistent     | `check-exports.mjs` |
| `tokens.css` ⇄ `tokens/index.js` ⇄ `.json`      | `check-tokens.mjs`  |
| `classes` `cls` ⇄ `.ui-*` selectors             | `check-classes.mjs` |
| `classes`/`tokens` `.d.ts` ⇄ JS runtime (exact) | `check-dts.mjs`     |
| `tokens.dtcg.json` ⇄ token model                | `check-dtcg.mjs`    |
| `shiki/nothing.json` valid + on rationed palette | `check-shiki.mjs`  |
| `dist/*.css` == fresh build of `css/` + budget  | `check-dist.mjs`    |
| published tarball == intended `files` only      | `check-pack.mjs`    |
| CSS style/correctness                           | Stylelint           |

`check-dist` is the most supply-chain-critical row: `dist/bronto.css` is
the default `exports["."]` consumers actually load, so its byte-equality
to a fresh build of `css/` is what makes the committed bundle trustworthy.

## Release gating

`release.yml` (on a pushed `v*` tag) is a four-job DAG:

- `validate` — read-only: `npm run check` + tag↔version match.
- `e2e` — Playwright (visual + axe a11y, both themes, cross-engine) in
  the pinned `mcr.microsoft.com/playwright` container.
- `publish-npm` — `needs: [validate, e2e]`: `npm publish` with provenance.
- `release-notes` — `needs: publish-npm`: a GitHub Release for visibility
  (transitively gated on a successful publish, hence on validate + e2e).

Because the documented install path is the npm package, **the npm publish
is a real gate**: if `validate` *or* `e2e` fails, `publish-npm` never runs,
the version never reaches the registry, and consumers never resolve it.
(Corollary: a flaky `e2e` blocks releases — that is deliberate; fix the
flake, don't bypass the gate.) Permissions are least-privilege per job
(only `release-notes` gets `contents: write`; only `publish-npm` gets
`id-token: write` for provenance).

GitHub still serves the raw tag tarball `archive/refs/tags/vX.Y.Z.tar.gz`
for any tag, ungated — that path is legacy/fallback, deliberately *not* the
documented install, so it is no longer the safeguard-critical surface.
Process still applies: bump `package.json`, land on `main`, go green, tag.

## Decision — distribution: npm public `@ponchia/ui`

Decided 2026-05-15. The framework is consumed by a growing set of
heterogeneous web frontends (Astro, SvelteKit, future React/Solid/vanilla),
several deploying via third-party CI. The only option where onboarding a new
frontend is `npm i @ponchia/ui` with zero per-consumer config is **npm
public**, and it uniquely also closes the release-gating gap (publish *is*
the gate). GitHub Packages was rejected: it requires auth to install even
public packages, i.e. an `.npmrc` + token on every frontend and CI runner —
the exact friction to avoid. The raw tag tarball is kept as an ungated
legacy/fallback only.

The npm scope `@bronto` is not ownable, so the package name is
**`@ponchia/ui`**. Naming layers, intentionally distinct:

- **npm package**: `@ponchia/ui` (registry identity).
- **CSS cascade layer**: `@layer bronto` and `data-bronto-*` behavior
  attributes (the design-system namespace — unchanged; renaming gains
  nothing and risks consumer overrides).
- **Workspace / brand**: "Bronto" (repo `Ponchia/bronto-ui`) — unchanged.

This split is deliberate; the README states it so the apparent mismatch is
explained, not surprising.

### Pre-publish checklist

Done in-repo:

- **LICENSE** — MIT, `Copyright (c) 2026 Ponchia`, `"license": "MIT"`.
  Chosen as a permissive, reversible default for a public personal UI
  lib; change the SPDX id + `LICENSE` file (and holder name) before
  first publish if a different license is wanted.
- **Version** — bumped to `0.2.0`; CHANGELOG section retitled. 0.1.0
  was CSS-only and predates the `tokens`/`classes`/`behaviors`
  entrypoints, so the first npm release is `0.2.0`.

Remaining (npm-account side, cannot be done in-repo):

- **`@ponchia` scope + `NPM_TOKEN`** — create the scope on npm, add an
  automation token with publish rights as the `NPM_TOKEN` repo secret.
- **Consumers** — the consuming apps switch their dependency specifier
  from the tarball URL to `@ponchia/ui` after the first publish
  (separate repos; not changed here).

`publishConfig` is set (`access: public`, `provenance: true`) and
`private` is removed so the gated workflow can publish; local accidental
publish still fails without auth.
