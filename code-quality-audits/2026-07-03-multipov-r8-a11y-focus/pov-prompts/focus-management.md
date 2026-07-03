ROUND 8 multi-POV review of `@ponchia/ui` (bronto-ui). Theme: CORRECTNESS — find REAL,
REPRODUCIBLE DEFECTS. READ-ONLY. FRESH angle: system-wide FOCUS management (round 4/5 fixed
specific focus bugs; do a systemic sweep).

Your lens: **FOCUS MANAGEMENT (order, restore, trap, visible, roving).**
Hunt focus defects across ALL interactive behaviors + css/state.css/overlay.css:
- Focus TRAP correctness: dialog/modal/command/menu/popover — is Tab/Shift+Tab contained to the
  right subtree, wrapping at both edges, including all tabbables, excluding inert/hidden? Any way
  to Tab OUT of a modal, or a trap that includes an unintended element?
- Focus RESTORE: on close/cleanup, focus returns to the invoking trigger — for every dismiss path
  (Escape, backdrop click, close button, programmatic, cleanup). Round 5/7 fixed dialog cases;
  check menu/popover/command/modal/toast for lost focus (to <body>) or restore to a stale/removed
  element.
- Roving tabindex / `aria-activedescendant`: tablist/menu/combobox/command — exactly one tab stop,
  arrow keys move the roving index correctly, focus/activedescendant not left on a hidden/removed
  option, initial focus sane.
- `:focus-visible`: is a visible focus indicator ALWAYS present for keyboard focus, never removed
  with `outline:none` without replacement, sufficient contrast (WCAG 2.4.7 / 2.4.11)? Sweep css/
  for `outline:none`/`:focus{outline:0}` without a `:focus-visible` ring.
- Initial focus / autofocus: does opening an overlay move focus to the right first element (per
  APG), not the wrong one or nowhere? `autofocus`/`inert` interactions.
- Tab order: DOM order vs visual order mismatches (positive tabindex, reordered flex/grid) that
  make Tab jump around.

Give a concrete "keyboard user does X → focus goes wrong/lost/escapes" for each.

--- OUTPUT CONTRACT ---
READ-ONLY. REAL, REPRODUCIBLE DEFECTS only. FINAL ANSWER exactly:

# Focus management — bronto-ui round 8 review
**Verdict:** one paragraph.
## Confirmed defects
- **[P0/P1/P2/P3] [conf HIGH/MED/LOW]** `path:line` — defect.
  - Failure scenario: keyboard action → focus goes wrong.
  - Fix direction: minimal fix. Mark SAFE-FIX vs NEEDS-DESIGN · (CSS?/JS?).
## Lower-confidence / needs-repro
- bullets.
## Notable (not a bug)
- worth knowing.
Evidence-dense; defects only; no restating this prompt.
