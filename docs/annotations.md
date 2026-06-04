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

Match the accessibility treatment to the annotation's job, in both directions:
a **data** annotation (a peak, a threshold, a watched region — it says something
the reader needs) must stay readable, so represent its text as above and do
**not** `aria-hidden` it; a purely **decorative** mark (a cover flourish, a
margin doodle that carries no data) should be `aria-hidden="true"` and
`focusable="false"` on the whole SVG so a screen reader skips the decoration.
The one thing to avoid is the middle: a meaningful callout hidden from assistive
tech, or decoration announced as if it were data.

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
| `notePlacement({ x, y, width, height, bounds, preferred, inset })` | Bounded note offset, alignment and transform for one annotation. `inset` reserves an extra margin (e.g. the title stroke-halo, ~3) so a placement that "fits" doesn't clip. |
| `declutterLabels(items, { gap, min, max })` | Adjusted centres for `items` (`[{ pos, size }]`) so labels don't overlap along one axis (order-preserving). |
| `directLabels(items, { axis, cross, gap, min, max, shape })` | Decluttered label points **and** a leader path per item: `[{ x, y, anchor, key, d }]`. |
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
| `connectorElbow({ dx, dy, subject, mid })` | Right-angle dogleg connector (H/V/H); `mid` (0..1, default 0.5) sets the turn position along the dominant axis. |
| `connectorCurve({ dx, dy, subject })` | Deterministic cubic connector. |
| `connectorEndDot({ x, y, radius })` | Dot marker path. |
| `connectorEndArrow({ x1, y1, x2, y2, size, spread })` | Arrow marker path. `x1,y1`→`x2,y2` sets the direction (the head sits at `x2,y2`); `spread` is the half-angle (default 0.32 ≈ a crisp 37° head). |
| `annotationParts(options)` | Convenience object with `transform`, `subject`, `connector`, and `note`. |

`declutterLabels` is a deliberately small, deterministic **1-D** declutter for
direct labels or axis ticks — sort, push overlaps apart by `size + gap`, slide
to fit under `max`. It is **not** a general 2-D collision solver: if more labels
are requested than the axis can hold, the overflow is yours to resolve (fewer
labels, a longer axis, or rotation). It returns numbers; you own the scale and
the DOM.

`directLabels` is the **direct-labeling** companion: it declutters labels along
one axis _and_ draws the leader from each true anchor to its placed label,
reusing the connector kernel. Each `items[i]` is `{ anchor: {x, y}, size, key? }`
in figure coordinates; labels declutter along `axis` (`'y'` = a vertical column,
the default) and sit at the fixed `cross` coordinate. It returns, in input
order, the placed label point `{ x, y }`, the echoed `anchor`/`key`, and the
leader path `d` (`shape`: `straight` · `elbow` · `curve`). Like everything here
it owns no scales, no DOM, and no 2-D placement — map data → figure coordinates
first, then drop each `d` into a `<path class="ui-annotation__connector">` and
position the label at `{ x, y }`:

```js
import { directLabels } from '@ponchia/ui/annotations';

// anchors are data points already projected into the figure's SVG coords
const labels = directLabels(
  points.map((p) => ({ anchor: p, size: 18, key: p.id })),
  { axis: 'y', cross: width - 8, gap: 6, min: 12, max: height - 12 },
);
// labels[i] → { x, y, anchor, key, d }
```

All numeric inputs must be finite. Negative radius, width, height, padding, and
marker size throw `RangeError`; non-finite values throw `TypeError`. Path
numbers are rounded to three decimals with trailing zeros removed so snapshots
and unit tests stay stable.

`notePlacement()` is intentionally small: it places one note inside explicit SVG
bounds using a preferred side (`right`, `left`, `top`, or `bottom`) and falls
back to another side or a clamped note transform. It is not a collision solver
for a whole chart. For dense annotation sets, pre-compute positions or author a
mobile-specific SVG.

### Using the helpers in a static, no-JS report

The [report layer](./reporting.md) is static and ships no behavior JS, but these
helpers are JS — so in a hand- or LLM-authored report you can't call them at
render time. Bridge the gap by running them **once, at author/build time**, and
pasting the returned strings straight into the SVG. The output is deterministic
(path numbers are rounded to three decimals), so the strings are stable and
diff-friendly.

```js
// author-time only — copy the logged strings into the static HTML
import { circleSubjectPath, connectorLine } from '@ponchia/ui/annotations';

circleSubjectPath({ radius: 15 });
// "M0,-15A15,15 0 1 1 0,15A15,15 0 1 1 0,-15Z"
connectorLine({ dx: 78, dy: -38, subject: { type: 'circle', radius: 15, radiusPadding: 0 } });
// "M13.485,-6.57L78,-38"
```

The static markup then carries only the resolved strings — no runtime, no
import:

```html
<g class="ui-annotation ui-annotation--circle ui-annotation--accent" transform="translate(34, 58)">
  <path class="ui-annotation__subject" d="M0,-15A15,15 0 1 1 0,15A15,15 0 1 1 0,-15Z" />
  <path class="ui-annotation__connector" d="M13.485,-6.57L78,-38" />
  <g class="ui-annotation__note" transform="translate(78, -38)">…</g>
</g>
```

