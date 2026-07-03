# bronto-ui — round 9 (fresh-lens correctness) synthesis

## Executive verdict
All five reports are present and non-empty. There are **18 real SAFE-FIX items**: **15 JS/docs-preferred** and **3 CSS-touching held-if-budget** items because the raw bundle budget is full (~89kB) and CSS changes need cross-engine e2e. Worst safe issue is unbatched connector redraw on scroll/resize; worst overall correctness risk is modal inert ownership, but that needs design. Returns are thinning: no P1s, mostly P2/P3 edge correctness, parser, and scale defects.

## Scorecard
| Lens | Grade | # SAFE-FIX (HIGH/MED) | Worst item |
|---|---:|---:|---|
| Async/timing/race | B- | 3 (2/1) | `behaviors/modal.js:125` inert release while inner modal remains open, NEEDS-DESIGN |
| Storage/persistence | B | 1 (1/0) | `docs/integration.md:24` no-flash snippet persists invalid `data-theme` |
| Scale/performance | C+ | 6 (4/2) | `behaviors/connectors.js:187` unbatched redraw rescans/layouts on every scroll/resize |
| Cascade/layer edge | C+ | 3 (3/0) | global `@property` registrations for generic vars break consumer CSS |
| Numeric parse/format | B- | 5 (2/3) | `behaviors/table.js:177` Unicode minus + decimal comma sorts as `-35` |
| Overall | B- | 18 (12/6) | clustered in behavior JS hot paths, theme snippets, numeric normalization, and CSS `@property` globals |

## Confirmed SAFE-FIX — the fix list (severity × confidence, ranked)

JS/docs preferred:

- **[P2] [conf HIGH]** `behaviors/connectors.js:187` — redraw is synchronous/unbatched and re-discovers connectors on every scroll/resize/RO · 60 scroll events/sec can become O(60 * C * I) id scans plus layout reads/writes · cache connector records/endpoints and rAF-batch redraws, rebuilding on re-init · JS.
- **[P2] [conf HIGH]** `behaviors/table.js:217` — sort extracts cell text/number inside comparator · 10k rows cause ~130k live DOM reads/parses · decorate rows once with `{ row, key }`, sort keys, append rows · JS.
- **[P2] [conf HIGH]** `behaviors/command.js:169`, `behaviors/combobox.js:282` — active movement rewrites every item · 5k items under key repeat churns DOM/a11y tree · track previous active item, update previous/next only, cache search text, skip unchanged `hidden` writes · JS.
- **[P2] [conf HIGH]** `behaviors/combobox.js:148` — every combobox adds a document click listener · unrelated clicks run N `contains()` checks/closes · delegate one listener per root/document or attach only while open · JS.
- **[P2] [conf HIGH]** `behaviors/carousel.js:320` — programmatic-scroll suppression drops real IO updates · swipe/drag during 500ms suppression leaves status/thumbs on wrong slide · cache ignored IO entry and replay/remeasure on release, or suppress only echo batch · JS.
- **[P2] [conf HIGH]** `behaviors/spotlight.js:46` — retarget before new target exists leaves stale cutout forever · `data-target` changes, target inserted next macrotask, no later observer rechecks · clear vars on missing target and observe childList or schedule post-mutation/rAF reconciliation · JS.
- **[P2] [conf HIGH]** `docs/integration.md:24` — no-flash snippet accepts any truthy stored theme · `bronto-theme=garbage` sets persistent invalid `data-theme="garbage"` · validate `light|dark` in all snippets and optionally remove corrupt values · docs/examples JS.
- **[P2] [conf HIGH]** `behaviors/table.js:177` — `data-sort-value` decimal comma path misses Unicode minus · `−3,5` falls back to display parse as `-35` · normalize Unicode minus/dashes before explicit `Number` / comma-decimal parse · JS.
- **[P2] [conf HIGH]** `behaviors/splitter.js:17` — `parseFloat` accepts ARIA range values with units · `aria-valuemin="20%"` exposes invalid ARIA while behavior uses `20` · strict numeric parse and rewrite non-canonical attrs · JS.
- **[P3] [conf HIGH]** `behaviors/sources.js:78` — source seeding repeatedly scans all ids · 1k citations * 1.2k ids yields ~1.2M candidates · build one id map per island and cache preview text per source · JS.
- **[P3] [conf HIGH]** `behaviors/crosshair.js:76` — raw pointermove reads layout/style and writes DOM every event · 120Hz pointer input thrashes rect/style reads and CSS var/data/class writes · cache rect/direction with invalidation only; do not coalesce public events without design · JS.
- **[P3] [conf HIGH]** `behaviors/theme.js:69` — toggle ARIA does not follow OS color-scheme changes · no explicit theme, OS flips dark, visual changes but `aria-pressed` stays stale · add `matchMedia('change')` listener, cleanup, and `reflect()` when unset · JS.
- **[P3] [conf HIGH]** `behaviors/splitter.js:29` — orientation enum is not trimmed · `data-bronto-splitter="horizontal "` falls back vertical · trim before enum comparison · JS.
- **[P3] [conf HIGH]** `behaviors/glyph.js:268` — glyph render enum is not trimmed · `"mask "` misses mask path and renders dotmatrix · trim before comparing to `mask` · JS.
- **[P3] [conf HIGH]** `behaviors/dismissible.js:18` — whitespace dismiss selector is treated as custom selector · `data-bronto-dismiss=" "` finds no target · trim and treat empty-after-trim as default dismissible target · JS.

