# Workbench — split panes, inspector, properties, selection bar

`@ponchia/ui/css/workbench.css` is an opt-in set of primitives for **real
tools**: resizable split panes, an inspector panel, property rows for a selected
object, and a bar of actions on the current selection. Generic kits stop at
cards/tables/forms, so every app builds its own half-consistent workbench. This
is the low-risk core — layout, resize affordance, and ARIA value sync.

```css
@import '@ponchia/ui';
@import '@ponchia/ui/css/workbench.css';
```

```js
import { initSplitter } from '@ponchia/ui/behaviors';

initSplitter();
```

Not in the core bundle. Import the CSS leaf where the workbench appears and run
`initSplitter()` only if the page includes `[data-bronto-splitter]`.

## Splitter — `.ui-splitter`

Two panes separated by a focusable ARIA separator handle. The CSS owns the grid
tracks and handle affordance; `initSplitter()` owns keyboard/pointer resizing,
`--splitter-pos`, `aria-valuenow`, and the `bronto:splitter:resize` event. The
host owns pane content, persistence, saved layout state, collapse policy, and any
domain selection model.

```html
<div
  class="ui-splitter ui-splitter--vertical"
  data-bronto-splitter
  style="--splitter-pos: 36%"
>
  <section class="ui-splitter__pane" id="files" aria-label="Files">...</section>
  <div
    class="ui-splitter__handle"
    role="separator"
    tabindex="0"
    aria-controls="files"
    aria-label="Resize files pane"
    aria-orientation="vertical"
    aria-valuemin="20"
    aria-valuemax="72"
    aria-valuenow="36"
  ></div>
  <section class="ui-splitter__pane" aria-label="Preview">...</section>
</div>
```

Use `.ui-splitter--horizontal` for top/bottom panes. Arrow keys change the value
by 2 percentage points, Shift+Arrow and PageUp/PageDown by 10, and Home/End jump
to `aria-valuemin` / `aria-valuemax`. The handle needs a real accessible name
and `aria-controls` pointing at the primary pane.

## Inspector — `.ui-inspector`

A panel of details for the selected object: a `__head` (title + actions) over
a `__body` of property rows.

```html
<aside class="ui-inspector">
  <div class="ui-inspector__head">
    <h2 class="ui-eyebrow">Sync job</h2>
    <button class="ui-button ui-button--subtle ui-button--sm" type="button">Reset</button>
  </div>
  <div class="ui-inspector__body">
    <!-- property rows -->
  </div>
</aside>
```

## Property row — `.ui-property`

A label/value pair, denser than `ui-key-value` and tuned for an inspector. The
`__value` can hold a static read-out or an input.

```html
<div class="ui-property">
  <span class="ui-property__label">Owner</span>
  <span class="ui-property__value">Platform</span>
</div>
<div class="ui-property">
  <span class="ui-property__label">Retries</span>
  <span class="ui-property__value"><input class="ui-input" value="3" /></span>
</div>
```

## Selection bar — `.ui-selectionbar`

> **Name note:** `.ui-selectionbar` is the workbench bulk-action bar (this
> section). It is unrelated to the `.ui-sel--on` / `.ui-sel--off` /
> `.ui-sel--maybe` selection-emphasis state classes in
> [`css/selection.css`](./selection.md), which style host-managed selection
> state on individual items.

A raised bar of actions on the current selection: a `__count` on one side,
`__actions` on the other. The host owns what is selected and what the actions do.

```html
<div class="ui-selectionbar">
  <span class="ui-selectionbar__count">3 selected</span>
  <span class="ui-selectionbar__actions">
    <button class="ui-button ui-button--subtle ui-button--sm" type="button">Group</button>
    <button class="ui-button ui-button--subtle ui-button--sm" type="button">Align</button>
    <button class="ui-button ui-button--danger ui-button--sm" type="button">Delete</button>
  </span>
</div>
```

## Scope

No recipes — these are structural containers and rows; apply the classes
directly (or read them from `cls.splitter`, `cls.inspector`, `cls.property`, …).
Pair the selection bar with the cross-cutting [`ui-sel`](./selection.md) states
on the selected items themselves. Bronto styles both and wires the splitter
affordance; the host owns hit-testing, persistence, pane contents, and commands.
