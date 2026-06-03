# Frontier primitives

This is the strategic memory for Bronto's design-system differentiation. The
goal is not to out-catalog Radix, Carbon, Atlassian, Fluent, Spectrum, or
shadcn. Those systems already cover the standard component center: buttons,
forms, dialogs, tabs, menus, cards, tables, tooltips, badges, navigation,
loaders, and date inputs.

Bronto should instead own the interface layer that makes complex work legible:
explanation, provenance, relationships, command access, workbench ergonomics,
generated reports, and durable system state. In short: interfaces that explain
themselves.

## Boundary

The pattern that worked for annotations should stay the rule:

- Bronto owns visual grammar, class vocabulary, token use, accessibility
  guidance, pure geometry helpers, and small idempotent behavior kernels.
- The host owns domain state, data mapping, chart scales, tour step order,
  command execution, persistence, AI/tool orchestration, and announcements that
  need product-specific wording.
- New surfaces stay opt-in. They should not enter `dist/bronto.css` by default
  unless they are clearly universal chrome.
- Prefer CSS and markup first. Add JS only when the browser cannot express the
  behavior without measuring, filtering, keyboard state, or pointer tracking.

This keeps Bronto useful across Astro, SvelteKit, React, Solid, Qwik, plain
HTML, and generated static reports without becoming a framework component kit.

## Already aligned in 0.5.0

The analytical/generated-report suite is already the first concrete expression
of this strategy:

