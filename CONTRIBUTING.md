# Contributing

Thanks for helping. `@ponchia/ui` is a CSS-first, framework-agnostic UI
framework consumed by several apps, so the contract (token names, the
`--accent` derivation, `.ui-*` class names, `data-bronto-*` attributes,
behavior return contracts) is treated as load-bearing and is
machine-checked.

## Setup

```bash
npm ci
npm run check   # 12 gates: lint, format, exports, tokens, classes,
                #            dts, types, dtcg, shiki, dist, pack, release
npm test        # node:test unit + type-d + contract tests
```

`main` is protected: changes land via PR, squash-merged, with `check`
and `e2e` green and the branch up to date. Branches auto-delete on
merge.

## Conventions

- **Conventional commits** for PR titles: `feat` / `fix` / `docs` /
  `ci` / `test` / `chore`, with `!` for breaking changes. Pre-1.0,
  breaking changes bump the **minor** (see README → Versioning).
- The CSS is the framework. New components are `.ui-*`, added to the
  `cls` registry in `classes/index.js` — `check-classes` enforces a
  bidirectional match with the stylesheet, and the `.d.ts` are
  **generated** (`npm run dts:build`) and drift-checked, so don't
  hand-edit `classes/index.d.ts` / `tokens/index.d.ts`.
- Generated artifacts (`dist/`, `tokens/index.json`,
  `tokens/tokens.dtcg.json`, the `.d.ts`) are committed; rebuild with
  `npm run prepack` and commit the result.
- Accessibility is a gate, not an afterthought: keyboard paths, both
  themes, RTL, forced-colors and reduced-motion are covered by the e2e
  axe suite. New interactive components need matching coverage.
- Every breaking change gets a **BREAKING** entry in `CHANGELOG.md`
  with a migration note. The changelog is hand-curated — keep it
  narrative and accurate. The version in `package.json` must map to a
  **dated** changelog heading (the `check:release` gate enforces this —
  a published version can never be left marked `unreleased`).

## Deprecation policy

From 0.4.0 onward, public surface (`.ui-*` classes, `data-bronto-*`
attributes, `cls`/token keys, behavior signatures) is removed on a
**deprecate-one-minor** cycle:

1. **Deprecate** in minor _N_: the surface keeps working unchanged, is
   marked deprecated in `CHANGELOG.md`, and — if it is a rename — an
   entry is added to [`MIGRATIONS.json`](MIGRATIONS.json) with a
   `safe`/`manual` classification.
2. **Remove** no earlier than minor _N+1_, with a **BREAKING** entry
   pointing at the migration.

This makes "minor may break" predictable: a consumer who upgrades one
minor at a time always gets a working deprecation window and a
machine-readable rename map. The 0.2 → 0.3 cut predates this policy
(documented in `docs/migrations/0.2-to-0.3.md`).

## Browser floor

Evergreen only: Chrome/Edge 111+, Safari 16.4+, Firefox 121+ (cascade
layers, `:has()`, `color-mix()`, logical properties, native
`<dialog>`). Don't add fallbacks below this; pin an older tag instead.

## Visual baselines

Pixel snapshots (`test/e2e/__screenshots__`) are Linux/Chromium,
authored in the pinned Playwright container — **never regenerate them
on a dev machine** (cross-OS rasterisation differs). After an
intentional visual change, run the **“Update visual baselines”**
workflow (Actions → run `workflow_dispatch`); it rebuilds them in the
container and opens a PR with the new baselines.

## Dependencies

The package has **zero runtime dependencies** and that is a feature —
don't add one. Dev dependencies and GitHub Actions are kept current by
Dependabot (grouped, weekly). `@playwright/test` is intentionally
**not** auto-bumped: it must stay in lockstep with the pinned
`mcr.microsoft.com/playwright` container image, so bump both together
in one deliberate PR.
