# Geometry & math edge cases — bronto-ui round 5 review
**Verdict:** Found five reproducible geometry defects: two crosshair placement bugs, one reversed interval endpoint bug, and two valid-zero value floors that misstate normalized data.

## Confirmed defects
- **[P2] [conf HIGH]** `behaviors/crosshair.js:81` — crosshair coordinates use the plot border-box while the overlay is positioned from the padding box.
  - Failure scenario: `position:relative; box-sizing:border-box; width:200px; height:100px; border:10px solid transparent`; pointer at content-left gives `--crosshair-x:10px`, but overlay starts at x=10, so the rule lands at x=20, 10px off pointer. In-contract.
  - Fix direction: SAFE-FIX: compute CSS coordinates from `overlay.getBoundingClientRect()` or subtract border offsets; add bordered-plot coverage.

- **[P2] [conf HIGH]** `behaviors/crosshair.js:92` — readout flip uses only `x / width > 0.5`, ignoring readout width.
  - Failure scenario: 200px plot, gap 0.35rem, long readout clamped to ~188.8px; pointer x=80 sets `after`, so readout spans ~85.6–274.4px and overflows right by ~74px. In-contract.
  - Fix direction: NEEDS-DESIGN: width-aware/clamped placement, or cap readout width to the side that can actually fit.

- **[P2] [conf HIGH]** `css/interval.css:48` — reversed interval endpoints collapse to a 2px tick at `--lo`.
  - Failure scenario: `--lo: .8; --hi: .2` on 100px track → width `max(2px, -60%)` = 2px at 80px, not a 20–80 span or a rejected invalid interval. In-contract as documented; docs do not state `--lo <= --hi`.
  - Fix direction: SAFE-FIX: normalize with `min(var(--lo), var(--hi))` / `max(...)`, or document and test `--lo <= --hi`.

- **[P3] [conf HIGH]** `css/bullet.css:72` — valid zero measure renders non-zero.
  - Failure scenario: `--v: 0` on a 200px bullet track → `inline-size: max(2px, 0%)` = 2px, visually reporting ~1%. In-contract.
  - Fix direction: SAFE-FIX: remove the floor or make missing-value fallback separate from explicit zero.

- **[P3] [conf MED]** `css/spark.css:27` — valid zero spark bar renders non-zero.
  - Failure scenario: `--v: 0` in a 16px-tall spark → `block-size: max(1px, 0%)` = 1px, visually reporting ~6.25%. In-contract, though the docs mention a missing-value 1px floor.
  - Fix direction: NEEDS-DESIGN: preserve missing-value affordance without applying it to explicit zero.

## Lower-confidence / needs-repro
- None beyond the zero-value floor design question above.

## Notable (not a bug)
- `--band-hi < --band-lo` is explicitly out-of-contract for bullets.
- Palette swatch helpers are 1-based and bounded to `--chart-1..8`; no off-by-one found.
- Negative and `>1` normalized values are host-contract violations for spark/bullet/dotgauge; these leaves intentionally do not clamp.