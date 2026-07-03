# bronto-ui — round 8 (fresh-lens correctness) synthesis

## Executive verdict
All five reports are present and non-empty. I count **14 real SAFE-FIX items** after holding the modal-inert finding as a known-held contract; the worst safe item is the closed controlled non-`<dialog>` modal remaining tabbable. Issues cluster in focus/a11y behavior JS and short CSS custom-property APIs. Prefer JS/docs fixes first; every CSS-touching fix below carries cross-engine e2e risk and raw bundle-budget risk.

## Scorecard
| Lens | Grade | # SAFE-FIX (HIGH/MED) | Worst item |
|---|---:|---:|---|
| report-data-semantics | A- | 3 (2H/1M conf) | `behaviors/connectors.js:185` scoped connector can escape root |
| deep-a11y-screenreader | A- | 4 (4H/0M conf) | `behaviors/toast.js:29` atomic assertive stack can re-announce old alerts |
| focus-management | A | 3 (3H/0M conf) | `css/overlay.css:85` closed controlled modal contents remain tabbable |
| css-custom-prop-api | A | 4 (4H/0M conf) | `@property --lo/--hi/--t` globally type generic consumer vars |
| event-api-contract | B+ | 0 | `bronto:change` has incompatible combobox/carousel payloads; breaking to rename |
| Overall | A- | 14 (13H/1M conf) | Focus escape/tab-order bugs first; CSS prop fixes are real but e2e/budget-sensitive |

## Confirmed SAFE-FIX — the fix list (severity × confidence, ranked)

Non-CSS / preferred this round:

**Focus primitives / roving**
- **[P2] [conf HIGH]** `behaviors/internal.js:130` — `focusInto()` stops on hidden/non-rendered focus candidates · opening a modal/popover with a hidden first button can leave focus outside · filter to real tabbables before focusing: exclude `[hidden]`, inert ancestors, disabled fieldsets, non-rendered nodes, negative tabindex · JS.
- **[P2] [conf HIGH]** `behaviors/tabs.js:56` — hidden/native-disabled tabs enter the roving set · first hidden/disabled tab can become the only `tabindex="0"`, so Tab cannot enter the tablist · build candidates from reachable tabs; handle `aria-disabled` separately · JS.

**Report data behavior**
- **[P2] [conf HIGH]** `behaviors/connectors.js:185` — scoped connector lookup can escape `root` via document fallback · missing in-section endpoint resolves to an unrelated same-id element elsewhere · require `host.contains(from/to)` for element roots and clear otherwise; add scoped-root regression · JS/tests.

**Screen-reader behavior**
- **[P2] [conf HIGH]** `behaviors/toast.js:29` — assertive stack is one atomic alert containing multiple toasts · second danger toast can announce old plus new text · make assertive stack one-at-a-time or move alert semantics to per-toast nodes · JS.
- **[P2] [conf HIGH]** `behaviors/command.js:175` — “No commands” empty state is visual only · SR user types zero-match query and hears no status change · make `.ui-command__empty` a polite status/live region and update its live text · JS.
- **[P3] [conf HIGH]** `behaviors/combobox.js:50` — listbox label mirroring ignores `aria-labelledby` / `title` · input named “Fruit” opens an unnamed listbox · resolve/copy `aria-labelledby`, include title fallback, snapshot/restore generated labeling · JS.
- **[P3] [conf HIGH]** `behaviors/carousel.js:99` — slide `aria-roledescription` overwrites authored localized text · localized slides still announce English “slide” · preserve authored value and add localized slide-roledescription hook · JS/docs.

CSS / held-if-budget-and-e2e-risk:

**Overlay CSS**
- **[P1] [conf HIGH]** `css/overlay.css:85` — closed controlled non-`<dialog>` modals are not hidden · keyboard user tabs into a mounted but closed `.ui-modal` · add closed-state hiding for non-dialog controlled modals or have `initModal` maintain `hidden`/closed state · CSS/JS; CSS risk.

**Report presentation CSS**
- **[P2] [conf HIGH]** `css/textref.css:50` — `--textref-highlight` is documented on source link but `::target-text` paints destination text · author-bound provenance colour on `.ui-textref` is ignored · move/define the knob on root or target-side scope; update `docs/textref.md` and `classes.json` generator · CSS/docs/contract.
- **[P3] [conf MED]** `css/legend.css:151` — continuous legend gradient is LTR while tick labels follow RTL direction · min/max labels can map to wrong colours · reverse `:dir(rtl)` gradients or explicitly lock track and ticks to LTR · CSS/tests.

