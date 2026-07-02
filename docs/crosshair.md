# Crosshair & readout

`@ponchia/ui/css/crosshair.css` is an opt-in **ruler + readout** for reading a
value off a plot: pointer-tracking crosshair rules, axis value badges, and a
pinned readout chip.

```css
@import '@ponchia/ui';
@import '@ponchia/ui/css/crosshair.css';
```

Bronto draws the rules and (via `initCrosshair`) tracks the pointer — it reports
**where** the pointer is, as pixels and 0–1 fractions. It does **not** find the
nearest data point or map pixels to data values; that needs your scales. So this
is the *visual + pointer* layer, not a chart engine.

## Markup

The plot is `[data-bronto-crosshair]` (a `position: relative` box); it contains a
`.ui-crosshair` overlay with the rule(s) you want.

```html
<figure data-bronto-crosshair style="position: relative">
  <!-- your chart / image / canvas -->
  <div class="ui-crosshair" aria-hidden="true">
    <div class="ui-crosshair__line ui-crosshair__line--x"></div>
    <div class="ui-crosshair__line ui-crosshair__line--y"></div>
    <div class="ui-readout" id="readout"></div>
  </div>
</figure>
```

```js
import { initCrosshair } from '@ponchia/ui/behaviors';
const stop = initCrosshair(); // returns a cleanup
document.querySelector('[data-bronto-crosshair]').addEventListener(
  'bronto:crosshair:move',
  (e) => {
    const { x, y, fx, fy } = e.detail; // px + 0..1 fractions
    // YOU map the fraction to a data value with your scale:
    readout.textContent = `${(fx * 100).toFixed(0)}%`;
  },
);
```

| Class | Role |
| --- | --- |
| `ui-crosshair` | The overlay. Hidden until `.is-active` (set on the first pointer move over the plot). |
| `ui-crosshair__line` + `--x` / `--y` | Vertical / horizontal rule, positioned by `--crosshair-x` / `--crosshair-y`. |
| `ui-crosshair__badge` | An axis value chip (you set its text + edge). |
| `ui-readout` inside `.ui-crosshair` | A pinned readout chip; follows the crosshair point and flips before/above near plot edges via `data-readout-inline` / `data-readout-block`. Standalone `.ui-readout` remains the dot-matrix numeric row from `dots.css`. |

`ui-crosshair--muted` is a subtler neutral crosshair. `ui.crosshair({ muted })`
builds the class string. Include only the lines you need (just `--x` for a
vertical scrubber, etc.).

## Events

- `bronto:crosshair:move` — `{ x, y, fx, fy }` (px within the plot + fractions).
- `bronto:crosshair:leave` — pointer left the plot.

The crosshair is decorative (`aria-hidden`); expose the underlying values to
assistive tech through a data table or text, not the rules.

## Related

`crosshair.css` is part of
[`analytical.css`](./reporting.md#the-analytical-toolbox-in-a-report). Use
[reference.md](./reference.md) for the generated class and token catalog.
