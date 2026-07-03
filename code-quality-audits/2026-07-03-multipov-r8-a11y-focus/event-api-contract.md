# Custom event API contract — bronto-ui round 8 review
**Verdict:** I found one real custom-event contract defect: `bronto:change` is reused by unrelated behaviors with incompatible payload schemas. Everything else in the emitted-event map used fresh `CustomEvent`s, bubbles where the current docs/examples rely on delegation, and generally dispatches after state is committed.

## Confirmed defects
- **[P2] [conf HIGH]** `behaviors/combobox.js:322` + `behaviors/carousel.js:261` — `bronto:change` has two incompatible public meanings: combobox emits `detail: { value, label }`, while carousel emits `detail: { index }`.
  - Failure scenario: consumer listens with delegated `document.addEventListener('bronto:change', e => sync(e.detail.value))`; selecting a combobox yields `"banana"`, but pressing carousel next also fires `bronto:change` with no `value`, so the same consumer receives `undefined` from an unrelated widget. Existing tests assert both shapes at `test/behaviors.test.mjs:1246` and `test/behaviors.test.mjs:1892`; a read-only jsdom reproduction produced `[{"target":"combobox","value":"banana","keys":["label","value"]},{"target":"carousel","index":1,"keys":["index"]}]`.
  - Fix direction: NEEDS-DESIGN · JS/docs. Namespacing the events, e.g. `bronto:combobox:change` and `bronto:carousel:change`, is the clean fix but is a public breaking change; safest path is additive new names plus deprecation/migration for bare `bronto:change`.

## Lower-confidence / needs-repro
- `docs/reference.md` / `scripts/gen-reference.mjs` document `bronto:change` only as the combobox `{ value, label }` contract, while carousel also emits `bronto:change`. This is probably documentation drift tied to the confirmed collision, but the root defect is the runtime name reuse.
- All `bronto:*` events default `composed: false`. I did not find docs promising Shadow DOM delegation, so I’m not marking that as a bug.

## Notable (not a bug)
- Event map: `bronto:themechange` `{theme}` on `<html>`; `bronto:dismiss` cancelable on dismiss target; `bronto:selectionchange` `{count}` on table; `bronto:legend:toggle` `{series, active}` on legend; `bronto:crosshair:move/leave` on plot; `bronto:source:focus` `{id, citation, source}` on source island; `bronto:splitter:resize` `{value, orientation}` on splitter; `bronto:command:select/close` on command host; `bronto:modal:close` cancelable `{reason}` on modal; and the colliding `bronto:change` on combobox/carousel.