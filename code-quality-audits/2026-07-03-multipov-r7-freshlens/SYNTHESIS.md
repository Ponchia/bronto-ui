# bronto-ui — round 7 (fresh-lens correctness) synthesis

## Executive verdict
All five reports are present and non-empty. I count 26 real SAFE-FIX items: 23 high-confidence and 3 medium-confidence. The worst is `behaviors/connectors.js:154`, where one bad connector enum can throw through batch init after mutating earlier DOM. Fixes cluster in behavior resilience/i18n JS, generated declarations, and docs/demo support drift; only two SAFE-FIXes touch CSS, both requiring cross-engine e2e attention.

## Scorecard
| Lens | Grade | # SAFE-FIX (HIGH/MED) | Worst item |
|---|---:|---:|---|
| TS-DX | B- | 6 (6H/0M) | `package.json:127` root side-effect CSS import lacks types |
| SSR/hydration | B- | 2 (2H/0M) | `behaviors/tabs.js:111` SSR renders inactive panels visible, but needs design |
| i18n beyond RTL | C+ | 7 (6H/1M) | `behaviors/command.js:149`, `behaviors/combobox.js:276` Turkish filtering failure |
| Progressive enhancement | B | 5 (4H/1M) | `demo/index.html:856` no-JS carousel controls are focusable but inert/unlabelled |
| Error resilience | C+ | 6 (5H/1M) | `behaviors/connectors.js:154` invalid connector aborts init and leaves partial SVG |
| Overall | C+ | 26 (23H/3M) | Behavior init resilience plus package/types drift |

## Confirmed SAFE-FIX — the fix list (severity × confidence, ranked)
**Runtime resilience / behavior JS**
- **[P1] [HIGH]** `behaviors/connectors.js:154` — invalid `data-shape`/side throws during `initConnectors()` after earlier SVG mutation · one bad connector aborts sibling init and leaves `.ui-connector__path` behind · catch per connector, clear generated parts, dev-warn allowed values, continue · (JS).
- **[P2] [HIGH]** `classes/index.js:1098` — `attrs.meter/progress/dotbar` emit impossible/NaN ARIA for bad `min`/`max` · malformed ranges produce `aria-valuemin=100 aria-valuemax=0` or `NaN` · finite-check, require `max > min`, fallback/omit with dev warning · (JS).
- **[P2] [HIGH]** `behaviors/splitter.js:90` — invalid authored separator range remains in DOM while math normalizes · `aria-valuemin=80 aria-valuemax=20` persists · normalize DOM attrs too or skip enhancement with warning · (JS).
- **[P2] [HIGH]** `behaviors/toast.js:196` — invalid `duration` creates sticky toast with no close button · `duration: -1`/`NaN` never dismisses and cannot be closed · coerce finite non-negative duration or make sticky-with-close, dev-warn · (JS).
- **[P2] [HIGH]** `behaviors/table.js:229` — `.ui-table__sort` outside `<th>` crashes on click · caption/toolbar sort button throws on `closest('th')` null · guard, ignore, dev-warn placement contract · (JS).
- **[P3] [MED]** `behaviors/disclosure.js:51` — broken `aria-controls` silently makes disclosure inert · typo target gives no toggle and stale `aria-expanded` · warn once per broken trigger at init/click · (JS).

**Package / generated types**
- **[P1] [HIGH]** `package.json:127` — documented `import '@ponchia/ui'` side-effect CSS import has no root `types` condition · strict TS reports missing declarations · ship empty root declaration and add `"types"` for `"."` before style/default · (types).
- **[P2] [HIGH]** `connectors/index.d.ts:86`, `connectors/index.d.ts:142` — `connectorPath()` / `connectRects()` type-check without required geometry · omitted opts throw at runtime · make opts required in JSDoc/signature and regenerate d.ts · (types).
- **[P2] [HIGH]** `annotations/index.d.ts:15` — annotation helper option objects are emitted optional despite required fields · `notePlacement()`/`connectorLine()` type-check then throw · remove optional/default-object signatures for required geometry helpers and regenerate · (types).
- **[P2] [HIGH]** `svelte/index.d.ts:7` — `createBrontoAction` erases custom option fields · `{ threshold }` is rejected though runtime forwards it · genericize action opts/action/factory over initializer option type · (types).
- **[P2] [HIGH]** `vue/index.d.ts:7` — `createBrontoDirective` has same option erasure · directive value rejects custom fields forwarded at runtime · genericize directive opts/bindings/factory · (types).
- **[P3] [HIGH]** `classes/index.d.ts:7` — `cx` rejects readonly tuples · `as const` class arrays fail although runtime flattens them · recurse through `readonly ClassValue[]` and sync generated d.ts · (types).

