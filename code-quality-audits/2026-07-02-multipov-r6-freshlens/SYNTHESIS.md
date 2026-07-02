# bronto-ui — round 6 (fresh-lens correctness) synthesis

## Executive verdict
All five reports are present and non-empty. After dedupe and demoting known-held contracts, there are **22 confirmed SAFE-FIX items**: **20 HIGH-confidence** and **2 MED-confidence**. Worst held cluster is modal/inert ownership; worst safe clusters are prototype-inherited lookups, stale behavior state, duplicate ARIA option ids, and narrow-container CSS.

## Scorecard
| Lens | Grade | # SAFE-FIX (HIGH/MED) | Worst item |
|---|---:|---:|---|
| State machines | B- | 3 (3 HIGH / 0 MED) | `behaviors/modal.js:114` stacked modal inert release, held |
| Responsive / fluid | B- | 7 (7 HIGH / 0 MED) | `css/overlay.css:427` menu collapses to trigger width |
| Composition / override | C+ | 2 (0 HIGH / 2 MED) | `behaviors/modal.js:113` portal popover trapped inert, held |
| Motion / animation | B | 4 (4 HIGH / 0 MED) | `behaviors/carousel.js:188` reduced-motion scroll state suppression |
| Recipes / connectors | B- | 6 (6 HIGH / 0 MED) | `classes/index.js:716` inherited option-map lookups |
| Overall | B- | 22 (20 HIGH / 2 MED) | No P1; modal inert is held, but many P2 safe fixes are ready |

## Confirmed SAFE-FIX — the fix list (severity × confidence, ranked)

**JS helper registries / recipes / glyphs**
- **[P2] [conf HIGH]** `classes/index.js:716` — recipe maps read inherited properties · `ui.state({ state: 'toString' })` emits native function text as a class · use own-property/null-prototype lookups for all recipe maps.
- **[P2] [conf HIGH]** `annotations/index.js:709` — annotation subject dispatch reads inherited builders · `subject.type='toString'` bypasses unsupported-subject guard and returns bad subject text · guard with `Object.hasOwn()` or null-prototype builders.
- **[P2] [conf HIGH]** `glyphs/glyphs.js:1400` — glyph registry treats inherited properties as glyphs · `renderGlyph('toString')` throws instead of returning `''` · centralize own-property glyph row lookup or freeze a null-prototype registry.
- **[P3] [conf HIGH]** `classes/index.js:707` — `cx()` stringifies truthy booleans · `cx(true, 'ui-button')` returns `"true ui-button"` · ignore booleans while preserving strings/numbers and falsy dropping.
- **[P3] [conf HIGH]** `glyphs/glyphs.js:1454` — CSS length sanitizer accepts bare identifiers · `dot:'red'` emits invalid length custom properties · replace regex with a length/function allowlist and mirror in `behaviors/glyph.js`.

**Behavior state / drawing**
- **[P2] [conf HIGH]** `behaviors/disclosure.js:43` — overlapping roots double-toggle one click · document init plus section init opens then closes the same panel · mark handled events or skip already-handled Bronto disclosure events.
- **[P2] [conf HIGH]** `behaviors/carousel.js:188` — reduced-motion instant scroll still suppresses observer updates for 500ms · click Next then immediately scroll leaves status/thumb stale · skip/shorten hold when scroll behavior is `auto`/reduced; prefer `scrollend` fallback.
- **[P2] [conf HIGH]** `behaviors/connectors.js:143` — generated connector path remains after endpoint disappears · remove `#b`, resize, and stale line still shows relationship · clear/remove generated path/end when either endpoint is missing.
- **[P3] [conf HIGH]** `behaviors/disclosure.js:45` — multiple triggers for one panel desync · trigger A opens panel while trigger B still says false · derive state from panel and update all in-scope triggers with same `aria-controls`.
- **[P3] [conf HIGH]** `behaviors/theme.js:78` — scoped theme toggles do not reflect global changes across roots · island A toggles dark while island B stays stale · reflect on `bronto:themechange` or maintain document-level control registry with cleanup.

**Generated ARIA option ids**
- **[P2] [conf MED]** `behaviors/command.js:214` — copied command palettes with same list id duplicate option ids · second input’s `aria-activedescendant` resolves into first palette · include fresh per-instance UID in generated option ids; warn on duplicate list ids.
- **[P2] [conf MED]** `behaviors/combobox.js:368` — copied comboboxes with same list id cross-wire active descendants · second combobox points to first `choices-opt-0` · mint per-instance option ids independent of author list id; warn on duplicate controlled ids.

**CSS responsive / overflow / touch**
- **[P2] [conf HIGH]** `css/overlay.css:427` — mobile dropdown collapses to trigger width · 520px menu clips “Duplicate” · keep content/min width and cap to viewport instead of `inset-inline:0` against inline-block host.
- **[P2] [conf HIGH]** `css/table.css:120` — sortable header button hit target is too small · coarse pointer dense table yields about 16px height · give sort buttons 24px minimum block size or stretch over header padding.
- **[P3] [conf HIGH]** `css/term.css:81` — glossary `max-content` term column overflows narrow containers · long Kubernetes term exceeds 18rem sidebar · cap/wrap term column with `min-inline-size:0` and `overflow-wrap:anywhere`.
- **[P3] [conf HIGH]** `css/command.css:53` — command rows cannot shrink long labels beside shortcuts · 320px palette clips path-like label under hidden overflow · make label flex child shrink/wrap/ellipsis; keep shortcut non-shrinking.
- **[P3] [conf HIGH]** `css/code.css:24` — code headers clip long filenames · 320px header hides path with no ellipsis/scroll · add shrinkable header children with ellipsis or wrapping.
- **[P3] [conf HIGH]** `css/diff.css:71` — diff headers clip long tokens · long path/hash disappears under `.ui-diff { overflow:hidden }` · add scoped wrapping or horizontal scroller for headers.
- **[P3] [conf HIGH]** `css/primitives.css:543` — CTA/arrow links miss 24px coarse-pointer floor · 15px root makes `1.5rem` equal 22.5px · use `min-block-size:max(24px, 1.6rem)`.

