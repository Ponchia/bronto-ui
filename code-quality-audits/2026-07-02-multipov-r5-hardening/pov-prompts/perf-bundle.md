ROUND 5 multi-POV review of `@ponchia/ui` (bronto-ui). Theme: CORRECTNESS & OPTIMIZATION —
find REAL, actionable issues (defects OR concrete, safe optimizations). READ-ONLY.

Your lens: **PERFORMANCE, BUNDLE & DEAD CODE.**
Find concrete, safely-removable/optimizable items (not vague "could be faster"):
- Dead/unused CSS: selectors, custom properties, keyframes, or whole rule blocks that nothing
  references (cross-check css/ against classes/index.js, the demos/examples, docs, and the
  generated dist). Quantify with `path:line`.
- Duplicate/redundant declarations across css/ that could be consolidated without visual change.
- Selector-cost hot spots: expensive universal/`*`, deep descendant, or `:has()` selectors on
  hot elements; `@property`/`color-mix()` overuse where a static value would do.
- Bundle: is anything shipped in `dist/`/`files` that consumers never need? Tree-shaking gaps in
  behaviors/adapters (side-effectful imports). Font loading (`fonts/`, css/fonts.css):
  `font-display`, subsetting, preload, unused weights.
- Animation/motion perf: layout/paint-triggering animations that could use transform/opacity;
  missing `will-change` discipline (over- or under-use).
- The size budgets added earlier (scripts/size-report.mjs) — anything the numbers reveal.

Only report items you can concretely justify with evidence; prefer SAFE (no visual/behaviour
change) optimizations.

--- OUTPUT CONTRACT ---
READ-ONLY. Report actionable items with evidence. FINAL ANSWER exactly:

# Performance / bundle / dead code — bronto-ui round 5 review
**Verdict:** one paragraph.
## Findings
- **[P0/P1/P2/P3] [conf HIGH/MED/LOW]** `path:line` — issue.
  - Impact: bytes/perf/why it matters.
  - Fix direction: minimal safe change. Mark SAFE-FIX vs NEEDS-DESIGN.
## Lower-confidence / needs-measurement
- bullets.
## Notable (not actionable)
- worth knowing.
Evidence-dense; no vague advice; no restating this prompt.
