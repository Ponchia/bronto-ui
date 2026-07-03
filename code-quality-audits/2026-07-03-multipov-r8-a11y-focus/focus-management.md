# Focus management — bronto-ui round 8 review
**Verdict:** Confirmed focus defects remain in the controlled modal path and shared roving/initial-focus helpers. Native `<dialog>` looks intentionally delegated to the browser; the real systemic risk is the custom `.is-open` modal/popover/tab behavior not consistently excluding hidden/late/out-of-subtree focus targets.

## Confirmed defects
- **[P1] [conf HIGH]** `css/overlay.css:85` — closed controlled non-`<dialog>` modals are not hidden, so their contents stay in the tab order before open and after close.
  - Failure scenario: keyboard user tabs through a page with `<div class="ui-modal" data-bronto-modal><button>OK</button></div>` mounted but not `.is-open` → focus lands on the “closed” modal button.
  - Fix direction: add a closed-state rule for non-dialog controlled modals, e.g. `.ui-modal:not(dialog):not(.is-open) { display: none; }`, or have `initModal` maintain `hidden`/`inert` while closed. SAFE-FIX · CSS/JS.

- **[P1] [conf HIGH]** `behaviors/modal.js:107` — the controlled modal inert trap only snapshots existing ancestor siblings; focusable nodes added after open are not inerted.
  - Failure scenario: keyboard user opens a controlled modal → app calls `toast('...', { duration: 0 })` → `toast()` appends a body-level stack with a close button → Tab can leave the modal to that toast close button.
  - Fix direction: while trapped, observe the ancestor chain/body for added siblings and inert any new nodes outside the active modal, releasing only nodes Bronto inerted. SAFE-FIX · JS.

- **[P2] [conf HIGH]** `behaviors/internal.js:130` — `focusInto()` treats hidden/non-rendered controls as focus candidates and stops after the first match.
  - Failure scenario: keyboard user opens a popover/modal whose first descendant button is `hidden` and second button is visible → `focusInto()` calls `.focus()` on the hidden button and never tries the visible one, so initial focus is lost or remains outside the overlay.
  - Fix direction: replace the raw selector with a tabbable filter that excludes `[hidden]`, inert ancestors, disabled fieldsets, non-rendered nodes, and negative tabindex values before focusing. SAFE-FIX · JS.

- **[P2] [conf HIGH]** `behaviors/tabs.js:56` — hidden/native-disabled tabs participate in the roving set and can become the only `tabindex="0"` tab.
  - Failure scenario: keyboard user reaches a tablist where the first `.ui-tab` is `hidden` or `disabled` → `initTabs()` selects it, sets that unreachable tab to `tabIndex=0`, and sets the visible tab to `-1`; Tab cannot enter the tablist.
  - Fix direction: build the roving candidates from reachable tabs, at least excluding `[hidden]` and native `:disabled`; define `aria-disabled` handling separately if needed. SAFE-FIX · JS.

## Lower-confidence / needs-repro
- `behaviors/combobox.js:259` / `behaviors/command.js:234` — if consumers put `.ui-combobox__option` or `.ui-command__item` on native buttons/links, Bronto sets `role="option"` but leaves native `tabIndex=0`, creating extra tab stops inside an `aria-activedescendant` widget. Docs show `<li>` rows, so this is contract hardening unless that markup is supported.

## Notable (not a bug)
- `initMenu` deliberately is not an ARIA `menu`; its items are normal Tab-reachable buttons, so lack of arrow-key roving is intentional.
- `initPopover` is documented as non-modal; Tab leaving an open popover is expected, unlike controlled modal focus escape.