# Forms / interaction / a11y — bronto-ui correctness review
**Verdict:** Found four reproducible defects, no P0/P1. The strongest issues are keyboard/APG handling in tabs and editable combobox-style inputs, plus form summaries that are programmatically linked but not meaningfully identifiable to AT users.

## Confirmed defects
- **[P2] [conf HIGH]** `behaviors/tabs.js:132` — tab keyboard handling ignores `aria-orientation`.
  - Failure scenario: focus a default horizontal `.ui-tabs__list`, press `ArrowDown` → selection moves to the next tab and default scrolling is prevented. In a vertical tablist, `ArrowRight` also changes tabs.
  - Fix direction: branch on `aria-orientation`; horizontal handles Left/Right only, vertical handles Up/Down only, Home/End remain shared.

- **[P2] [conf HIGH]** `behaviors/combobox.js:361` — editable combobox steals `Home`/`End` from text editing.
  - Failure scenario: type in `.ui-combobox__input`, popup open, press `Home` to move the caret → event is prevented and focus remains in the input with caret unmoved; with no matches it prevents default and does nothing.
  - Fix direction: let native `Home`/`End` edit the input; keep option movement on ArrowUp/ArrowDown, or require an explicit modified shortcut for list-edge jumps.

- **[P2] [conf HIGH]** `behaviors/forms.js:149` — error-summary links are indistinguishable for multiple invalid fields.
  - Failure scenario: submit a form with “First name” and “Email” both empty required fields → summary contains two links both named only by `control.validationMessage` (“Please fill out this field” / equivalent). A screen-reader user cannot tell which link targets which field.
  - Fix direction: include the associated label/legend/name in each summary link, e.g. `Email: Please fill out this field`.

- **[P3] [conf MED]** `behaviors/command.js:194` — command input also intercepts text-field `Home`/`End` while using `role="combobox"`.
  - Failure scenario: type a query with visible matches, press `Home` to edit the start of the query → default text navigation is prevented and active command changes instead.
  - Fix direction: prioritize native text editing; use Arrow keys for command navigation and avoid hijacking unmodified `Home`/`End` in the input.

## Lower-confidence / needs-repro
- `behaviors/forms.js:138` — required radio groups can produce duplicate summary entries when multiple radios in the same named group carry `required`; likely fix is de-duping invalid radios by form/name.

## Notable (not a bug)
- `behaviors/menu.js` intentionally does not implement ARIA menu roving focus; items remain real Tab-reachable buttons inside native `<details>`.