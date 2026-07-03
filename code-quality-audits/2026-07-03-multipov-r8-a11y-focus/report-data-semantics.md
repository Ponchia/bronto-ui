# Report data & provenance semantics — bronto-ui round 8 review
**Verdict:** Confirmed semantic defects exist below the rendering layer: one text-fragment contract tells consumers to bind data where CSS cannot read it, one scoped connector can resolve evidence endpoints outside its root, and RTL continuous legends can invert tick-to-colour meaning. Existing `check-report`, `check-legend`, and `check-contract` all pass, so these are current gate gaps.

## Confirmed defects
- **[P2] [conf HIGH]** `css/textref.css:50` — `--textref-highlight` is documented/contracted on `.ui-textref`, but `::target-text` paints the destination text, not the source link, so the bound value cannot inherit from the link.
  - Failure scenario: author sets `<a class="ui-textref" style="--textref-highlight: ...">` → clicked quote lands on target text highlighted with default `--accent-soft`, not the author-bound provenance colour.
  - Fix direction: define the knob on `:root` / target container, or add a target-side scope class; update `docs/textref.md` and `classes.json` generator. SAFE-FIX · CSS/docs/contract.

- **[P2] [conf HIGH]** `behaviors/connectors.js:185` — scoped connector endpoint lookup can escape the scoped root through `byIdInHost()`’s document fallback.
  - Failure scenario: report section initializes `initConnectors({ root: section })`; `data-from="claim-a"` is missing inside that section but exists elsewhere in the document → connector draws a leader line to the unrelated outside element.
  - Fix direction: after lookup, require `host.contains(from)` and `host.contains(to)` for element roots, and clear when not contained; add a scoped-root regression test. SAFE-FIX · JS/tests.

- **[P3] [conf MED]** `css/legend.css:151` — continuous legend tracks are hard-coded left-to-right while tick labels follow document direction.
  - Failure scenario: RTL report binds ticks as min/mid/max in DOM order → flex lays min at the right edge, but the gradient’s low stop remains on the left, so labels map to the wrong colours.
  - Fix direction: add `:dir(rtl)` gradient reversal for sequential/diverging tracks, or explicitly lock track + ticks to LTR. SAFE-FIX · CSS/tests.

## Lower-confidence / needs-repro
- `scripts/check-report.mjs:67` omits `data-bronto-source-ref` from snippet target validation; a typoed source-ref control can pass snippet checks and become inert at runtime.
- `css/spark.css:27` maps both missing `--v` and real `--v: 0` to the same 1px bar floor; may be intentional, but it can visually turn a true zero into a nonzero mark.

## Notable (not a bug)
- `behaviors/sources.js` re-checks `island.contains(source)`, so source citations do not have the connector root-escape problem.
- Legend categorical swatch helpers 1–8 map to matching `--chart-N` tokens, and `check-legend` covers that path.