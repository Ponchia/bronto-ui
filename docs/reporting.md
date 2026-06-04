# Static reports

`@ponchia/ui` can dress static, LLM-authored HTML reports without a component
runtime. Load the normal bundle, then opt in to the report layer, chart palette,
and annotation layer only when the report needs them.

In a bundled app, package specifiers are fine because Vite or another bundler
rewrites them:

```css
@import '@ponchia/ui';
@import '@ponchia/ui/css/report.css';
@import '@ponchia/ui/css/dataviz.css';
@import '@ponchia/ui/css/annotations.css';
@import '@ponchia/ui/css/legend.css';
```

**`dist/bronto.css` is the standard component set only — it does NOT contain
the report, chart, annotation, or legend layers.** Those are opt-in leaves
under `dist/css/`; a report links the default bundle *and* each leaf it uses.
Forgetting them is the most common way an LLM-emitted report renders unstyled.

For standalone browser HTML, use real stylesheet URLs. Package specifiers like
`@ponchia/ui/css/report.css` do not resolve in a saved `.html` file — and note
the path is `dist/css/`, the built leaf, not the source `css/`:

```html
<!-- installed locally -->
<link rel="stylesheet" href="./node_modules/@ponchia/ui/dist/bronto.css" />
<link rel="stylesheet" href="./node_modules/@ponchia/ui/dist/css/report.css" />
<link rel="stylesheet" href="./node_modules/@ponchia/ui/dist/css/dataviz.css" />
<link rel="stylesheet" href="./node_modules/@ponchia/ui/dist/css/annotations.css" />
<link rel="stylesheet" href="./node_modules/@ponchia/ui/dist/css/legend.css" />
```

