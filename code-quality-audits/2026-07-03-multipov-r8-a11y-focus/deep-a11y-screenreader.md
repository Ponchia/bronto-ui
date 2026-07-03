# Deep screen-reader a11y — bronto-ui round 8 review
**Verdict:** Read-only review found several real SR correctness defects in behavior-owned ARIA: missing no-results announcements, silent nameless combobox promotion, duplicate/generic carousel naming, localized roledescription override, and assertive-toast re-announcement risk.

## Confirmed defects
- **[P2] [conf HIGH]** `behaviors/toast.js:29` — assertive toast stack is one atomic `role="alert"` region but can contain multiple toasts.
  - Failure scenario: SR user gets “first error”; before it dismisses, a second danger toast appears → atomic alert can announce old + new text together.
  - Fix direction: SAFE-FIX · JS. Make assertive stack truly one-at-a-time or move alert semantics to per-toast nodes without stack-level atomic rereads.

- **[P2] [conf HIGH]** `behaviors/command.js:175` — command “No commands” empty state is only visually revealed; it has no `role="status"` / live semantics.
  - Failure scenario: SR user types a query with zero matches → focus stays in the combobox and nothing announces “No commands”.
  - Fix direction: SAFE-FIX · JS. Prepare `.ui-command__empty` as a polite status/live region and update live text when the empty state changes.

- **[P2] [conf MED]** `behaviors/command.js:240` — `initCommand()` promotes any `.ui-command__input` to `role="combobox"` without requiring or warning on an accessible name.
  - Failure scenario: SR user opens a command palette with an unlabeled input → hears an unnamed expanded combobox.
  - Fix direction: NEEDS-DESIGN · JS/docs. Match `initCombobox()` name validation, add a localized label option/data attribute, or document/enforce required labeling.

- **[P3] [conf HIGH]** `behaviors/combobox.js:50` — combobox listbox label mirroring ignores `aria-labelledby` / `title`.
  - Failure scenario: SR user opens a combobox whose input is named by `aria-labelledby="fruit-label"` → input is “Fruit”, popup listbox remains unnamed.
  - Fix direction: SAFE-FIX · JS. Resolve/copy `aria-labelledby` to the listbox, include title fallback, and snapshot/restore generated `aria-labelledby`.

- **[P3] [conf HIGH]** `behaviors/carousel.js:90` — unlabeled carousel defaults to `aria-label="Carousel"` while also using `aria-roledescription="carousel"`.
  - Failure scenario: SR user focuses an unlabeled carousel → hears duplicated/generic “Carousel carousel” instead of a useful content name.
  - Fix direction: NEEDS-DESIGN · JS/docs. Require `data-bronto-carousel-label` or choose a non-duplicating fallback and warn when the content label is missing.

- **[P3] [conf HIGH]** `behaviors/carousel.js:99` — slide `aria-roledescription` is unconditionally overwritten with English `"slide"`.
  - Failure scenario: localized page authors `aria-roledescription="Folie"` and carousel roledescription “Karussell” → SR still hears each slide as English “slide”.
  - Fix direction: SAFE-FIX · JS/docs. Preserve authored slide roledescription and add a localized slide-roledescription hook.

## Lower-confidence / needs-repro
- `behaviors/command.js:238` — command group headings become `role="presentation"` instead of APG grouped options; duplicate option names across groups may be ambiguous to SR users.
- `behaviors/forms.js:250` — error summary uses `role="alert"` and then receives focus; verify against NVDA/JAWS/VO for double announcement.

## Notable (not a bug)
- No focusable `aria-hidden="true"` traps surfaced in the searched source.
- Existing demo/docs generally label splitters, close buttons, and icon-only controls correctly.