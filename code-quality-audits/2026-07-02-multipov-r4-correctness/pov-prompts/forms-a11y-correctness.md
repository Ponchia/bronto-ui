ROUND 4 multi-POV review of `@ponchia/ui` (bronto-ui). Theme: CORRECTNESS & ROBUSTNESS — hunt
REAL, REPRODUCIBLE DEFECTS. READ-ONLY.

Your lens: **FORMS, INTERACTION & A11Y CORRECTNESS.**
Hunt actual accessibility/interaction BUGS (things that break for a real keyboard/AT user), in
css/forms.css, css/navigation.css, css/command.css, css/disclosure.css, css/overlay.css and the
matching behaviors (behaviors/forms.js, command.js, menu.js, combobox.js, dialog.js, modal.js,
popover.js, tabs.js, disclosure.js, inert.js):
- Keyboard operability: an interactive control not reachable/operable by keyboard; a keyboard
  trap; arrow-key/Home/End/typeahead patterns (APG) implemented wrong for menu/combobox/tabs.
- Focus: focus lost to `<body>` on close, not restored to trigger; focus ring removed with no
  `:focus-visible` replacement; focus entering `inert`/`aria-hidden` regions.
- ARIA correctness: wrong/missing `role`, `aria-*` that lies about state, mis-wired
  `aria-controls`/`aria-labelledby`/`aria-activedescendant`, `aria-expanded` desync.
- Forms: label/control association gaps, error not programmatically associated
  (`aria-describedby`), `:user-invalid`/native validation misuse, required/disabled handling,
  the `novalidate` progressive-enhancement contract.
- Contrast/visibility as a functional bug: a state (focus/selected/error) that isn't
  perceivable, or relies on color alone.

Give a concrete "user does X with keyboard/AT → wrong/broken" repro for each.

--- OUTPUT CONTRACT ---
READ-ONLY. REAL, REPRODUCIBLE DEFECTS only. Trace before reporting; unsure → confidence LOW.
FINAL ANSWER exactly:

# Forms / interaction / a11y — bronto-ui correctness review
**Verdict:** one paragraph.
## Confirmed defects
- **[P0/P1/P2/P3] [conf HIGH/MED/LOW]** `path:line` — defect.
  - Failure scenario: concrete keyboard/AT steps → broken behaviour.
  - Fix direction: minimal correct fix.
## Lower-confidence / needs-repro
- bullets.
## Notable (not a bug)
- worth knowing.
Evidence-dense; defects only; no restating this prompt.
