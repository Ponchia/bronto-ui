# Renderer tokens

`@ponchia/ui/renderer` resolves the live bronto theme for renderers that cannot
read CSS: Vega, xterm.js, a canvas or WebGL graph, a map, a 3D scene. Those
engines take literal colours, so a page that switches theme, skin, contrast or
the OLED surface has to resolve its tokens again before each repaint that
matters.

```js
import { readTokens, observeTokens, vegaConfig, xtermTheme } from '@ponchia/ui/renderer';

const tokens = readTokens(); // { scheme, bg, panel, text, line, accent, categorical, … }
view = await embed(el, spec, { config: vegaConfig(tokens, { narrow: el.clientWidth < 480 }) });
terminal.options.theme = xtermTheme(tokens);

const stop = observeTokens((next) => {
  terminal.options.theme = xtermTheme(next);
  rebuildChart(vegaConfig(next));
});
```

The static exports serve a different host. [`charts.json`](./theming.md#data-viz-palette)
and [`tokens/vega.js`](./vega.md) are snapshots per light/dark theme for a
report, a `file://` document or a build step. They cannot follow a skin or the
OLED preset; this module reads the page.

## What `readTokens()` returns

Every colour is a renderer literal: `#rrggbb` when opaque, `rgba(r, g, b, a)`
when translucent. Canvas, SVG, d3-color, xterm.js, three.js and MapLibre all
accept both.

| Field | Token | Use |
| --- | --- | --- |
| `scheme` | luminance of `--bg` | `'light'` or `'dark'` |
| `bg`, `panel`, `panelStrong` | `--bg`, `--panel`, `--panel-strong` | Backgrounds; draw on `panel` |
| `text`, `textSoft`, `textDim` | `--text`, `--text-soft`, `--text-dim` | Labels, secondary and tertiary ink |
| `line`, `lineStrong` | `--line`, `--line-strong` | Grid and hairlines; axes and rules |
| `accent`, `accentText`, `onAccent`, `focus` | accent family | The one emphasis, its text forms, focus |
| `selection` | `--accent` at 27% | A translucent selection wash |
| `success`, `warning`, `danger`, `info` | status tier | Status only, never categories |
| `sans`, `mono` | `--sans`, `--mono` | Font stacks for a canvas renderer |
| `categorical` | `--cat-1..8` | Eight hues in fixed order |
| `categoricalTint` | `--cat-N-tint` | Each hue as a wash over `panel` |
| `categoricalInk` | `--cat-N-ink` | Each hue as text, 4.5:1 on panel and tint |
| `sequential`, `diverging` | `--chart-seq-*`, `--chart-div-*` | Ramps for magnitude and ± data |

`readTokens(element)` reads the custom properties as computed on `element`, so a
subtree that re-points tokens is honoured. Without `css/dataviz.css` on the
page, the categorical set and the ramps fall back to the packaged palette for
the resolved scheme, and the tint is computed over the live panel. Without a
DOM (SSR, tests) it returns the packaged values; pass `{ scheme: 'dark' }` to
choose.

## Following changes

`observeTokens(callback, { element, signal })` calls back with fresh tokens
when the root's `data-theme`, `data-bronto-skin`, `data-contrast`,
`data-surface`, `data-density`, `class` or `style` changes, or the system
colour-scheme or contrast preference flips. Calls are coalesced to one per
animation frame. It returns a stop function; an `AbortSignal` also stops it.

## Mappings

- **`vegaConfig(tokens, { mode, narrow, background })`** — a Vega-Lite (default)
  or Vega `config`. Quiet chrome in the bronto inks, no plot frame, the
  categorical palette as `range.category` (a single series takes its first
  hue), the sequential ramp for `ordinal`/`ramp`/`heatmap`, the diverging ramp
  for `diverging`. `narrow` moves the legend under the plot and thins ticks;
  `background` defaults to transparent so the host panel shows. A spec's own
  `config` still wins where Vega merges it. The static
  [`tokens/vega.js`](./vega.md) is this mapping applied to each theme's
  packaged tokens.
- **`xtermTheme(tokens)`** — an xterm.js `ITheme`: page ink on the page
  background, the accent as cursor, the status colours for red, green, yellow
  and blue, and the categorical magenta and aqua inks for magenta and cyan, so
  all six ANSI hues differ.

For any other engine, map the fields yourself: they are already the roles a
renderer needs.

## Conversions

- **`parseColor(value)`** — a resolved CSS colour to `{ r, g, b, alpha }`,
  clipped into sRGB: hex, `rgb()`, `hsl()`, `oklch()`, `oklab()`, `lab()`,
  `lch()` and `color(srgb | srgb-linear | display-p3 | xyz-d65 | xyz-d50 …)`.
  It returns null for `var()`, `color-mix()`, `light-dark()` and named colours,
  which only a browser can compute.
- **`formatColor(rgba)`** — `#rrggbb` or `rgba(r, g, b, a)`.
- **`resolveColor(value, { element })`** — any colour expression to a literal,
  asking the browser for what `parseColor()` cannot compute.

The module is SSR-safe: it touches the DOM only inside a call that needs it.
It owns no renderer and imports none.
