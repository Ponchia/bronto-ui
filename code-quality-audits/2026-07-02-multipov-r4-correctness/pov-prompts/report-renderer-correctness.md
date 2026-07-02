ROUND 4 multi-POV review of `@ponchia/ui` (bronto-ui). Theme: CORRECTNESS & ROBUSTNESS — hunt
REAL, REPRODUCIBLE DEFECTS. READ-ONLY.

Your lens: **REPORT / PDF & DATA-VIZ RENDERER CORRECTNESS.**
The report/analytical lane is the project's strongest consumer path (static, no-JS,
Chromium-PDF). Hunt actual defects in css/report.css, css/report-kit.css, css/analytical.css,
css/dataviz.css, css/figure.css, css/legend.css, css/annotations.css, css/interval.css,
css/spark.css, css/bullet.css, css/marks.css, and the renderer token bridges tokens/mermaid|d2|
vega + their generators:
- Print/PDF breakage: page-break rules that split a figure/table wrong, content clipped at page
  edges, backgrounds/colors dropped by print color-adjust, `position` fixed/sticky that breaks
  paged media, orphaned headings.
- Host-normalized geometry primitives (spark `--v`, bullet `--v`/`--t`, interval `--lo`/`--hi`):
  a value at a boundary (0, 1, >1, negative, lo>hi) that renders out of bounds or NaN in
  `calc()`.
- Data-viz color: a chart series/legend swatch that resolves to the wrong or an invalid color;
  legend index → palette mapping off-by-one; `--chart-*` refs that don't resolve.
- Renderer bridges: a mermaid/d2/vega resolved value that's wrong for a theme, or a documented
  helper that returns the wrong slot.
- Annotations/figure geometry: overlay/subject/connector math that mispositions at edge cases
  (zero-size, RTL, scaled container).

Give a concrete "in a printed/rendered report, X with value/state Y renders wrong" for each.

--- OUTPUT CONTRACT ---
READ-ONLY. REAL, REPRODUCIBLE DEFECTS only. Trace/compute before reporting; unsure → conf LOW.
FINAL ANSWER exactly:

# Report / renderer correctness — bronto-ui correctness review
**Verdict:** one paragraph.
## Confirmed defects
- **[P0/P1/P2/P3] [conf HIGH/MED/LOW]** `path:line` — defect.
  - Failure scenario: concrete report/print/value context → wrong render.
  - Fix direction: minimal correct fix.
## Lower-confidence / needs-repro
- bullets.
## Notable (not a bug)
- worth knowing.
Evidence-dense; defects only; no restating this prompt.
