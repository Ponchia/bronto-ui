# Workbench — panes, split panes, toolstrips, inspector, properties, selection bar

`@ponchia/ui/css/workbench.css` is an opt-in set of primitives for **real
tools**: resizable split panes, compact toolstrips, button-mode segmented
controls, an inspector panel, property rows for a selected object, and a bar of
actions on the current selection. Generic kits stop at cards/tables/forms, so
every app builds its own half-consistent workbench. This is the low-risk core —
layout, dense controls, resize affordance, and ARIA value sync.

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

## Toolstrip — `.ui-toolstrip`

A compact row of controls for a tool surface or viewport. Use
`.ui-toolstrip--floating` when the strip sits over a canvas, chart, map, media
stage, or preview. The CSS owns density, wrapping, grouping, and raised/floating
treatment; the host owns commands, search behavior, active mode, responsive
hiding, and placement.

```html
<header class="ui-toolstrip ui-toolstrip--floating" aria-label="View controls">
  <div class="ui-toolstrip__brand">
    <strong>Repository</strong>
    <span class="ui-toolstrip__context">main branch</span>
  </div>
  <div class="ui-toolstrip__group" aria-label="Mode">
    <button class="ui-segmented-buttons__button" type="button" aria-pressed="true">Map</button>
    <button class="ui-segmented-buttons__button" type="button" aria-pressed="false">Flow</button>
    <button class="ui-segmented-buttons__button" type="button" aria-pressed="false">Risk</button>
  </div>
  <label class="ui-toolstrip__search">
    <span class="ui-visually-hidden">Filter items</span>
    <input class="ui-input" type="search" placeholder="Filter by path, owner, or tag" />
  </label>
  <div class="ui-toolstrip__actions" aria-label="Viewport actions">
    <button class="ui-button ui-button--ghost ui-button--icon ui-button--sm" type="button">
      Fit
    </button>
  </div>
</header>
```

### Pane-scale — `.ui-toolstrip--pane`

The app has one toolstrip; a workbench full of panes has one *per pane*, and
those are a different thing. The difference is framing, not density: a pane bar
is a row inside a surface that already has a border, so it drops its own frame
and corners and rules off from the content below.

It also refuses to wrap. A pane bar usually sits directly above content that may
be a live terminal, an editor, or a video — and a second row would resize that
content every time a control appears. The row scrolls instead, and
`.ui-toolstrip__fill` marks the one element that absorbs slack and gives it back
first (a title, a path, a filter input), so nothing else is pushed out of reach.

```html
<div class="ui-toolstrip ui-toolstrip--pane">
  <button class="ui-button ui-button--subtle ui-button--dense" type="button">Run</button>
  <span class="ui-toolstrip__fill ui-mono">src/server/routes/reports.ts</span>
  <button class="ui-button ui-button--ghost ui-button--icon ui-button--dense" type="button">
    <span class="ui-button__label">Close</span>
  </button>
</div>
```

## Button segmented control — `.ui-segmented-buttons`

Use `.ui-segmented-buttons` when each option is a real command button and the
current mode is exposed with `aria-pressed`. For form values submitted with the
page, keep using the core `.ui-segmented` radio-input pattern.

```html
<div class="ui-segmented-buttons" aria-label="Density">
  <button class="ui-segmented-buttons__button" type="button" aria-pressed="true">Dense</button>
  <button class="ui-segmented-buttons__button" type="button" aria-pressed="false">Comfort</button>
  <button class="ui-segmented-buttons__button" type="button" aria-pressed="false">Wide</button>
</div>
```

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
  <section class="ui-splitter__pane" id="files" aria-label="Files">
    <div class="ui-cluster" role="group" aria-label="Resize files pane">
      <button class="ui-button ui-button--sm" type="button" data-bronto-splitter-adjust="-10">
        Narrow
      </button>
      <button class="ui-button ui-button--sm" type="button" data-bronto-splitter-adjust="10">
        Widen
      </button>
    </div>
    ...
  </section>
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
and `aria-controls` pointing at the primary pane. Also provide ordinary buttons
with `data-bronto-splitter-adjust="-10"` / `"10"`: pointer users then have a
non-drag resize path, while keyboard and assistive-technology users retain the
separator interaction. The signed value is a percentage-point delta and is
clamped to the separator's min/max.

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

### Anchoring a floating bar

Both `--floating` bars are raised but position-less, so every consumer
re-derives the same thing — including the `max(offset, inset)` shape, which is
the part people get wrong by writing a bare offset that a phone then swallows
under the home indicator. `--anchored` centres the bar against its positioned
ancestor and clears the safe area:

```html
<div class="ui-selectionbar ui-selectionbar--anchored">…</div>

<!-- The bar that must NOT sit under the thumb: recovery, destructive actions. -->
<div class="ui-selectionbar ui-selectionbar--anchor-block-start">…</div>
```

`--anchored` alone means bottom. Override the gap with `--anchor-offset`. The
host still owns `z-index`, because only it knows what else is on the canvas.

## Pane — `.ui-pane`

`.ui-panel` is a padded card and `.ui-inspector` is head-plus-body; neither is a
*window*. A pane is what a canvas node, a floating tool window, or a dockable
panel needs: a header you can drag, a title that renames in place, an actions
slot that survives a narrow pane, and a body that owns the rest.

```html
<article class="ui-pane">
  <header class="ui-pane__head">
    <strong class="ui-pane__title">deploy.log</strong>
    <span class="ui-pane__actions">
      <button class="ui-button ui-button--subtle ui-button--icon ui-button--dense" type="button">
        <span class="ui-button__label">Focus</span>
      </button>
    </span>
  </header>
  <div class="ui-pane__body">…</div>
</article>
```

Two behaviours are worth knowing, because both come from a real failure:

- **The title gives up space first.** It is the only thing in the header that
  can be truncated without losing a function.
- **`__actions` scrolls rather than pushing.** Sized `flex: 0 1 auto` with
  `overflow-x: auto`, so a pane narrow enough to run out of room scrolls its
  controls instead of pushing the last one past the clipped edge — which is how
  an app ends up with a Focus or Disconnect button that exists, is in the a11y
  tree, and cannot be reached.

Swap the title for `.ui-pane__title-input` to rename in place. It inherits the
type it replaces, so the swap moves no layout; only the accent border says you
are typing a name now. The host owns dragging, z-order, focus policy and
persistence — this leaf has no behavior.

## Scope

No recipes for the structural containers and rows; apply the classes directly
(or read them from `cls.toolstrip`, `cls.pane`, `cls.splitter`, `cls.inspector`,
`cls.property`, …). `ui.toolstrip()` and `ui.selectionbar()` exist only to
compose the variant/anchor modifiers. Pair the selection bar with the
cross-cutting
[`ui-sel`](./selection.md) states on the selected items themselves. Bronto styles
the chrome and wires the splitter affordance; the host owns hit-testing,
persistence, pane contents, viewport semantics, and commands.
