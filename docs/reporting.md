# Static reports

`@ponchia/ui` can dress static, LLM-authored HTML reports without a component
runtime. Load the normal bundle, then either opt in to the complete report kit
or import only the leaves a narrow report actually uses.

In a bundled app, package specifiers are fine because Vite or another bundler
rewrites them:

```css
@import '@ponchia/ui';
@import '@ponchia/ui/css/report-kit.css';
```

For tighter payload control, import leaves one by one:

```css
@import '@ponchia/ui';
@import '@ponchia/ui/css/report.css';
@import '@ponchia/ui/css/dataviz.css';
@import '@ponchia/ui/css/annotations.css';
@import '@ponchia/ui/css/legend.css';
```

**`dist/bronto.css` is the standard component set only — it does NOT contain
the report, chart, annotation, source, trust, or code/diff layers.**
`report-kit.css` is the one-file opt-in path for complete static reports; the
individual leaves remain available under `dist/css/` when a report uses only a
small subset. Forgetting the opt-in CSS is the most common way an LLM-emitted
report renders unstyled.

For standalone browser HTML, use real stylesheet URLs. Package specifiers like
`@ponchia/ui/css/report.css` do not resolve in a saved `.html` file — and note
the path is `dist/css/`, the built leaf, not the source `css/`:

```html
<!-- installed locally -->
<link rel="stylesheet" href="./node_modules/@ponchia/ui/dist/bronto.css" />
<link rel="stylesheet" href="./node_modules/@ponchia/ui/dist/css/report-kit.css" />
```

Or, if you are intentionally keeping a report minimal, link only the leaves it
uses:

```html
<link rel="stylesheet" href="./node_modules/@ponchia/ui/dist/bronto.css" />
<link rel="stylesheet" href="./node_modules/@ponchia/ui/dist/css/report.css" />
<link rel="stylesheet" href="./node_modules/@ponchia/ui/dist/css/dataviz.css" />
<link rel="stylesheet" href="./node_modules/@ponchia/ui/dist/css/annotations.css" />
<link rel="stylesheet" href="./node_modules/@ponchia/ui/dist/css/legend.css" />
```

