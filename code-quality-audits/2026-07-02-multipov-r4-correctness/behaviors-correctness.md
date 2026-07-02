# Behaviors — leaks/races/SSR — bronto-ui correctness review
**Verdict:** I found three reproducible behavior-layer correctness defects: one shared cleanup idempotency bug, one theme re-init ARIA desync, and one controlled-modal stacking/inert failure. I did not find confirmed import-time SSR crashes or unpaired observer/timer/listener leaks in the audited paths.

## Confirmed defects
- **[P2] [conf HIGH]** `behaviors/internal.js:69` — `bindOnce()` cleanups are not idempotent, so a stale cleanup can corrupt the currently active re-init.
  - Failure scenario: call `stop1 = initTabs()`, then `stop2 = initTabs()`; the second init correctly invokes `stop1` through `bindOnce`. If app/framework/HMR later calls the stale `stop1`, it runs again and `restoreState()` from the first tabs binding removes the active `role="tab"` / `aria-selected` state while `stop2`’s listeners remain active. Reproduced with `initTabs()`: after stale `stop1()`, the first tab’s `role` and `aria-selected` become `null`.
  - Fix direction: make the `cleanup` wrapper in `bindOnce` one-shot with a `done` guard before calling `remove()`.

- **[P2] [conf HIGH]** `behaviors/theme.js:108` — `initThemeToggle()` reflects `aria-pressed` before `bindOnce()` tears down the previous binding, so double-init immediately removes the freshly reflected ARIA state.
  - Failure scenario: markup has `<html data-theme="dark"><button data-bronto-theme-toggle>`. First `initThemeToggle()` sets `aria-pressed="true"`. Second `initThemeToggle()` calls `reflect()` at line 109, then `bindOnce()` runs the old cleanup, whose saved state removes `aria-pressed`; after re-init the active toggle has no pressed state until the next click.
  - Fix direction: move `applyStoredTheme()` + `reflect()` into the `bindOnce` add callback after old cleanup has run, so the new binding snapshots/restores and reflects in the right order.

- **[P2] [conf HIGH]** `behaviors/modal.js:112` — sibling stacked controlled modals inert each other, leaving the top modal itself `inert`.
  - Failure scenario: render two sibling `[data-bronto-modal]` overlays in a portal root. Open A, then open sibling B. A’s trap inerted every sibling, including B; B’s trap then inerts A but never clears B’s existing `inert`. Reproduced state after B opens: both `#a.inert === true` and `#b.inert === true`, while focus is in B. In a browser, B’s subtree is non-interactive despite being the top modal.
  - Fix direction: make inert handling stack-aware. Reconcile inert state so only the top active modal subtree remains interactive, with lower modals/background inerted; avoid independent per-modal sibling inert lists fighting each other.

## Lower-confidence / needs-repro
- **[P2] [conf LOW]** `behaviors/dialog.js:96` — cleanup removes each native dialog’s `close` focus-restorer before calling `dlg.close()`. A jsdom stub reproduces normal `dlg.close()` returning focus to the opener via the listener, while `stop()` leaves focus inside the now-closed dialog. Needs real-browser verification because native `<dialog>` may mask this with platform focus restoration. Fix direction: close before removing the listener, or call the restorer manually during cleanup.

## Notable (not a bug)
- Toast live regions intentionally persist after individual toasts drain; I did not treat the retained `.ui-toast-stack` as a leak.
- The audited observer/listener paths generally pair teardown correctly: `disconnect()`, `removeEventListener()`, timer clearing, and state restoration are present in the main lifecycle helpers.