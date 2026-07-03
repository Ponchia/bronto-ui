# Progressive enhancement / no-JS / features — bronto-ui round 7 review
**Verdict:** Read-only pass found real progressive-enhancement defects: one no-JS tier misclassification, one behavior-absent a11y/control failure, and several feature/import floor mismatches. The core CSS-native patterns mostly hold, but some docs overpromise against the stated Firefox 129 floor.

## Confirmed defects
- **[P2] [conf HIGH]** `docs/usage.md:627` — native modal is listed as “fully operable with JS off”, but Bronto’s documented open/close path is `data-bronto-open` / `data-bronto-close`, implemented only by `initDialog`.
  - Failure scenario: JS off → demo buttons at `demo/index.html:765` never open `demo/index.html:792`; close buttons also do nothing unless JS runs. An authored `open` attribute is not equivalent to `showModal()` modal top-layer/focus-trap behavior.
  - Fix direction: SAFE-FIX doc correction: move modal/lightbox to behavior-required unless a verified declarative no-JS modal opener/closer is documented.

- **[P2] [conf HIGH]** `demo/index.html:856` — carousel fallback is documented as “native scroll-snap track (usable, no controls)”, but the shipped/demo markup renders visible prev/next controls that only `initCarousel()` labels and wires.
  - Failure scenario: JS off → empty arrow buttons remain focusable/clickable, have no authored `aria-label`, and do not move slides; status stays empty.
  - Fix direction: SAFE-FIX: author labels and disabled/hidden no-JS state, then have `initCarousel()` enable/unhide controls; update fallback docs.

- **[P3] [conf HIGH]** `docs/tree.md:40` — `details name` exclusive grouping is documented as native no-JS behavior, but the stated floor includes Firefox 129; Firefox only added this in 130 per MDN release notes: https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/130.
  - Failure scenario: Firefox 129 + JS off → sibling tree branches with the same `name` can all remain open; exclusive accordion behavior is broken.
  - Fix direction: SAFE-FIX doc/support correction: mark exclusive grouping as Firefox 130+ progressive enhancement, raise the floor, or provide JS fallback.

- **[P3] [conf HIGH]** `docs/figure.md:8` — the documented figure imports omit leaves used by the recipe.
  - Failure scenario: load exactly `@ponchia/ui`, `figure.css`, and `legend.css` → SVG fills using `--chart-1/2` lack `dataviz.css`, and `ui-annotation__connector` lacks `annotations.css`, so chart/callout visuals are wrong or invisible.
  - Fix direction: SAFE-FIX: add `dataviz.css` and `annotations.css` to the recipe, or remove those cross-leaf classes/vars from the minimal figure example.

- **[P3] [conf MED]** `docs/textref.md:18` — textref promises exact no-JS quoted-sentence navigation, but URL Text Fragments / `::target-text` are not supported at Firefox 129; MDN lists Firefox 131: https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment/Text_fragments.
  - Failure scenario: Firefox 129 + documented `#:~:text=` URL → no exact scroll/highlight; with no ordinary `#section` fallback, navigation can land only at the page/top.
  - Fix direction: SAFE-FIX: require `#section:~:text=...` fallback URLs and document exact textref as Firefox 131+, or raise the browser floor.

## Lower-confidence / needs-repro
- `docs/annotations.md:8` likely has the same import-contract drift: it imports only `annotations.css` but immediately demonstrates `ui-figure__*` classes. Needs a rendered-doc smoke to confirm whether shipped examples rely on figure layout there.

## Notable (not a bug)
- `ui-scroll-reveal` is correctly gated behind `@supports (animation-timeline: view())`; unsupported engines keep visible content.
- `highlights.css` depends on CSS Custom Highlight support, which MDN lists after Firefox 129, but docs explicitly require `CSS.highlights` detection and plain-text fallback: https://developer.mozilla.org/en-US/docs/Web/API/CSS_Custom_Highlight_API.