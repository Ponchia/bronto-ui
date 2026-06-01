# Workbench — inspector, properties, selection bar

`@ponchia/ui/css/workbench.css` is an opt-in set of primitives for **real
tools**: an inspector panel, property rows for a selected object, and a bar of
actions on the current selection. Generic kits stop at cards/tables/forms, so
every app builds its own half-consistent workbench. This is the low-risk CSS
core — layout and affordances only.

```css
@import '@ponchia/ui';
@import '@ponchia/ui/css/workbench.css';
```

Resizable split panes (a focusable ARIA window-splitter behavior) and drag
handles are deliberately deferred until a consumer needs them. Not in the core
bundle.

## Inspector — `.ui-inspector`

A panel of details for the selected object: a `__header` (title + actions) over
a `__body` of property rows.

```html
<aside class="ui-inspector">
  <div class="ui-inspector__header">
    <h2 class="ui-eyebrow">Rectangle</h2>
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
  <span class="ui-property__label">Width</span>
  <span class="ui-property__value">240 px</span>
</div>
<div class="ui-property">
  <span class="ui-property__label">Fill</span>
  <span class="ui-property__value"><input class="ui-input" value="#121212" /></span>
</div>
```

## Selection bar — `.ui-selectionbar`

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

CSS only, no recipes — these are structural containers and rows; apply the
classes directly (or read them from `cls.inspector`, `cls.property`, …). Pair
the selection bar with the cross-cutting [`ui-sel`](./selection.md) states on the
selected items themselves; Bronto styles both, the host owns the hit-testing.
