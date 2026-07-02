# Security / injection surface — bronto-ui round 5 review
**Verdict:** I found one reproducible product-side safety issue, but no markdown XSS, Shiki/code HTML sink, CSS exfil pattern, `eval`/`new Function`, or `_blank` opener defect in the audited shipped/docs surfaces.

## Findings
- **[P3] [conf HIGH]** `behaviors/sources.js:73` — `initSources()` source lookups can escape the `[data-bronto-sources]` island via `byIdInHost()`’s document fallback at `behaviors/internal.js:90`.
  - Failure scenario: attacker-controlled citation HTML inside a sources island (`<a class="ui-citation" href="#outside">`) → `sourceId()`/`byIdInHost()` resolves `#outside` from the whole document → `seed()` writes `aria-describedby="outside"` and click calls `source.focus()` plus `.is-source-active` on an element outside the island. Reproduced with jsdom: `{"focused":"outside","outsideActive":true,"describedby":"outside"}`. This contradicts `docs/sources.md:162`, which says refs focus elements inside the source island.
  - Fix direction: make `initSources()` use an island-only ID resolver instead of the generic document-fallback helper, or add a `documentFallback: false` mode to `byIdInHost()` and use it here. **SAFE-FIX**.

## Lower-confidence / needs-repro
- `behaviors/internal.js:90` also lets `initSpotlight()` and `initConnectors()` target outside a scoped root; I did not prove a direct data leak or actionable click/focus effect beyond visual drawing/measurement.
- `docs/index.html:142` imports `marked`/`DOMPurify` from jsDelivr; this is a docs-site supply-chain dependency, not a reproduced markdown injection bug.

## Notable (not a defect)
- `docs/index.html:347` allow-lists doc paths, and `docs/index.html:367` applies `DOMPurify.sanitize(marked.parse(...))` before `innerHTML`; the markdown/sanitize order is correct.
- `glyphs/glyphs.js:1441` escapes labels, and the glyph CSS length/data-URL paths are constrained/encoded.
- CSS `@import`/`url()` usage is package-local fonts/leaves; I found no shipped external-origin CSS fetch or attr-to-URL exfil pattern.
- No `target="_blank"` opener issue showed up in shipped docs/demo markup.