# Spark

`@ponchia/ui/css/spark.css` is an opt-in **inline dataword** — a word-sized
microchart you drop into a sentence or a dense table cell to show a trend
in-line. It is the inline counterpart to the scalar `ui-delta` / `ui-num` /
`ui-stat`, and it fills a gap a block-level chart cannot.

```css
@import '@ponchia/ui';
@import '@ponchia/ui/css/spark.css';
```

## Boundary — the host owns the numbers

Bronto paints bars; it does **not** compute scales. The host normalises each
data point to `0..1` and sets it as `--v` on a `.ui-spark__bar`. Bronto refuses
raw values and min/max — that is the same boundary that keeps the analytical
layer from owning chart state.

## Markup

```html
<!-- "weekly signups, trending up" — the label IS the accessible content -->
<span class="ui-spark" role="img" aria-label="weekly signups, trending up">
  <span class="ui-spark__bar" style="--v: 0.2"></span>
  <span class="ui-spark__bar" style="--v: 0.4"></span>
  <span class="ui-spark__bar" style="--v: 0.35"></span>
  <span class="ui-spark__bar" style="--v: 0.7"></span>
  <span class="ui-spark__bar ui-spark__bar--accent" style="--v: 1"></span>
</span>
```

A **win/loss** strip uses fixed-height bars with `--pos` / `--neg` tones:

```html
<span class="ui-spark" role="img" aria-label="last 5 deploys: 4 passed, 1 failed">
  <span class="ui-spark__bar ui-spark__bar--pos" style="--v: 1"></span>
  <span class="ui-spark__bar ui-spark__bar--pos" style="--v: 1"></span>
  <span class="ui-spark__bar ui-spark__bar--neg" style="--v: 1"></span>
  <span class="ui-spark__bar ui-spark__bar--pos" style="--v: 1"></span>
  <span class="ui-spark__bar ui-spark__bar--pos" style="--v: 1"></span>
</span>
```

## Class reference

| Class | Role |
| --- | --- |
| `.ui-spark` | The inline container (sizes to ~1em tall, `max-content` wide). |
| `.ui-spark__bar` | One bar — height from `--v` (`0..1`). Defaults to `currentColor`. |
| `.ui-spark__bar--accent` | Emphasise one bar with the rationed accent. |
| `.ui-spark__bar--pos` | Success tone (win). |
| `.ui-spark__bar--neg` | Danger tone (loss). |

| Custom property | On | Meaning |
| --- | --- | --- |
| `--v` | `.ui-spark__bar` | **Required.** Normalised height `0..1`; the host computes it. A bar with no `--v` collapses to a 1px floor. |

## Recipes

```js
import { ui } from '@ponchia/ui/classes';

ui.sparkBar({ tone: 'accent' }); // "ui-spark__bar ui-spark__bar--accent"
ui.sparkBar({ tone: 'pos' });    // "ui-spark__bar ui-spark__bar--pos"
ui.sparkBar();                   // "ui-spark__bar"
```

## Accessibility & robustness

- **A bare spark is opaque.** The `.ui-spark` container **must** carry
  `role="img"` and an `aria-label` that states the trend in words — colour and
  shape are never the only channel (WCAG 1.4.1, 1.1.1).
- **Forced colours:** the bars repaint in the system text colour so the shape
  survives (the tone distinction lives in the label).
- **Print:** bars are forced through `print-color-adjust: exact`.
- No JS, no measurement — it renders identically server-side and in a static
  report.
