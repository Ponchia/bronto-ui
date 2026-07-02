# Report / PDF / paged-media — bronto-ui round 5 review
**Verdict:** The core report print layer is much stronger than earlier rounds, but I found a few real correctness defects around print-only navigation, dark-theme chart tokens leaking into white-paper PDFs, and SVG media sizing. I could not run a live Chromium PDF probe in this sandbox because no Chromium binary is installed, so fragmentation concerns are separated below.

## Confirmed defects
- **[P2] [conf HIGH]** `css/dataviz.css:77` — dark-theme data-viz tokens are not reset for print.
  - Failure scenario: `html[data-theme="dark"]` report → printed/PDF output is forced to white paper by `tokens.css`, but `--chart-seq-1..6` and `--chart-pattern-ink` keep dark-theme values, so a sequential legend/heatmap prints low values dark and high values pale on white paper.
  - Fix direction: SAFE-FIX: add a high-specificity `@media print` remap in `dataviz.css` for chart sequential/diverging tokens and `--chart-pattern-ink` to the light/print palette.

- **[P2] [conf HIGH]** `css/figure.css:54` — `.ui-figure__media` scales inline size but does not force block size back to `auto`.
  - Failure scenario: printed/PDF figure with an SVG like `demo/report.html`’s annotated chart (`width="100%" height="360" viewBox="0 0 640 360"`) shrinks to the page/stage width while retaining the fixed 360px height, so the chart and annotations render with a non-native aspect ratio.
  - Fix direction: SAFE-FIX: set `.ui-figure__media { block-size: auto; }` and the same for staged `svg/img/canvas` media where safe.

- **[P3] [conf HIGH]** `demo/report-standalone.html:54` — the PDF-only contents block removes navigation without adding page numbers.
  - Failure scenario: printed/PDF standalone report shows “Contents” with `Executive summary`, `Trend`, etc., but those entries are plain text, not PDF links, and have no page numbers.
  - Fix direction: NEEDS-DESIGN: keep anchors in print, or remove the print TOC until the renderer can inject page numbers/bookmarks.

## Lower-confidence / needs-repro
- `css/report.css:740` — `.ui-report__evidence` is `break-inside: avoid`; a long evidence table inside the documented single-table evidence block may fail to paginate cleanly.
- `css/diff.css:25` — long `.ui-diff` blocks remain CSS grid in print, matching the class of Chromium grid-fragmentation bug already fixed for report flow wrappers.
- `css/table.css:30` — sticky table headers are not reset in print; needs a long-table PDF check for header repeat/alignment.

## Notable (not a bug)
- `demo/report-standalone.html` does not reproduce the round-4 overlay-vs-media issue: its request-mix figure has no separate `.ui-figure__overlay`, and the SVG has no fixed height.