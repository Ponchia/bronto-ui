ROUND 4 multi-POV review of `@ponchia/ui` (bronto-ui). Theme: CORRECTNESS & ROBUSTNESS — hunt
REAL, REPRODUCIBLE DEFECTS. READ-ONLY.

Your lens: **BEHAVIORS — LEAKS, RACES, SSR, TEARDOWN.**
Hunt actual bugs in behaviors/*.js (the vanilla SSR-safe glue: dialogs, toasts, disclosure,
menus, combobox, popover, modal, tabs, theme, command, splitter, forms, inert, connectors,
annotations, …):
- Leaks: event listeners / MutationObserver / ResizeObserver / IntersectionObserver / timers /
  rAF added but not removed on the returned cleanup; global (document/window) listeners that
  outlive the element.
- Idempotency / double-init: calling init twice double-binds; re-init after DOM change duplicates
  handlers or state.
- Teardown correctness: cleanup that doesn't fully undo setup (leaves attrs/classes/inert/focus
  state); destroy mid-transition/mid-open.
- Focus management: focus-trap escapes (Tab/Shift-Tab at edges), focus not restored to trigger,
  `inert`/`aria-hidden` desync, ESC/outside-click not honored in an edge case.
- Races / null-deref: assuming an element/ref/owner-document exists; async ordering; event fired
  before listener attached.
- SSR/hydration: top-level or init-time `document`/`window` access that throws in SSR; state that
  desyncs between server markup and client hydration.
- ARIA state desync: `aria-expanded`/`aria-selected`/`aria-controls` not updated with actual state.

Trace each defect through the code; give a concrete repro.

--- OUTPUT CONTRACT ---
READ-ONLY. REAL, REPRODUCIBLE DEFECTS only. Trace before reporting; unsure → confidence LOW.
FINAL ANSWER exactly:

# Behaviors — leaks/races/SSR — bronto-ui correctness review
**Verdict:** one paragraph.
## Confirmed defects
- **[P0/P1/P2/P3] [conf HIGH/MED/LOW]** `path:line` — defect.
  - Failure scenario: concrete steps → leak/wrong state/crash.
  - Fix direction: minimal correct fix.
## Lower-confidence / needs-repro
- bullets.
## Notable (not a bug)
- worth knowing.
Evidence-dense; defects only; no restating this prompt.
