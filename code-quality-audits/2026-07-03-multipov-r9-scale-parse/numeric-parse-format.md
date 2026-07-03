# Numeric parsing / formatting — bronto-ui round 9 review
**Verdict:** Confirmed several reproducible parser defects, mostly from permissive numeric coercion or exact string enum checks on DOM attributes. No filesystem changes made.

## Confirmed defects
- **[P2] [conf HIGH]** `behaviors/table.js:177` — `data-sort-value` handles decimal comma but not Unicode minus before falling back.
  - Failure scenario: `data-sort-value="−3,5"` → explicit parse fails, display fallback drops comma → `-35` → row sorts before `-10` instead of between `-10` and `-1`.
  - Fix direction: SAFE-FIX · normalize Unicode minus/dashes before the explicit `Number` / comma-decimal parse. (JS)

- **[P2] [conf HIGH]** `behaviors/splitter.js:17` — `parseFloat` accepts ARIA range values with units and leaves invalid ARIA in place.
  - Failure scenario: `aria-valuemin="20%" aria-valuemax="80%"` → parses as `20/80` → `syncRangeAttr` preserves `"20%"`/`"80%"` → invalid separator range exposed to AT.
  - Fix direction: SAFE-FIX · use strict numeric parsing for ARIA attrs and rewrite non-canonical values. (JS)

- **[P3] [conf HIGH]** `behaviors/splitter.js:29` — splitter orientation enum is not trimmed.
  - Failure scenario: `data-bronto-splitter="horizontal "` → not equal to `"horizontal"` → falls back to vertical → wrong `aria-orientation` and pointer axis.
  - Fix direction: SAFE-FIX · trim before enum comparison; warn or fallback only after normalization. (JS)

- **[P3] [conf HIGH]** `behaviors/glyph.js:268` — glyph render enum is not trimmed.
  - Failure scenario: `data-bronto-glyph-render="mask "` + `data-bronto-glyph-size="2rem"` → exact compare misses → renders 256-cell dotmatrix and ignores mask size.
  - Fix direction: SAFE-FIX · trim `data-bronto-glyph-render` before comparing to `mask`. (JS)

- **[P3] [conf HIGH]** `behaviors/dismissible.js:18` — whitespace-only dismiss selector is treated as a custom selector, not empty.
  - Failure scenario: `data-bronto-dismiss=" "` → truthy selector path → invalid/empty selector returns no target → alert is not dismissed.
  - Fix direction: SAFE-FIX · trim value; empty after trim should use `[data-bronto-dismissible]`. (JS)

## Lower-confidence / needs-repro
- `classes/index.js:1120` — plain-JS `attrs.progress(null)` / `attrs.progress('')` coerces to determinate `0`; types reject this, so decide whether runtime should treat null/empty as indeterminate.
- `behaviors/toast.js:127` — `duration: ''` coerces to sticky `0`; types say number, but config-derived empty strings can silently disable auto-dismiss.

## Notable (not a bug)
- `behaviors/table.js` explicitly documents display text `3,5` sorting as `35`; the supported escape hatch is `data-sort-value`.
- Connector shape/side enums are already validated and skipped with a warning on invalid values.