# Architecture & Decisions

Status: accepted · 2026-05-15 · applies from v0.1.0

## Context

`@bronto/ui` is the shared design layer for several personal projects on
different stacks: Astro (`personal-site`), SvelteKit (`polpo-admin`), and an
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
@bronto/ui
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

Every data mirror is backed by a check wired into `npm run check` (CI on
every push/PR, and gating the release tag):

| Invariant                                   | Enforced by              |
| ------------------------------------------- | ------------------------ |
| exports / import graph / `files` consistent | `check-exports.mjs`      |
| `tokens.css` ⇄ `tokens/index.js` ⇄ `.json`  | `check-tokens.mjs`       |
| `classes` `cls` ⇄ `.ui-*` selectors         | `check-classes.mjs`      |
| CSS style/correctness                       | Stylelint                |

## Open decision — distribution

Consumers currently pin a GitHub release tarball
(`archive/refs/tags/vX.Y.Z.tar.gz`). It is reproducible but every upgrade is a
hand-edited URL, and `package.json` is still `private: true` as a safety.

Moving to a published package is the biggest "easily available everywhere"
lever, but it needs an account/registry decision that is intentionally **not**
made here:

- **npm public** under a real scope — simplest for consumers (`npm i`,
  semver, Renovate), requires reserving the scope. Note `@bronto` may not be
  available; the package may need to be renamed (e.g. `@ponchia/ui`).
- **GitHub Packages** — no extra account, but requires the scope to match the
  GitHub owner (`@ponchia/...`) and consumers to configure an `.npmrc`.
- **Status quo** — keep the tarball pin; fine until upgrade friction bites.

Until this is decided, `private: true` stays and the tarball flow is
documented in the README. `publishConfig` is intentionally unset.