CSS held-if-budget:

- **[P2] [conf HIGH]** `css/feedback.css:13` — global `@property --value` types a generic consumer var as `<number>` · consumer `--value: 50%` collapses to registered initial · register internal namespaced prop and feed it from public unregistered `--value` · CSS, held-if-budget.
- **[P2] [conf HIGH]** `css/interval.css:13` — global `@property --lo` / `--hi` reserves generic names · consumer `--hi: 3rem` becomes invalid/auto · register namespaced internals and keep public vars as aliases · CSS, held-if-budget.
- **[P2] [conf HIGH]** `css/bullet.css:36` — global `@property --t` reserves one-letter consumer var · consumer `--t: 250ms` kills transition · move typed registration to namespaced internal prop fed from public `--t` · CSS, held-if-budget.

## NEEDS-DESIGN / held
- **[P2] [conf HIGH]** `behaviors/modal.js:125` — closing outer controlled modal while inner remains open releases inert/focus ownership. Needs modal-stack ownership/refcount design before changing.
- **[P3] [conf HIGH]** `behaviors/theme.js:99` — cross-tab storage sync missing. Decide whether `storage` events are supported API or explicitly documented unsupported.
- `behaviors/crosshair.js:76` — rAF-coalescing public move events is design-sensitive; only cache geometry/style as SAFE-FIX.
- `behaviors/sources.js:123` — authored `is-source-active` removal is contract-ambiguous; tests already treat authored state as movable/restored on cleanup. Treat as known-held unless contract changes.
- `classes/index.js:1120`, `behaviors/toast.js:127` — null/empty runtime coercions conflict with TS-only contracts. Decide whether runtime should harden invalid JS/config inputs.
- `behaviors/forms.js:332`, `behaviors/spotlight.js:43`, `behaviors/popover.js:198` — perf concerns need measurement before changing.
- CSS custom-property fixes are safe only if public vars remain aliases. Renaming/removing `--value`, `--lo`, `--hi`, or `--t` would be breaking.

## False alarms / non-issues
- No report identified a duplicate of a shipped prior-round fix.
- Toast first-frame rAF early-dismiss guard does not resurrect dismissed toasts.
- Combobox live MutationObserver cleanup/self-trigger behavior is OK.
- Popover native `toggle` cleanup after teardown is OK.
- `behaviors/theme.js` guards storage reads/writes and ignores corrupt stored values after init.
- Demo skin/surface persistence validates stored values.
- Connector/annotation geometry helpers are not all-pairs; stale redraw listener cleanup already has e2e coverage.
- `@layer bronto` ordering/dist assembly is sound; layered `!important` media-boundary carve-out is documented.
- Table display text `3,5` sorting as `35` is documented; `data-sort-value` is the intended escape hatch.
- Connector shape/side enums are already validated and skipped with warnings.

## Recommended fix batching
1. Theme first-paint/ARIA: `behaviors/theme.js`, `docs/integration.md`, any duplicated no-flash snippets — SAFE-FIX theme media ARIA and snippet validation only.
2. Async reconciliation: `behaviors/carousel.js`, `behaviors/spotlight.js` — replay suppressed carousel IO and recheck missing spotlight targets.
3. Table sort pipeline: `behaviors/table.js` — Unicode-minus normalization plus decorate-once sort keys.
4. Attribute normalization: `behaviors/splitter.js`, `behaviors/glyph.js`, `behaviors/dismissible.js` — strict numeric parsing and trim enum/selector attrs.
5. Scale hot paths: `behaviors/connectors.js` — cache records/endpoints and rAF-batch redraw.
6. List navigation scale: `behaviors/command.js`, `behaviors/combobox.js` — previous/next active updates, search caching, delegated/lazy outside-click listener.
7. Sources init scale: `behaviors/sources.js` — per-island id map and preview cache.
8. Crosshair cache-only: `behaviors/crosshair.js` — geometry/style caching without public event coalescing.
9. CSS-only last, held-if-budget/e2e: `css/feedback.css`, `css/interval.css`, `css/bullet.css` — namespace typed internals while preserving public aliases; raw bundle budget is full (~89kB), so dispatch only with budget and cross-engine e2e capacity.