No install? Link the same files from a CDN. Pin the version — pre-1.0, breaking
changes ship in the minor (see [stability.md](./stability.md)):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ponchia/ui@0.6.0/dist/bronto.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ponchia/ui@0.6.0/dist/css/report.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ponchia/ui@0.6.0/dist/css/dataviz.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ponchia/ui@0.6.0/dist/css/annotations.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ponchia/ui@0.6.0/dist/css/legend.css" />
```

The CDN serves the package's own `fonts/` next to the CSS, so font URLs resolve
with no extra setup. If instead you copy the built CSS next to the report, keep
the same relationship between `dist/bronto.css`, the `dist/css/*` leaves, and
`fonts/` so the relative font URLs continue to resolve.

The report layer is static and PDF-first. It does not initialize behaviors and
does not sanitize content. If a report includes arbitrary LLM, CMS, or user HTML,
sanitize that content before rendering it and do not initialize
`data-bronto-*` behaviors on the generated region.

## The analytical toolbox in a report

`css/report.css` gives you the document grammar (covers, sections, findings,
evidence). The _content_ inside those sections is where the rest of the
analytical layer earns its place. Each one is an opt-in import that stays out of
the default bundle — add the leaves a given report actually needs, or pull the
whole set with `@ponchia/ui/css/analytical.css`. Reach for:

| Layer | Import | Reach for it when… |
| --- | --- | --- |
| **Marks** (`.ui-mark`, `.ui-bracket-note`) | `css/marks.css` | You want to emphasise a phrase _in prose_ — a highlight on the finding, an underline on a risk, or a bracket around an evidence/caveat passage. The inline counterpart to annotations. See [marks.md](./marks.md). |
| **Sources / provenance** (`.ui-citation`, `.ui-source-card`, `.ui-source-list`, `.ui-provenance`) | `css/sources.css` | The report makes claims a reader will question — "where did this come from?". A CSS-only trust layer whose cross-cutting state modifier (`.ui-src--verified`, plus reviewed / generated / unverified / stale / conflict) sets a rationed tone, always paired with a written label, never colour alone. See [sources.md](./sources.md). |
| **Annotations** (`.ui-annotation*`) | `css/annotations.css` | A figure needs an explicit callout — a peak, a limit, a watched region — or a small decorative margin mark. SVG only. See [annotations.md](./annotations.md) and the [off-chart + scaling notes](./annotations.md#using-annotations-off-chart) before you size one. |
| **Legends / data keys** (`.ui-legend*`) | `css/legend.css` | A chart figure needs a colour key. WCAG 1.4.1 by construction. See [legends.md](./legends.md). |
| **Mermaid theme** (`@ponchia/ui/mermaid`) | _(JS/JSON, no CSS)_ | The report embeds a [Mermaid](https://mermaid.js.org) diagram (flowchart, sequence, pie…) and you want it on-brand instead of generic. A resolved `base` theme projected from the same tokens as `charts.json`; annotate the rendered SVG with the annotation layer. See [mermaid.md](./mermaid.md). |
| **D2 theme** (`@ponchia/ui/d2`) | _(JS/JSON, no CSS)_ | The report embeds a [D2](https://d2lang.com) diagram and you want it on-brand. Resolved theme-override slots (monochrome base + one rationed accent) projected from the same tokens; annotate the rendered SVG. See [d2.md](./d2.md). |
| **Generated-content trust** (`.ui-generated`, `.ui-origin-label`, `.ui-reasoning`, `.ui-tool-log`) | `css/generated.css` | The report (or a section of it) is AI/system-authored and should _say so_ — an origin label plus quiet, collapsible reasoning / tool-call logs. Pairs with the sources layer. See [generated.md](./generated.md). |
| **Lifecycle / system state** (`.ui-state`, `.ui-syncbar`) | `css/state.css` | A status report needs to show the state a thing is in — saving / queued / stale / conflict / reviewed — as a labelled object, not a bare coloured dot. See [state.md](./state.md). |

These compose with the report-native primitives already called out in
[Composition rules](#composition-rules): `ui-statgrid`, `ui-alert`, `ui-table`,
`ui-timeline`, `ui-meter`, and `ui-num`. None of them require behavior JS, so
they are all safe in the static, PDF-first report path.

## Canonical skeleton

```html
<main class="ui-report ui-report--numbered">
  <header class="ui-report__cover">
    <p class="ui-eyebrow">Quarterly review</p>
    <h1 class="ui-report__title">Personal systems report</h1>
    <p class="ui-report__subtitle">A static report generated from trusted data.</p>
    <ul class="ui-report__meta">
      <li><time datetime="2026-06-01">2026-06-01</time></li>
      <li>Static HTML</li>
      <li>Chromium PDF-ready</li>
    </ul>
  </header>

  <nav class="ui-report__toc" aria-label="Report contents">
    <p class="ui-eyebrow ui-eyebrow--muted">Contents</p>
    <ol>
      <li><a href="#summary">Executive summary</a></li>
      <li><a href="#findings">Findings</a></li>
    </ol>
  </nav>

  <section id="summary" class="ui-report__section">
    <h2 class="ui-report__section-head">Executive summary</h2>
    <div class="ui-report__summary">
      <p>The summary block is for the decision-level conclusion.</p>
    </div>
    <div class="ui-statgrid">
      <div class="ui-stat">
        <span class="ui-stat__label">Open risks</span>
        <span class="ui-stat__value">3</span>
        <span class="ui-stat__delta is-neg">+1 this week</span>
      </div>
    </div>
  </section>

  <section id="findings" class="ui-report__section">
    <h2 class="ui-report__section-head">Findings</h2>
    <article class="ui-report__finding" aria-labelledby="finding-1">
      <p class="ui-eyebrow" id="finding-1">Finding 1 — short title</p>
      <div class="ui-prose">
        <p>Use prose only for narrative body content.</p>
      </div>
    </article>
  </section>
</main>
```

## Composition rules

- Use `ui-report` as the page-level wrapper. Add `ui-report--numbered` when
  section headings should auto-number. Add `ui-report--compact` to tighten the
  whole report's vertical rhythm (gap + page padding) for dense briefs — this
  is the document-level density toggle, distinct from `ui-report__cover--compact`
  below, which only shrinks the cover.
- Use `ui-report__cover` for title, subtitle, author/date, and generation
  metadata. Add `ui-report__cover--compact` for short screen-first reports.
  Use `ui-report__head` for a compact in-page header instead of a full cover
  (same role, no tall hero block). Author `ui-report__meta` as a `<ul>` — the
  facts it lists are unordered.
- Use `ui-report__section` and `ui-report__section-head` for report chapters.
  Keep one `h1` for the report title; use ordered `h2`/`h3` headings after it.
- Add `ui-report__section--unnumbered` to appendices, sources, or footnotes
  when the report uses `ui-report--numbered` but the section should not count as
  a numbered chapter.
- Use `ui-prose` only around narrative HTML you do not fully control, such as
  Markdown output. Do not wrap structured app/report UI in `ui-prose`.
- Use existing primitives for shared meanings: `ui-statgrid` for KPIs,
  `ui-alert` for persistent notices, `ui-table` for structured evidence,
  `ui-timeline` for events, `ui-meter` for measured values, and `ui-num` for
  non-table numeric values.
- Give `ui-report__finding` blocks an accessible name so the visual grouping is
  also programmatic: point `aria-labelledby` at the block's `ui-eyebrow` label
  (give it an `id`), or lead with a real heading. Do the same for a
  multi-part `ui-report__evidence` block; a single evidence table is already
  named by its own `<caption>`.
- Name the `ui-report__sources` and `ui-report__footnotes` blocks
  (`aria-labelledby` on their `ui-eyebrow`), and link footnotes both ways:
  an in-text `<sup><a id="fnref1" href="#fn1">1</a></sup>` to an
  `<ol><li id="fn1">… <a href="#fnref1">↩</a></li></ol>`. They are real
  regions, not decoration.
- Every `<table>` that carries report data should have a `<caption>`, header
  cells, and `.is-num` on numeric columns. (`.is-num`, `.is-pos`, `.is-neg`
  and `.is-key` only take effect inside `.ui-table` cells and `.ui-stat`
  deltas — they are not free-standing utilities.) Keep raw Markdown tables
  inside `ui-prose`; use `.ui-table` for curated evidence tables. If a
  `ui-report__evidence` block contains only a `ui-table-wrap`, the report layer
  removes the inner frame so evidence tables do not look double-boxed.
- Every `<figure>` should include a `figcaption` using `ui-report__caption`.
- Do not use raw color values. Theme with `--accent`; use status tones for
  status; use chart tokens only in chart figures.

## Numbers and dates

The framework **aligns** figures; it does not **format** them. `.is-num` (table
cells) and `ui-num` (standalone) give tabular figures and end-alignment so a
column lines up — but a raw `1240` or `2026-6-1` still reads as machine output.
Format the values yourself, before they reach the markup:

- **Numbers** — group thousands and fix the precision. In JS,
  `new Intl.NumberFormat('en-US').format(1240)` → `1,240`;
  `{ style: 'currency', currency: 'USD' }` → `$1,240.00`;
  `{ style: 'percent', maximumFractionDigits: 1 }` for rates;
  `{ notation: 'compact' }` → `1.2M` for headline KPIs. Pick one locale and
  precision per report and apply it consistently.
- **Dates** — render a human label but keep the machine value in a
  `<time datetime="…">` (ISO-8601), as the report skeleton and `ui-timeline`
  already do. `new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' })`
  → `Jun 1, 2026`.
- **Signs and units** — write the sign and unit into the text (`+1`, `−3.2%`,
  `18 h`); never rely on a tone or arrow alone to say "down" (WCAG 1.4.1).
- Keep a column's precision uniform so the tabular alignment actually reads.

A non-JS host formats with its own locale library (Python `babel`, Go
`golang.org/x/text/message`, etc.) and emits the finished strings — bronto only
styles them.

## Trend deltas

For a standalone change indicator (a KPI's movement, a row's quarter-over-quarter
shift), use `ui-delta`. A direction modifier sets both the arrow glyph — the
non-colour channel — and the conventional tone:

```html
<span class="ui-delta ui-delta--up">+12.4%</span>
<span class="ui-delta ui-delta--down">−3</span>
<span class="ui-delta ui-delta--flat">0</span>
```

Direction tone follows the common case (up = good, green; down = bad, red). When
**up is the bad direction** — latency, error rate, cost, churn — add
`ui-delta--invert` to swap only the tone; the arrow still reports real direction:

```html
<span class="ui-delta ui-delta--up ui-delta--invert">+48 ms p95</span>
```

The arrow is visual; always include the number and unit in the text.

A stat card's own `ui-stat__delta is-pos` / `is-neg` carries **tone** (good vs
bad, as colour) and auto-prepends a `▲`/`▼` glyph — but that glyph follows the
**tone**, not the real direction: `is-pos` always renders `▲` and `is-neg`
always `▼`, regardless of whether the number went up or down. The tone is
deliberately decoupled from direction (a *dropped* latency is good, so `is-pos`),
so the auto-arrow can contradict the words: write `is-pos` on a "−48 ms" and it
prints `▲ −48 ms`. Do **not** add your own direction word/arrow on top, or you
double it. When the change must read by direction — most printed reports —
prefer `ui-delta` for the card's delta line, because its `--up`/`--down` arrow is
a real (author-controlled) non-colour channel; reach for the arrow-free `ui-num`
if you want neither tone nor glyph:

```html
<span class="ui-stat__label">p95 latency</span>
<span class="ui-stat__value">172 ms</span>
<span class="ui-delta ui-delta--down ui-delta--invert">−48 ms</span>
```

Here the arrow points **down** (latency fell) while `--invert` keeps the tone
green (down is good) — both channels stay honest. Reach for `ui-stat__delta` only
when a bare tonal accent is enough.

## Comparison layout

For an "A vs B" or before/after section, use `ui-compare` — a fluid grid that
wraps to a single stack on a narrow screen, so two panels never overflow.
`ui-compare__col` is one side; label it with `ui-compare__head`. Add
`ui-compare--2up` to pin exactly two equal columns for a hard pairing.

```html
<div class="ui-compare ui-compare--2up">
  <div class="ui-compare__col">
    <p class="ui-compare__head">Before</p>
    <div class="ui-statgrid">
      <div class="ui-stat">
        <span class="ui-stat__label">p95 latency</span>
        <span class="ui-stat__value">220 ms</span>
      </div>
    </div>
  </div>
  <div class="ui-compare__col">
    <p class="ui-compare__head">After</p>
    <div class="ui-statgrid">
      <div class="ui-stat">
        <span class="ui-stat__label">p95 latency</span>
        <span class="ui-stat__value">172 ms</span>
        <span class="ui-stat__delta is-pos">−48 ms</span>
      </div>
    </div>
  </div>
</div>
```

## Chart figure recipe

bronto ships **no chart component** — a chart needs scales and data binding, the
two things the analytical layer [refuses to own](./architecture.md). It supplies
the figure frame, the data key, and the colour palette; the chart itself comes
from one of two routes:

- **Live, interactive, or many-series** — theme [Vega-Lite](./vega.md):
  `brontoVegaConfig(theme)` (from `@ponchia/ui/vega`) returns an on-brand
  Vega-Lite `config` you spread into a spec and hand to vega-embed. Vega renders
  the SVG/canvas; bronto only paints it. See [vega.md](./vega.md) for the full
  recipe and the resolved `@ponchia/ui/vega.json` for non-JS hosts.
- **Frozen, print, or zero-JS** — hand-author a token-themed inline `<svg>`,
  painting marks from the `--chart-N` palette so the figure prints exactly and
  carries no runtime.

Whichever route, the figure frame is the same: wrap it in `ui-report__figure`,
caption it with `ui-report__caption`, give it the standalone, portable
`.ui-legend` data key (`@ponchia/ui/css/legend.css` — see
[legends.md](./legends.md)), and pair every colour with a direct label, a
pattern, **and** a fallback `ui-table` so the figure survives mono print and
colour-vision deficiency.

A Vega-Lite figure. The live mount is **`ui-screen-only`** and the fallback
`ui-table` carries the data into print — a live chart bakes the on-screen theme
into its SVG/canvas at render time, so printing it would emit a dark-baked chart
on white paper. Print the table; keep the chart for screen:

```html
<figure class="ui-report__figure" role="group" aria-labelledby="chart-title">
  <figcaption id="chart-title" class="ui-report__caption">
    Fig 1 - Weekly focus split
  </figcaption>
  <div id="focus-chart" class="ui-screen-only" style="min-block-size: 240px">
    <noscript>Chart needs JavaScript — the data is in the table below.</noscript>
  </div>
  <div class="ui-table-wrap">
    <table class="ui-table ui-table--dense">
      <caption>Chart source data</caption>
      <thead>
        <tr><th>Series</th><th class="is-num">Hours</th></tr>
      </thead>
      <tbody>
        <tr><td>Research</td><td class="is-num">18</td></tr>
        <tr><td>Delivery</td><td class="is-num">11</td></tr>
      </tbody>
    </table>
  </div>
</figure>
<script type="module">
  import vegaEmbed from 'vega-embed';
  import { brontoVegaConfig } from '@ponchia/ui/vega';
  const theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  vegaEmbed('#focus-chart', {
    data: { values: [
      { series: 'Research', hours: 18 },
      { series: 'Delivery', hours: 11 },
    ] },
    mark: 'bar',
    encoding: {
      x: { field: 'series', type: 'nominal' },
      y: { field: 'hours', type: 'quantitative' },
    },
  }, { config: brontoVegaConfig(theme), renderer: 'svg', actions: false });
</script>
```

Give the mount a `min-block-size` so the figure is not a collapsed blank band
before the chart paints (or while JS is blocked), and pass **`renderer: 'svg'`**
(vega-embed defaults to `canvas`, which doesn't theme-inspect and prints as a
raster).

> The bare-specifier `import`s above assume a **build step** (or an import map),
> and even then `import`/`fetch` of the config only works over an `http(s)`
> origin. A static report **opened from disk (`file://`) cannot import the module
> nor fetch `vega.json`** (CORS) — load Vega + Vega-Lite + vega-embed from pinned
> `/build/*.min.js` CDN tags and **inline the resolved `config` object**
> (generate it with `npm run emit:theme vega light`), the file://-safe recipe in
> [vega.md](./vega.md#from-a-cdn-no-bundler). For a report
> you intend to **print/PDF**, prefer the frozen inline `<svg>` below — it has no
> runtime, prints exactly, and sidesteps all of this.

A frozen, token-themed inline `<svg>` for the same data — no runtime, prints
exactly, with a `.ui-legend` key and the fallback table:

```html
<figure class="ui-report__figure ui-print-exact" role="group" aria-labelledby="chart-title">
  <figcaption id="chart-title" class="ui-report__caption">
    Fig 1 - Weekly focus split
  </figcaption>
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
      <span
        class="ui-legend__swatch"
        style="--chart-color: var(--chart-2); --chart-pattern: var(--chart-pattern-2)"
        aria-hidden="true"
      ></span>
      <span class="ui-legend__label">Delivery</span>
    </li>
  </ul>
  <svg viewBox="0 0 360 160" role="img" aria-labelledby="focus-svg-title">
    <title id="focus-svg-title">Weekly focus split</title>
    <line x1="36" y1="132" x2="324" y2="132" stroke="var(--line)" />
    <rect x="72" y="42" width="96" height="90" fill="var(--chart-1)" />
    <rect x="200" y="77" width="96" height="55" fill="var(--chart-2)" />
  </svg>
  <div class="ui-table-wrap">
    <table class="ui-table ui-table--dense">
      <caption>Chart source data</caption>
      <thead>
        <tr><th>Series</th><th class="is-num">Hours</th></tr>
      </thead>
      <tbody>
        <tr><td>Research</td><td class="is-num">18</td></tr>
        <tr><td>Delivery</td><td class="is-num">11</td></tr>
      </tbody>
    </table>
  </div>
</figure>
```

For a frozen figure, drive the SVG fills from the `--chart-N` palette tokens
directly; for a Vega chart, the same colours arrive through
`brontoVegaConfig`'s `range.*` ramps, projected from `@ponchia/ui/charts.json`.

For a **sequential** figure (a heatmap, a choropleth, a magnitude ramp) fill the
cells from the single-hue ramp tokens `--chart-seq-1` … `--chart-seq-6`
(low → high); for a **diverging** figure (−…0…+) use `--chart-div-1` …
`--chart-div-7` (the middle band is the neutral midpoint). Both ramps live in
`css/dataviz.css`, and their resolved per-theme hexes are in
`@ponchia/ui/charts.json` (`sequential` / `diverging`) for a non-JS or `file://`
host that needs literal values. The same ramps back Vega's
`range.heatmap`/`ramp`/`diverging`, so a frozen sequential figure and a live Vega
heatmap read identically — but note the ramp **runs pale→deep in light theme and
deep→pale in dark** (it flips to stay legible against the background), so don't
print a colour key that assumes one direction, and don't bake a fixed ink colour
onto the cells. Pair the figure with a stepped legend and the fallback table.

## Annotation recipe

When a report chart needs an explicit callout, import
`@ponchia/ui/css/annotations.css` and layer SVG annotations inside the same
`ui-report__figure`. Keep the subject/connector/note text visible in the SVG or
represented by the figure caption/fallback data.

```html
<svg viewBox="0 0 360 160" role="img" aria-labelledby="annotated-title annotated-desc">
  <title id="annotated-title">Weekly focus chart with peak callout</title>
  <desc id="annotated-desc">The annotation marks the research peak.</desc>
  <g class="ui-annotation ui-annotation--circle ui-annotation--accent" transform="translate(210, 58)">
    <path class="ui-annotation__subject" d="M0,-18A18,18 0 1 1 0,18A18,18 0 1 1 0,-18Z" />
    <path class="ui-annotation__connector" d="M15.556,-7.424L84,-40" />
    <g class="ui-annotation__note" transform="translate(84, -40)">
      <path class="ui-annotation__note-line" d="M0,0H92" />
      <text class="ui-annotation__title" y="-8">Peak</text>
      <text class="ui-annotation__label" y="12">18 research hours</text>
    </g>
  </g>
</svg>
```

For generated SVG, use `@ponchia/ui/annotations` to compute connector and
subject path strings. Full annotation recipes and the complete variant list are
in `docs/annotations.md`; the shipped `demo/annotations.html` page is the
visual specimen.

## Timeline recipe

Incident reviews and research logs should use the existing timeline primitive
with its required item and time parts. Do not emit a bare list and expect it to
style itself.

```html
<ol class="ui-timeline">
  <li class="ui-timeline__item">
    <time class="ui-timeline__time" datetime="2026-06-01T09:12:00">09:12</time>
    <span>Latency alert fired for p95 over threshold.</span>
  </li>
  <li class="ui-timeline__item" aria-current="step">
    <time class="ui-timeline__time" datetime="2026-06-01T09:54:00">09:54</time>
    <span>Latency returned to baseline.</span>
  </li>
</ol>
```

## Meters and quotes

Two more report-native primitives. A **meter** shows a measured value as a
proportion — set the percentage on the `--value` custom property of
`ui-meter__fill` (a number 0–100, see `classes.json` `customProperties`); a tone
modifier picks the fill colour, and the readable label is yours to write beside
it (never rely on the bar alone — WCAG 1.4.1):

```html
<div class="ui-meter ui-meter--accent">
  <span class="ui-meter__fill" style="--value: 72"></span>
</div>
<span class="ui-num">72% of quota</span>
```

`--value` is a percentage and the fill **clamps at 100**, so an over-target
reading (e.g. 112 % of plan) shows a full bar — put the true figure in the
written label beside it (`ui-num`), which is the data of record anyway.

For a block of meters — SLO burn, error budgets, capacity — lay each out as
**label | bar | value** with `ui-meter__row`; `ui-meter__label` names it and
`ui-meter__value` carries the reading (the data of record — never the bar
alone). The row collapses to a stack on a narrow screen, so you don't hand-roll
the grid:

```html
<div class="ui-meter__row">
  <span class="ui-meter__label">Write availability</span>
  <div class="ui-meter ui-meter--danger" role="presentation">
    <span class="ui-meter__fill" style="--value: 90"></span>
  </div>
  <span class="ui-meter__value ui-num">90% of budget burned</span>
</div>
```

A **pull-quote** lifts a source sentence out of the prose — `ui-quote` is the
block, `ui-quote__cite` attributes it:

```html
<blockquote class="ui-quote">
  <p>The migration paid for itself within the first billing cycle.</p>
  <cite class="ui-quote__cite">Q2 finance review</cite>
</blockquote>
```

## Theming a live report

The report layer is static, but a screen report often offers a light/dark
**toggle**. The chart palette is the one piece that does not re-skin from CSS
alone: Vega and Mermaid/D2 bake resolved colours into their SVG at render time
(they can't read `var()`), so on a theme flip you must **re-render** the foreign
figures. Set the theme on the root and re-embed:

```html
<button type="button" class="ui-button ui-button--ghost ui-button--sm" id="theme-toggle">
  Toggle theme
</button>
<script type="module">
  import { brontoVegaConfig } from '@ponchia/ui/vega'; // http(s) origin only
  const root = document.documentElement;
  let view; // the previous Vega view, so we can tear it down before re-embedding
  const renderChart = async () => {
    const theme = root.dataset.theme === 'dark' ? 'dark' : 'light';
    const host = document.querySelector('#focus-chart');
    view?.finalize(); // 1. finalize the old view first — frees its listeners/RAF (see below)
    host.replaceChildren(); // 2. clear the host — re-embedding into a non-empty node stacks SVGs
    const res = await vegaEmbed(host, spec, {
      config: brontoVegaConfig(theme),
      renderer: 'svg',
      actions: false,
    });
    view = res.view;
  };
  document.querySelector('#theme-toggle').addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    renderChart(); // 2. re-render on every flip — the baked SVG does not follow CSS
  });
  renderChart();
</script>
```

Four foot-guns, each verified while dogfooding:

- **Finalize the previous view before re-embedding.** `vegaEmbed` resolves to
  `{ view }`; a Vega view registers event listeners and an animation frame loop
  that `replaceChildren()` does **not** unwind. Call `view.finalize()` on the
  prior view before each re-render (as above), or a report that toggles theme
  repeatedly leaks a view per toggle.
- **Clear the host before re-embedding.** vega-embed appends; embedding twice
  into the same node stacks a second chart under the first. `replaceChildren()`
  (or `host.innerHTML = ''`) first.
- **Avoid `width: 'container'` if the chart can be re-rendered while hidden.** A
  container-sized Vega chart measures its parent at embed time; if that parent is
  `display: none` (a collapsed section, an inactive tab) it measures `0` and
  renders empty. Give the spec an explicit `width`, or re-embed when the section
  becomes visible.
- **Mermaid: don't `innerHTML = svg` over the source.** `mermaid.render()`
  returns the SVG string — write it to a *separate* mount, not back into the
  `<pre class="mermaid">` that still holds the diagram source, or a re-theme has
  nothing to re-render from. Keep the source and the rendered output in different
  nodes.

For a report you will only ever **print/PDF**, skip all of this: render once in
the target theme, or use the frozen inline `<svg>` route, which has no runtime.

## Common templates

- Executive brief: compact cover, one summary block, KPI `ui-statgrid`, short
  findings, and sources.
- Research brief: compact header, decision frame, evidence table, quotes or
  prose excerpts, and sources.
- Incident review: compact cover, summary, `ui-timeline`, corrective-action
  evidence table, and footnotes.
- Project status: compact header, KPI `ui-statgrid`, chart figure with fallback
  data, print-only notes, and unnumbered appendix.

## Print and PDF

The supported export target is modern Chromium print/PDF. A bronto report is
static and zero-JS, so producing the PDF is just _load → print_ — you do not
need a full automatable browser, only a Chromium-class layout+print pass.

- **By hand:** open the report in Chrome/Edge → Print (Cmd/Ctrl+P) → "Save as
  PDF". In **More settings**, enable **Background graphics** (the dialog's
  equivalent of `printBackground` — without it chart fills and swatches drop
  out), and pick the paper size there. Paper size is a browser print setting,
  not a token; the layer only themes the page _margin_ via
  `--report-page-margin`.
- **Headless, lightweight:** use **`chrome-headless-shell`** — the minimal
  headless-Chromium binary built for exactly this, a fraction of a full
  browser's weight. Drive it through Playwright/Puppeteer (or raw CDP) and
  always pass `printBackground: true`, or chart fills and legend swatches drop
  out:

  ```js
  import { chromium } from 'playwright'; // or puppeteer
  const browser = await chromium.launch({ channel: 'chromium-headless-shell' });
  const page = await browser.newPage();
  await page.goto('file:///abs/path/report.html', { waitUntil: 'networkidle' });
  await page.pdf({ path: 'report.pdf', format: 'A4', printBackground: true });
  await browser.close();
  ```

  Install the binary with `npx playwright install chromium-headless-shell`
  (Puppeteer ships its own). The repo's `scripts/render-pdf.mjs` is a working
  copy of this (`npm run report:pdf -- report.html`); it is a dev/example
  helper, not part of the published API — bronto does not own rendering.
- **As a service / from another language:** run Chromium-as-a-service
  (e.g. **Gotenberg**'s `POST /forms/chromium/convert/html`, or a hosted CDP
  endpoint) and POST the HTML + the `dist/css/*` assets. A Python/Go/any host
  then needs no local browser. This is the natural fit for reports generated
  by an LLM or service in another system.

The report prints ink-on-white regardless of the on-screen theme. The chart
fills and swatches carry `print-color-adjust: exact`, but the engine still
needs background printing enabled (`printBackground: true` headless, or
"Background graphics" by hand). The bare `chrome --headless --print-to-pdf`
CLI flag does **not** print backgrounds — use the scripted CDP/`page.pdf()`
path above for any report with charts.

A browserless engine (WeasyPrint, Prince, …) can work for text-and-table
reports if you feed it the **unlayered** CSS (`@ponchia/ui/css/unlayered/*` —
no `@layer`) and resolve colours from `tokens/resolved.json`; but `:has()` and
modern paged-media are not universally supported, so charts and edge cases may
degrade. For faithful output, stay on a Chromium-class engine. Older
HTML-to-PDF engines are not part of the browser floor and may not support
cascade layers, `oklch()`, `color-mix()`, `:has()`, or modern paged-media.

- Use `ui-print-only` for content that should appear only in print.
- Use `ui-screen-only` for navigation or helper content that should not print.
- Use `ui-break-before` and `ui-break-after` for deliberate page boundaries.
- Use `ui-keep` on short figures, findings, and summary blocks that should not
  split across pages.
- Use `ui-print-exact` on charts whose fills and patterns must survive PDF
  export.
- External links inside `ui-prose` print their URL automatically through the
  base print stylesheet.

**Not provided** (use the browser's paged-media features, or author the markup
yourself): running headers/footers with "Page X of Y", automatic table-of-contents
pagination, multi-column layout, and automatic citation/footnote numbering. The
report layer is a document grammar, not a paged-media or citation engine — do not
fake page numbers with inert markup.

## LLM checklist

Before returning a report, an LLM should verify:

- All `ui-*` classes exist in `@ponchia/ui/classes` (or `classes/classes.json`).
  The `is-*` state hooks (`is-num`/`is-pos`/`is-neg`/`is-key` in `.ui-table`
  cells and `.ui-stat` deltas, `is-open`/`is-active`) are valid but live
  outside `cls` by design — keep them.
- The document has one `h1`, ordered headings, and a single main report region.
- Tables have captions and header cells.
- Charts have captions, direct labels or legends, and fallback data.
- No raw chromatic colors appear in inline styles.
- No remote scripts, styles, iframes, or images are required for the report.
- Generated/untrusted body HTML was sanitized before insertion.
