# SVG annotations

`@ponchia/ui/css/annotations.css` is an opt-in SVG annotation layer for charts,
reports, and analytical figures. It follows the same grammar as
d3-annotation: a **subject** marks the thing being discussed, a **connector**
points away from it, and a **note** carries the visible explanation.

```css
@import '@ponchia/ui';
@import '@ponchia/ui/css/annotations.css';
```

Use it with any SVG renderer. Bronto supplies classes and tiny geometry helpers;
it does not own chart scales, mutate the DOM, or provide draggable edit mode.

```js
import {
  annotationParts,
  annotationTransform,
  axisThresholdPath,
  bracketSubjectPath,
  circleSubjectPath,
  connectorLine,
  evidenceMarkerPath,
  notePlacement,
  noteTransform,
} from '@ponchia/ui/annotations';

const transform = annotationTransform({ x: 180, y: 72 });
const subject = circleSubjectPath({ radius: 18 });
const connector = connectorLine({
  dx: 88,
  dy: -42,
  subject: { type: 'circle', radius: 18, radiusPadding: 4 },
});
const parts = annotationParts({
  x: 180,
  y: 72,
  dx: 88,
  dy: -42,
  subject: { type: 'circle', radius: 18, radiusPadding: 4 },
});
const note = notePlacement({
  x: 180,
  y: 72,
  width: 96,
  height: 44,
  bounds: { x: 0, y: 0, width: 360, height: 180 },
  preferred: 'right',
});
```

## Markup model

Author annotation groups at the subject anchor. Use `dx` / `dy` as the note
offset, matching d3-annotation's mental model.

```html
<svg viewBox="0 0 360 180" role="img" aria-labelledby="chart-title chart-desc">
  <title id="chart-title">Annotated delivery chart</title>
  <desc id="chart-desc">A callout marks the delivery peak.</desc>

  <g
    class="ui-annotation ui-annotation--circle ui-annotation--accent"
    transform="translate(180, 72)"
  >
    <path class="ui-annotation__subject" d="M0,-18A18,18 0 1 1 0,18A18,18 0 1 1 0,-18Z" />
    <path class="ui-annotation__connector" d="M15.556,-7.424L88,-42" />
    <g class="ui-annotation__note" transform="translate(88, -42)">
      <path class="ui-annotation__note-line" d="M0,0H76" />
      <text class="ui-annotation__title" y="-8">Peak</text>
      <text class="ui-annotation__label" y="12">Delivery spike</text>
    </g>
  </g>
</svg>
```

The visible note text should also be represented in the figure caption,
`<desc>`, fallback table, or surrounding prose when the figure is complex.
Use `aria-hidden="true"` only for decorative annotations.

## Variants and motion

Use one variant class per annotation group. Variants describe the visual
grammar, not data semantics:

| Variant | Use |
| --- | --- |
| `ui-annotation--label` | Direct label with no connector. |
| `ui-annotation--callout` | Plain point-to-note callout. |
| `ui-annotation--elbow` | Dogleg connector around dense marks. |
| `ui-annotation--curve` | Softer connector for paths or flows. |
| `ui-annotation--circle` | Circular subject around a point or local cluster. |
| `ui-annotation--rect` | Rectangular subject around a bar, block, or region. |
| `ui-annotation--threshold` | Horizontal or vertical limit rule. |
| `ui-annotation--badge` | Compact numbered or categorical mark. |
| `ui-annotation--bracket` | Range span on one axis. |
| `ui-annotation--band` | Interval, confidence band, or risk window. |
| `ui-annotation--slope` | Trend or slope segment. |
| `ui-annotation--compare` | Before/after or A/B grouping. |
| `ui-annotation--cluster` | Several nearby outliers. |
| `ui-annotation--axis` | Axis milestone or reference tick. |
| `ui-annotation--timeline` | Event pin on a timeline. |
| `ui-annotation--evidence` | Proof, source, or evidence marker. |

Tones are `accent`, `muted`, `success`, `warning`, `danger`, and `info`.
Status tones (`success`, `warning`, `danger`, `info`) are only for annotations
that carry that status meaning.

Motion is opt-in and respects `prefers-reduced-motion`:

| Motion class | Effect |
| --- | --- |
| `ui-annotation--draw` | Connectors draw in once; subjects reveal without losing dashed variant styling. |
| `ui-annotation--reveal` | Note fades into place. |
| `ui-annotation--pulse` | Subject or badge pulses gently. |
| `ui-annotation--focus` | Static emphasis with a stronger subject stroke. |

The class recipe mirrors this surface:

```js
ui.annotation({ variant: 'bracket', tone: 'info', motion: 'draw' });
// "ui-annotation ui-annotation--bracket ui-annotation--info ui-annotation--draw"
```

