# Mermaid

[Mermaid](https://mermaid.js.org) renders diagrams (flowcharts, sequence, pie,
git, gantt…) from text to **SVG**. `@ponchia/ui` does not render diagrams — it
**themes** the ones you already have and lets you **annotate** them, the same way
it dresses any other SVG figure in a report. Two things ship:

- `@ponchia/ui/mermaid` — a resolved Mermaid `base` theme, per bronto theme.
- `@ponchia/ui/mermaid.json` — the same data as plain JSON, for any consumer.

Mermaid stays the consumer's renderer. This is config only: bronto never imports
or runs Mermaid, and Mermaid is **not** a dependency.

## Theme a diagram

Mermaid's `base` theme is the only one meant to be customized. Hand it the
bronto theme variables:

```js
import mermaid from 'mermaid';
import { brontoMermaidTheme } from '@ponchia/ui/mermaid';

mermaid.initialize(brontoMermaidTheme()); // light
await mermaid.run();
```

`brontoMermaidTheme(theme)` returns `{ theme: 'base', themeVariables }` ready to
spread into `initialize`. Pass `'dark'` for the dark palette, or read the active
bronto theme:

```js
const theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
mermaid.initialize(brontoMermaidTheme(theme));
```

You can also splice the variables into a single diagram via an init directive,
or read the raw maps (`import { mermaid } from '@ponchia/ui/mermaid'` →
`{ light, dark }`). For a build step or non-JS host, read
`@ponchia/ui/mermaid.json` directly.

**Over `http(s)`, import the helper from a CDN as an ES module** — no bundler.
`tokens/mermaid.js` (the `@ponchia/ui/mermaid` entry) has **zero dependencies**,
so it loads directly as a browser ES module; you get `brontoMermaidTheme(theme)`
itself, not a frozen object to keep in sync. Pin the package version; this needs
a real origin (not `file://` — inline or pre-render to SVG there, per the note
below):

```html
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
  import { brontoMermaidTheme } from 'https://cdn.jsdelivr.net/npm/@ponchia/ui@VERSION/tokens/mermaid.js';
  mermaid.initialize(brontoMermaidTheme('light'));
  await mermaid.run();
</script>
```