No install? Link the same files from a CDN. Pin the version — pre-1.0, breaking
changes ship in the minor (see [stability.md](./stability.md)):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ponchia/ui@0.6.8/dist/bronto.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ponchia/ui@0.6.8/dist/css/report-kit.css" />
```

Leaf-by-leaf CDN imports use the same `dist/css/` paths:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ponchia/ui@0.6.8/dist/bronto.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ponchia/ui@0.6.8/dist/css/report.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ponchia/ui@0.6.8/dist/css/dataviz.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ponchia/ui@0.6.8/dist/css/annotations.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ponchia/ui@0.6.8/dist/css/legend.css" />
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
the default bundle — add the leaves a given report actually needs.
`@ponchia/ui/css/analytical.css` is a convenience roll-up of the **nine
figure/evidence-layer leaves only** (figure, annotations, legends, marks,
connectors, spotlight, crosshair, selection, highlights) — sources, generated,
state, interval, clamp, workbench, command, and the prose/evidence leaves below
are NOT in it and must be linked individually. Reach for:

| Layer | Import | Reach for it when… |
| --- | --- | --- |
| **Figure stage** (`.ui-figure*`) | `css/figure.css` | A chart, diagram, screenshot, or annotated SVG needs a stable media box, overlay slot, right-side key, and fallback-data slot. It composes with `ui-report__figure`; it does not render charts or own scales. See [figure.md](./figure.md). |
| **Marks** (`.ui-mark`, `.ui-bracket-note`) | `css/marks.css` | You want to emphasise a phrase _in prose_ — a highlight on the finding, an underline on a risk, or a bracket around an evidence/caveat passage. The inline counterpart to annotations. See [marks.md](./marks.md). |
| **Sources / provenance** (`.ui-citation`, `.ui-source-card`, `.ui-source-list`, `.ui-provenance`) | `css/sources.css` | The report makes claims a reader will question — "where did this come from?". A CSS-only trust layer whose cross-cutting state modifier (`.ui-src--verified`, plus reviewed / generated / unverified / stale / conflict) sets a rationed tone, always paired with a written label, never colour alone. See [sources.md](./sources.md). |
| **Interval** (`.ui-interval*`) | `css/interval.css` | Evidence is a low/high estimate, confidence window, target band, or uncertain reading. The host normalises `--lo`, `--hi`, and optional `--v`; Bronto only paints the range and point. See [interval.md](./interval.md). |
| **Clamp** (`.ui-clamp*`) | `css/clamp.css` | A source excerpt, claim basis, or caveat should scan as a bounded text block but remain reachable through explicit "Show more" / "Show less" labels and print expansion. See [clamp.md](./clamp.md). |
| **Highlights** (`.ui-highlights`) | `css/highlights.css` | The host registers CSS Custom Highlight API ranges for cited evidence, search hits, or the current match without wrapping DOM text nodes. See [highlights.md](./highlights.md). |
| **Chart palette** (`--chart-*`) | `css/dataviz.css` | A figure needs categorical, sequential, or diverging chart colours. The palette is opt-in, CVD-gated, and never UI chrome. See [theming.md](./theming.md#data-viz-palette). |
| **Annotations** (`.ui-annotation*`) | `css/annotations.css` | A figure needs an explicit callout — a peak, a limit, a watched region — or a small decorative margin mark. SVG only. See [annotations.md](./annotations.md) and the [off-chart + scaling notes](./annotations.md#using-annotations-off-chart) before you size one. |
| **Connectors** (`.ui-connector*`) | `css/connectors.css` | A note, card, or region needs a leader line to another DOM element. Bronto supplies overlay styling plus pure SVG path geometry; the host owns layout and meaning. See [connectors.md](./connectors.md). |
| **Legends / data keys** (`.ui-legend*`) | `css/legend.css` | A chart figure needs a colour key. WCAG 1.4.1 by construction. See [legends.md](./legends.md). |
| **Spotlight** (`.ui-spotlight*`, `.ui-tour-note*`) | `css/spotlight.css` | A screen report or guided workflow needs a visual focus cutout and callout note. It is not a tour engine; the host owns step order, persistence, and focus movement. See [spotlight.md](./spotlight.md). |
| **Crosshair / readout** (`.ui-crosshair*`, `.ui-readout`) | `css/crosshair.css` | A plot needs pointer-tracking ruler lines and a readout chip. Bronto reports pixels/fractions; the host maps those to data values with its own scales. See [crosshair.md](./crosshair.md). |
| **Selection emphasis** (`.ui-sel*`) | `css/selection.css` | Host-owned brush, filter, or selection logic needs a shared visual state vocabulary for selected / excluded / candidate items. See [selection.md](./selection.md). |
| **Mermaid theme** (`@ponchia/ui/mermaid`) | _(JS/JSON, no CSS)_ | The report embeds a [Mermaid](https://mermaid.js.org) diagram (flowchart, sequence, pie…) and you want it on-brand instead of generic. A resolved `base` theme projected from the same tokens as `charts.json`; annotate the rendered SVG with the annotation layer. See [mermaid.md](./mermaid.md). |
| **D2 theme** (`@ponchia/ui/d2`) | _(JS/JSON, no CSS)_ | The report embeds a [D2](https://d2lang.com) diagram and you want it on-brand. Resolved theme-override slots (monochrome base + one rationed accent) projected from the same tokens; annotate the rendered SVG. See [d2.md](./d2.md). |
| **Vega theme** (`@ponchia/ui/vega`) | _(JS/JSON, no CSS)_ | The report embeds a live or generated Vega-Lite chart and you want token-matched axes, text, legends, and ramps. See [vega.md](./vega.md). |
| **Generated-content trust** (`.ui-generated`, `.ui-origin-label`, `.ui-reasoning`, `.ui-tool-log`) | `css/generated.css` | The report (or a section of it) is AI/system-authored and should _say so_ — an origin label plus quiet, collapsible reasoning / tool-call logs. Pairs with the sources layer. See [generated.md](./generated.md). |
| **Lifecycle / system state** (`.ui-state`, `.ui-syncbar`) | `css/state.css` | A status report needs to show the state a thing is in — saving / queued / stale / conflict / reviewed — as a labelled object, not a bare coloured dot. See [state.md](./state.md). |
| **Workbench surfaces** (`.ui-inspector`, `.ui-property`, `.ui-selectionbar`, `.ui-splitter`) | `css/workbench.css` | A screen report or analytical tool needs an inspector, property rows, selected-item actions, or resizable panes. Not in `report-kit.css`; pair splitters with `initSplitter`. See [workbench.md](./workbench.md). |
| **Command palette** (`.ui-command*`) | `css/command.css` | A screen report or analytical tool needs a searchable command shell. Not in `report-kit.css`; pair with `initCommand` and a host-owned opener/action registry. See [command.md](./command.md). |
| **Spark** (`.ui-spark*`) | `css/spark.css` | A trend belongs _inside a sentence or table cell_ — a word-sized inline microchart, the inline counterpart to `ui-delta`/`ui-num`/`ui-stat`. See [spark.md](./spark.md). |
| **Bullet graph** (`.ui-bullet*`) | `css/bullet.css` | A measure needs "inside budget? vs target?" at a glance — the canonical SLO / error-budget figure that `ui-meter` structurally cannot express. See [bullet.md](./bullet.md). |
| **Diff** (`.ui-diff*`) | `css/diff.css` | The report shows what _changed_ — code review, changelogs, version history, config diffs. Marks call out a sentence; diff calls out a line. See [diff.md](./diff.md). |
| **Code** (`.ui-code*`) | `css/code.css` | Code-as-evidence: fenced snippets with an optional gutter and add/remove/highlight line states, sharing diff's change vocabulary. On-brand syntax colours via the [Shiki theme](./code.md). See [code.md](./code.md). |
| **Sidenotes** (`.ui-sidenote`, `.ui-marginnote`) | `css/sidenote.css` | Evidence, caveats, and provenance asides that belong _beside_ the prose, Tufte-style, instead of interrupting it. See [sidenote.md](./sidenote.md). |
| **Textref** (`.ui-textref`) | `css/textref.css` | A citation should deep-link to the _exact quoted sentence_ (URL text fragments, on-brand `::target-text` paint) — the inline counterpart to the source-card layer. See [textref.md](./textref.md). |
| **Term / glossary** (`.ui-term`, `.ui-glossary`) | `css/term.css` | Jargon should explain itself inline (native popover definition) and gather into an end-of-report glossary. See [term.md](./term.md). |
| **Contents rail** (`.ui-toc*`) | `css/toc.css` | A long report needs a sticky table of contents with the in-view section highlighted; degrades to a plain anchored list with zero JS. Distinct from the in-flow `ui-report__toc` block. See [toc.md](./toc.md). |
| **Tree** (`.ui-tree*`) | `css/tree.css` | Nested structure — file trees, object graphs, nested provenance — as a depth-indented outline on native `<details>`. See [tree.md](./tree.md). |
| **Dot surfaces** (`.ui-waffle`, `.ui-activity`, `.ui-level`, `.ui-dotgauge`, `.ui-readout`, …) | _(in the core bundle)_ | A count, rate, level, or gauge wants the library's signature dot-matrix expression — waffle units, activity strips, dot gauges, readouts. See [dots.md](./dots.md). |

These compose with the report-native primitives already called out in
[Composition rules](#composition-rules): `ui-statgrid`, `ui-alert`, `ui-table`,
`ui-timeline`, `ui-meter`, and `ui-num`. The static leaves do not require
behavior JS, so they are safe in the PDF-first report path. `workbench.css` and
`command.css` are deliberately screen-tool leaves: they stay out of
`report-kit.css` and only become interactive when the host imports the matching
behavior JS.

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
    <aside class="ui-report__decision" aria-labelledby="decision-title">
      <p class="ui-report__decision-kicker">Decision</p>
      <h3 class="ui-report__decision-title" id="decision-title">Ship the low-risk path</h3>
      <p class="ui-report__decision-body">
        State the operator-facing call first, then list the evidence below it.
      </p>
      <dl class="ui-report__decision-grid">
        <div class="ui-report__decision-item">
          <dt class="ui-report__decision-label">Basis</dt>
          <dd class="ui-report__decision-value">Two verified sources support the call.</dd>
        </div>
        <div class="ui-report__decision-item">
          <dt class="ui-report__decision-label">Next action</dt>
          <dd class="ui-report__decision-value">Owner rechecks the remaining caveat by Jun 8.</dd>
        </div>
      </dl>
      <p class="ui-report__decision-meta">Evidence state: supported · Checked: 2026-06-01</p>
    </aside>
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

## Report-specific primitives

Use these report-layer primitives before inventing custom card layouts. They are
generic, static, and PDF-safe; the host still owns the content, scoring, source
fetching, and claim wording.

- `ui-report__decision` is the above-the-fold call. Pair it with
  `ui-report__decision-kicker`, `ui-report__decision-title`,
  `ui-report__decision-body`, optional `ui-report__decision-grid` /
  `ui-report__decision-item` detail rows, and optional
  `ui-report__decision-meta`. It should answer "what should the reader do or
  believe now?" before the deep evidence. Good rows are basis, impact, next
  action, owner, recheck date, and evidence state.
- `ui-report__finding` is the repeated finding block. Add
  `ui-report__finding--critical`, `--major`, `--minor`, or `--resolved` only
  when the written finding label also states the severity/status. The colour
  band is a scanning aid, not the data of record. For dense reports, use
  `ui-report__finding-title`, `ui-report__finding-claim`,
  `ui-report__finding-impact`, `ui-report__finding-remediation`,
  `ui-report__finding-evidence`, and `ui-report__finding-caveat` so impact,
  evidence, caveat, and remediation do not collapse into one paragraph.
- `ui-claim` is the smallest claim/evidence contract. Use
  `ui-claim--supported`, `--partial`, `--disputed`, `--unsupported`, or
  `--unknown` only when the written `ui-claim__status` says the same thing.
  Use `ui-claim__statement`, `__scope`, `__basis`, `__limits`, `__refs`, and
  `__caveat` to show what the report asserts, where it applies, what supports
  it, what would limit or change it, and which sources/evidence entries it maps
  to.
- `ui-evidence-grid` and `ui-evidence-item` are for compact evidence packets:
  one source, check, observation, counterexample, or assumption per item. Use
  `ui-evidence-item__title`, `__meta`, and `__body` for simple cards; add
  `__kind`, `__method`, `__window`, `__value`, `__source`, and `__caveat` when
  the evidence needs to say how it was gathered. Link to source cards or a table
  when the evidence is more than a sentence.
- `ui-evidence-ledger` is a wrapper for a claim/evidence/source matrix. Put a
  normal `ui-table` inside it with columns such as claim, evidence, source,
  trust, freshness, relation, and caveat.
- `ui-report__actions`, `ui-report__action`, and
  `ui-report__action-status` are for follow-up rows in status, incident, and
  audit reports. Add `ui-report__action-title`, `__action-owner`,
  `__action-due`, `__action-priority`, `__action-criteria`, and
  `__action-source` when the action is a real workflow item. The status text
  must be written out; do not rely on tone alone. The status occupies the side
  rail on wide screens; the other action fields stay in the main text column.

Decision brief pattern:

```html
<aside class="ui-report__decision" aria-labelledby="decision-title">
  <p class="ui-report__decision-kicker">Decision</p>
  <h3 class="ui-report__decision-title" id="decision-title">Adopt the safer option</h3>
  <p class="ui-report__decision-body">
    The current evidence supports the lower-risk path while the disputed source is rechecked.
  </p>
  <dl class="ui-report__decision-grid">
    <div class="ui-report__decision-item">
      <dt class="ui-report__decision-label">Basis</dt>
      <dd class="ui-report__decision-value">Verified metrics support the call; one source is stale.</dd>
    </div>
    <div class="ui-report__decision-item">
      <dt class="ui-report__decision-label">Recheck</dt>
      <dd class="ui-report__decision-value"><time datetime="2026-06-08">2026-06-08</time></dd>
    </div>
  </dl>
  <p class="ui-report__decision-meta">Evidence state: partial · Sources: 4 · Checked: 2026-06-01</p>
