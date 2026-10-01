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

## Three ways to own a palette

| Mode | Bronto owns | The host owns |
| --- | --- | --- |
| `initCommand()` | filtering, ids, roles, active row, keyboard, pointer, empty state | the rows in the DOM, the actions |
| `initCommand({ headless: true })` | ids, roles, active row, keyboard, pointer, the empty state's live region | which rows exist, rendered per query; the actions |
| controlled host mode (CSS only) | nothing | the whole combobox/listbox contract |

### Matching

Filtering is a substring match on each row's text. Pass `match` to decide it
yourself: it receives the row and the query (trimmed, lower-cased in the
palette's locale) and returns whether the row stays. An empty query always
shows every row.

```js
initCommand({
  match: (row, query) =>
    row.hasAttribute('data-always') || // e.g. a "Search everything" row
    `${row.textContent} ${row.dataset.keywords ?? ''}`.toLowerCase().includes(query),
});
```

That covers keywords a row should match without showing them, and a row that
must stay reachable for every query (escalating to a full search, say) inside
the list, where the keyboard reaches it.

### Headless mode

When the host computes the results itself (search over a corpus, ranked
matches, results that arrive asynchronously), pass `headless: true` and render
the rows on every query. Bronto never hides a row or group in this mode. It reads
the list live, so replacing rows needs no second `initCommand()`. New rows get
ids and `role="option"`. After the query changes, the first row the host renders
becomes active, and a row that disappears hands the active state to the first
row left. Keep `.ui-command__empty` mounted and toggle its `hidden`; Bronto
announces it when it appears.

```js
const box = document.querySelector('[data-bronto-command]');
const input = box.querySelector('.ui-command__input');
input.addEventListener('input', () => renderRows(search(input.value))); // yours
initCommand({ root: box.parentElement, headless: true });
```

### Controlled host mode

When React or another host already owns the query, filtered results, active
item, and selection, use only the `ui-command*` CSS shell and do not call
`initCommand()`. This is a supported composition boundary, not a second Bronto
state model. The host must then provide the complete combobox/listbox contract:
stable ids, roles, `aria-controls`, `aria-expanded`,
`aria-activedescendant`, keyboard navigation, filtering, selection, and close
behavior. Do not bind both owners to the same palette.

The framework adapter subpaths were removed in 0.10. Use direct `initCommand()` lifecycle cleanup for
a DOM-authored list, or controlled host mode when the framework owns the widget.

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
filtering (substring, or your `match`; none in headless mode), the keyboard (Down/Up to move, Enter to run, Escape to
close — Home/End stay with the query input's native text caret), and pointer
select. It emits:

- `bronto:command:select` — `{ value, label }`. The host executes and closes.
- `bronto:command:close` — on Escape. The host closes the dialog.

> **Permission boundary:** `initCommand()` owns the `hidden` attribute on items
> (that is how it filters), so it will reveal any item you pre-hid the moment the
> query changes. To gate a command by permission, **omit it from the DOM** —
> don't render it hidden.

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

## Accessibility

- The input is a `combobox`, the list a `listbox`, items `option`s, with
  `aria-activedescendant` tracking the active row — standard APG listbox semantics.
- Focus stays in the input while arrows move the active item; Enter selects it.
- Open the palette in a focus-trapping `<dialog>` (Bronto's `initDialog`) so focus
  returns to the trigger on close.