## Geometry helpers

The helper module returns SVG strings only. It does not know about scales,
selections, DOM nodes, or frameworks.

| Helper | Returns |
| --- | --- |
| `annotationTransform({ x, y })` | Group transform for the subject anchor. |
| `noteTransform({ dx, dy, align, valign, width, height })` | Note transform from the subject anchor, with optional alignment. |
| `notePlacement({ x, y, width, height, bounds, preferred })` | Bounded note offset, alignment and transform for one annotation. |
| `declutterLabels(items, { gap, min, max })` | Adjusted centres for `items` (`[{ pos, size }]`) so labels don't overlap along one axis (order-preserving). |

`declutterLabels` is a deliberately small, deterministic **1-D** declutter for
direct labels or axis ticks — sort, push overlaps apart by `size + gap`, slide
to fit under `max`. It is **not** a general 2-D collision solver: if more labels
are requested than the axis can hold, the overflow is yours to resolve (fewer
labels, a longer axis, or rotation). It returns numbers; you own the scale and
the DOM.
| `circleSubjectPath({ radius })` | Circle subject path. |
| `rectSubjectPath({ x, y, width, height, padding })` | Rect subject path. |
| `thresholdPath({ x1, y1, x2, y2 })` | Arbitrary threshold/rule path. |
| `axisThresholdPath({ orientation, value, start, end })` | Horizontal or vertical axis-aligned threshold. |
| `bracketSubjectPath({ x1, y1, x2, y2, depth })` | Dogleg bracket path. |
| `bandSubjectPath({ x, y, width, height, padding })` | Band or interval path. |
| `slopeSubjectPath({ x1, y1, x2, y2 })` | Trend segment path. |
| `comparisonBracePath({ x1, y1, x2, y2, depth })` | Comparison brace path. |
| `outlierClusterPath({ points, radius })` | Repeated circle subjects for a cluster. |
| `timelineEventPath({ size, direction })` | Event pin marker path. |
| `evidenceMarkerPath({ x, y, width, height, padding })` | Centered square/rect evidence marker path. |
| `connectorLine({ dx, dy, subject })` | Straight connector, trimmed against circle/rect subjects. |
| `connectorElbow({ dx, dy, subject })` | D3-like dogleg connector. |
| `connectorCurve({ dx, dy, subject })` | Deterministic cubic connector. |
| `connectorEndDot({ x, y, radius })` | Dot marker path. |
| `connectorEndArrow({ x1, y1, x2, y2, size })` | Arrow marker path. |
| `annotationParts(options)` | Convenience object with `transform`, `subject`, `connector`, and `note`. |

All numeric inputs must be finite. Negative radius, width, height, padding, and
marker size throw `RangeError`; non-finite values throw `TypeError`. Path
numbers are rounded to three decimals with trailing zeros removed so snapshots
and unit tests stay stable.

`notePlacement()` is intentionally small: it places one note inside explicit SVG
bounds using a preferred side (`right`, `left`, `top`, or `bottom`) and falls
back to another side or a clamped note transform. It is not a collision solver
for a whole chart. For dense annotation sets, pre-compute positions or author a
mobile-specific SVG.

## Density and responsive rules

Annotations are strongest when they explain the few things a reader would miss.
As a default, keep a single chart to three to five visible callouts. Use direct
labels for stable context, one accent callout for the main insight, and status
tones only for genuine status.

Dense SVGs should not shrink until the notes become unreadable. Use one of
these patterns:

- Keep the chart wide in a horizontally scrollable figure and provide fallback
  table text.
- Author a simpler mobile SVG with fewer annotations.
- Move low-priority annotation text into the caption or fallback table on small
  screens.

## Recipes

### Label

Use `ui-annotation--label` for direct labels when the subject is already clear.

```html
<g class="ui-annotation ui-annotation--label ui-annotation--muted" transform="translate(112, 48)">
  <g class="ui-annotation__note">
    <text class="ui-annotation__title">Baseline</text>
    <text class="ui-annotation__label" y="16">Previous quarter</text>
  </g>
</g>
```

### Circle callout

Use a circle subject when the referenced point or local cluster matters.

```html
<g class="ui-annotation ui-annotation--circle ui-annotation--accent" transform="translate(180, 72)">
  <path class="ui-annotation__subject" d="M0,-18A18,18 0 1 1 0,18A18,18 0 1 1 0,-18Z" />
  <path class="ui-annotation__connector" d="M15.556,-7.424L88,-42" />
  <g class="ui-annotation__note" transform="translate(88, -42)">
    <path class="ui-annotation__note-line" d="M0,0H84" />
    <text class="ui-annotation__title" y="-8">Spike</text>
    <text class="ui-annotation__label" y="12">Investigate change</text>
  </g>
</g>
```

