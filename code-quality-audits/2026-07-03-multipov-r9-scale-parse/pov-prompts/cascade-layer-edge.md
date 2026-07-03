ROUND 9 multi-POV review of `@ponchia/ui` (bronto-ui). Theme: CORRECTNESS — find REAL,
REPRODUCIBLE DEFECTS. READ-ONLY. FRESH angle: the `@layer` cascade contract under real consumer CSS.

Your lens: **CSS CASCADE / @layer / CONSUMER-INTERACTION EDGE CASES.**
The core promise: everything lives in `@layer bronto`, so a consumer's UN-layered CSS wins with
no specificity fight and no !important. Stress the CASCADE contract:
- The un-layered-wins promise under EDGE cases: a consumer using their OWN `@layer` (does bronto's
  layer order still let un-layered consumer CSS win? what about a consumer layer declared before
  vs after bronto?), `@import` ordering, `revert-layer`/`revert`/`all:revert`, `!important` in a
  layer (which INVERTS layer precedence — does any bronto `!important` in `@layer bronto` now beat
  un-layered consumer CSS, breaking the promise?).
- Layer ORDER integrity: is `@layer bronto` (and any sub-layers) declared exactly once with a
  stable order? Any file that (re)declares layers in a different order, or emits rules OUTSIDE the
  layer that then over-specify? Check css/core.css, css/generated.css, dist assembly
  (scripts/build-dist.mjs), and every css/*.css `@layer` usage.
- Specificity land-mines that survive layering: `:where()`/`:is()` specificity (0 vs the
  argument's), `:has()` specificity, id selectors, chained selectors that a consumer can't
  override even un-layered because of `!important`.
- Custom Highlight / paint order (highlights.css), `@property` inheritance across layers, and
  `all: unset`/`revert` interactions with custom properties.
- The dist flattened vs per-file layered outputs (dist/bronto.css vs dist/css/*): do BOTH preserve
  the same layer semantics, or can loading a per-file leaf break the layer order?

Give a concrete "consumer writes CSS X → bronto rule wins when it shouldn't / order breaks" for each.

--- OUTPUT CONTRACT ---
READ-ONLY. REAL, REPRODUCIBLE DEFECTS only; reason about the cascade precisely. FINAL ANSWER exactly:

# CSS cascade / @layer edge cases — bronto-ui round 9 review
**Verdict:** one paragraph.
## Confirmed defects
- **[P0/P1/P2/P3] [conf HIGH/MED/LOW]** `path:line` — defect.
  - Failure scenario: consumer CSS → cascade breaks the un-layered-wins promise.
  - Fix direction: minimal fix. Mark SAFE-FIX vs NEEDS-DESIGN · (CSS? note bundle-budget/e2e risk).
## Lower-confidence / needs-repro
- bullets.
## Notable (not a bug)
- worth knowing.
Evidence-dense; defects only; no restating this prompt.
