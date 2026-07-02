# bronto-ui — round 5 (fresh correctness + residual triage) synthesis

## Executive verdict
All five reports are present and non-empty. There are **13 confirmed SAFE-FIX items**: 8 P2/high-confidence, 1 P2/medium-confidence, and 4 P3/high-confidence. Worst cluster is P2 correctness around report/PDF data representation, interaction cleanup/validation, geometry placement, and release-note selection. Security-sensitive callout: one P3/high product-side source-island escape; no markdown XSS, code HTML sink, eval, CSS exfil, or `_blank` opener issue was found.

## Scorecard
| Lens | Grade | # SAFE-FIX (HIGH/MED) | Worst item |
|---|---:|---:|---|
| Perf / bundle | A- | 3 (2 HIGH / 1 MED) | `css/legend.css:108` duplicate categorical swatch block shipped in multiple bundles |
| Security / injection | B+ | 1 (1 HIGH / 0 MED) | `behaviors/sources.js:73` source refs can target outside `[data-bronto-sources]` |
| Report / PDF | B | 2 (2 HIGH / 0 MED) | `css/dataviz.css:77` dark chart tokens leak into white-paper print/PDF |
| Geometry / math | B- | 3 (3 HIGH / 0 MED) | `behaviors/crosshair.js:81` bordered plots misplace crosshair; reversed intervals collapse |
| Round-4 residuals | B- | 4 (4 HIGH / 0 MED) | `behaviors/dialog.js:96` cleanup close loses focus restore |
| Overall | B | 13 (12 HIGH / 1 MED) | No P1; several P2/high correctness fixes are ready to dispatch |

## Confirmed SAFE-FIX — the fix list (severity × confidence, ranked)

**Behaviors / interaction**
- **[P2] [conf HIGH]** `behaviors/dialog.js:96` — cleanup removes `restoreFocus` before `dlg.close()` · open dialog removed during cleanup leaves focus inside `#inside` · close while listener is still attached or explicitly run focus restorer after close.
- **[P2] [conf HIGH]** `behaviors/forms.js:267` — radio invalid summary duplicates same required group · same-name radios produce multiple links like `Basic` and `Pro` · dedupe by `form + name`, focus first radio, prefer group legend label.
- **[P2] [conf HIGH]** `behaviors/crosshair.js:81` — crosshair uses plot border-box while overlay is padding-box positioned · 10px border makes rule land 10px off pointer · compute from `overlay.getBoundingClientRect()` or subtract border offsets; add bordered-plot test.
- **[P3] [conf HIGH]** `behaviors/sources.js:73` — source lookup escapes source island via document fallback · citation `href="#outside"` focuses/activates outside element and sets `aria-describedby="outside"` · use island-only resolver or `byIdInHost(..., { documentFallback: false })`.

**Report / PDF CSS**
- **[P2] [conf HIGH]** `css/dataviz.css:77` — dark-theme chart tokens not reset for print · white-paper PDF keeps dark sequential/pattern values, reversing or weakening visual meaning · add high-specificity `@media print` remap for sequential/diverging tokens and `--chart-pattern-ink`.
- **[P2] [conf HIGH]** `css/figure.css:54` — media width scales but fixed SVG height remains · `width="100%" height="360"` SVG shrinks inline but keeps 360px block size, distorting aspect ratio · set `.ui-figure__media { block-size: auto; }` and same for staged `svg/img/canvas` where safe.

**Geometry CSS primitives**
- **[P2] [conf HIGH]** `css/interval.css:48` — reversed endpoints collapse to 2px tick at `--lo` · `--lo:.8; --hi:.2` renders 2px at 80px instead of 20-80 span · normalize with `min(var(--lo), var(--hi))` / `max(...)` and test.
- **[P3] [conf HIGH]** `css/bullet.css:72` — explicit zero measure renders non-zero · `--v:0` on 200px track displays 2px, visually reporting about 1% · remove floor for explicit zero or separate missing-value fallback from zero.

**Release tooling**
- **[P2] [conf HIGH]** `scripts/check-release.mjs:41` / `scripts/changelog-section.mjs:28` — changelog heading match is substring-based · `0.6.0-rc.1` can satisfy stable `0.6.0` and release notes can select rc section first · match exact escaped SemVer heading token with non-semver boundaries.

