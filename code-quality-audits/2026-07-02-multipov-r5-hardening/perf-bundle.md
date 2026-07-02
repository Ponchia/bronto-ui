# Performance / bundle / dead code — bronto-ui round 5 review
**Verdict:** No broad dead-CSS problem surfaced: `check:dist`, `check:classes`, and selector ownership all pass, and a repo-wide class/keyframe reachability scan found no zero-reference `.ui-*` classes or keyframes. The actionable issues are small but real: duplicated shipped CSS blocks, removable `@property` registrations in an opt-in leaf, and package-only declaration-map payload.

## Findings
- **[P2] [conf HIGH]** `css/legend.css:108` — categorical swatch rules are dead at runtime because `css/legend.css:145` repeats the same selectors with equal specificity and later fallback values.
  - Impact: ~1.7 kB unpacked across `css/legend.css`, `dist/css/legend.css`, `dist/css/analytical.css`, and `dist/css/report-kit.css`; 416 raw bytes in each generated opt-in bundle copy.
  - Fix direction: SAFE-FIX — update `scripts/check-legend.mjs` to accept `var(--chart-N, var(--accent))`, then delete `css/legend.css:108-138`.

- **[P2] [conf MED]** `css/spotlight.css:14` — five global `@property --spot-*` registrations do not buy the current spotlight animation path.
  - Impact: 402 raw / ~78 gzip bytes in `dist/css/spotlight.css`, plus duplicated copies in `analytical` and `report-kit`; transitions are on `transform`, `inline-size`, and `block-size` at `css/spotlight.css:72`, while JS sets valid px values at `behaviors/spotlight.js:49`.
  - Fix direction: SAFE-FIX for valid public values — remove `@property` blocks at `css/spotlight.css:14-42`; keep `.ui-spotlight` defaults at `css/spotlight.css:45-49`.

- **[P3] [conf HIGH]** `css/tokens.css:278` — high-contrast opt-in declarations are duplicated for `[data-contrast='high']` and `:root[data-contrast='high']`.
  - Impact: small but on the binding bundle: `dist/bronto.css` is 90,620 raw / 15,480 gzip against 91,000 / 15,650, so consolidating saves 123 raw bytes of scarce default-bundle headroom.
  - Fix direction: SAFE-FIX — group selectors as `[data-contrast='high'], :root[data-contrast='high'] { ... }`; specificity for root stays via the second selector.

- **[P3] [conf MED]** `tsconfig.dts.json:8` — declaration maps are shipped for every JS declaration leaf even though TypeScript type resolution does not require them.
  - Impact: 31 `*.d.ts.map` files under exported dirs from `package.json:51-60`, totaling 20.2 kB raw plus 1.1 kB `sourceMappingURL` comments; about 3.5 kB gzip-equivalent packed payload.
  - Fix direction: NEEDS-DESIGN — if source-map editor navigation is not a package contract, set `declarationMap: false`, remove existing maps/comments, and update `check-dts-emit`.

## Lower-confidence / needs-measurement
- `css/motion.css:133` + `css/feedback.css:440` still animate `inset-inline-start` for indeterminate progress; transform rewrite needs visual equivalence proof because the current 45%-wide bar travels parent-relative distance.
- `css/dataviz.css:46` and `css/dataviz.css:47` define `--chart-pattern-7/8`; first-party demos only exercise 1-6, but docs expose `--chart-pattern-1..8`, so removal is not safe without a public contract change.

## Notable (not actionable)
- `npm run size:report` could not complete in this read-only sandbox because `npm pack --dry-run` writes npm cache; direct `buildBundles()` sizing was used instead.
- Doto 400/700/800 are used internally; 500/600/900 are shipped but not fetched unless consumers match those weights, so removing them is not a safe package-contract change.
- No dead keyframes found; every `@keyframes` name in `css/` is referenced by an animation declaration in CSS or generated bundles.