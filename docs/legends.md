# Legends & data keys

`@ponchia/ui/css/legend.css` is an opt-in layer of **data keys** for charts,
reports, and analytical figures. A legend maps a visual encoding (colour, a
pattern, a shape, a gradient) to its meaning. It reads the same Tier-4
`--chart-*` tokens the [data-viz palette](./reference.md) ships, so a key never
drifts from the series it describes.

```css
@import '@ponchia/ui';
@import '@ponchia/ui/css/dataviz.css';
@import '@ponchia/ui/css/legend.css';
```

Bronto **paints and positions** the key; it owns no scales, no data→pixel
mapping, and no series state. Pair it with Bronto's own `.ui-chart` bars, an
SVG/canvas figure, or any external chart engine — the host owns the chart.

## What it is not

- Not a chart engine. It does not compute tick positions, "nice" numbers,
  bin thresholds, or bubble radii — you supply the tick/range **text**; the
  CSS positions the slots you give it.
- Not a colour source. Swatch colour always comes from a `--chart-*` token
  (enforced by `check:legend`), never a hand-rolled hex.

## Accessibility: colour is never the only channel

A legend that distinguishes series by **colour alone** fails
[WCAG 1.4.1 Use of Color](https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html).
In a legend, the **text label** is the required non-colour channel — every
entry carries its name, so the meaning survives even if colour is lost
(`forced-colors`, monochrome print, colour-vision deficiency). Where the chart
*mark itself* is colour-only (a bare area or line), also pair the swatch with
its `--chart-pattern-*` so the figure — not just the legend — stays readable.

Recommended structure: wrap the figure and its key in a `<figure>` with a
`<figcaption>`, and give the legend its own group label.

```html
<figure role="group" aria-labelledby="fig-1-title">
  <figcaption id="fig-1-title">Fig 1 — Weekly focus split</figcaption>

  <!-- … the chart … -->

  <ul class="ui-legend" aria-label="Series">
    <li class="ui-legend__item">
      <span
        class="ui-legend__swatch"
        style="--chart-color: var(--chart-1); --chart-pattern: var(--chart-pattern-1)"
        aria-hidden="true"
      ></span>
      <span class="ui-legend__label">Research</span>
    </li>
    <li class="ui-legend__item">
      <span class="ui-legend__swatch ui-legend__swatch--2" aria-hidden="true"></span>
      <span class="ui-legend__label">Delivery</span>
    </li>
  </ul>
</figure>
```

The swatch is decorative (`aria-hidden="true"`) — the meaning is the label
text. Set its colour either inline (`--chart-color`) to mirror exactly what the
chart mark uses, or with a `--N` index helper for the categorical palette.

## Parts

| Class | Role |
| --- | --- |
| `ui-legend` | The container (a wrapping inline row by default). |
| `ui-legend__title` | Optional heading for the key. |
| `ui-legend__item` | One entry — swatch + label (+ value). |
| `ui-legend__swatch` | The colour/pattern chip. |
| `ui-legend__symbol` | A glyph/shape chip (fill an `.ui-icon` mask). |
| `ui-legend__label` | The series name (the non-colour channel). |
| `ui-legend__value` | Optional trailing value/range. |
| `ui-legend__caption` | Optional footnote (units, source). |
| `ui-legend__track` | The gradient bar (continuous keys). |
| `ui-legend__ticks` / `ui-legend__tick` | Tick labels under the track. |

### Swatch colour

| Approach | Use |
| --- | --- |
| `style="--chart-color: var(--chart-3)"` | Mirror any token, any order; add `--chart-pattern` to match a patterned mark. |
| `class="… ui-legend__swatch--3"` | Categorical palette series 1–8 — sets `--chart-3` for you. |

`ui-legend__swatch--circle` and `ui-legend__swatch--line` change the chip shape
(dot series, line series).

## Variants

| Modifier | Effect |
| --- | --- |
| `ui-legend--vertical` | Stack entries instead of the wrapping row. |
| `ui-legend--compact` | Denser type and gaps. |
| `ui-legend--with-values` | Align a trailing `__value` column across rows. |
| `ui-legend--gradient` | Continuous colour ramp (`__track` + `__ticks`). |
| `ui-legend--diverging` | Use the 7-stop diverging ramp (with `--gradient`). |
| `ui-legend--threshold` | Binned `swatch │ range-label` grid. |
| `ui-legend--interactive` | Entries are toggle controls (see below). |

The recipe mirrors this surface:

```js
import { ui } from '@ponchia/ui/classes';

ui.legend({ type: 'gradient', diverging: true });
// "ui-legend ui-legend--gradient ui-legend--diverging"
ui.legendSwatch({ series: 3, shape: 'circle' });
// "ui-legend__swatch ui-legend__swatch--3 ui-legend__swatch--circle"
```

### Continuous ramp

Supply the min/mid/max tick **text**; the track interpolates the sequential
ramp in OKLCH (`--diverging` swaps in the diverging ramp around its neutral
centre).

```html
<div class="ui-legend ui-legend--gradient" role="group" aria-label="Density">
  <span class="ui-legend__track" aria-hidden="true"></span>
  <span class="ui-legend__ticks">
    <span class="ui-legend__tick">0</span>
    <span class="ui-legend__tick">50</span>
    <span class="ui-legend__tick">100</span>
  </span>
</div>
```

## Interactive legends (optional)

An interactive legend toggles a series on or off. Bronto ships the **control
surface** only; the **host owns the data**. The split is deliberate (it keeps
the legend out of chart-engine territory):

- **Bronto:** each entry is a `<button aria-pressed>`. The optional
  `initLegend` behavior flips `aria-pressed`, toggles `.is-inactive`, and
  dispatches `bronto:legend:toggle` with `{ detail: { series, active } }`.
- **You:** listen for the event, hide/show your own series, and announce the
  change through an `aria-live` region you own.

```html
<ul class="ui-legend ui-legend--interactive" data-bronto-legend aria-label="Series">
  <li>
    <button class="ui-legend__item" aria-pressed="true" data-series="research">
      <span class="ui-legend__swatch ui-legend__swatch--1" aria-hidden="true"></span>
      <span class="ui-legend__label">Research</span>
    </button>
  </li>
</ul>
```

```js
import { initLegend } from '@ponchia/ui/behaviors';
const stop = initLegend(); // returns a cleanup fn
document.addEventListener('bronto:legend:toggle', (e) => {
  const { series, active } = e.detail;
  // hide/show your series, then announce it in your own aria-live region
});
```

Convention: `aria-pressed="true"` means the series is **shown** (the default).
The entry's label never changes on toggle — only `aria-pressed` and
`.is-inactive` flip, so a screen reader reads a stable name with a clear
pressed state. React/Solid/Qwik consumers can use `useLegend()` instead of
calling `initLegend` directly.