</aside>
```

Finding + evidence pattern:

```html
<article class="ui-report__finding ui-report__finding--major" aria-labelledby="finding-cache">
  <p class="ui-eyebrow" id="finding-cache">Major finding — cache pressure is rising</p>
  <p class="ui-report__finding-claim">
    Claim: cache pressure is rising during the refresh window.
  </p>
  <p class="ui-report__finding-impact">Impact: p95 latency is likely to breach target if volume rises.</p>
  <p class="ui-report__finding-remediation">Remediation: lower the refresh batch size before the next rollout.</p>
  <p class="ui-report__finding-caveat">
    Caveat: the conclusion assumes comparable traffic shape in the next window.
  </p>
</article>
<div class="ui-evidence-grid" aria-label="Evidence summary">
  <article class="ui-evidence-item">
    <h3 class="ui-evidence-item__title">Metric trend</h3>
    <p class="ui-evidence-item__kind">Observation</p>
    <p class="ui-evidence-item__meta">Prometheus · 24 h window</p>
    <p class="ui-evidence-item__body">p95 latency rose 18% while request volume stayed flat.</p>
  </article>
  <article class="ui-evidence-item">
    <h3 class="ui-evidence-item__title">Log sample</h3>
    <p class="ui-evidence-item__meta">Application logs · reviewed</p>
    <p class="ui-evidence-item__body">Timeouts cluster around cache refresh intervals.</p>
  </article>