**CSS custom-property API**
- **[P2] [conf HIGH]** `css/interval.css:13` — global `@property --lo` / `--hi` registers generic consumer names as `<number>` · unrelated `--hi: 3rem` / `--lo: .25rem` can be rejected after import · remove generic registrations or feed namespaced internal typed props from legacy aliases · CSS.
- **[P2] [conf HIGH]** `css/bullet.css:36` — global `@property --t` registers one-letter public knob as `<number>` · consumer `--t: 250ms` or `50%` can be rejected globally · remove registration or move typing to namespaced internal prop while preserving public alias · CSS.
- **[P3] [conf HIGH]** `css/dots.css:451` — inherited `--v` bypasses `var(--v, 0)` fallback · consumer root `--v: 12px` can corrupt dot gauge/spark/bullet/interval geometry · set component-local defaults on value hosts · CSS.
- **[P3] [conf HIGH]** `css/motion.css:189` — inherited `--i` leaks into stagger/dot-matrix indexes · consumer root `--i: 4` adds unintended delays/reveals · set local `--i: 0` defaults or introduce namespaced aliases while preserving inline `--i` compatibility · CSS.

## NEEDS-DESIGN / held
- **[P1] [conf HIGH]** `behaviors/modal.js:107` — late-added body siblings are not inerted while controlled modal trap is open · toast close button can become tabbable outside the modal · this duplicates the **known-held modal inert** contract; needs owner decision before implementing observer-based inerting.
- **[P2] [conf MED]** `behaviors/command.js:240` — command input can be promoted to unnamed combobox · enforcing/warning/auto-labeling changes public authoring contract · decide required labeling API/localization path.
- **[P3] [conf HIGH]** `behaviors/carousel.js:90` — unlabeled carousel defaults to generic duplicate “Carousel carousel” · requiring `data-bronto-carousel-label` or changing fallback is behavior/docs policy · decide contract.
- **[P2] [conf HIGH]** `behaviors/combobox.js:322` + `behaviors/carousel.js:261` — `bronto:change` has incompatible `{value,label}` vs `{index}` payloads · renaming public events is breaking · prefer additive namespaced events plus deprecation plan.
- Public CSS custom-property renames for `--lo`, `--hi`, `--t`, `--v`, `--i`, or `--textref-highlight` are breaking. Safe fixes must preserve current names/aliases.

## False alarms / non-issues
- `behaviors/sources.js` already checks `island.contains(source)`; no source-citation root escape.
- Legend categorical swatches 1-8 match `--chart-N`; covered by `check-legend`.
- No focusable `aria-hidden="true"` traps found.
- `initMenu` is intentionally not ARIA `menu`; normal Tab navigation is expected.
- `initPopover` is documented non-modal; Tab leaving it is expected.
- Native `<dialog>` path appears intentionally delegated to browser behavior.
- `bronto:*` events with `composed: false` are not bugs absent Shadow DOM delegation docs.
- Short theme aliases `--bg`, `--panel`, `--line`, `--accent` are documented permanent aliases.
- No new report item targets the known-held `--value` global prop, figure overlay, Svelte/Vue generics, combobox/tabs/modal SSR, or raw-bundle-budget contract.

## Recommended fix batching
1. **JS focus/data batch** — `behaviors/internal.js`, `behaviors/tabs.js`, `behaviors/connectors.js`: focusInto filtering, reachable tab roving, scoped connector containment.
2. **JS screen-reader batch** — `behaviors/toast.js`, `behaviors/command.js`, `behaviors/combobox.js`, `behaviors/carousel.js`: toast alert semantics, command empty live region, combobox listbox naming, preserve localized slide roledescription.
3. **Overlay closed-state batch** — `css/overlay.css` and/or `behaviors/modal.js`: closed non-dialog modal tabbability only; avoid the held late-sibling inert observer unless design approves. CSS path is e2e/budget risk.
4. **CSS custom-property containment batch** — `css/interval.css`, `css/bullet.css`, `css/dots.css`, `css/spark.css`, `css/motion.css`: remove generic `@property` registrations or add namespaced internals; add local defaults for `--v`/`--i`. CSS e2e/budget risk.
5. **Report CSS/docs contract batch** — `css/textref.css`, `docs/textref.md`, classes generator, `css/legend.css`: textref target-side highlight contract and RTL continuous legend semantics. CSS e2e/budget risk.