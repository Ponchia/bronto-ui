# Concepts

`@ponchia/ui` is easier to use when you treat it as a CSS design system with a
small set of explicit escape hatches, not as a component library. This page is
the mental model before the how-to docs: what the package owns, what the host
application owns, and where the public contract lives.

For task-level guidance, use [usage](./usage.md). For the full architecture and
release gates, use [architecture](./architecture.md), [stability](./stability.md),
and the generated [package contract](./package-contract.md).

## CSS is the framework

The required layer is CSS. Consumers load the root stylesheet and write semantic
`.ui-*` classes in normal HTML, templates, or framework components. There is no
package-root component runtime and no required UI framework adapter.

The JavaScript surface is deliberately narrow and optional. `@ponchia/ui/classes`
builds class strings from the typed class registry. `@ponchia/ui/behaviors`
contains vanilla, dependency-free behavior initializers for the interactions CSS
cannot own by itself: theme persistence, dialogs, toasts, tabs, comboboxes,
menus, source backrefs, and similar delegated glue. Those modules are
side-effect-free on import, SSR-safe, idempotent, and return cleanup functions.
React, Solid, Qwik, Svelte, and Vue bindings are lifecycle adapters over the
same vanilla behaviors; they do not define markup or own component state.

Read more: [architecture](./architecture.md#decision),
[integration](./integration.md), and [stability](./stability.md).

## The cascade is cooperative

All authored framework CSS is wrapped in one cascade layer, `@layer bronto`.
That is the override model. Normal, un-layered application CSS wins over
framework rules through the ordinary cascade, so consumers should override with
plain selectors instead of escalating specificity or adding `!important`.

The default bundle and direct CSS leaf exports are layered by default. Raw
un-layered leaf exports exist under `@ponchia/ui/css/unlayered/*` as explicit
escape hatches for consumers that knowingly opt out of that ordering model.

The honest carve-outs are media boundaries. Print and reduced-motion safeguards
may use `!important` where the framework must freeze animation, reveal content,
or remove screen-only chrome despite component rules. That is not the normal
component styling path.

Read more: [architecture](./architecture.md#consequences-of-each-layer),
[Tailwind interop](./interop/tailwind.md), and
[package contract](./package-contract.md#contract-summary).

## Color is tiered

The default surface is neutral, with one rationed accent for action and emphasis.
That does not mean the system has no other colors. It means every color belongs
to a tier with a job:

- Neutral canvas: surfaces, lines, and text.
- Brand accent: one `--accent` and its derived family.
- Functional status: success, warning, danger, and info for state.
- Display expression: dot-matrix brightness, density, glow, pulse, and reveal
  timing.
- Data visualization: opt-in chart palettes and ramps, never UI chrome.

Status color is not a second brand accent. Chart color is not component color.
Display colorways re-point the one accent at the root; they do not add a second
interactive hue. Written labels, shape, structure, or pattern carry meaning
with the color so forced-colors, print, and assistive technology still have the
state.

Read more: [theming](./theming.md), [contrast](./contrast.md),
[dot surfaces](./dots.md), and
[ADR-0001: color system](./adr/0001-color-system.md).

## Primitives stop at the product boundary

Bronto primitives own visual grammar, class vocabulary, token use,
accessibility guidance, pure geometry, and small idempotent behavior kernels.
The host owns product data and product decisions: chart scales, data mapping,
fetching, persistence, routing, workflow execution, action registries,
selection state, hit-testing, and product-specific announcements.

That boundary is why analytical primitives are useful without becoming chart or
workflow engines. An annotation helper returns SVG paths; it does not place
callouts on a renderer's private DOM. A connector helper computes the line
between rectangles; it does not infer what the relationship means. Vega,
Mermaid, and D2 stay the renderers; Bronto supplies token-matched theme data and
composition guidance.

Read more: [frontier primitives](./frontier-primitives.md),
[reporting](./reporting.md#the-analytical-toolbox-in-a-report),
[annotations](./annotations.md), [connectors](./connectors.md), and
[Vega](./vega.md).

## The default bundle is identity, not inventory

`dist/bronto.css` is the shared app and service identity: tokens, base, fonts,
motion, dots, navigation, site/content surfaces, primitives, forms, feedback,
overlays, disclosure, tables, and app shell. It is the thing most applications
can load first to look and behave like the same family of products.

Report, analytical, provenance, generated-content, data-viz, renderer,
workbench, and command surfaces are opt-in leaves or roll-ups. They are public
and stable where documented, but they do not enter the default bundle unless
they become universal application chrome. This keeps a service shell from
paying for a report toolbox, and it keeps new specialized surfaces honest about
their audience.

Read more: [reporting](./reporting.md),
[frontier primitives](./frontier-primitives.md#boundary),
[adding a primitive](./adding-a-primitive.md), and
[package contract](./package-contract.md#export-matrix).

## Tokens project into CSS and data

Token values are authored once in `tokens/index.js` as `cssVars`. Generated
projections carry the same model to the places that need it: `css/tokens.css`,
`tokens.json`, `tokens.dtcg.json`, `tokens/resolved.json`,
`tokens/figma.variables.json`, the TypeScript declarations, and renderer theme
data.

CSS consumers should think in live custom properties. Non-CSS renderers need
resolved data. Mermaid, D2, and Vega exports therefore ship concrete theme maps
or configs with hex/rgba values, because those renderers cannot consume Bronto
CSS variables directly. If the token source changes, those projections must be
regenerated. If a page changes theme or accent after a renderer has produced an
SVG or canvas scene, the host must reinitialize or rerender that renderer with
fresh resolved data; the already-rendered output does not live-reskin from later
CSS.

Read more: [theming](./theming.md#design-token-interop-dtcg),
[Mermaid](./mermaid.md#why-resolved-colours-not-var-x),
[D2](./d2.md#why-resolved-colours-not-var-x), and
[Vega](./vega.md#why-resolved-colours-not-var-x).

## Package paths are the contract

The package root is CSS-only: `@ponchia/ui` resolves to `dist/bronto.css` for
CSS-aware bundlers and side-effect stylesheet imports. Runtime JavaScript lives
behind explicit ESM subpaths such as `/classes`, `/behaviors`, `/tokens`,
`/glyphs`, `/annotations`, `/connectors`, framework bindings, renderer helpers,
and JSON/data exports. The package has zero runtime dependencies; framework
bindings declare optional peers where needed.

Public surface is versioned by name and path: `.ui-*` classes, documented token
names and roles, `data-bronto-*` behavior attributes, exported functions,
schema files, shipped data files, and documented subpaths. The package is still
pre-1.0, so patch releases are non-breaking and minor releases may contain
breaking changes with changelog and migration notes. Generated docs and data
exist to make that public surface inspectable rather than implicit.

Read more: [stability](./stability.md),
[package contract](./package-contract.md), [CHANGELOG](../CHANGELOG.md), and
[llms.txt](../llms.txt).