</div>
```

Claim block pattern:

```html
<article class="ui-claim ui-claim--partial" id="claim-latency">
  <p class="ui-claim__statement">The migration improved latency without reducing availability.</p>
  <p class="ui-claim__status">Evidence state: partial</p>
  <p class="ui-claim__scope">Scope: last 7 days, production traffic only</p>
  <p class="ui-claim__basis">Basis: metrics export S1 and incident note S2 support the claim.</p>
  <p class="ui-claim__limits">Limit: retry volume still needs a separate review.</p>
  <p class="ui-claim__refs">Sources: <a class="ui-citation" href="#source-metrics">S1</a></p>
</article>
```

Evidence ledger pattern:

```html
<div class="ui-evidence-ledger">
  <div class="ui-table-wrap">
    <table class="ui-table ui-table--dense">
      <caption>Claim, evidence, and caveat ledger</caption>
      <thead>
        <tr>
          <th>Claim</th>
          <th>Evidence</th>
          <th>Source</th>
          <th>Trust</th>
          <th>Relation</th>
          <th>Caveat</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><a href="#claim-latency">Latency improved</a></td>
          <td>p95 fell 48 ms</td>
          <td><a class="ui-citation" href="#source-metrics">S1</a></td>
          <td>Verified</td>
          <td>Supports</td>
          <td>Last 7 days only</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
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
- Put a `ui-report__decision` near the start of decision reports, audits, and
  incident reviews. If the report is intentionally exploratory and has no
  decision yet, say so in the summary instead of leaving the reader to infer it.
