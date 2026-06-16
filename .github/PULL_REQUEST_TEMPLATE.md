<!--
Conventional Commits: title as type(scope): summary — feat / fix / docs /
ci / test / chore, with `!` for breaking changes (pre-1.0 → minor bump).
The CHANGELOG is hand-curated; add your entry under the unreleased
version with a BREAKING note + migration if applicable.
-->

## What & why

## Contract impact

- [ ] No new/renamed token, `.ui-*` class, `cls`/recipe, or
      `data-bronto-*` attribute — **or** it's a breaking change and the
      CHANGELOG has a BREAKING + migration note (pre-1.0 → minor)
- [ ] Token *values* only changed (visual, non-breaking) — or N/A

## Checklist

- [ ] `npm run check` green (lint, exports, tokens, classes, dts, dtcg,
      shiki, dist, pack, types, unit tests, format)
- [ ] Accessibility: keyboard + both themes considered; e2e/a11y updated
      if a component changed
- [ ] Generated artifacts rebuilt and committed (`npm run prepack`)
- [ ] Docs updated (README / theming.md / architecture.md) if the
      public surface changed
