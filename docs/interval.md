# Interval

`@ponchia/ui/css/interval.css` is an opt-in low/high uncertainty primitive for
reports: confidence intervals, estimates, measurement ranges, target windows,
and caveated values.

```css
@import '@ponchia/ui';
@import '@ponchia/ui/css/interval.css';
```

The host normalises every value to `0..1`. Bronto paints only the track, range,
and optional point estimate.

```html
<div
  class="ui-interval"
  style="--lo: 0.22; --hi: 0.68"
  role="img"
  aria-label="Estimated completion between 22 and 68 percent, point estimate 52 percent"
>
  <span class="ui-interval__label">Estimate window</span>
  <span class="ui-interval__track" aria-hidden="true">
    <span class="ui-interval__range"></span>
    <span class="ui-interval__point" style="--v: 0.52"></span>
  </span>
  <span class="ui-interval__bounds" aria-hidden="true">
    <span>22%</span>
    <span>68%</span>
  </span>
</div>
```

## Contract

| Class | Role |
| --- | --- |
| `.ui-interval` | Wrapper and custom-property host. |
| `.ui-interval__track` | Neutral track. |
| `.ui-interval__range` | Low-high range span. |
| `.ui-interval__point` | Optional point estimate. Omit the element when none exists. |
| `.ui-interval__label` | Written label. |
| `.ui-interval__bounds` | Visible low/high labels. |

| Custom property | On | Meaning |
| --- | --- | --- |
| `--lo` | `.ui-interval` | Required normalised lower bound, `0..1`. |
| `--hi` | `.ui-interval` | Required normalised upper bound, `0..1`. |
| `--v` | `.ui-interval__point` | Optional normalised point estimate, `0..1`. |

## Accessibility

Pair each interval with a written label or `role="img"` plus `aria-label`. The
range is not the data of record: under forced-colors or print, the readable
label and bounds must still explain the value.
