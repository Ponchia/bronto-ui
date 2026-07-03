ROUND 8 multi-POV review of `@ponchia/ui` (bronto-ui). Theme: CORRECTNESS — find REAL,
REPRODUCIBLE DEFECTS. READ-ONLY. FRESH angle: DEEP screen-reader a11y (round 4 did keyboard
basics; go at announcements + name computation + full APG).

Your lens: **SCREEN-READER A11Y — ANNOUNCEMENTS, NAME COMPUTATION, LIVE REGIONS.**
Hunt real screen-reader defects across behaviors/ + the css/ that carries a11y semantics:
- Accessible NAME computation: a control whose computed name is empty, wrong, or duplicated
  (icon-only buttons with no label, a name from the wrong source, `aria-label` overriding useful
  content, visually-hidden text missing). Check dialog/menu/command/combobox/tabs/toast/carousel/
  splitter/dismiss buttons + form controls.
- Live regions: toasts/status/system-state/sync-bar/error-summary — correct `aria-live`
  politeness (polite vs assertive), `role="status"/"alert"`, atomic/relevant; do dynamic updates
  actually announce (region present at load, content changed not replaced)? Double or missing
  announcements.
- Roles & relationships: `role`/`aria-*` that a screen reader mis-reads — a listbox/option/tab/
  tabpanel/dialog/menu wired to APG, `aria-activedescendant` targeting a real focusable option,
  `aria-controls`/`labelledby`/`describedby` resolving to existing ids, `aria-expanded`/`selected`/
  `pressed`/`current` truthful.
- State announcements: expand/collapse, selection, sort direction (`aria-sort`), busy/loading,
  invalid — announced and correct.
- Hidden/inert: content hidden from SR that shouldn't be (or visible that should be hidden);
  `aria-hidden` on a focusable element (a serious trap); decorative icons/glyphs exposed to SR.
- `aria-roledescription` / localized announcements (round 7 added hooks — verify they announce).

Give a concrete "a screen-reader user doing X hears wrong/nothing" for each.

--- OUTPUT CONTRACT ---
READ-ONLY. REAL, REPRODUCIBLE DEFECTS only. FINAL ANSWER exactly:

# Deep screen-reader a11y — bronto-ui round 8 review
**Verdict:** one paragraph.
## Confirmed defects
- **[P0/P1/P2/P3] [conf HIGH/MED/LOW]** `path:line` — defect.
  - Failure scenario: SR user action → wrong/absent announcement.
  - Fix direction: minimal fix. Mark SAFE-FIX vs NEEDS-DESIGN · (CSS?/JS?/docs?).
## Lower-confidence / needs-repro
- bullets.
## Notable (not a bug)
- worth knowing.
Evidence-dense; defects only; no restating this prompt.
