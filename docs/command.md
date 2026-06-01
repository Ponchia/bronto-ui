# Command palette

`@ponchia/ui/css/command.css` + `initCommand` are an opt-in **command palette**:
a filter input over a grouped listbox of commands with shortcut hints. Command
palettes turn a product from a page collection into a tool. Existing libraries
(cmdk, kbar) are good — Bronto owns the *design-system contract* (the shell,
shortcuts, groups, meta) and a small navigation behavior, not the action registry.

```css
@import '@ponchia/ui';
@import '@ponchia/ui/css/command.css';
```

```js
import { initCommand, initDialog } from '@ponchia/ui/behaviors';
initDialog(); // open/close the dialog the palette lives in
initCommand(); // filter + keyboard-navigate the list
```

**Bronto** filters and keyboard-navigates a DOM-authored list. **The host** owns
the action registry, permission checks, routing, async effects, and execution —
it listens for `bronto:command:select` and runs the command. There is **no global
Cmd/Ctrl+K**; you open the palette yourself (e.g. a `<dialog>` opened by a button
or your own shortcut). Pairs with the [`ui-shortcut`](./reference.md) hint. Not in
the core bundle.

## Markup

```html
<dialog class="ui-modal" id="cmdk" data-bronto-dialog-light aria-label="Command palette">
  <div class="ui-command" data-bronto-command>
    <input class="ui-command__input" aria-label="Command" placeholder="Type a command…" />
    <ul class="ui-command__list">
      <li class="ui-command__group">Navigation</li>
      <li class="ui-command__item" data-value="dashboard">
        <span>Go to dashboard</span>
        <span class="ui-command__shortcut"><kbd class="ui-kbd">G</kbd> <kbd class="ui-kbd">D</kbd></span>
      </li>
      <li class="ui-command__group">Actions</li>
      <li class="ui-command__item" data-value="invoice">
        <span>New invoice</span>
        <span class="ui-command__meta">Create</span>
      </li>
    </ul>
    <p class="ui-command__empty" hidden>No commands</p>
  </div>
</dialog>
<button class="ui-button" data-bronto-open="cmdk" type="button">Commands</button>
```

| Class | Role |
| --- | --- |
| `ui-command` | The palette shell (input + list + empty). |
| `ui-command__input` | The filter input (becomes `role="combobox"`). |
| `ui-command__list` | The listbox of commands. |
| `ui-command__group` | A non-selectable group label; auto-hidden when its items all filter out. |
| `ui-command__item` | A command row (`role="option"`); optional `data-value`. |
| `ui-command__shortcut` | A trailing shortcut hint (use `ui-kbd`). |
| `ui-command__meta` | Trailing secondary text (category, hint). |
| `ui-command__empty` | Shown when nothing matches. |

## Behavior & events

`initCommand()` owns ids, `role`/`aria-activedescendant`, a roving active item,
substring filtering, the full keyboard (Down/Up/Home/End/Enter/Escape), and
pointer select. It emits:

- `bronto:command:select` — `{ value, label }`. The host executes and closes.
- `bronto:command:close` — on Escape. The host closes the dialog.

```js
const dialog = document.getElementById('cmdk');
document.querySelector('[data-bronto-command]').addEventListener('bronto:command:select', (e) => {
  run(e.detail.value); // YOUR action registry
  dialog.close();
});
document.querySelector('[data-bronto-command]').addEventListener('bronto:command:close', () =>
  dialog.close(),
);
```

Framework hook: `useCommand()` in `@ponchia/ui/react` · `/solid` · `/qwik`.

## Accessibility

- The input is a `combobox`, the list a `listbox`, items `option`s, with
  `aria-activedescendant` tracking the active row — standard APG listbox semantics.
- Focus stays in the input while arrows move the active item; Enter selects it.
- Open the palette in a focus-trapping `<dialog>` (Bronto's `initDialog`) so focus
  returns to the trigger on close.
