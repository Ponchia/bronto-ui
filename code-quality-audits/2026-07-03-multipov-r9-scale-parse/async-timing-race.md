# Async / timing / race — bronto-ui round 9 review
**Verdict:** Found four real async/timing defects. The main pattern is “suppress now, never replay later”: carousel IO updates, spotlight retargeting, and theme media changes all miss a later reconciliation step; modal stacking has a stale ownership problem when independently observed modal states change out of order.

## Confirmed defects
- **[P2] [conf HIGH]** `behaviors/carousel.js:320` — programmatic-scroll suppression drops real user scroll IO updates.
  - Failure scenario: initialize a smooth carousel, then swipe/scroll within 500 ms of init, or click Next and drag back before `scrollend`/the 500 ms timer releases; IO fires while `programmatic` is true, returns, and no final IO state is replayed, so status/thumbs stay on the wrong slide.
  - Fix direction: cache the best ignored IO entry and apply/remeasure on release, or suppress only the initial/programmatic echo batch. SAFE-FIX · JS.

- **[P2] [conf HIGH]** `behaviors/modal.js:125` — closing an outer controlled modal while an inner modal remains open releases background inert state.
  - Failure scenario: outer and inner `.ui-modal.is-open` are active; remove `is-open` from the outer only; on the MutationObserver microtask, outer `release()` sets its inerted body siblings back to `false` and focuses the opener while the inner modal still has `is-open`.
  - Fix direction: track behavior-owned inert with per-element ownership/ref counts, or release descendant active modals before the parent can un-inert shared ancestors. NEEDS-DESIGN · JS.

- **[P2] [conf HIGH]** `behaviors/spotlight.js:46` — retargeting before the new target exists leaves the cutout on stale coordinates forever.
  - Failure scenario: spotlight currently targets `#old`; set `data-target="new"`, then insert `#new` in the next macrotask; the MutationObserver runs before insertion, `byIdInHost()` returns null, `place()` keeps old `--spot-*` values, and no later observer watches the insertion.
  - Fix direction: clear spot vars when target is missing and observe relevant childList mutations, or schedule a post-mutation/rAF reconciliation that rechecks the target. SAFE-FIX · JS.

- **[P3] [conf HIGH]** `behaviors/theme.js:69` — theme toggle ARIA does not follow live OS color-scheme changes.
  - Failure scenario: no explicit `data-theme`; init in light mode sets plain toggle `aria-pressed="false"`; OS preference flips to dark; CSS media query changes the visual theme, but no `matchMedia('change')` listener calls `reflect()`, so the toggle remains announced as not pressed until another Bronto theme event/click.
  - Fix direction: keep a MediaQueryList listener and remove it in cleanup; call `reflect()` on changes, especially when `data-theme` is unset. SAFE-FIX · JS.

## Lower-confidence / needs-repro
- `behaviors/sources.js:123` — if a source card is authored with `is-source-active` and the user activates a citation to that same card, the 1600 ms generated-highlight timer removes the authored class. Reproducible, but contract intent is ambiguous because tests already treat authored active state as movable during behavior lifetime and restored on cleanup.

## Notable (not a bug)
- Toast’s first-frame rAF queue has an early-dismiss guard; dismissing before the first frame does not resurrect the toast.
- Combobox live mode disconnects its MutationObserver on cleanup and only observes childList/subtree, so its own role/id/hidden mutations do not self-trigger.
- Popover cleanup removes queued native `toggle` listeners after closing, so I did not find a stale native-popover toggle callback after teardown.