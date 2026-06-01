# Connectors (leader lines)

`@ponchia/ui/css/connectors.css` + `@ponchia/ui/connectors` draw a **leader line
between two DOM elements** — connect a note to a card, a card to a chart point,
or two related regions. This is the page-coordinate, element-to-element cousin
of the figure-coordinate [annotations](./annotations.md) layer.

```css
@import '@ponchia/ui';
@import '@ponchia/ui/css/connectors.css';
```

Bronto computes the **geometry** (pure functions) and styles the line; the
optional `initConnectors` behavior draws and keeps it in sync. It owns no
layout, no scales — just the path between two rects.

## Markup

An `.ui-connector` is an SVG that overlays a **positioned** container. Give it
the ids of the two elements to connect; `initConnectors` fills in the path.

```html
<div style="position: relative">
  <div id="card-a" class="ui-card">…</div>
  <div id="note-b" class="ui-card">…</div>

  <svg
    class="ui-connector ui-connector--accent"
    data-bronto-connector
    data-from="card-a"
    data-to="note-b"
    data-shape="elbow"
    data-end="arrow"
    aria-hidden="true"
  ></svg>
</div>
```

```js
import { initConnectors } from '@ponchia/ui/behaviors';
const stop = initConnectors(); // redraws on resize/scroll; returns a cleanup
```

A connector is decorative — mark it `aria-hidden="true"` and make sure the
relationship it depicts is also clear from the content/DOM order.

| Attribute | Values |
| --- | --- |
| `data-from` / `data-to` | ids of the elements to connect (required). |
| `data-shape` | `straight` (default), `elbow`, `curve`. |
| `data-from-side` / `data-to-side` | `top`/`right`/`bottom`/`left`/`center`. Omit a side to auto-pick it (set neither for fully automatic facing edges). |
| `data-end` | `arrow` (default), `dot`, `none`. |

Tones: `ui-connector--accent` / `--muted` / `--success` / `--warning` /
`--danger` / `--info` (monochrome by default). `ui-connector--dashed` for a
dashed line; `ui-connector--draw` strokes it in once (reduced-motion-safe).
`ui.connector({ tone, dashed, motion })` builds the class string.

## Geometry helpers (no DOM)

For SSR, canvas, or your own renderer, the pure helpers return SVG strings /
coordinates and never touch the DOM:

```js
import { connectRects, arrowHead } from '@ponchia/ui/connectors';

const { d, to, angle } = connectRects({
  fromRect: { x: 0, y: 0, width: 80, height: 32 },
  toRect: { x: 220, y: 120, width: 80, height: 32 },
  shape: 'curve',
});
const head = arrowHead(to, angle); // place at the endpoint
```

- `anchorPoint(rect, side)` — a point on a rect's edge.
- `connectorPath({ from, to, shape, curvature, mid })` — path between two points.
- `straightPath` / `elbowPath` / `curvePath` — the individual shapes.
- `connectRects(opts)` → `{ d, from, to, angle }`.
- `arrowHead(point, angle, size)` / `dotMark(point, radius)` — end markers.
- `autoSides(fromRect, toRect)` / `angleBetween(from, to)`.
- `endTangentAngle(from, to, shape)` — the angle the path *arrives* at `to`
  (chord for `straight`, axis-aligned for `elbow`/`curve`); rotate an end marker
  by this so it points along the path. `connectRects().angle` already uses it.

## Coordinate model

`initConnectors` measures the from/to elements relative to the connector SVG's
own box (via `getBoundingClientRect`), so place the SVG as an overlay
(`position: absolute; inset: 0`, which `.ui-connector` sets) inside a
`position: relative` container that holds both endpoints. The SVG has no
`viewBox`, so its user units are CSS pixels.
