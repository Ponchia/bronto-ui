# Report / renderer correctness — bronto-ui correctness review
**Verdict:** I found two reproducible renderer/report defects: one color fallback bug in analytical-only legends, and one figure overlay sizing bug that misaligns annotations when a stage reserves extra height. Renderer token bridges for Mermaid/D2/Vega look internally consistent in the checked paths.

## Confirmed defects
- **[P2] [conf HIGH]** `css/legend.css:112` — indexed legend swatches do not fall back when `dataviz.css` is absent.
  - Failure scenario: an analytical report imports `@ponchia/ui/css/analytical.css` but not `dataviz.css`; `css/analytical.css:10` says legend swatches fall back to accent, but `<span class="ui-legend__swatch ui-legend__swatch--2">` sets `--chart-color: var(--chart-2)`. Because `--chart-2` is unresolved, the outer `background: var(--chart-color, ...)` fallback does not fire, so the printed/rendered swatch has an invalid/transparent background.
  - Fix direction: give each indexed helper its own fallback, e.g. `--chart-color: var(--chart-2, var(--chart-1, var(--accent)))`, or make `analytical.css` import `dataviz.css`.

- **[P2] [conf HIGH]** `css/figure.css:65` — annotation overlays size to the full stage, not the rendered media.
  - Failure scenario: a report figure uses a `320x120` SVG media at 480px wide and `--figure-min-block: 240px`; the media renders 180px tall and is centered in the 240px stage, but `.ui-figure__overlay` is `position:absolute; inset:0; block-size:100%`. An overlay with the same `viewBox="0 0 320 120"` maps y=120 to 240px while the media bottom is 210px, so subjects/connectors near the top/bottom land ~30px off.
  - Fix direction: stack media and overlay in the same sized box, or add an explicit aspect-ratio/media wrapper so overlay dimensions are tied to the rendered media, not the stage’s reserved min block.

## Lower-confidence / needs-repro
- `css/interval.css:62` / `css/bullet.css:89` — endpoint markers are centered with `translate(-50%, -50%)` / `translateX(-50%)`, so valid boundary values `--v:0|1` and `--t:0|1` bleed half a marker outside the track. This may be intentional scale-boundary rendering; needs visual acceptance.
- `css/spark.css:27`, `css/bullet.css:63`, `css/interval.css:48` — out-of-contract normalized values like `1.2`, negative endpoints, or `--lo > --hi` can overflow or collapse to hairlines. Docs require host-normalized `0..1`, so I did not count this as confirmed.

## Notable (not a bug)
- Mermaid/D2/Vega generated outputs checked cleanly for `var()`, `undefined`, `NaN`, and `Infinity` leakage.
- Vega `range.category`, `brontoVegaAccent()`, and `brontoVegaNeutral()` matched `charts.json` for the checked themes.