- Use severity modifiers on `ui-report__finding` only for scanability. The
  label should still include the severity/status in text, for example
  "Major finding — …" or "Resolved finding — …".
- In alerts, put the readable message in `<p class="ui-alert__body">…</p>`
  and use `ui-alert__title` only for a separate title line. `ui-alert` is a
  grid with a leading status dot; raw text or loose inline children such as
  `<strong>` / `<code>` become separate grid items and can fragment in print.
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
  removes the inner frame so evidence tables do not look double-boxed. Report
  tables preserve words by default so identifiers and headings do not split into
  unreadable fragments in PDF. Add `ui-table--break-anywhere` only for
  machine-token tables where fixed, shrink-to-fit columns and forced wrapping
  matter more than preserving words.
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

Whichever route, the figure frame is the same: wrap it in
`ui-report__figure ui-figure`, caption it with
`ui-report__caption ui-figure__caption`, put the rendered chart in
`ui-figure__stage`, give it the standalone, portable `.ui-legend` data key
(`@ponchia/ui/css/legend.css` — see [legends.md](./legends.md)), and pair every
colour with a direct label, a pattern, **and** a fallback `ui-table` in
`ui-figure__data` so the figure survives mono print and colour-vision
deficiency.

A Vega-Lite figure. The live mount is **`ui-screen-only`** and the fallback
`ui-table` carries the data into print — a live chart bakes the on-screen theme
into its SVG/canvas at render time, so printing it would emit a dark-baked chart
on white paper. Print the table; keep the chart for screen:

```html
<figure class="ui-report__figure ui-figure" role="group" aria-labelledby="chart-title">
  <figcaption id="chart-title" class="ui-report__caption ui-figure__caption">
    Fig 1 - Weekly focus split
  </figcaption>
  <div class="ui-figure__stage ui-screen-only" style="--figure-min-block: 240px">
    <div id="focus-chart" class="ui-figure__media">
      <noscript>Chart needs JavaScript — the data is in the table below.</noscript>
    </div>
  </div>
  <div class="ui-figure__data ui-table-wrap">
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
<figure class="ui-report__figure ui-figure ui-print-exact" role="group" aria-labelledby="chart-title">
  <figcaption id="chart-title" class="ui-report__caption ui-figure__caption">
    Fig 1 - Weekly focus split
  </figcaption>
  <div class="ui-figure__body ui-figure__body--key-right">
    <div class="ui-figure__stage">
      <svg class="ui-figure__media" viewBox="0 0 360 160" role="img" aria-labelledby="focus-svg-title focus-svg-desc">
        <title id="focus-svg-title">Weekly focus split</title>
        <desc id="focus-svg-desc">Research is 18 hours and delivery is 11 hours.</desc>
        <line x1="36" y1="132" x2="324" y2="132" stroke="var(--line)" />
        <rect x="72" y="42" width="96" height="90" fill="var(--chart-1)" />
        <rect x="200" y="77" width="96" height="55" fill="var(--chart-2)" />
      </svg>
    </div>
    <div class="ui-figure__key">
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
    </div>
  </div>
  <div class="ui-figure__data ui-table-wrap">
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

- Executive brief: compact cover, above-fold reader outcome, KPI
  `ui-statgrid`, short findings, evidence-state disclosure, and sources.
- Decision report: decision frame, options considered, chosen option, rationale,
  tradeoffs, revisit trigger, next actions, evidence ledger, and sources.
- Research brief: compact header, scope/method block, claim cards, evidence
  table, quotes or prose excerpts, limitations, and sources.
- Incident review: compact cover, impact summary, `ui-timeline`, root-cause
  claim, corrective-action register, evidence ledger, and footnotes.
- Audit: summary, finding cards with severity in text, evidence/caveat rows,
  remediation owner/due dates, accepted risk, and sources.
- Project status: compact header, KPI `ui-statgrid`, current state, blocked
  decisions, action register, chart figure with fallback data, print-only notes,
  and unnumbered appendix.

Minimum blocks by report type:

| Type | Required shape |
| --- | --- |
| Executive | Summary, above-fold outcome, evidence-state disclosure, source cards. |
| Decision | Decision frame, options/tradeoffs, claim cards, evidence ledger, next actions, sources. |
| Research | Scope/method, explicit claims, evidence table, limitations, sources. |
| Primer | Scope, teaching sequence, key claims, examples, caveats, sources. |
| Incident | Impact, root-cause claim, timeline, evidence ledger, corrective actions, footnotes. |
| Audit | Severity-labelled findings, evidence/caveat rows, remediation owners/dates, accepted risk, sources. |
| Status | Current state, risks/blockers, decision requests, action register, recheck timing, sources. |

## Semantic contract

The report layer is not a fact checker, but it should make a report's reasoning
auditable. A useful report separates:

- **Reader outcome** — what the reader should do or believe now.
- **Claim** — the actual assertion, with scope and evidence state.
- **Evidence** — observation, metric, log, quote, sample, method, assumption,
  counterevidence, or limitation.
- **Source** — where the evidence came from, with trust/freshness written in
  text.
- **Action** — who does what next, by when, and how completion is checked.

Use inline citations and stable IDs to connect those layers:

```html
<article class="ui-claim ui-claim--supported" id="claim-1" data-source-ids="source-metrics">
  <p class="ui-claim__statement">Availability remained above target.</p>
  <p class="ui-claim__status">Evidence state: supported</p>
  <p class="ui-claim__refs">Source: <a class="ui-citation" href="#source-metrics">S1</a></p>
</article>

<article class="ui-source-card ui-src--verified" id="source-metrics">
  <h3 class="ui-source-card__title">Metrics export</h3>
  <p class="ui-source-card__origin">Verified operational export</p>
