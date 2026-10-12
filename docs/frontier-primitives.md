# Frontier primitives

Bronto's specialist surfaces help people understand complex work: what changed,
where a claim came from, how objects relate, and which action or state matters.
This guide explains the current boundary and where to find the shipped pieces.
For the complete HTML cookbook, start with [reporting.md](./reporting.md); for
application layouts, use [compositions.md](./compositions.md).

The project direction is **objects on a canvas that explain themselves**, with
reports and ordinary application shells as supported uses. The
[roadmap](https://github.com/Ponchia/bronto-ui/blob/main/ROADMAP.md) owns current
priorities. This document is a design guide, not a queue of promised components.

## Boundary

- **Bronto owns presentation and narrow interaction:** visual grammar, class
  vocabulary, tokens, accessibility guidance, pure geometry helpers, and small
  behavior initializers.
- **The host owns product meaning and state:** data mapping, chart scales,
  fetching, persistence, routing, selection, command execution, tour order,
  orchestration, and announcements requiring product-specific wording.
- **Specialized surfaces are opt-in.** Add their CSS beside the default bundle,
  or compose the leaves required by a narrower surface. Universal application
  chrome is the only candidate for the core stylesheet.
- **Start with markup and CSS.** Add a behavior when the interaction needs
  measurement, filtering, focus management, or pointer tracking. A framework
  component API is not required to use the same styles.

The result can be used in normal HTML, server-rendered templates, Astro,
SvelteKit, React, Vue, Solid, Qwik, and static reports. The maintained packed
examples cover a subset of those integrations; the
[README](../README.md#framework-integration) distinguishes executable examples
from lifecycle recipes.

## Shipped surfaces

These are available now. Load the named CSS leaf through a bundler, or use its
`dist/css/` URL in a standalone page. The [package contract](./package-contract.md)
is the authoritative path inventory.

| Task | Surface and guide | Host responsibility |
| --- | --- | --- |
| Explain a figure | [Figure](./figure.md), [annotations](./annotations.md), and [legends](./legends.md) | Render the chart or diagram, choose the data mapping, and provide accessible descriptions and fallback data. |
| Connect related elements | [Connectors](./connectors.md) | Identify endpoints and explain the relationship; the geometry helper computes a path. |
| Show provenance | [Sources](./sources.md) and [generated content](./generated.md) | Supply source records, claim relationships, authorship, trust decisions, and redaction. |
| Explain a change | [Diff](./diff.md) and [code evidence](./code.md) | Compute and classify changes, tokenize code, and supply lines and context. |
| Show compact quantitative evidence | [Spark](./spark.md), [bullet](./bullet.md), and [interval](./interval.md) | Normalize values, define units and thresholds, and provide a written equivalent. |
| Help readers navigate evidence | [Marks](./marks.md), [highlights](./highlights.md), [text references](./textref.md), [sidenotes](./sidenote.md), [terms](./term.md), and [contents rail](./toc.md) | Register ranges, build URLs, supply definitions and notes, and update active-section state. |
| Present lifecycle state | [State and jobs](./state.md) | Own polling, saving, retry, cancellation, and the source of truth for status. |
| Build a tool panel | [Workbench](./workbench.md), [command palette](./command.md), and [tree outline](./tree.md) | Own pane content, saved layout, selection, actions, hierarchy data, and product shortcuts. |
| Emphasize a selection or location | [Selection](./selection.md), [crosshair](./crosshair.md), and [spotlight](./spotlight.md) | Own hit-testing, data readouts, selected objects, and tour state. |
| Present discussion | [Discussion](./discussion.md) | Own posting, persistence, identity, resolution, anchors, and focus policy. |

The `@ponchia/ui/css/analytical.css` roll-up includes **figure, annotations,
legend, marks, connectors, spotlight, crosshair, selection, and highlights**.
It does not include all rows in the table. `sources`, `interval`, `clamp`,
`state`, `generated`, `workbench`, `command`, and `discussion` remain separate
imports. The report cookbook documents which additional leaves a report needs.

## Important distinctions

### Figure framing and chart rendering

A figure stage supplies a frame, overlay slots, key, caption, and fallback-data
area. Bronto's chart data supplies colors and patterns. Neither computes chart
scales, axes, domains, or data binding.

Use a renderer for those jobs. Bronto provides resolved theme data for
[Vega](./vega.md), [Mermaid](./mermaid.md), and [D2](./d2.md), and a
[runtime token resolver](./renderer.md) for other SVG, canvas, or WebGL consumers.
The renderer remains a consumer dependency. Keep a figure's text description and
fallback table understandable independently of its visual encoding.

### Annotation grammar and the annotation engine

`@ponchia/ui/annotations` contains small, dependency-free SVG geometry helpers
for the subject / connector / note grammar. Bronto UI also owns the matching
CSS classes and token styling.

The richer placement, collision handling, editing, and renderer integrations
live in the separate `@ponchia/annotations` package. Do not recreate that engine
here or add it as a runtime or public type dependency of Bronto UI. Use the
[annotation guide](./annotations.md) to choose the appropriate surface.

### Visual state and product state

A lifecycle class can represent "saving"; it cannot know when the save is
complete. A source card can identify an unverified claim; it cannot verify the
claim. Generated-content labels can disclose origin; they do not establish
accuracy or confidence. The application must supply truthful state and wording.

Likewise, a discussion surface styles messages and composers without providing
a messaging backend or chat runtime. A command palette filters and navigates
items, then emits an event; the host authorizes and executes the action.

### Native outlines and ARIA trees

The tree outline composes nested `<details>` elements. It is a disclosure group,
not an ARIA `tree` with roving focus and tree-specific keyboard behavior. A host
needing an interactive file explorer should choose its interaction owner first
and apply the shared visual vocabulary to that implementation.

### Progressive enhancement and essential content

Custom Highlight API paint, text-fragment targeting, anchor positioning, and
some motion effects depend on browser support. Preserve useful text, links,
controls, and print output when an enhancement is absent. A highlighted range
still needs a meaningful citation; a popover definition used by a report also
needs a printable glossary entry.

## Priority

Consolidate complete compositions before expanding the catalog. A useful review
starts with a real screen, document, or workspace object and asks:

1. Can the reader identify the important content, state, and available action?
2. Does the composition work with realistic text, narrow containers, keyboard
   and touch input, both themes, and relevant print output?
3. Can existing classes replace duplicated presentation or behavior code?
4. Is any remaining difficulty a missing reusable primitive, or product logic
   that belongs in the host?

A packed example proves package compatibility. A real consumer upgrade supplies
evidence of practical value. Record both when deciding whether a new public
surface is justified; class count and test count are not proxies for either.

Potential work such as conflict-resolution affordances, drag/drop presentation,
or richer outline navigation needs a concrete consumer and an explicit
ownership boundary. It is not a committed roadmap merely because related CSS
already exists. When existing primitives can express the result, add a recipe.

Use [adding a primitive](https://github.com/Ponchia/bronto-ui/blob/main/docs/adding-a-primitive.md)
for implementation steps and [stability](./stability.md) for compatibility rules.

## Design history

The analytical and provenance foundations shipped in the 0.5 line. Later
releases added report evidence, lifecycle, workbench, and discussion vocabulary,
then refined typography, tokens, and consumer integration. Earlier scout lists
are historical research; the [CHANGELOG](../CHANGELOG.md) records what actually
shipped. The current scope is defined by
[architecture](./architecture.md), [ADR-0004](./adr/0004-prune-unused-adapters.md),
and [ADR-0005](./adr/0005-productive-tools-and-editorial-reports.md).
