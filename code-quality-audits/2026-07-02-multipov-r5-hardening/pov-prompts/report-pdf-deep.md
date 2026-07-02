ROUND 5 multi-POV review of `@ponchia/ui` (bronto-ui). Theme: CORRECTNESS — find REAL,
REPRODUCIBLE DEFECTS. READ-ONLY. Round 4 lightly covered report/renderer; go DEEPER on
PRINT/PDF specifically.

Your lens: **REPORT / PDF / PAGED-MEDIA CORRECTNESS (deep).**
The static, no-JS, Chromium-PDF report grammar is the strongest consumer lane — stress its
PRINT correctness in css/report.css, css/report-kit.css, css/analytical.css, css/figure.css,
css/table.css, css/toc.css, css/sources.css, css/sidenote.css, css/code.css, css/diff.css, and
the report demos (demo/report-standalone.html):
- Paged media: `break-before/after/inside`, `break-inside: avoid` on figures/tables/cards;
  orphaned/widowed headings; content that overflows the page box or is clipped; running
  headers/footers; `@page` margins.
- `print-color-adjust`/`-webkit-print-color-adjust: exact` coverage — surfaces/accents/borders
  that drop to white in PDF; dark-on-dark or invisible text in print.
- `position: sticky`/`fixed`, scroll containers, `overflow`, and `100vh` used where paged media
  needs static flow.
- Table pagination: header repeat (`thead`/`display:table-header-group`), row splitting, column
  alignment across page breaks.
- Footnotes/sidenotes/sources/TOC page-number correctness; anchor/`::target-text` in print.
- Figures: aspect-ratio boxes, media that overflows the stage in print, annotation overlay
  alignment on the paged size (round 4 flagged overlay-vs-media sizing — confirm in print).

Give a concrete "printed to PDF, element X with content Y renders wrong" for each.

--- OUTPUT CONTRACT ---
READ-ONLY. REAL, REPRODUCIBLE DEFECTS only. FINAL ANSWER exactly:

# Report / PDF / paged-media — bronto-ui round 5 review
**Verdict:** one paragraph.
## Confirmed defects
- **[P0/P1/P2/P3] [conf HIGH/MED/LOW]** `path:line` — defect.
  - Failure scenario: printed/PDF context → wrong render.
  - Fix direction: minimal fix. Mark SAFE-FIX vs NEEDS-DESIGN.
## Lower-confidence / needs-repro
- bullets.
## Notable (not a bug)
- worth knowing.
Evidence-dense; defects only; no restating this prompt.