- `annotations`: subject / connector / note grammar for SVG figures.
- `legends`: data keys that prevent chart meaning drifting from palette tokens.
- `marks`: semantic prose evidence and passage brackets.
- `connectors`: DOMRect leader lines between related UI regions.
- `spotlight`: the visual language of guided focus without a tour engine.
- `crosshair`: pointer/ruler/readout surface without chart-domain mapping.
- `selection`: shared selected/excluded/candidate states without hit-testing.
- `sources`: citation / source-card / source-list / provenance with a
  trust-state grammar (candidate #1 below — now shipped in 0.5.0).

These are intentionally not a chart framework. They are communication
primitives.

## 2026 scout batch — report & evidence grammar

A multi-source scout pass (2026-06-03) surfaced the next concrete batch. All
four are novel, Baseline-clean on the 2026 floor, and squarely on the
"explains itself" north star — the report / review / evidence lane. They ship
as opt-in surfaces (never default `dist/bronto.css`), CSS-and-markup first,
each with the same host-owns-state boundary that kept the chart renderer out in
0.6.0. `ui-diff` is the first build; the rest are queued behind it.

### `ui-diff` — line/row change grammar  🚧 in flight

A CSS-grid gutter grammar (`ui-diff`, `__row --add/--remove/--context`,
`__hunk`, `--unified/--split`). The host supplies pre-classified rows; Bronto
only paints — redundant `::before` +/- sign glyphs (never colour-only), tone
tints, and optional subgrid alignment that degrades to plain grid. Composes
with the shipped `ui-compare--2up`. Boundary: all tokenizing, row alignment,
and hunk computation stay in the host — the moment Bronto parses or aligns rows
it crosses the line that deleted the bar renderer in 0.6.0. Diff is the most
explanation-dense surface Bronto does not yet own.

### `ui-code` — fenced-code evidence chrome

A static code surface that paints already-tokenized markup (head bar,
line-number gutter via CSS counters, `.is-add` / `.is-del` / `.is-hl` line
states) and **never parses**. The host — or Shiki, via the shipped
`shiki/nothing.json` token-colour theme — supplies the token spans; Bronto owns
chrome only. Code-as-evidence for changelogs, version history, and generated
reports; pairs with the `.ui-src` provenance pill and marks. Degrades to a
plain scrollable `<pre>`.

### `ui-spark` — inline datawords

Word-sized inline microcharts (line / bar / tristate / win-loss) for
trend-in-a-sentence inside reports and dense tables — the inline-series gap the
scalar `ui-delta` / `ui-num` / `ui-stat` leave open, and one block-level Vega
will not fill. The host normalises each point to `0..1` (`--v`); Bronto paints
geometry via inline SVG + custom properties + `currentColor`. No JS,
SSR-static, print-survivable. Boundary: Bronto refuses raw values and
min/max/scale computation, and every spark carries a host-supplied text / aria
equivalent (a bare sparkline is opaque to AT).

### `ui-sidenote` / `ui-marginnote` — marginal explanation

Numbered margin sidenotes plus unnumbered marginnotes with CSS-counter
numbering and zero-JS responsive collapse (the Tufte `:checked` pattern);
degrades to an inline aside on narrow viewports and a footnote under
`@media print`. The channel for evidence, caveats, and provenance asides that
do not belong in the main column. Scope it as typographic margin notes,
reconciled with the existing `report.css` `__footnotes` numbering — not a
second backref engine.

## Next strong candidates

### 1. Source, citation, and provenance UI — ✅ shipped in 0.5.0

Shipped as `@ponchia/ui/css/sources.css` (`ui-citation`/`ui-source-card`/
`ui-source-list`/`ui-provenance` + the cross-cutting `ui-src--*` trust states),
matching the surface below. The optional `initSources()` behavior is still
deferred until a consumer needs backref focus / preview toggles.

Why it matters: AI output, generated reports, audit views, docs, and operational
tools all need to answer "where did this come from?" Normal UI kits have tags
and footnotes, but not a trust grammar. The shipped surface and its trust-state
vocabulary are documented with the component — only the optional `initSources()`
disclosure behavior is still open.

### 2. Lifecycle and system-state UI — 🟡 `ui-state` family shipped in 0.5.0

Shipped as `@ponchia/ui/css/state.css` (`ui-state` + the canonical state matrix
+ `ui-syncbar`), matching the "good first build" below. `ui-job` (background
progress) and `ui-conflict` (resolution affordances) remain deferred until a
consumer needs them; `ui-review-state` is covered by the reviewed/needs-review
state modifiers.

Why it matters: serious apps spend a lot of time in states like saving, saved,
queued, offline, stale, retrying, conflicted, locked, reviewed, and background
job running. These states are usually improvised per product, so even good apps
feel inconsistent. Still deferred: `ui-job` (background progress) and
`ui-conflict` (resolution affordances), each until a consumer needs it.

### 3. Command-first UI — ✅ shipped in 0.5.0

The keyboard-hint primitive (`.ui-shortcut` + `.ui-shortcut__sep` over `.ui-kbd`,
core chrome) landed first, then the `ui-command` palette: the
`@ponchia/ui/css/command.css` shell + the `initCommand` `data-bronto-command`
behavior (filter, roving focus, `bronto:command:select`/`close`) + `useCommand`
bindings. The host still owns the action registry and execution — Bronto only
filters and navigates.

Why it matters: command palettes turn a product from a page collection into a
tool. Existing libraries such as cmdk and kbar are good, but Bronto can own the
design-system contract: shortcuts, actions, groups, disabled reasons, context,
and command result feedback. The host still owns the action registry and
execution; global Cmd/Ctrl+K stays opt-in by design.

### 4. Workbench UI — 🟡 inspector / property / selectionbar shipped in 0.5.0

Shipped as `@ponchia/ui/css/workbench.css` (`ui-inspector`, `ui-property`,
`ui-selectionbar`) — the low-risk CSS core below. Resizable split panes
(`ui-splitter`, an ARIA window-splitter behavior) and drag handles remain
deferred until a consumer needs them.

Why it matters: real tools need inspectors, object action bars, split panes,
resize handles, property rows, dense trees, and selected-object affordances.
Generic UI kits tend to stop at cards/tables/forms, leaving every app to build
its own half-consistent workbench. Still open: a `ui-splitter` ARIA
window-splitter behavior (focusable separator, `aria-valuemin/max/now`,
arrow-key resize) and drag/drop affordances — both deferred, and Bronto should
style drag handles, not become a drag-and-drop framework.

### 5. Generated-content and AI trust primitives — 🟡 shipped in 0.5.0

Shipped as `@ponchia/ui/css/generated.css` (`ui-generated`, `ui-origin-label`,
`ui-reasoning`, `ui-tool-log` / `ui-tool-call`) — the origin/provenance labels,
generated-content wrapper, and tool-call log of the "good first build" below.
Chat-thread components and a `ui-confidence` widget are intentionally not shipped.

Why it matters: AI interfaces are becoming common, but most UI systems either
ship chat bubbles or nothing. Bronto should not become a chat framework. It
should own the trust surfaces around generated content. The host still owns model
metadata, tool execution, traces, redaction, and safety; chat-thread components
and a `ui-confidence` widget are intentionally not shipped (never fabricate a
precision signal the product does not have).

## Priority

The CSS cores of candidates 1–5 shipped in 0.5.0. The active work, in order:

1. The 2026 scout batch — `ui-diff` (in flight), then `ui-code`, `ui-spark`,
   and `ui-sidenote` / `ui-marginnote`.
2. `initSources()` backref-focus / preview disclosure (candidate 1).
3. `ui-job` / `ui-conflict` lifecycle surfaces (candidate 2).
4. The `ui-splitter` ARIA window-splitter behavior + drag affordances (candidate 4).

Deferred items stay gated on a real consumer needing them. This order keeps
Bronto differentiated while staying inside its core philosophy: small,
framework-agnostic primitives that make complex interfaces clearer.

## Inspiration watchlist

These are examples of the kind of older or under-supported work worth mining for
ideas. They are not dependency recommendations; the useful part is the shape of
the primitive, not the implementation stack.

| Project | Useful idea | Bronto-shaped lesson |
| --- | --- | --- |
| Susie Lu `d3-annotation` | Subject / connector / note grammar for explaining SVG figures. | Keep annotation as a grammar, not a chart engine or editor. |
| Susie Lu `d3-legend` | Colour, size, and symbol legends as reusable figure keys. | Legends belong in the design system because they explain visual encodings. |
| Twitter `labella.js` | One-dimensional label collision avoidance for timelines and dense axes. | A tiny `declutterLabels` helper can be more valuable than another component. |
| `D3-Labeler` / `d3fc-label-layout` | Greedy/simulated-annealing label placement. | Direct labels need layout helpers; host still owns chart scales and data. |
| `d3-lasso` | Possible / not-possible / selected / not-selected states while drawing a region. | Bronto should own selection vocabulary and maybe region visuals, not hit-testing. |
| `leader-line` / `react-xarrows` | Lines and arrows between DOM elements. | DOMRect connectors are broadly useful, but should be styleable and token-bound. |
| LinkedIn `hopscotch` / `chardin.js` | Guided tours as target + note + step metadata. | Bronto should own spotlight visuals, not the tour state machine. |
| `Waypoints` / `gumshoe` | Scroll-triggered section awareness and scrollspy navigation. | Long documents and reports may need section-progress/navigation affordances. |
| `mark.js`, `Rangy`, `TextHighlighter` | Search hits, user text selections, persistent text highlights. | Evidence/source marks need careful semantics around ranges and generated content. |
| `Mousetrap` / `Keypress` | Keyboard shortcut grammar and key sequences. | Command-first UI needs shortcut display and action dispatch boundaries. |
| `Split.js` | Small, unopinionated resizable split views. | Workbench panes are worth styling; behavior must follow accessible splitter rules. |
| jQuery Steps / old wizard plugins | Multi-step flows with progress, validation, and branching. | If Bronto adds stepper/wizard UI, it should be state vocabulary first. |
| `progressbar.js` | Lightweight progress shapes and determinate/indeterminate motion. | Lifecycle/job UI should make long-running work persistent and legible. |
| `react-json-view` / old JSON viewers | Inspectable structured data with collapse/copy/path affordances. | Generated/tool output needs compact inspector primitives without a React lock-in. |
| old diff viewers / `jsdifflib` | Side-by-side and inline change explanation. | Becoming `ui-diff` (2026 batch): Bronto paints the row/gutter grammar, the host pre-classifies rows — parsing and alignment stay outside Bronto. |
