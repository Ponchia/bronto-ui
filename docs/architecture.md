# Architecture & Decisions

Status: accepted · 2026-05-15 · applies from v0.1.0

## Context

`@ponchia/ui` is the shared design layer for several personal projects on
different stacks: Astro (`an Astro site`), SvelteKit (`a SvelteKit admin`), and an
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

| Invariant                                   | Enforced by              |
| ------------------------------------------- | ------------------------ |
| exports / import graph / `files` consistent | `check-exports.mjs`      |
| `tokens.css` ⇄ `tokens/index.js` ⇄ `.json`  | `check-tokens.mjs`       |
| `classes` `cls` ⇄ `.ui-*` selectors         | `check-classes.mjs`      |
| CSS style/correctness                       | Stylelint                |

## Release gating

`release.yml` (on a pushed `v*` tag) splits into three jobs:

- `validate` — read-only: `npm run check` + tag↔version match.
- `publish-npm` — `needs: validate`: `npm publish` with provenance.
- `release-notes` — `needs: validate`: a GitHub Release for visibility.

Because the documented install path is the npm package, **the npm publish
is a real gate**: if `validate` fails, `publish-npm` never runs, the version
never reaches the registry, and consumers never resolve it. Permissions are
least-privilege per job (only `release-notes` gets `contents: write`; only
`publish-npm` gets `id-token: write` for provenance).

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
- **Workspace / brand**: "Bronto" (`the workspace`, repo
  `Ponchia/bronto-ui`) — unchanged.

This split is deliberate; the README states it so the apparent mismatch is
explained, not surprising.

### Pre-publish checklist (blockers before the first real `npm publish`)

1. **LICENSE** — none exists. `package.json` declares
   `"license": "SEE LICENSE IN LICENSE"`; a `LICENSE` file must be added.
   The license choice is the owner's and is intentionally not made here.
2. **`NPM_TOKEN`** repo secret — an npm automation token for the
   `@ponchia` scope (scope must be created on npm first).
3. **Version** — `package.json` is still `0.1.0`, which predates the
   `tokens`/`classes`/`behaviors` entrypoints. Bump to `0.2.0` (and
   retitle the CHANGELOG `Unreleased` section) before tagging, so the
   published version honestly reflects its contents.
4. **Consumers** — `an Astro site` / `a SvelteKit admin` must switch their
   dependency specifier from the tarball URL to `@ponchia/ui` (separate
   repos; not changed here per workspace VCS rules).

`publishConfig` is set (`access: public`, `provenance: true`) and
`private` is removed so the gated workflow can publish; local accidental
publish still fails without auth.
