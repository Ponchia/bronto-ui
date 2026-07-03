ROUND 8 multi-POV review of `@ponchia/ui` (bronto-ui). Theme: CORRECTNESS — find REAL,
REPRODUCIBLE DEFECTS. READ-ONLY. FRESH angle: the report/analytical DATA + provenance layer
(rounds 4-5 covered print rendering; go at the semantic/data-binding layer).

Your lens: **REPORT GRAMMAR — DATA, PROVENANCE & EVIDENCE SEMANTICS.**
The report/analytical lane binds host data to visual grammar. Hunt SEMANTIC/data-binding bugs
(not print rendering) in css/report*.css, css/analytical.css, css/dataviz.css, css/legend.css,
css/sources.css, css/interval.css, css/spark.css, css/bullet.css, css/marks.css, css/highlights.css,
css/figure.css, connectors/, annotations/, and the report checks (scripts/check-report.mjs,
check-legend.mjs, check-contract.mjs):
- Provenance / sources trust layer (css/sources.css + behaviors/sources.js): does the citation/
  source model correctly associate a claim to its source, keep the boundary "host owns numbering/
  fetching/trust", and not mis-link? Any way a citation points to the wrong source or loses its
  reference?
- Evidence/highlight/marks (highlights.css, marks.css, textref.css): does an evidence highlight
  bind to the right range/text? Custom Highlight API ranges that drift, `::target-text` that
  targets wrong content, mark nesting that mis-attributes emphasis.
- Data-bound primitives (spark/bullet/interval/legend): the host-normalized value → visual
  mapping SEMANTICS (not the calc geometry round 6 did) — does a legend swatch map to the SAME
  series color the chart uses? Does bullet measure/target/band mean what the docs say? Off-by-one
  in the data→class mapping.
- Figure/annotation data slots (figure.css, annotations): the "key/legend/fallback-data" slots —
  do they bind correctly, and is the "primitive owns grammar not data" boundary honored?
- The structured contract (classes.json via gen-classes-json.mjs): does it accurately describe
  the report authoring surface an LLM/consumer relies on? Any documented-but-wrong data attr.

Give a concrete "author binds data X → report shows/associates wrong Y" for each.

--- OUTPUT CONTRACT ---
READ-ONLY. REAL, REPRODUCIBLE DEFECTS only. FINAL ANSWER exactly:

# Report data & provenance semantics — bronto-ui round 8 review
**Verdict:** one paragraph.
## Confirmed defects
- **[P0/P1/P2/P3] [conf HIGH/MED/LOW]** `path:line` — defect.
  - Failure scenario: data binding → wrong association/mapping.
  - Fix direction: minimal fix. Mark SAFE-FIX vs NEEDS-DESIGN · (CSS?/JS?/docs?).
## Lower-confidence / needs-repro
- bullets.
## Notable (not a bug)
- worth knowing.
Evidence-dense; defects only; no restating this prompt.
