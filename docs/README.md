# Documentation

The full docs set for `@ponchia/ui`. The curated subset listed in
`package.json` `files` also ships inside the npm tarball, so an offline agent or
consumer gets it under `node_modules/@ponchia/ui/docs/`. A rendered site is
published from [`index.html`](https://ponchia.github.io/bronto-ui/).

> New to the repo? Start with **[architecture.md → Repository layout](./architecture.md#repository-layout)**
> for what each top-level directory is and which files are generated.

## Contract & governance

- [architecture.md](./architecture.md) — the layered architecture, the repository layout, drift control, and release gating.
- [stability.md](./stability.md) — what is contractual (and what is a convenience preset) across versions.
- [package-contract.md](./package-contract.md) — the generated package manifest matrix: every export, shipped path, and artifact provenance row. _(generated — do not hand-edit)_
- [usage.md](./usage.md) — the decision guide: which primitive to reach for when.
- [reference.md](./reference.md) — the generated catalog of every `.ui-*` class and token. _(generated — do not hand-edit)_
- [release.md](./release.md) — the release runbook.
- [frontier-primitives.md](./frontier-primitives.md) — the design line for new analytical/communication primitives.

## Theming & color

- [theming.md](./theming.md) — the one-knob `--accent` model and a full re-skin recipe.
- [contrast.md](./contrast.md) — the CI-gated WCAG contrast matrix (+ APCA advisory).

## App/service primitives

- [state.md](./state.md) — lifecycle / system-state vocabulary and sync bar.
- [generated.md](./generated.md) — trust surfaces for AI / system-generated content.
- [command.md](./command.md) — the command-palette shell + behavior.
- [workbench.md](./workbench.md) — tool-UI core (inspector, property rows, selection bar).

## Reports & analytical primitives

- [reporting.md](./reporting.md) — the static, PDF-first report grammar **and the analytical toolbox available to a report**.
- [figure.md](./figure.md) — reusable chart/diagram/media figure stage with overlay, key, and fallback-data slots.
- [annotations.md](./annotations.md) — SVG annotations (subject / connector / note), off-chart use, and the geometry helpers.
- [legends.md](./legends.md) — standalone data keys / legends.
- [mermaid.md](./mermaid.md) — theme Mermaid diagrams from bronto tokens, and annotate the rendered SVG.
- [d2.md](./d2.md) — theme D2 diagrams from bronto tokens (theme-override slots), and annotate the rendered SVG.
- [vega.md](./vega.md) — theme Vega-Lite charts from bronto tokens (resolved `config`) — the recommended path when a report needs a chart, since bronto ships no chart component.
- [marks.md](./marks.md) — text/evidence emphasis for running prose (`ui-mark`, `ui-bracket-note`).
- [dots.md](./dots.md) — the dot-matrix surface family: backgrounds, loaders, readouts, and data-bound dot primitives.
- [glyphs.md](./glyphs.md) — the display glyph API built on the dot-matrix primitive.
- [sources.md](./sources.md) — the citations / provenance trust layer.
- [interval.md](./interval.md) — host-normalised low/high uncertainty spans for estimates and evidence windows.
- [clamp.md](./clamp.md) — bounded excerpts with optional CSS-only show-more / show-less reveal.
- [highlights.md](./highlights.md) — CSS Custom Highlight API paint for evidence, search, and current ranges.
- [diff.md](./diff.md) — line/row change-review grammar (`ui-diff`, add/remove/context rows).
- [code.md](./code.md) — fenced-code evidence chrome (`ui-code`, line numbers + add/del/hl states; never parses).
- [spark.md](./spark.md) — inline datawords / word-sized microcharts (`ui-spark`, host-normalised `--v`).
- [sidenote.md](./sidenote.md) — Tufte margin notes (`ui-sidenote` numbered, `ui-marginnote` plain).
- [textref.md](./textref.md) — deep-link a citation to the exact cited sentence (`ui-textref` + `::target-text` paint).
- [bullet.md](./bullet.md) — Stephen-Few bullet graph: measure vs target vs grayscale bands (`ui-bullet`, host-normalised `--v`/`--t`).
- [term.md](./term.md) — inline glossary term + definition popover and end-of-report `<dl>` (`ui-term`/`ui-def`/`ui-glossary`).
- [toc.md](./toc.md) — sticky scrollspy table-of-contents rail (`ui-toc`, `aria-current` active section).
- [tree.md](./tree.md) — hierarchy outline on nested `<details>` (`ui-tree` branches/leaves; disclosure group, not an ARIA tree).
- [connectors.md](./connectors.md) — leader lines between DOM elements.
- [spotlight.md](./spotlight.md) — guided-focus overlay.
- [crosshair.md](./crosshair.md) — plot ruler + pinned readout.
- [selection.md](./selection.md) — cross-cutting selection-emphasis vocabulary.

## Getting started (frameworks)

- [getting-started/vanilla.md](./getting-started/vanilla.md) · [getting-started/react-solid.md](./getting-started/react-solid.md) · [getting-started/astro.md](./getting-started/astro.md) · [getting-started/sveltekit.md](./getting-started/sveltekit.md) · [getting-started/vue.md](./getting-started/vue.md)
- [integration.md](./integration.md) — framework integration overview.
- [interop/tailwind.md](./interop/tailwind.md) — Tailwind interop recipe.

## Architecture Decision Records

- [adr/0001-color-system.md](./adr/0001-color-system.md) — the five-tier color constitution.
- [adr/0002-scope-and-2026-baseline.md](./adr/0002-scope-and-2026-baseline.md) — scope, the 2026 browser floor, and CSS-native motion.
- [adr/0003-theme-model.md](./adr/0003-theme-model.md) — the binary base × one-knob × orthogonal-axes theme model.

## Migrations

- [migrations/0.2-to-0.3.md](./migrations/0.2-to-0.3.md) · [migrations/0.3-to-0.4.md](./migrations/0.3-to-0.4.md) · [migrations/0.4-to-0.5.md](./migrations/0.4-to-0.5.md) · [migrations/0.5-to-0.6.md](./migrations/0.5-to-0.6.md)