### Rect callout

Use a rect subject for a band, bar, table region, or evidence block inside an
SVG figure.

```html
<g class="ui-annotation ui-annotation--rect ui-annotation--warning" transform="translate(206, 92)">
  <path class="ui-annotation__subject" d="M-34,-16H34V16H-34Z" />
  <path class="ui-annotation__connector" d="M34,-16L72,-46" />
  <g class="ui-annotation__note" transform="translate(72, -46)">
    <path class="ui-annotation__note-line" d="M0,0H96" />
    <text class="ui-annotation__title" y="-8">Watch</text>
    <text class="ui-annotation__label" y="12">Lower confidence</text>
  </g>
</g>
```

### Threshold

Use `ui-annotation--threshold` when a horizontal or vertical rule is the
subject.

```html
<g class="ui-annotation ui-annotation--threshold ui-annotation--danger" transform="translate(0, 96)">
  <path class="ui-annotation__subject" d="M36,0L324,0" />
  <path class="ui-annotation__connector" d="M240,0L282,-32" />
  <g class="ui-annotation__note" transform="translate(282, -32)">
    <text class="ui-annotation__title">Limit</text>
    <text class="ui-annotation__label" y="16">Do not exceed</text>
  </g>
</g>
```

### Badge

Use badges for compact numbered or categorical markers. Do not rely on the badge
color alone; pair it with visible text, a caption, or a table row.

```html
<g class="ui-annotation ui-annotation--badge ui-annotation--info" transform="translate(72, 84)">
  <circle class="ui-annotation__badge" r="12" />
  <text class="ui-annotation__title" text-anchor="middle" dominant-baseline="central">1</text>
</g>
```

## Chart figure recipe

Inside a report, keep the existing chart structure: caption, legend or direct
labels, annotated SVG, and fallback data. A useful annotated figure should show
more than one annotation family when the story needs it: direct labels for
stable references, threshold annotations for limits, circle/rect subjects for
specific data, and badge markers for compact index points.

```html
<figure class="ui-report__figure ui-chart ui-print-exact" role="group" aria-labelledby="annotated-chart">
  <figcaption id="annotated-chart" class="ui-chart__caption">
    Fig 2 - Weekly throughput, annotated at the peak
  </figcaption>
  <svg viewBox="0 0 360 160" role="img" aria-labelledby="throughput-title throughput-desc">
    <title id="throughput-title">Weekly throughput with a peak callout</title>
    <desc id="throughput-desc">Annotations mark the baseline, limit and highest research week.</desc>
    <line x1="36" y1="112" x2="324" y2="112" stroke="var(--line)" />
    <rect x="88" y="42" width="72" height="70" fill="var(--chart-1)" />
    <rect x="188" y="70" width="72" height="42" fill="var(--chart-2)" />
    <g class="ui-annotation ui-annotation--label ui-annotation--muted" transform="translate(36, 132)">
      <g class="ui-annotation__note">
        <text class="ui-annotation__title">Baseline</text>
        <text class="ui-annotation__label" y="16">Previous quarter</text>
      </g>
    </g>
    <g class="ui-annotation ui-annotation--threshold ui-annotation--danger" transform="translate(0, 66)">
      <path class="ui-annotation__subject" d="M36,0L324,0" />
      <path class="ui-annotation__connector" d="M272,0L304,-28" />
      <g class="ui-annotation__note" transform="translate(234, -52)">
        <text class="ui-annotation__title">Limit</text>
        <text class="ui-annotation__label" y="16">Watch capacity</text>
      </g>
    </g>
    <g class="ui-annotation ui-annotation--circle ui-annotation--accent" transform="translate(124, 42)">
      <path class="ui-annotation__subject" d="M0,-18A18,18 0 1 1 0,18A18,18 0 1 1 0,-18Z" />
      <path class="ui-annotation__connector" d="M16,-8L76,-36" />
      <g class="ui-annotation__note" transform="translate(76, -36)">
        <path class="ui-annotation__note-line" d="M0,0H80" />
        <text class="ui-annotation__title" y="-8">Peak</text>
        <text class="ui-annotation__label" y="12">Research high</text>
      </g>
    </g>
  </svg>
  <div class="ui-chart__fallback">
    <div class="ui-table-wrap">
      <table class="ui-table ui-table--dense">
        <caption>Annotated chart source data</caption>
        <thead><tr><th>Week</th><th class="is-num">Hours</th></tr></thead>
        <tbody><tr><td>Week 4</td><td class="is-num">18</td></tr></tbody>
      </table>
    </div>
  </div>
</figure>
```

Status tones (`success`, `warning`, `danger`, `info`) are only for annotations
that carry that status meaning. Use `accent` for the primary insight and
`muted` for secondary callouts.