> **file:// portability.** A report opened straight from disk (`file://`) cannot
> `import` the `@ponchia/ui/mermaid` module **nor** `fetch('…/mermaid.json')` —
> the browser blocks both across the `null`/file origin (CORS), exactly as with
> [Vega](./vega.md#from-a-cdn-no-bundler). So for a double-clickable or PDF-bound
> report either **inline the theme variables** (generate the paste-ready literal
> with `npm run emit:theme mermaid light` / `dark` — guard it from token drift
> with `npm run emit:theme:check <file>`) or, better, **pre-render to a frozen
> SVG** with the Mermaid CLI (`mmdc`, below) so there is no runtime at all. Over
> an `http(s)` origin the `import`/`fetch` forms both work.

The result is monochrome surfaces and lines with the rationed accent reserved
for notes — a diagram that looks like the rest of a bronto surface and
**re-skins for free** when you change `--accent`, exactly like the chart palette.

### Why resolved colours, not `var(--x)`

Mermaid's theming engine derives shades (lighten/darken) from your seed colours,
so it only understands real colours — a `var(--accent)` string breaks
derivation. The theme map therefore ships **resolved hex/rgba per theme**,
projected from the same token source that feeds
[`tokens/resolved.json`](./architecture.md) and `charts.json`. That projection
is the bridge a CSS-first system needs until Mermaid can read CSS variables
directly. It also means the theme is **static per theme**: on a light/dark
switch, re-`initialize` with the other palette and re-render.

### Which diagrams get the palette

- **Chart-like** diagrams carry a categorical series palette — **pie**
  (`pie1`…`pie12`), **git** (`git0`…`git7`), and **user-journey**
  (`fillType0`…`fillType7`) are wired to the CVD-safe
  [charts palette](./legends.md) (series 1 = the live accent).
- **Structural** diagrams — flowchart, sequence, class, ER, state — use the
  monochrome node/edge/cluster grammar and spend the accent only on notes.
- **Not themed: `gantt` and `timeline`.** Their colours come from
  diagram-specific slots (`taskBkgColor`, `sectionBkgColor*`, `gridColor`,
  `todayLineColor`, …) that the base `themeVariables` map does **not** set, so a
  gantt/timeline renders with Mermaid's own off-brand defaults (red/grey bars),
  not the bronto palette. For a **report timeline**, prefer the native,
  fully-themed [`ui-timeline`](./reporting.md) primitive (it also prints and
  needs no renderer); reach for a Mermaid gantt only when you specifically need
  its scheduling layout, and accept its default colours.

Pie wedge labels (`pieSectionTextColor`) sit on arbitrary palette colours; if a
label is hard to read on a given wedge, prefer a legend or direct labels over
recolouring.

### Fit to small screens

The theme map sets colours, not size — sizing stays Mermaid's. Keep `useMaxWidth`
on (the default for most diagram types) so each SVG scales to its container
instead of forcing page-wide horizontal scroll:

```js
mermaid.initialize({
  ...brontoMermaidTheme(theme),
  flowchart: { useMaxWidth: true },
  sequence: { useMaxWidth: true },
});
```

A genuinely wide diagram (a long flowchart, a big ER) can still be unreadable
once squeezed onto a phone. Rather than let it overflow the page, wrap the render
in a scroll container so the *diagram* scrolls, not the document — the same
pattern the report layer uses for wide figures and tables:

```css
.diagram-scroll {
  overflow-x: auto;
}
```

## Annotate a diagram

Mermaid output is SVG, and the [annotation layer](./annotations.md) is
renderer-agnostic SVG — so a `<g class="ui-annotation">` callout composes onto a
rendered diagram the same as onto any figure. bronto supplies the geometry and
the styling; **placing a callout on a specific node is yours**, because that
means reading Mermaid's laid-out coordinates, which bronto deliberately does not
own (no scales, no DOM, no hit-testing — see [annotations.md](./annotations.md)).

The robust path is **build-time**, mirroring the
[static-report recipe](./annotations.md#using-the-helpers-in-a-static-no-js-report):

1. Pre-render the diagram to a frozen SVG with the Mermaid CLI
   (`mmdc -t base -i diagram.mmd -o diagram.svg`, feeding the same
   `themeVariables`).
2. From that SVG, read the target node's box (`getBBox()` / the node's
   `transform`), accounting for the diagram's root `<g>` translate and the
   `viewBox`.
3. Compute the callout strings with `@ponchia/ui/annotations` and paste a
   `<g class="ui-annotation …">` into the SVG at those coordinates.

The output is a static, on-brand, annotated SVG with no runtime — ideal for the
[report layer](./reporting.md).

To annotate a **live** client render instead, run the same measure-and-inject
pass on the SVG returned by `mermaid.render()`, after it is in the DOM. Two
honest caveats, both inherent to overlaying a foreign renderer (not bronto
limitations):

- **Mermaid's internal SVG structure is not a public contract.** Node ids and
  classes are undocumented and have changed across major versions. Match nodes
  by your own author-supplied id substring, measure positions rather than
  hard-coding them, and **pin your Mermaid version**.
- **Every re-render replaces the SVG**, discarding injected overlays. Re-apply
  the annotation pass after each `render()` / theme switch / resize.

## Scope

bronto owns the theme map (gated: every value resolves to a colour, both themes,
no `var()` leaks) and the annotation geometry. It does **not** own Mermaid's
rendering, its internal DOM, or its re-render lifecycle — those stay Mermaid's,
and the overlay above is a documented composition, not a shipped runtime binding.
