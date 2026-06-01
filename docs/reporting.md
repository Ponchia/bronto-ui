# Static reports

`@ponchia/ui` can dress static, LLM-authored HTML reports without a component
runtime. Load the normal bundle, then opt in to the report layer and the chart
palette only when the report needs them.

In a bundled app, package specifiers are fine because Vite or another bundler
rewrites them:

```css
@import '@ponchia/ui';
@import '@ponchia/ui/css/report.css';
@import '@ponchia/ui/css/dataviz.css';
```

For standalone browser HTML, use real stylesheet URLs. Package specifiers like
`@ponchia/ui/css/report.css` do not resolve in a saved `.html` file:

```html
<link rel="stylesheet" href="./node_modules/@ponchia/ui/dist/bronto.css" />
<link rel="stylesheet" href="./node_modules/@ponchia/ui/dist/css/report.css" />
<link rel="stylesheet" href="./node_modules/@ponchia/ui/dist/css/dataviz.css" />
```

If you copy the built CSS next to the report, keep the same relationship between
`dist/bronto.css`, `dist/css/report.css`, `dist/css/dataviz.css`, and `fonts/`
so font URLs continue to resolve.

The report layer is static and PDF-first. It does not initialize behaviors and
does not sanitize content. If a report includes arbitrary LLM, CMS, or user HTML,
sanitize that content before rendering it and do not initialize
`data-bronto-*` behaviors on the generated region.

## Canonical skeleton

```html
<main class="ui-report ui-report--numbered">
  <header class="ui-report__cover">
    <p class="ui-eyebrow">Quarterly review</p>
    <h1 class="ui-report__title">Personal systems report</h1>
    <p class="ui-report__subtitle">A static report generated from trusted data.</p>
    <ol class="ui-report__meta">
      <li><time datetime="2026-06-01">2026-06-01</time></li>
      <li>Static HTML</li>
      <li>Chromium PDF-ready</li>
    </ol>
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
    <article class="ui-report__finding">
      <p class="ui-eyebrow">Finding</p>
      <div class="ui-prose">
        <p>Use prose only for narrative body content.</p>
      </div>
    </article>
  </section>
</main>
```

## Composition rules

- Use `ui-report` as the page-level wrapper. Add `ui-report--numbered` when
  section headings should auto-number.
- Use `ui-report__cover` for title, subtitle, author/date, and generation
  metadata. Use `ui-report__header` for compact in-page headers.
- Use `ui-report__section` and `ui-report__section-head` for report chapters.
  Keep one `h1` for the report title; use ordered `h2`/`h3` headings after it.
- Use `ui-prose` only around narrative HTML you do not fully control, such as
  Markdown output. Do not wrap structured app/report UI in `ui-prose`.
- Use existing primitives for shared meanings: `ui-statgrid` for KPIs,
  `ui-alert` for persistent notices, `ui-table` for structured evidence,
  `ui-timeline` for events, `ui-meter` for measured values, and `ui-num` for
  non-table numeric values.
- Every `<table>` that carries report data should have a `<caption>`, header
  cells, and `.is-num` on numeric columns. Keep raw Markdown tables inside
  `ui-prose`; use `.ui-table` for curated evidence tables.
- Every `<figure>` should include a `figcaption` using
  `ui-report__caption` or `ui-chart__caption`.
- Do not use raw color values. Theme with `--accent`; use status tones for
  status; use chart tokens only in chart figures.

## Chart figure recipe

The report layer supplies chart containers and legends, not a chart engine. For
CSS/HTML/SVG charts, pair each chart color with a direct label, a pattern, or a
fallback table.

```html
<figure class="ui-report__figure ui-chart ui-print-exact" role="group" aria-labelledby="chart-title">
  <figcaption id="chart-title" class="ui-chart__caption">
    Fig 1 - Weekly focus split
  </figcaption>
  <ul class="ui-chart__legend" aria-label="Series">
    <li>
      <span
        class="ui-chart__swatch"
        style="--chart-color: var(--chart-1); --chart-pattern: var(--chart-pattern-1)"
        aria-hidden="true"
      ></span>
      Research
    </li>
    <li>
      <span
        class="ui-chart__swatch"
        style="--chart-color: var(--chart-2); --chart-pattern: var(--chart-pattern-2)"
        aria-hidden="true"
      ></span>
      Delivery
    </li>
  </ul>
  <div class="ui-chart__fallback">
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
  </div>
</figure>
```

For canvas or SVG libraries, import resolved series colors from
`@ponchia/ui/charts.json` and keep the same legend/caption/fallback structure in
the surrounding HTML.

## Print and PDF

The supported export target is modern Chromium print/PDF with
`printBackground: true`. Older HTML-to-PDF engines are not part of the browser
floor and may not support cascade layers, `oklch()`, `color-mix()`, `:has()`,
or modern paged-media behavior.

- Use `ui-print-only` for content that should appear only in print.
- Use `ui-screen-only` for navigation or helper content that should not print.
- Use `ui-break-before` and `ui-break-after` for deliberate page boundaries.
- Use `ui-keep` on short figures, findings, and summary blocks that should not
  split across pages.
- Use `ui-print-exact` on charts whose fills and patterns must survive PDF
  export.
- External links inside `ui-prose` print their URL automatically through the
  base print stylesheet.

## LLM checklist

Before returning a report, an LLM should verify:

- All `ui-*` classes exist in `@ponchia/ui/classes`.
- The document has one `h1`, ordered headings, and a single main report region.
- Tables have captions and header cells.
- Charts have captions, direct labels or legends, and fallback data.
- No raw chromatic colors appear in inline styles.
- No remote scripts, styles, iframes, or images are required for the report.
- Generated/untrusted body HTML was sanitized before insertion.
