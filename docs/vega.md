# Vega-Lite

[Vega-Lite](https://vega.github.io/vega-lite/) is a **declarative JSON grammar
of graphics** — you describe a chart as data and it compiles (through
[Vega](https://vega.github.io/vega/)) to **SVG or canvas**. Like the
[Mermaid](./mermaid.md) and [D2](./d2.md) integrations, `@ponchia/ui` doesn't
render charts — it **themes** them from your tokens. Two things ship:

- `@ponchia/ui/vega` — `brontoVegaConfig(theme)`, the on-brand Vega-Lite
  [`config`](https://vega.github.io/vega-lite/docs/config.html) object.
- `@ponchia/ui/vega.json` — the resolved per-theme config, for any consumer.

This is the idiomatic Vega theme shape — a `config`, the same kind the
[`vega-themes`](https://github.com/vega/vega-themes) package ships. Vega stays
the consumer's renderer; this is config only, and **Vega is not a dependency**
of bronto (the dev-only render-probe aside).

> Why Vega-Lite and not a bronto chart component? A chart needs **scales**
> (data → pixels) and **data binding** — the two things the analytical layer
> [refuses to own](./architecture.md). A spec is also something an
> LLM-from-another-system can emit as data, the same way it emits Mermaid/D2.
> So bronto themes a real charting grammar instead of shipping a fragile one.

## Theme a chart

`brontoVegaConfig(theme)` returns a `config` object. Spread it into a spec, or
hand it to [vega-embed](https://github.com/vega/vega-embed):

```js
import vegaEmbed from 'vega-embed';
import { brontoVegaConfig } from '@ponchia/ui/vega';

const theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';

vegaEmbed('#chart', {
  data: { values: [
    { quarter: 'Q1', value: 42 },
    { quarter: 'Q2', value: 58 },
    { quarter: 'Q3', value: 50 },
  ] },
  mark: 'bar',
  encoding: {
    x: { field: 'quarter', type: 'nominal' },
    y: { field: 'value', type: 'quantitative' },
  },
}, { config: brontoVegaConfig(theme), renderer: 'svg', actions: false });
```

Pass **`renderer: 'svg'`** (not vega-embed's `canvas` default): an SVG chart is
inspectable, themeable, survives the print/PDF pipeline, and is what the
[annotation layer](#annotate-a-chart) composes onto — a canvas chart prints as a
raster and carries no text alternative.

### From a CDN, no bundler

Load Vega + Vega-Lite + vega-embed from **pinned `/build/*.min.js` UMD files**,
then pass the config. Pin exact versions and use the `/build/` path — a bare
`cdn.jsdelivr.net/npm/vega@6` redirect resolves to a module bundle that does
**not** register the global `window.vega`, so vega-embed throws and nothing
renders. Keep the three majors aligned: **Vega-Lite 6 targets Vega 6** (and
vega-embed 7), so don't mix a Vega-Lite 6 with a Vega 5 runtime:

```html
<script src="https://cdn.jsdelivr.net/npm/vega@6.2.0/build/vega.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/vega-lite@6.4.3/build/vega-lite.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/vega-embed@7.1.0/build/vega-embed.min.js"></script>
<script>
  // INLINE the config — generate the paste-ready literal with
  // `npm run emit:theme vega light` (mirrors the annotations author-time-copy
  // pattern). This is the only path that also works from a file:// report.
  const brontoLight = {
    /* …paste tokens/vega.json → light here… */
  };
  vegaEmbed('#chart', spec, { config: brontoLight, renderer: 'svg', actions: false });
</script>
```

> **file:// portability.** A report opened straight from disk (`file://`) cannot
> `import` the `@ponchia/ui/vega` module **nor** `fetch('…/vega.json')` — the
> browser blocks both across the `null`/file origin (CORS). So for a
> double-clickable or PDF-bound report, **inline the resolved config object**
> (as above) rather than fetching it. Generate the paste-ready, sentinel-tagged
> literal with `npm run emit:theme vega light` (or `dark`); re-running
> `npm run emit:theme:check <file>` re-derives every tagged block and fails if a
> token change has left an inlined copy stale. Over an `http(s)` origin (a dev server, a
> static host, a bundler), the `import { brontoVegaConfig }` form and a
> `fetch('https://cdn.jsdelivr.net/npm/@ponchia/ui@VERSION/tokens/vega.json')`
> both work — pin the package version in the URL, since the unversioned latest
> may predate this target.

**Over `http(s)`, skip the inline copy — import the helper as an ES module.**
`tokens/vega.js` (the `@ponchia/ui/vega` entry) has **zero dependencies**, so it
loads straight from a CDN as a browser ES module with no bundler and no
import-map. You get `brontoVegaConfig(theme)` itself (live theme switching), not
a frozen object to keep in sync. Pin the package version; this needs a real
origin (it does **not** work from `file://` — use the inline form above there):

```html
<script type="module">
  import { brontoVegaConfig } from 'https://cdn.jsdelivr.net/npm/@ponchia/ui@VERSION/tokens/vega.js';
  // vegaEmbed loaded from its UMD bundle above (window.vegaEmbed), or import it as ESM too.
  vegaEmbed('#chart', spec, { config: brontoVegaConfig('light'), renderer: 'svg', actions: false });
</script>
```

For a build step or non-JS host, read `@ponchia/ui/vega.json` directly
(`{ light, dark }`, each a ready Vega-Lite `config`).

### Why resolved colours, not `var(--x)`

Vega-Lite compiles a spec to a Vega scene that renders to **SVG or canvas** —
colours are **baked into the output** and parsed by `d3-color`, which understands
real hex/rgb but **not** `var()` (nor `oklch()`). So the config ships **resolved
hex per theme**, projected from the same token source as
[`tokens/resolved.json`](./architecture.md) / [`charts.json`](./theming.md).
Re-call `brontoVegaConfig()` when the theme toggles and re-embed.

### What the slots paint

The config keeps a chart **monochrome by default** — the rationed accent is the
one chromatic default (series 1 / the lone mark), never the chrome:

| Slot | Paint | bronto token |
| --- | --- | --- |
| `background` | Chart canvas | `--bg` |
| `view.stroke` | Plot frame | `--line` |
| `mark.color` | Default / single-series mark | `--accent` |
| `rule.color` | Reference rules, annotations | `--line-strong` |
| `axis.domainColor` · `tickColor` | Axis line · ticks | `--line-strong` |
| `axis.gridColor` | Gridlines | `--line` |
| `axis.labelColor` · `titleColor` | Tick labels · axis title | `--text-soft` · `--text` |
| `text.color` | Free `text`/`label` marks | `--text` |
| `legend.*` · `header.*` · `title.*` | Legend, facet headers, title | `--text-soft` / `--text` / `--text-dim` |
| `*.font` / `*Font` | All text | `--sans` |
| `range.category` | 8-series categorical palette | `charts.json` categorical (series 1 = accent) |
| `range.ordinal` · `ramp` · `heatmap` | Single-hue sequential ramp | `charts.json` sequential |
| `range.diverging` | − … neutral … + ramp | `charts.json` diverging |

The palette is the same CVD-safe, pattern-paired set documented in
[theming](./theming.md#data-viz) — colour is never the sole channel. When a
series needs the redundant second channel, drive the mark's fill from the
`--chart-pattern-*` tokens or pair a [legend](./legends.md) swatch.

### Spending the accent

Series 1 of `range.category` **is** the live accent, so a single-series chart and
the first category re-skin for free with `--accent`. To emphasise one mark in a
multi-series chart, paint just that mark with the accent and leave the rest
neutral — the same "reserve the accent for the one thing a reader must not miss"
rule the rest of the system follows. Two small helpers hand you the exact
per-theme hexes so you never hard-code a palette array index:

```js
import { brontoVegaAccent, brontoVegaNeutral } from '@ponchia/ui/vega';

// e.g. a bar chart where only the 'Alert' category is loud:
const spec = {
  /* …data… */
  mark: 'bar',
  encoding: {
    x: { field: 'name', type: 'nominal' },
    y: { field: 'value', type: 'quantitative' },
    color: {
      condition: { test: "datum.name === 'Alert'", value: brontoVegaAccent(theme) },
      value: brontoVegaNeutral(theme),
    },
    legend: null,
  },
};
```

`brontoVegaAccent(theme)` is `range.category[0]` (the live accent) and
`brontoVegaNeutral(theme)` is the last category (the quiet neutral); re-read both
when the theme toggles. Prefer them over digging the hex out of
`tokens/resolved.json` — they are guaranteed to match the palette the config
already ships. In token terms the accent is `--chart-1` and the neutral is
`--chart-8`, so a [legend](./legends.md#swatch-colour) for an accent-rationed
chart keys those two series with `ui-legend__swatch--1` and
`ui-legend__swatch--8` — the swatches mirror the marks exactly.

### Selecting the themed ramp in a spec

The config registers the ramps as **named ranges**, so a quantitative encoding
opts in with `scale: { range: 'heatmap' }` (or `'ramp'` / `'diverging'`) — the
range **name**, not a colour scheme:

```js
{
  mark: 'rect',
  encoding: {
    x: { field: 'x', type: 'nominal' },
    y: { field: 'y', type: 'nominal' },
    color: { field: 'v', type: 'quantitative', scale: { range: 'heatmap' } },
  },
}
```

> Use `scale: { range: 'heatmap' }`, **not** `scale: { scheme: 'heatmap' }`.
> `scheme:` looks up a registered Vega/d3 scheme by name and **throws** for
> `'heatmap'` (no such scheme) — the ramp is a custom `range` the bronto config
> defines, addressed by range name. A `quantitative` colour encoding already
> defaults to `range.heatmap`; name it explicitly only when a chart has several
> quantitative scales and you want a specific one (`'diverging'` for a signed
> domain around a neutral centre).

### Sequential & diverging ramps invert by theme

`range.heatmap` / `ramp` / `ordinal` is a single-hue ramp that runs **pale → deep
as the value rises in light theme, and deep → pale in dark theme** (the bg flips,
so the ramp flips to stay legible against it). Two consequences:

- **Don't hard-code ink on a heatmap cell.** A fixed black (or white) label is
  readable at one end of the ramp and invisible at the other — and the readable
  end swaps between themes. Either omit per-cell labels and rely on the fallback
  `ui-table`, or compute the label colour from the cell's luminance at render
  time. bronto themes the ramp; it can't know your data domain, so it does not
  ship a cell-ink helper.
- **A CSS gradient key won't pixel-match the Vega ramp.** A native
  [`ui-legend--gradient`](./legends.md) track is interpolated in OKLCH; Vega
  interpolates its `range.*` ramp in d3's RGB space. They share endpoints but
  drift in the mid-tones, so a continuous gradient key placed beside a Vega
  heatmap will not match its mid cells exactly. Use a **stepped** legend (one
  swatch per band, each from the same `charts.json` ramp stop) when the key sits
  next to the chart.

## Annotate a chart

Vega renders to SVG, so the [annotation layer](./annotations.md) composes onto it
exactly as in the [Mermaid recipe](./mermaid.md#annotate-a-diagram): render to a
frozen SVG (vega-embed's `view.toSVG()`, or the Vega CLI), read the target mark's
box, and paste a `<g class="ui-annotation">` computed with
`@ponchia/ui/annotations`. The same caveat applies — Vega's internal SVG (element
ids, the `role`/`aria` structure, the scene transform) is **not a public
contract**, so pin your Vega version and key off the data, not generated ids.

## Scope

bronto owns the theme config — gated structurally by `check:vega` (every colour
slot resolves, both themes, no `var()` leaks, every `range.*` ramp populated),
and separately a dev-only render-probe (`npm test`, via the `vega`/`vega-lite`
dev deps) asserts the colours actually land on a rendered chart — and the
annotation geometry. It does not own Vega's grammar, its rendering, or its internal SVG —
those stay Vega's, and the chart is a documented composition, not a shipped
runtime binding.