**CSS cleanup / bundle**
- **[P2] [conf HIGH]** `css/legend.css:108` — categorical swatch rules are shadowed by later equal-specificity fallback rules at `css/legend.css:145` · dead duplicate block ships in `legend`, `analytical`, and `report-kit` bundles · update `scripts/check-legend.mjs` for `var(--chart-N, var(--accent))`, then delete `css/legend.css:108-138`.
- **[P2] [conf MED]** `css/spotlight.css:14` — five global `@property --spot-*` registrations are unused by current animation path · JS sets valid px values and transitions use transform/size, so registrations add bundle cost · remove `@property` blocks `css/spotlight.css:14-42`; keep `.ui-spotlight` defaults.
- **[P3] [conf HIGH]** `css/tokens.css:278` — high-contrast opt-in declarations duplicated for `[data-contrast='high']` and `:root[data-contrast='high']` · wastes default bundle headroom · group selectors into one rule preserving root selector specificity.
- **[P3] [conf HIGH]** `css/marks.css:33` — Safari/WebKit still needs prefixed decoration-break · wrapped `.ui-mark` can slice padding/background despite unprefixed rule · add `-webkit-box-decoration-break: clone` before `box-decoration-break`.

## NEEDS-DESIGN / held
- `behaviors/crosshair.js:92` — readout flip ignores readout width; long readout overflows right even when `x / width <= .5`. Needs width-aware/clamped placement or a public cap strategy.
- `css/spark.css:27` — explicit zero spark bar renders 1px, but docs mention a missing-value 1px floor. Needs a design split between missing and explicit zero.
- `demo/report-standalone.html:54` — print TOC removes links and lacks page numbers. Needs decision: keep anchors, remove print TOC, or add renderer page-number/bookmark support.
- `tsconfig.dts.json:8` — declaration maps add package payload. Turning them off may regress editor navigation/package contract.
- `qwik/index.d.ts:37`, `react/index.js:104` — public integration typing/init behavior needs API story; safe partials are docs/narrowing, not behavioral rewrites.
- `css/feedback.css:13`, `behaviors/modal.js:107`, `css/figure.css:65`, `css/dataviz.css:39` — round-4 held items reconfirmed: global `--value`, stacked-modal inert ownership, overlay coordinate contract, and per-series pattern contrast need design/API decisions.
- Pending repro/measurement: `css/report.css:740`, `css/diff.css:25`, `css/table.css:30`, `css/motion.css:133` + `css/feedback.css:440`, and outside-root targeting in `initSpotlight()` / `initConnectors()`.

## False alarms / non-issues
- `css/interval.css:62` / `css/bullet.css:98` marker half-bleed is correct: marker center represents the endpoint; RTL already mirrors centerline.
- `<0` / `>1` normalized values for spark/bullet/interval are producer-contract violations; do not add defensive clamping.
- Docs markdown path allowlist plus `DOMPurify.sanitize(marked.parse(...))` is correct; no markdown XSS, Shiki/code sink, `eval`, `new Function`, external CSS exfil, glyph escaping, or `_blank` opener defect found.
- `demo/report-standalone.html` does not reproduce the round-4 overlay-vs-media issue.
- No dead keyframes or zero-reference `.ui-*` classes found. Doto extra weights and `--chart-pattern-7/8` remain package/docs contract, not safe removals.

## Recommended fix batching
1. **Behavior interactions:** `behaviors/dialog.js`, `behaviors/forms.js`, `behaviors/crosshair.js`, `behaviors/sources.js` — dialog cleanup, radio summary dedupe, crosshair bordered coordinate fix, source island-only lookup.
2. **Report/PDF print CSS:** `css/dataviz.css`, `css/figure.css` — print chart token reset and media `block-size:auto`; avoid changing overlay contract.
3. **Geometry primitives:** `css/interval.css`, `css/bullet.css` — reversed interval normalization and explicit-zero bullet rendering.
4. **Release tooling:** `scripts/check-release.mjs`, `scripts/changelog-section.mjs` — exact SemVer heading matching.
5. **CSS bundle/support cleanup:** `css/legend.css`, `scripts/check-legend.mjs`, `css/spotlight.css`, `css/tokens.css`, `css/marks.css` — duplicate legend rules, unused spotlight `@property`, high-contrast selector grouping, WebKit mark prefix.