</article>
```

If a claim is generated, inferred, stale, disputed, or uncited, say so near the
claim, not only in the source appendix. Do not use a numeric confidence widget
unless the number has a real model, sample, or scoring method behind it.

Generator-side tools should keep a machine-readable claim/source sidecar beside
important reports. The HTML stays the readable artifact; the sidecar lets a
checker prove that claim IDs, source IDs, trust states, retrieval dates and
high-risk decisions still line up after editing.

The declarative contract ships as
`@ponchia/ui/schemas/report-claims.v1.schema.json` for validators in any
language. It is a schema only — `@ponchia/ui` does not ship a report generator
or validation runtime.

```json
{
  "$schema": "https://cdn.jsdelivr.net/npm/@ponchia/ui@0.6.8/schemas/report-claims.v1.schema.json",
  "schemaVersion": "bronto-report-claims.v1",
  "report": { "title": "Decision readiness", "type": "decision" },
  "claims": [
    {
      "id": "claim-primary",
      "status": "supported",
      "risk": "medium",
      "statement": "The guarded option reduces operational risk.",
      "scope": "Current release window",
      "sourceIds": ["source-primary"]
    }
  ],
  "sources": [
    {
      "id": "source-primary",
      "state": "verified",
      "title": "Release metrics export",
      "origin": "Verified operational export",
      "retrievedAt": "2026-06-08T10:00:00Z",
      "supports": ["claim-primary"]
    }
  ],
  "relations": [
    {
      "claimId": "claim-primary",
      "sourceId": "source-primary",
      "kind": "supports",
      "note": "The metrics export supports the operational-risk conclusion."
    }
  ]
}
```

For source archives, keep the same source IDs and add any available immutable
handles: URL, artifact path, content hash, retrieval timestamp, collection
method and caveats. A report is more useful when the source appendix, inline
citations, evidence ledger and sidecar all name the same IDs.

## Print and PDF

The supported export target is modern Chromium print/PDF. A bronto report is
static and zero-JS, so producing the PDF is just _load → print_ — you do not
need a full automatable browser, only a Chromium-class layout+print pass.

Chromium's generated PDF is a visual/export artifact, not a tagged accessible
PDF. Keep the HTML report as the accessible artifact unless the host application
adds a separate tagged-PDF pipeline and verifies it with PDF accessibility
tooling.

- **By hand:** open the report in Chrome/Edge → Print (Cmd/Ctrl+P) → "Save as
  PDF". In **More settings**, enable **Background graphics** (the dialog's
  equivalent of `printBackground` — without it chart fills and swatches drop
  out), and pick the paper size there. Paper size and page margins are browser
  print settings; the report stylesheet uses a fixed 18mm `@page` margin because
  Chromium-class print engines do not reliably resolve custom properties inside
  `@page` rules.
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

  **If the report renders figures from `<script type="module">`, do not load
  it over `file://`** — browsers block relative module imports from `file://`
  (CORS, opaque `null` origin), so the figures silently render empty in the
  PDF. Serve the report over HTTP first; `render-pdf.mjs --serve` does this
  (loopback server + load over `http://127.0.0.1`), waits for the report's
  `data-report-ready` signal if it sets one, and logs page errors instead of
  swallowing them.
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
- The report type is clear: executive, decision, research, incident, audit,
  primer, or status. The above-fold block answers what the reader should do or
  believe now, unless the report explicitly says it is exploratory.
- Every decision, major finding, quantitative claim, and recommendation has a
  nearby citation, claim block, evidence packet, evidence ledger row, or an
  explicit assumption/uncited/generated label.
- Claim/source sidecars, when present, resolve every claim ID and source ID back
  to visible HTML. High-risk claims have at least one verified or reviewed
  source.
- Stale, conflicting, unverified, or generated inputs are surfaced near the
  affected claim or decision, not buried only in the source appendix.
- Actions that represent real follow-up include owner, due/recheck date, status,
  and success criteria, or explicitly say why those fields are unassigned.
- Tables have captions and header cells.
- Charts have captions, direct labels or legends, and fallback data.
- No raw chromatic colors appear in inline styles.
- No remote scripts, styles, iframes, or images are required for the report.
- Generated/untrusted body HTML was sanitized before insertion.
- Alert text is wrapped in `.ui-alert__body`; no loose text or inline-only
  elements are direct children of `.ui-alert`.
