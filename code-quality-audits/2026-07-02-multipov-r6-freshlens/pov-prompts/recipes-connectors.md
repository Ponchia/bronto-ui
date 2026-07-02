ROUND 6 multi-POV review of `@ponchia/ui` (bronto-ui). Theme: CORRECTNESS — find REAL,
REPRODUCIBLE DEFECTS. READ-ONLY. FRESH angle: the typed recipes + connectors/annotations JS
(lightly covered so far).

Your lens: **CLASS RECIPES (classes/) + CONNECTORS + ANNOTATIONS + GLYPH JS.**
Hunt correctness bugs in the JS layers that generate class strings / draw geometry:
- classes/index.js recipes (the `ui.*` factories + helpers): option handling edge cases — an
  option combination that produces a wrong/empty/duplicate class string; a falsy option (0, '',
  false) mishandled; mutually-exclusive options both applied; an option documented/typed but not
  implemented (or vice-versa); `j()`/join helpers dropping or duplicating classes.
- connectors/ (connectors.js + its CSS): the connector geometry/anchoring — coordinate math,
  attachment points, path drawing at edge cases (same source/target, zero distance, off-screen,
  scaled/scrolled container), SVG namespace/attribute correctness.
- annotations/ (annotations.js): subject/connector/note placement math, viewBox/coordinate-space
  handling, the geometry helpers — off-by-one, NaN, wrong units, RTL, resize handling.
- glyphs/ JS (glyph rendering on the dot-matrix): index/lookup correctness, unknown-glyph
  handling, escaping, the GLYPH_NAMES contract.
- Shared helpers (behaviors/internal.js utilities used by these): id minting, host resolution,
  text extraction — edge cases.

Give a concrete "input/option X → wrong class/geometry/output" for each.

--- OUTPUT CONTRACT ---
READ-ONLY. REAL, REPRODUCIBLE DEFECTS only; trace the code. FINAL ANSWER exactly:

# Recipes / connectors / annotations — bronto-ui round 6 review
**Verdict:** one paragraph.
## Confirmed defects
- **[P0/P1/P2/P3] [conf HIGH/MED/LOW]** `path:line` — defect.
  - Failure scenario: input/option → wrong output/geometry.
  - Fix direction: minimal fix. Mark SAFE-FIX vs NEEDS-DESIGN.
## Lower-confidence / needs-repro
- bullets.
## Notable (not a bug)
- worth knowing.
Evidence-dense; defects only; no restating this prompt.
