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
}, { config: brontoVegaConfig(theme), actions: false });
```

From a CDN (no bundler), load Vega + Vega-Lite + vega-embed and pass the same
config — fetch it from `@ponchia/ui/vega.json` or inline the object:

```html
<script src="https://cdn.jsdelivr.net/npm/vega@5"></script>
<script src="https://cdn.jsdelivr.net/npm/vega-lite@5"></script>
<script src="https://cdn.jsdelivr.net/npm/vega-embed@6"></script>
<script type="module">
  const { light } = await fetch('https://cdn.jsdelivr.net/npm/@ponchia/ui/tokens/vega.json')
    .then((r) => r.json());
  vegaEmbed('#chart', spec, { config: light, actions: false });
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
multi-series chart, set its colour with a Vega-Lite
[conditional](https://vega.github.io/vega-lite/docs/condition.html) to the
resolved `--accent` hex (from [`tokens/resolved.json`](./architecture.md)) and
leave the rest neutral — the same "reserve the accent for the one thing a reader
must not miss" rule the rest of the system follows.

## Annotate a chart

Vega renders to SVG, so the [annotation layer](./annotations.md) composes onto it
exactly as in the [Mermaid recipe](./mermaid.md#annotate-a-diagram): render to a
frozen SVG (vega-embed's `view.toSVG()`, or the Vega CLI), read the target mark's
box, and paste a `<g class="ui-annotation">` computed with
`@ponchia/ui/annotations`. The same caveat applies — Vega's internal SVG (element
ids, the `role`/`aria` structure, the scene transform) is **not a public
contract**, so pin your Vega version and key off the data, not generated ids.

## Scope

bronto owns the theme config (gated: every colour slot resolves, both themes, no
`var()` leaks, every `range.*` ramp populated — and a dev-only render-probe
asserts the colours actually land on a rendered chart) and the annotation
geometry. It does not own Vega's grammar, its rendering, or its internal SVG —
those stay Vega's, and the chart is a documented composition, not a shipped
runtime binding.