**i18n behavior / generated accessible text**
- **[P2] [HIGH]** `behaviors/command.js:149`, `behaviors/combobox.js:276` — filtering uses default `toLowerCase()` · Turkish `İstanbul` is hidden for `istanbul` · derive closest `[lang]`/document locale and normalize query/options locale-aware · (JS).
- **[P2] [HIGH]** `behaviors/carousel.js:68` — localized `aria-roledescription` is overwritten · French `carrousel`/`diapositive` becomes English · only set if absent and add data/option hooks for localized defaults · (JS).
- **[P2] [HIGH]** `behaviors/forms.js:230` — validation summary title is hard-coded English · German form announces “There is a problem” · preserve authored heading or accept localized title option/data attr · (JS).
- **[P3] [HIGH]** `behaviors/table.js:190` — text sort ignores component/document locale · Swedish `Ä/Ö` collate incorrectly · use `Intl.Collator(locale, { numeric: false, sensitivity: 'base' })` · (JS).
- **[P3] [HIGH]** `behaviors/toast.js:122` — generated close button hard-codes `aria-label="Dismiss"` · Japanese UI announces English action · add `dismissLabel` option/data attr, default only as fallback · (JS).

**SSR / progressive markup and docs**
- **[P2] [HIGH]** `behaviors/glyph.js:216` — glyph DOM is injected only after hydration · SSR first paint shows placeholder/missing icon · use `renderGlyph()`/mask helpers for SSR-visible glyphs; keep init as fallback · (JS/docs).
- **[P2] [HIGH]** `behaviors/combobox.js:269` — SSR/demo combobox list is visible until JS hides it · dropdown flashes open before hydration · safe fix is docs/examples requiring `hidden`, stable ids, and initial ARIA; API helper remains design · (docs/HTML).
- **[P2] [HIGH]** `docs/usage.md:627` — native modal is documented as fully no-JS operable · demo open/close buttons are JS-only and `open` is not `showModal()` · move modal/lightbox to behavior-required unless declarative path is verified · (docs).
- **[P2] [HIGH]** `demo/index.html:856` — no-JS carousel fallback leaves visible inert arrow buttons · controls are focusable, unlabelled, and do nothing · author labels plus disabled/hidden no-JS state, init enables/unhides · (HTML/docs).
- **[P3] [HIGH]** `docs/tree.md:40` — `details name` exclusive grouping is documented for Firefox 129 · Firefox support starts at 130 · mark Firefox 130+, raise floor, or provide JS fallback · (docs).
- **[P3] [HIGH]** `docs/figure.md:8` — figure recipe imports omit CSS leaves it uses · `--chart-*` and annotation connector classes can render wrong/invisible · add `dataviz.css`/`annotations.css` or remove cross-leaf dependencies · (docs).
- **[P3] [MED]** `docs/textref.md:18` — text-fragment exact navigation is promised at Firefox 129 · Firefox support starts at 131 and no `#section` fallback can land at top · require `#section:~:text=...` fallback or document 131+ · (docs).

**CSS writing-mode / bidi**
- **[P2] [HIGH]** `css/forms.css:423`, `css/navigation.css:70` — switch/theme-toggle thumbs use physical `translateX` with logical track sizing · vertical writing mode moves checked thumb sideways out of track · use logical positioning or explicitly pin controls horizontal · (CSS, e2e risk).
- **[P2] [MED]** `css/code.css:16`, `css/diff.css:25` — code/diff inherit page direction/writing mode · RTL/vertical pages reorder punctuation or turn source lines vertical · set code bodies/cells `direction: ltr; unicode-bidi: isolate; writing-mode: horizontal-tb` · (CSS, e2e risk).