The same author-time-copy idea covers foreign-renderer theme literals: a
`file://` report can't `import` the Vega/Mermaid/D2 theme helpers either, so
`npm run emit:theme <vega|mermaid|d2> <light|dark>` prints the resolved object to
paste inline, and `npm run emit:theme:check <file>` re-checks a pasted block
against current tokens. See [vega.md](./vega.md#from-a-cdn-no-bundler).

## Using annotations off-chart

Annotations are not only for charts. Two report uses worth calling out:

- **A decorative margin mark.** A small `ui-annotation` group — a circled point
  with a short note — adds a hand-annotated feel to a report cover or section
  opener. It carries no data, so mark the whole SVG `aria-hidden="true"` and
  `focusable="false"`: a screen reader should not read decoration.

```html
<svg width="440" height="92" viewBox="0 0 440 92" aria-hidden="true" focusable="false">
  <g class="ui-annotation ui-annotation--circle ui-annotation--accent" transform="translate(34, 58)">
    <path class="ui-annotation__subject" d="M0,-15A15,15 0 1 1 0,15A15,15 0 1 1 0,-15Z" />
    <circle r="3.5" fill="var(--accent)" />
    <path class="ui-annotation__connector" d="M13.485,-6.57L78,-38" />
    <g class="ui-annotation__note" transform="translate(78, -38)">
      <path class="ui-annotation__note-line" d="M0,0H188" />
      <text class="ui-annotation__title" y="-8">You are here</text>
      <text class="ui-annotation__label" y="12">a short, terse label</text>
    </g>
  </g>
</svg>
```

- **A data note that sits off the plot area, statically (no JS).** When the
  callout carries a *finding* — a threshold, a labelled event — rather than
  decoration, it must **not** be `aria-hidden`; instead mirror its text in the
  figure's `<desc>` and the fallback table so the data reaches every reader. The
  JS `notePlacement()` helper computes this offset for you, but for a frozen
  `file://`/print-bound report you place it by hand: reserve a band at the top of
  the `viewBox` for the note (don't draw bars into it), keep the subject (the
  rule/point) on the plot, and translate the `__note` group **up, above the
  plot**, so the connector points off the plotting area. Author the `viewBox` near
  the rendered pixel size to keep text near 1× (see the user-unit trap below):

```html
<svg viewBox="0 0 360 180" role="img" aria-labelledby="fig-t fig-d" style="max-inline-size: 540px; width: 100%">
  <title id="fig-t">Write success rate over the incident day</title>
  <!-- The note text is repeated here so it is not JS- or sight-only. -->
  <desc id="fig-d">…dashed line marks the 99.9% SLO floor; the off-plot callout reads "SLO floor 99.9% — below floor 41 min".</desc>

  <line x1="36" y1="150" x2="336" y2="150" stroke="var(--line)" /><!-- axis -->
  <!-- bars drawn only below y≈40, leaving the top band free for the note -->

  <!-- subject rule ON the plot; note translated UP, off the plotting area -->
  <g class="ui-annotation ui-annotation--threshold ui-annotation--danger" transform="translate(0, 44)">
    <path class="ui-annotation__subject" d="M36,0L336,0" stroke-dasharray="4 4" />
    <path class="ui-annotation__connector" d="M180,0L150,-30" />
    <g class="ui-annotation__note" transform="translate(40, -34)">
      <path class="ui-annotation__note-line" d="M0,0H150" />
      <text class="ui-annotation__title" y="-8">SLO floor 99.9%</text>
      <text class="ui-annotation__label" y="12">Below floor 41 min</text>
    </g>
  </g>
</svg>
```

- **Bracketing a passage of prose belongs to marks, not here.** To bracket a
  sentence or paragraph in running text, use `.ui-bracket-note` from the
  [marks layer](./marks.md) — it is the prose analogue of
  `ui-annotation--bracket`. SVG annotations are for SVG figures.

## Sizing: the user-unit trap

Annotation text (`__title`, `__label`) is sized in **SVG user units**, so it
scales with the figure. A 360-unit-wide chart stretched across a full report
column is scaled roughly 2.5–3×, and the callout text scales with it — long
notes turn huge and overflow the `viewBox` (SVG text is clipped, not wrapped).
Two rules keep callouts readable:

- **Keep note text terse** — a title and a few words, like the recipe examples
  (`Peak`, `Limit`, `80 kB cap`). Push the full sentence into the figure caption,
  the `<desc>`, or the fallback table.
- **Constrain the figure width** so the user-unit → pixel scale stays near
  1–1.5×: set a `max-inline-size` on the SVG instead of letting it stretch to the
  whole column, or author the `viewBox` at roughly the rendered pixel size.

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
<figure class="ui-report__figure ui-print-exact" role="group" aria-labelledby="annotated-chart">
  <figcaption id="annotated-chart" class="ui-report__caption">
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
  <div class="ui-table-wrap">
    <table class="ui-table ui-table--dense">
      <caption>Annotated chart source data</caption>
      <thead><tr><th>Week</th><th class="is-num">Hours</th></tr></thead>
      <tbody><tr><td>Week 4</td><td class="is-num">18</td></tr></tbody>
    </table>
  </div>
</figure>
```

Status tones (`success`, `warning`, `danger`, `info`) are only for annotations
that carry that status meaning. Use `accent` for the primary insight and
`muted` for secondary callouts.
