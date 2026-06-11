# Figure

`@ponchia/ui/css/figure.css` is an opt-in analytical/report figure stage. It
does not render charts. It gives charts, diagrams, screenshots, and annotated
SVGs a stable frame: caption, media stage, optional overlay, optional key, and
fallback data.

```css
@import '@ponchia/ui';
@import '@ponchia/ui/css/figure.css';
@import '@ponchia/ui/css/legend.css';
```

Use it with `ui-report__figure` when the figure sits in a report. Use it alone
when the same stage appears in a dashboard, doc page, or generated artifact.

```html
<figure class="ui-figure ui-report__figure ui-print-exact" role="group" aria-labelledby="fig-title">
  <figcaption id="fig-title" class="ui-figure__caption ui-report__caption">
    Fig 1 - Weekly focus split
  </figcaption>
  <div class="ui-figure__body ui-figure__body--key-right">
    <div class="ui-figure__stage" style="--figure-max-inline: 30rem; --figure-min-block: 12rem">
      <svg class="ui-figure__media" viewBox="0 0 320 120" role="img" aria-labelledby="svg-title svg-desc">
        <title id="svg-title">Weekly focus split</title>
        <desc id="svg-desc">Research is the largest category.</desc>
        <rect x="80" y="24" width="180" height="20" fill="var(--chart-1)" />
        <rect x="80" y="64" width="110" height="20" fill="var(--chart-2)" />
      </svg>
      <svg class="ui-figure__overlay" viewBox="0 0 320 120" aria-hidden="true">
        <path class="ui-annotation__connector" d="M260,34L292,14" />
      </svg>
    </div>
    <div class="ui-figure__key">
      <ul class="ui-legend" aria-label="Series">...</ul>
    </div>
  </div>
  <div class="ui-figure__data ui-table-wrap">
    <table class="ui-table ui-table--dense">...</table>
  </div>
</figure>
```

## Contract

| Class | Role |
| --- | --- |
| `.ui-figure` | Figure wrapper. |
| `.ui-figure__caption` | Caption text; can compose with `ui-report__caption`. |
| `.ui-figure__body` | Stage/key layout wrapper. |
| `.ui-figure__body--key-right` | Two-column body: visual stage plus right-side key. |
| `.ui-figure__stage` | Stable, centered media stage; `position: relative` for overlays. |
| `.ui-figure__media` | Primary SVG, image, canvas, or rendered figure output. |
| `.ui-figure__overlay` | Absolute, pointer-transparent overlay for annotations or guides. |
| `.ui-figure__key` | Legend/key slot. |
| `.ui-figure__data` | Fallback data slot, usually a `ui-table-wrap`. |

| Custom property | On | Meaning |
| --- | --- | --- |
| `--figure-max-inline` | `.ui-figure__stage` | Maximum stage width, default `42rem`. |
| `--figure-min-block` | `.ui-figure__stage` | Reserved stage height for late-rendered media. |
| `--figure-key-width` | `.ui-figure__body--key-right` | Right key column width before mobile collapse. |

## Boundary

- Bronto owns layout, responsive collapse, overlay positioning, print spacing,
  and class names.
- The host owns scales, data binding, SVG/canvas/chart rendering, fallback table
  rows, annotation text, and accessibility labels.
- A figure should always have a `<figcaption>`. Data-bearing SVGs still need
  `<title>` and `<desc>`.