## NEEDS-DESIGN / held
- **[P2] [HIGH]** `behaviors/tabs.js:111` — SSR inactive tab panels render visible until hydration. Needs an SSR markup/render-helper contract for ids, roles, `aria-selected`, `tabindex`, and `hidden`.
- **[P2] [HIGH]** `behaviors/combobox.js:269` — docs/examples can be fixed safely, but a first-class SSR API/helper for enhanced resting state needs design.
- **[P2] [MED]** `behaviors/modal.js:177` — initially open controlled modals show before focus trap/inert siblings hydrate. Needs contract: server-encoded inert/ARIA, native `<dialog>`, or client-open only.
- **[P2] [HIGH]** `behaviors/table.js:165` — localized numeric parsing mis-sorts common formats. Existing `data-sort-value` is an escape hatch; decide whether default parser becomes locale-aware or docs require sort values.
- **[P3] [MED]** `css/bullet.css:46` — vertical writing mode breaks bullet graph gradients/ticks. Decide pin-horizontal vs true vertical support; any fix is CSS e2e risk.
- **KNOWN-HELD** `tokens/mermaid.js:176` / type tests — runtime accepts unknown theme fallback, but shipped types intentionally reject unknown strings. Do not loosen without API decision.
- Needs repro before dispatch: `docs/annotations.md:8` import drift, Qwik City `useToast()` resumability, uppercase/tracking on localized labels, and bidi truncation guidance for mixed-script command/tree labels.

## False alarms / non-issues
- No report found a top-level `document`/`window`/`localStorage` SSR import crash in behaviors or adapters.
- Round-6 style ID concerns were not reproduced: ids are monotonic client-side; the SSR issue is missing server-emitted enhanced state, not random id mismatch.
- Next theme `<html data-theme>` mismatch is intentional and paired with `suppressHydrationWarning`.
- `behaviors/internal.d.ts` has broad internal helper declarations, but the public barrel exposes precise aliases.
- React/Solid/Qwik custom option generics are already precise; only Svelte/Vue erase options.
- Pure `connectors/` and `annotations/` helpers may intentionally throw on invalid direct inputs; the safe fix is containment in DOM behavior init.
- Missing connector endpoints are already skip-and-clear, covered separately from invalid enum crashes.
- Direct `null` options are not counted: public types allow optional objects, not nullable objects.
- `ui-scroll-reveal` and `highlights.css` fallbacks are correctly gated/documented.

## Recommended fix batching
1. **Connector behavior containment** — `behaviors/connectors.js` plus focused tests for invalid `data-shape`/side continuing sibling init. Items: runtime P1.
2. **Types/package generation** — `package.json`, root empty d.ts, connector/annotation JSDoc+d.ts, `svelte/`, `vue/`, `classes` readonly type tests. Items: all TS-DX SAFE-FIXes.
3. **Behavior JS hardening and i18n** — `behaviors/command.js`, `combobox.js`, `table.js`, `splitter.js`, `disclosure.js`, `carousel.js`, `forms.js`, `toast.js`, `glyph.js`, plus unit/browser tests. Items: filtering, text collation, sort guard, ARIA normalization, localized labels, glyph SSR path.
4. **Runtime helper ARIA** — `classes/index.js` and tests for `attrs.meter/progress/dotbar` malformed ranges. Keep separate from generated type batch if ownership differs.
5. **CSS-only writing-mode/bidi** — `css/forms.css`, `css/navigation.css`, `css/code.css`, `css/diff.css`. Items: switch/theme-toggle vertical writing, code/diff isolation. Cross-engine e2e watch required.
6. **Docs/demo support contracts** — `docs/usage.md`, `demo/index.html`, `docs/tree.md`, `docs/figure.md`, `docs/textref.md`, combobox SSR examples. Items: no-JS modal/carousel, browser floors, figure imports, combobox initial hidden state.