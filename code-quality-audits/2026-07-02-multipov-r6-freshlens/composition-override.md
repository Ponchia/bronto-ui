# Composition & consumer override — bronto-ui round 6 review
**Verdict:** The `@layer bronto` normal-rule promise mostly holds: I found no non-media `!important` override blockers. The real defects are outside ordinary cascade specificity: global `@property` registration leaking into consumer CSS, modal inert ownership breaking portal composition, non-ref-counted shared behavior bindings, and ARIA id collisions when copied command/combobox instances carry duplicate list ids.

## Confirmed defects
- **[P2] [conf HIGH]** `css/feedback.css:13` — global `@property --value` breaks consumer unlayered CSS using `--value` for another type.
  - Failure scenario: consumer imports `@ponchia/ui`, then writes unlayered `.bar { --value: 50%; inline-size: var(--value); }` → Bronto’s global `<number>` registration rejects `50%`, so the consumer rule cannot win by cascade.
  - Fix direction: rename/register a Bronto-prefixed property such as `--bronto-value` / `--progress-value`, or remove the global registration. **SAFE-FIX**.

- **[P2] [conf HIGH]** `behaviors/modal.js:113` — controlled modal inert-traps document-portal popovers supported by `initPopover`.
  - Failure scenario: `.ui-modal.is-open[data-bronto-modal]` contains a trigger, while its `.ui-popover` panel is portaled under `body` → modal trap sets the portal panel `inert=true`; opening the popover leaves it inert, and Escape from inside it emits `bronto:modal:close` before popover close handling.
  - Fix direction: make modal inert ownership portal-aware, or provide an allowlist/owned-overlay relation for popovers opened from inside the modal. **NEEDS-DESIGN**.

- **[P2] [conf HIGH]** `behaviors/internal.js:69` — shared `bindOnce()` bindings are not reference-counted across multiple consumers.
  - Failure scenario: two React/Solid/Qwik islands both call a default global hook such as `useDisclosure()`; the second mount replaces the first binding, and when the second unmounts, document behavior is removed while the first island is still mounted.
  - Fix direction: replace “single cleanup per host/key” with retain/release ownership, or make adapters install one app-level singleton explicitly. **NEEDS-DESIGN**.

- **[P2] [conf MED]** `behaviors/command.js:214` — copied command palettes with the same list id generate duplicate option ids.
  - Failure scenario: two component instances both render `<ul id="cmds">`; `initCommand()` creates two `id="cmds-opt-0"` options, and the second input’s `aria-activedescendant="cmds-opt-0"` resolves to the first palette’s option.
  - Fix direction: include a fresh UID in generated option ids even when the list already has an id; optionally warn on duplicate controlled list ids. **SAFE-FIX**.

- **[P2] [conf MED]** `behaviors/combobox.js:368` — copied comboboxes with the same list id get cross-instance `aria-controls` / `aria-activedescendant`.
  - Failure scenario: two combobox instances both render `<ul id="choices">`; after keyboard navigation in the second, `aria-activedescendant="choices-opt-0"` resolves via `getElementById` to the first option, not the active option in the second combobox.
  - Fix direction: mint per-instance option ids independent of author list ids, and warn when the controlled list id is duplicated in the document. **SAFE-FIX**.

## Lower-confidence / needs-repro
- `behaviors/popover.js:121` + `css/feedback.css:371` — fallback `.ui-popover` uses viewport `top/left` inline styles on `position: fixed`; inside transformed/contained ancestors this likely mispositions or clips unless the author adds native `[popover]`.
- `css/bullet.css:24` / `css/interval.css:13` — opt-in leaves also globally register short names like `--t`, `--lo`, `--hi`; same consumer-override leak as `--value`, but lower blast radius than the default feedback bundle.

## Notable (not a bug)
- `!important` use in source is confined to print and reduced-motion safeguards; I did not find a normal component styling rule that defeats unlayered consumer CSS by importance or selector specificity.