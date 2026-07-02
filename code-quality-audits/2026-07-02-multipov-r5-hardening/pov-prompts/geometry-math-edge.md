ROUND 5 multi-POV review of `@ponchia/ui` (bronto-ui). Theme: CORRECTNESS — find REAL,
REPRODUCIBLE DEFECTS. READ-ONLY.

Your lens: **GEOMETRY & MATH EDGE CASES.**
The library has many geometry/data primitives driven by host-normalized custom properties and
`calc()`. Hunt for math/boundary bugs:
- Host-normalized values (`--v`, `--t`, `--lo`, `--hi`, spark/bullet/interval/dots/crosshair):
  boundary inputs (0, 1, exactly equal, lo>hi, negative, >1, non-number) that produce out-of-box
  rendering, `NaN`/`Infinity` in `calc()`, division-by-zero, or overflow/collapse. Check the
  `calc()` chains in css/spark.css, css/bullet.css, css/interval.css, css/dots.css,
  css/crosshair.css.
- Indexed palette / swatch mapping (legend, charts, dots): off-by-one, modulo wrap, index 0 vs 1
  base, a series index that maps to the wrong or missing `--chart-N`.
- Annotation/figure geometry (annotations/, css/annotations.css, css/figure.css): overlay
  subject/connector coordinate math; zero-size or scaled containers; percentage vs px mismatches.
- `clamp()`/`min()`/`max()` bounds that can invert (min>max) or clamp to the wrong side.
- `@property` typed props whose `initial-value` or `syntax` makes a boundary value invalid.
- Rounding/precision in generated token values or `color-mix()` percentages that push
  out-of-gamut.

For each, give the concrete input value(s) → wrong geometry/number.

--- OUTPUT CONTRACT ---
READ-ONLY. REAL, REPRODUCIBLE DEFECTS only. FINAL ANSWER exactly:

# Geometry & math edge cases — bronto-ui round 5 review
**Verdict:** one paragraph.
## Confirmed defects
- **[P0/P1/P2/P3] [conf HIGH/MED/LOW]** `path:line` — defect.
  - Failure scenario: input value(s) → wrong geometry/number.
  - Fix direction: minimal fix. Mark SAFE-FIX vs NEEDS-DESIGN. Note if the input is out-of-contract
    (docs require host-normalized 0..1) vs in-contract.
## Lower-confidence / needs-repro
- bullets.
## Notable (not a bug)
- worth knowing.
Evidence-dense; defects only; no restating this prompt.