**CSS motion**
- **[P3] [conf HIGH]** `css/feedback.css:337` — tooltip transform jumps because only opacity transitions · hover/focus moves bubble 4px instantly · include `transform` in transition while preserving reduced-motion reset.
- **[P3] [conf HIGH]** `css/spotlight.css:42` — spotlight animates layout sizes while repainting large mask · target changes force layout/paint · animate transform/opacity only, or snap size and translate.
- **[P3] [conf HIGH]** `css/motion.css:133` — indeterminate progress animates inset every frame · loading bar uses layout-position animation · position once and animate `transform: translateX(...)`; preserve reduced-motion hatch.

## NEEDS-DESIGN / held
- **[P2] [conf HIGH]** `behaviors/modal.js:114` — known-held stacked-modal inert ownership · closing lower modal releases background while inner modal remains open · needs Bronto-owned modal stack/ref-counted inert reconciliation.
- **[P2] [conf HIGH]** `behaviors/modal.js:113` — modal inert traps document-portal popovers · popover opened from modal stays inert under `body` and Escape ordering crosses modal/popover · needs portal ownership/allowlist contract.
- **[P2] [conf HIGH]** `css/feedback.css:13` — known-held global `--value` registration · consumer `--value:50%` is rejected by Bronto’s `<number>` registration · full fix needs deprecation/rename policy, not a blind safe fix.
- **[P2] [conf HIGH]** `behaviors/internal.js:69` — `bindOnce()` is not ref-counted across multiple consumers · second island unmount removes global behavior still needed by first · needs ownership semantics or explicit app-level singleton design.
- **[P3] [conf HIGH]** `behaviors/popover.js:143` — duplicate triggers for one popover panel desync · second trigger may close instead of syncing/retargeting · needs decision on same-panel trigger semantics.
- **[P2] [conf HIGH]** `css/report.css:633` — meter rows overflow narrow desktop containers · 20rem card keeps three columns · needs layout/API decision for container-aware wrapping.
- **[P2] [conf MED]** `css/overlay.css:95` — dialog close exit motion unlocks scroll/focus before visual exit completes · background scrolls during fade-out · needs closing-state vs native-snap behavior decision.
- **[P2] [conf HIGH]** `classes/index.js:1089` — value attrs emit NaN/inverted ARIA ranges · invalid `min/max` returns bad `aria-valuenow/min/max` · choose throw vs fail-safe omission policy.

## False alarms / non-issues
- Already-shipped duplicate: the round-4 dotfit axis issue is fixed; `.ui-cq` now establishes inline-size containment and dotfit uses `inline-size < 18rem`.
- Reconfirmed held, not safe re-fixes: `css/feedback.css:13` global `--value` and `behaviors/modal.js` stacked inert remain design/API items from rounds 4-5.
- Adjacent but not duplicate: round-6 `bindOnce()` ref-counting is not the round-4 stale-cleanup one-shot bug; round-6 `theme.js:78` scoped-root sync is not the round-4 double-init restore bug.
- `initTabs` static snapshots refresh on explicit re-init; do not change as a dynamic DOM bug.
- `initCombobox` live option handling is explicitly opt-in via `data-bronto-combobox-live`; no confirmed bug in that path.
- No normal component styling rule was found using `!important` to defeat consumer overrides; print/reduced-motion importance is intentional.
- Reduced-motion reset, scroll/view timeline gating, and analytical draw/reveal `no-preference` guards are correct-by-design.

## Recommended fix batching
1. **JS helper registries:** `classes/index.js`, `annotations/index.js`, `glyphs/glyphs.js`, `behaviors/glyph.js` — recipe own-property guards, `cx()` booleans, annotation subject guard, glyph lookup, glyph length sanitizer.
2. **Behavior state/drawing:** `behaviors/disclosure.js`, `behaviors/theme.js`, `behaviors/carousel.js`, `behaviors/connectors.js` — overlapping disclosure events, shared disclosure triggers, scoped theme sync, reduced-motion carousel hold, stale connector clearing.
3. **Generated ARIA ids:** `behaviors/command.js`, `behaviors/combobox.js` — per-instance option ids and duplicate-list-id warnings.
4. **Responsive overflow CSS:** `css/overlay.css`, `css/term.css`, `css/command.css`, `css/code.css`, `css/diff.css` — menu width, glossary wrapping, command labels, code/diff header clipping.
5. **Touch target CSS:** `css/table.css`, `css/primitives.css` — sortable header hit target and CTA/arrow link minimum block size.
6. **Motion CSS:** `css/feedback.css`, `css/spotlight.css`, `css/motion.css` — tooltip transform transition, spotlight compositor-safe motion, indeterminate progress transform animation.