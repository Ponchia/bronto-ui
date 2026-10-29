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


## Toolbar keyboard ownership

`initToolbar()` adds one Tab entry and arrow navigation to
`[data-bronto-toolbar]`. Keep a visible or accessible label. Horizontal
navigation follows `dir`; set `aria-orientation="vertical"` for Up/Down.
Home and End navigate controls, while native fields retain their editing keys.
Tab can leave a field for its adjacent toolbar control; it never traps the user.

```html
<div class="ui-toolstrip" data-bronto-toolbar aria-label="Document tools">
  <button type="button" class="ui-button">Select</button>
  <button type="button" class="ui-button">Move</button>
  <input class="ui-input" aria-label="Filter objects" />
</div>
```

```js
import { initToolbar } from '@ponchia/ui/behaviors/toolbar';
const stop = initToolbar({ root: document.querySelector('[data-bronto-toolbar]') });
// Retain stop and invoke it on view disposal. A null root is a no-op.
```

Nested toolbars, menus and native editing controls own their keys. An application
with additional editors can supply `ownsKey(event, toolbar)` and
`exclude(element, toolbar)`. The callbacks extend the boundary rather than
installing document-wide shortcuts. The initializer discovers late DOM children
and restores author tab stops when items leave or the binding is disposed.
Framework wrappers may initialize in a layout effect; keep commands, state,
portal placement and application-specific input ownership in the wrapper.

## Action menus are different from disclosure menus

`initMenu` keeps its existing native-details contract. Use `initActionMenu`
for a **flat action menu** with authored `role="menuitem"` buttons, arrow-key
navigation and focus handoff. This does not implement a menubar or submenus.

```html
<button type="button" id="document-actions" aria-haspopup="menu"
  aria-expanded="false" aria-controls="document-menu">Actions</button>
<div id="document-menu" class="ui-menu" data-bronto-action-menu
  role="menu" aria-label="Document actions" hidden>
  <button type="button" role="menuitem" tabindex="-1" class="ui-menu__item">Inspect</button>
  <button type="button" role="menuitem" tabindex="-1" class="ui-menu__item"
    aria-disabled="true">Unavailable action</button>
</div>
```

```js
import { initActionMenu } from '@ponchia/ui/behaviors/action-menu';
const trigger = document.querySelector('#document-actions');
const menu = document.querySelector('#document-menu');
let stop;
const close = () => {
  menu.hidden = true;
  trigger.setAttribute('aria-expanded', 'false');
  stop?.();
  stop = undefined;
};
trigger.addEventListener('click', () => {
  if (!menu.hidden) { close(); return; }
  menu.hidden = false;
  trigger.setAttribute('aria-expanded', 'true');
  stop = initActionMenu({ root: menu, invoker: trigger, onClose: close });
});
```

The host opens, positions and closes the surface. The initializer requests a
close through `onClose(detail)` and the cancelable `bronto:action-menu:close`
event. Its detail is `{ reason, backwards }`, where the reason is `escape`,
`tab`, `outside` or `select`. `aria-disabled` actions stay discoverable and
cannot activate; native disabled buttons remain skipped. Native button/link
activation remains native. Checkbox/radio state and submenus are host-owned.

Tab normally continues in the browser's order from the explicit invoker. A
portal host that already uses a specialist focus-order resolver can supply
`tabTarget(backwards)`; the library does not bring its own document-wide
focus-order engine. Escape returns to the invoker. Closing after an action
preserves focus deliberately moved into another editor or dialog. Set
`closeOnSelect: false` when the host owns selection completion or repeated
commands must leave the menu open. Retain and dispose the binding on every close.

Keyboard behavior follows the [toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/)
and the relevant flat-menu parts of the [menu pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/).
The runnable fixture is [workspace interactions](https://ponchia.github.io/bronto-ui/demo/workspace-primitives.html).

## Controlled pixel splitters and collapsed panes

A host with pixel-based widths may use `data-bronto-splitter-unit="px"`.
Set `aria-valuemin`, `aria-valuemax` and `aria-valuenow` in pixels; provide an
`aria-valuetext` that explains the measurement to readers. The resize detail
adds `unit: 'px'`; legacy percentage events keep their existing shape.
`data-bronto-splitter-step` and `data-bronto-splitter-large-step` customize
keyboard increments. Bounds and current values are read live on interaction,
so viewport resizing and host-controlled changes do not retain stale limits.

The host still owns measured bounds, persistence, per-panel widths and collapse.
Dispose the binding while a pane is closed; reinitialize when it opens.
Cleanup restores the authored DOM snapshot. A controlled framework wrapper must
seed the latest ARIA bounds/value and `--splitter-pos` from its own state before
reinitializing: an unchanged virtual-DOM prop may otherwise leave the restored
initial value in place.
Only the initiating pointer can resize or finish a gesture. Pointer cancellation,
lost capture and cleanup release the gesture. Native input composition and
host-cancelled key events remain untouched. Horizontal splitters use Up/Down;
vertical splitters use Left/Right and respect direction.

The two panes and handle have explicit grid tracks. A hidden handle cannot
accidentally move the second pane into the handle's column. For a collapsed
first pane, set `--splitter-pos: 0px` and `--splitter-handle: 0px`, and make
its content inert and its handle unreachable. Keep pane placement explicit;
`visibility: hidden` can retain the pane's grid item while `display: none`
removes it. Opening/closing is application state, not an inferred resize action.

## Keyboard-accessible scrolling

`ui-scroll-region` supplies scroll containment, a shrinkable body and a
focus-visible ring. CSS cannot provide a keyboard tab stop or accessible name:
those belong in markup. Use a named region only when it helps document navigation.

```html
<div class="ui-scroll-region" tabindex="0" role="region" aria-label="Operation history">
  <p>Retained observations appear here.</p>
</div>
```

The host bounds the region's height. Keep keyboard events native and avoid
adding a focusable scroll container around every non-scrolling paragraph.
