# Public API Stability

`@ponchia/ui` is pre-1.0. Breaking changes ship in the minor (`0.x.0`), and
patches are non-breaking. In practical terms: **PATCH releases (`0.6.x`) are
non-breaking bug-fixes and additive changes — safe to upgrade without review;
MINOR releases (`0.x.0`) may include breaking changes and consumers should
review the CHANGELOG before upgrading.** Pin `~0.x` (tilde) to accept only
patches, or `^0.x` only if you accept minor-level churn. This policy holds
until `1.0.0` is tagged. This matrix defines what counts as public API.
For the exhaustive package-manifest inventory — every `exports` key, every
shipped `files` entry, and the generated artifact provenance map — see
[package-contract.md](./package-contract.md).

## Path To 1.0

`1.0.0` is a stability declaration, not a catalog milestone. The package is
ready for 1.0 when the existing public contract is boring to upgrade:

- **Core boundary settled.** The default bundle contains shared app/service
  identity only. Report, analytical, provenance, generated-content, renderer,
  workbench, and command surfaces remain opt-in unless they solve universal
  application chrome.
- **Refusal list enforced by review.** The package still refuses chart scales,
  data fetching, persistence, routing, workflow execution, global action
  registries, virtualized grids, framework component APIs, theme marketplaces,
  and second-accent visual systems.
- **Consumer proof is routine.** Packed tarball checks, packed example builds,
  packed TypeScript resolution, and at least one real downstream upgrade prove
  each release candidate; source-tree checks are not treated as enough.
- **Generated contracts stay registry-backed.** Exports, shipped docs, CSS
  leaves, examples, generated artifacts, visual baselines, and ownership
  matrices derive from shared local registries wherever possible.
- **Bundle budget has headroom.** The default CSS bundle and tarball size have
  deliberate margin, or any budget increase is explicit in the changelog.
- **Deprecation history is clean.** Every breaking change has a changelog note,
  migration entry when machine-actionable, and the deprecate-one-minor policy
  has been followed or explicitly exempted for provably-unreferenced surface.

### 1.0 Readiness Ledger

This ledger is the release-candidate checklist. A row is ready only when the
evidence column is green for the candidate commit; prose approval alone is not
enough.

| Criterion | Current evidence | 1.0 bar |
| --- | --- | --- |
| Core boundary settled | `check:exports`, `check:dist`, `check:component-matrix`, `check:report`, and the `CORE_BUNDLE` registry keep default CSS, opt-in leaves, and report/analytical surfaces separate. | No unexplained growth in the default bundle; any move from opt-in to core is called out in `CHANGELOG.md`. |
| Refusal list enforced by review | `test/analytical-boundary.test.mjs`, `check:contract`, `check:behavior-matrix`, `check:helper-matrix`, and review against `docs/architecture.md` keep scales, routing, persistence, workflow execution, global action registries, and framework component APIs out of package-owned behavior. | No public helper, behavior, or doc implies Bronto owns application state, data, routing, workflow execution, or framework component rendering. |
| Consumer proof is routine | `check:pack`, `check:consumer-surface`, `check:consumer-types`, `check:examples`, `check:publint`, and `check:attw` prove the packed npm artifact before release; the release process requires a public-safe Release evidence note. | Every 1.0 candidate has packed import/type/example proof plus at least one real downstream upgrade note that names the consumer class, imported surface, and result without leaking private repo or product names. |
| Generated contracts stay registry-backed | `check:fresh`, `check:classes`, `check:dts-emit`, `check:doc-links`, `check:public-metadata`, `check:public-hygiene`, and the matrix gates prove generated artifacts, shipped docs, public hygiene, and ownership maps do not drift. | New public surface has one registry/source of truth before it gets a hand-authored gate row. |
| Bundle budget has headroom | `check:dist`, `check:public-metadata`, `check:pack`, and the README size badge keep default bundle and tarball claims visible. | Budget increases are intentional, reviewed, and named in `CHANGELOG.md`; accidental growth fails before release. |
| Deprecation history is clean | `check:migrations`, `check:release`, `check:versions`, `MIGRATIONS.json`, and this deprecation policy tie breaking changes to changelog and migration evidence. | No removal ships without either a deprecate-one-minor trail or an explicit BREAKING note for provably-unreferenced surface. |

After 1.0, breaking changes move to majors. Until then, the table below is the
current public-surface matrix and the release policy above still applies.

| Surface | Stability | Contract |
| --- | --- | --- |
| CSS package root (`@ponchia/ui`) | Stable | CSS-only entrypoint. CSS side-effect imports are supported in CSS-aware bundlers; Node/runtime JS root imports are not. |
| JS module format | Stable | JS subpaths are ESM-only. CommonJS consumers use dynamic `import()`. |
| CSS class names (`.ui-*`) | Stable | Names and documented modifier semantics are public. Internal selector structure and leaf-file boundaries may change. |
| Class recipes (`@ponchia/ui/classes`) | Stable | Exported `cls`, `ui`, `cx`, `attrs`, recipe names, ARIA attribute helper names, and option unions are public. |
| Class vocabulary as data (`@ponchia/ui/classes.json`, `@ponchia/ui/vscode.css-custom-data.json`) | Stable additive | The JSON shape (`groups`/`classes`/`states`/`customProperties`) and class/custom-property entries are public — for validating markup from a non-JS/non-TS host or editor integration. Generated from `cls` and CSS selectors; `classes.json`, `.d.ts`, reference docs, and VS Code custom data are drift-checked together. New classes/hooks are additive. |
| Design tokens | Stable names/roles | Token names and documented roles are public. Exact values and generated colour math outputs may change for visual tuning before 1.0. |
| `--accent-1..6` | Stable names/roles | A subtle-to-bold accent ramp derived from `--accent`. Exact resolved values are visual tuning; algorithm changes require release-note visibility and resolver/browser checks. |
| Tokens as data (`tokens.json`, `tokens.dtcg.json`, `tokens/resolved.json`, `tokens/figma.variables.json`) | Stable additive | The JSON shapes are public for non-CSS/non-JS consumers and handoff tooling. `resolved.json` exposes `light`/`dark` (resolved colours) and `scale` (resolved non-colour scales). `tokens/figma.variables.json` mirrors the token contract for local Figma Variables import/sync. Token names/roles are stable; exact resolved values are visual tuning (pin `~0.x`). |
| Schemas (`schemas/*.schema.json`, `schemas/report-claims.v1.schema.json`) | Stable additive | Declarative JSON Schema contracts for package-adjacent tooling data. Existing schema files and enum values are public within a compatible minor; new optional properties and new schema files are additive. No validator runtime ships. |
| Theme axes | Mixed | `data-theme` (light/dark) is the **contractual** base. `data-surface="oled"`, `data-density`, and `data-contrast` are **convenience presets** — best-effort visual variants, **not** part of the stability contract; their presence and exact values may change for tuning. Computed-style smoke tests guard that the presets apply to their intended token families. |
| Tailwind v4 bridge (`@ponchia/ui/tailwind`, `@ponchia/ui/tailwind.css`) | Stable additive | CSS-only token/variant bridge for Tailwind v4. It maps Bronto tokens and variants into Tailwind namespaces; it must not import Bronto component CSS or change the default bundle. |
| Behavior attributes (`data-bronto-*`) | Stable | Attribute names and documented markup relationships are public. Behavior internals are not. |
| Behavior functions (`@ponchia/ui/behaviors`) | Stable | Exported function names, option names, custom events, SSR no-op behavior, idempotency, and cleanup-returning contract are public. |
| Glyph registry/renderers (`@ponchia/ui/glyphs`) | Stable additive | Existing glyph names stay valid. New glyphs are additive. Renderer option names and accessibility defaults are public. |
| `.ui-icon` mask renderer | Stable | Class name, `--icon-size`, currentColor inheritance, and `--icon-mask` contract are public. The internal data URL encoding is not. |
| Framework lifecycle adapters (`react`/`solid`/`qwik`/`svelte`/`vue`) | Stable thin adapters | Hook/action/directive names, optional peer behavior where applicable, root ref/signal/resolver support, and cleanup lifecycle are public. They remain wrappers over vanilla behaviors, not component APIs. |
| Skins (`@ponchia/ui/skins`, `css/skins.css`) | Stable additive | Existing skin names stay valid. New skins are additive. Skins are root-level choices. Skin CSS is opt-in, not in the default bundle. |
| Charts (`@ponchia/ui/charts`, `charts.json`, `css/dataviz.css`) | Stable additive | Token names, JSON shape, and 8 categorical slots are public. `css/dataviz.css` is opt-in, not in the default bundle. Exact palette values may tune if gates and release notes justify it. |
| External renderer themes (`@ponchia/ui/mermaid`, `@ponchia/ui/mermaid.json`, `@ponchia/ui/d2`, `@ponchia/ui/d2.json`, `@ponchia/ui/vega`, `@ponchia/ui/vega.json`) | Stable additive | Theme helper names, JSON shapes, and supported renderer theme slots are public. Values are resolved colours because Mermaid, D2, and Vega cannot consume Bronto CSS variables directly. Exact colours may tune with token changes, but `check:mermaid`, `check:d2`, and `check:vega` must prove every exported theme resolves with no `var()` leaks. No renderer runtime ships. |
| Shiki theme data (`@ponchia/ui/shiki/nothing.json`) | Stable additive | The bundled Shiki theme JSON shape and token-derived scope roles are public for syntax-highlighting consumers. Exact colours may tune with the token model and must stay generated from the governed palette. |
| Reports (`css/report.css`, `.ui-report*`, print utilities) | Stable additive | Report class names, BEM part names, and print utility names are public. Report CSS is opt-in and not imported by the default bundle. The data key now lives in the standalone Legends layer (below), not `css/report.css`; charting is via the Vega theme target (`@ponchia/ui/vega`, see [vega](./vega.md)) or a token-themed inline SVG, not a shipped renderer. |
| Report kit roll-up (`css/report-kit.css`) | Stable additive | A convenience `@import` of the complete static-report vocabulary. The set of leaves it bundles may grow additively; each leaf also stays individually exported. Opt-in, not in the default bundle. |
| Figure stage (`css/figure.css`, `.ui-figure*`) | Stable additive | Figure class names, overlay/key/fallback-data slots, and report composition hooks are public. Opt-in, not in the default bundle. Bronto owns the figure frame, not chart rendering, scales, or data mapping. |
| Annotations (`@ponchia/ui/annotations`, `css/annotations.css`, `.ui-annotation*`) | Stable additive | SVG annotation class names, recipe option names, and helper function names are public. Helper internals and exact path-control heuristics may tune before 1.0. Opt-in, not in the default bundle. Rich placement, renderer, editing, and chart/diagram adapter APIs belong to the sibling `@ponchia/annotations` package; `@ponchia/ui` does not depend on it at runtime or through public declarations. |
| Legends (`css/legend.css`, `.ui-legend*`, `@ponchia/ui/behaviors` `initLegend`) | Stable additive | Legend class names, recipe option names, and the `bronto:legend:toggle` event contract (`aria-pressed="true"` ⇒ shown) are public. Opt-in, not in the default bundle; swatch colours are gated to the `--chart-*` palette. |
| Marks (`css/marks.css`, `.ui-mark*`, `.ui-bracket-note*`) | Stable additive | Text-mark and bracket-note class names and recipe option names are public. Opt-in, not in the default bundle. Uses semantic tones only. |
| Connectors (`@ponchia/ui/connectors`, `css/connectors.css`, `.ui-connector*`, `initConnectors`) | Stable additive | Connector class names, the `data-bronto-connector` attribute contract, geometry helper function names, and recipe options are public. Helper internals/heuristics may tune before 1.0. Opt-in, not in the default bundle. |
| Spotlight (`css/spotlight.css`, `.ui-spotlight*`, `.ui-tour-note*`, `initSpotlight`) | Stable additive | Spotlight/tour-note class names, the `--spot-*` custom-property contract, and the `data-bronto-spotlight`/`data-target` attributes are public. Opt-in, not in the default bundle. Not a tour engine. |
| Crosshair (`css/crosshair.css`, `.ui-crosshair*`, `.ui-readout`, `initCrosshair`) | Stable additive | Crosshair/readout class names, the `--crosshair-x/y` properties, the `data-bronto-crosshair` attribute, and the `bronto:crosshair:move`/`:leave` event contract are public. Opt-in. Reports pointer position only — no data mapping. |
| Selection states (`css/selection.css`, `.ui-sel*`) | Stable additive | The `.ui-sel`/`--on`/`--off`/`--maybe` emphasis classes and recipe options are public. Opt-in, cross-cutting. The host owns selection logic; Bronto only styles the states. |
| Analytical roll-up (`css/analytical.css`) | Stable additive | A convenience `@import` of the nine analytical leaves (figure, annotations, legend, marks, connectors, spotlight, crosshair, selection, highlights). The set of leaves it bundles may grow additively; each leaf also stays individually exported. Opt-in, not in the default bundle. |
| Sources / provenance (`css/sources.css`, `.ui-citation*`, `.ui-source-card*`, `.ui-source-list*`, `.ui-provenance*`, `.ui-src--*`, `initSources`) | Stable additive | Citation/source/provenance class names, the cross-cutting `.ui-src--*` trust-state modifiers (always paired with an author label), the optional `data-bronto-sources` / `data-bronto-source-ref` behavior contract, `bronto:source:focus`, and the `ui.citation`/`ui.source`/`ui.provenance` recipes + `cls.sourceList` are public. Opt-in, not in the default bundle. |
| Interval ranges (`css/interval.css`, `.ui-interval*`) | Stable additive | Interval class names and the normalised `--lo`/`--hi`/`--v` custom-property contract are public. Opt-in, not in the default bundle. The host owns domains, units, and estimate math. |
| Clamp blocks (`css/clamp.css`, `.ui-clamp*`) | Stable additive | Clamp class/part names, expanded/collapsed affordance slots, and print-expansion behavior are public. Opt-in, not in the default bundle. The host owns disclosure copy and state persistence. |
| Text highlights (`css/highlights.css`, `.ui-highlights`) | Stable additive | Highlight container classes and token-backed Custom Highlight API paint are public. Opt-in, not in the default bundle. The host owns range registration and search/current-match logic. |
| Lifecycle state (`css/state.css`, `.ui-state*`, `.ui-syncbar`) | Stable additive | The `.ui-state`/`__label`/`__detail`/`--busy` classes, the canonical lifecycle state modifiers, `.ui-syncbar`, and the `ui.state` recipe are public. Opt-in, not in the default bundle. |
| Generated / AI-trust (`css/generated.css`, `.ui-generated*`, `.ui-origin-label*`, `.ui-reasoning*`, `.ui-tool-log`, `.ui-tool-call*`) | Stable additive | The generated-content, origin-label (incl. `--ai`), reasoning-trace and tool-log/tool-call class names and the `ui.originLabel` recipe are public. Opt-in, not in the default bundle. Not a chat kit; no confidence widget. |
| Workbench (`css/workbench.css`, `.ui-splitter*`, `.ui-inspector*`, `.ui-property*`, `.ui-selectionbar*`, `initSplitter`) | Stable additive | Splitter, inspector, property-row and selection-bar class + BEM part names are public (no recipe). `data-bronto-splitter`, `--splitter-pos`, `bronto:splitter:resize`, and the `initSplitter` cleanup contract are public. Opt-in, not in the default bundle. The host owns pane content, persistence, collapse policy, and selection state. |
| Command palette (`css/command.css`, `.ui-command*`, `initCommand`, `useCommand` / `command` / `vCommand`) | Stable additive | Command class/part names, the `data-bronto-command` attribute, and the event contract — `bronto:command:select` (`detail: { value, label }`) and `bronto:command:close` — are public, plus the framework binding adapters. Bronto filters + navigates (APG combobox/listbox); the host owns the action registry/execution. Opt-in, not in the default bundle, no global hotkey. |
| Spark microcharts (`css/spark.css`, `.ui-spark*`) | Stable additive | Spark class names and inline sizing/label slots are public. Opt-in, not in the default bundle. The host owns data reduction and accessible surrounding text. |
| Bullet graphs (`css/bullet.css`, `.ui-bullet*`) | Stable additive | Bullet class names and measure/target/range custom-property slots are public. Opt-in, not in the default bundle. The host owns thresholds, units, and data mapping. |
| Diffs (`css/diff.css`, `.ui-diff*`) | Stable additive | Diff container/line/gutter class names and add/remove/highlight state modifiers are public. Opt-in, not in the default bundle. Bronto styles evidence; it does not compute diffs. |
| Code evidence (`css/code.css`, `.ui-code*`) | Stable additive | Code block/gutter/line-state class names and token-backed syntax-theme roles are public. Opt-in, not in the default bundle. Bronto styles code-as-evidence; it does not parse or highlight code at runtime. |
| Sidenotes (`css/sidenote.css`, `.ui-sidenote`, `.ui-marginnote`) | Stable additive | Sidenote and marginnote class names, numbering behavior, and responsive in-flow fallback are public. Opt-in, not in the default bundle. |
| Text references (`css/textref.css`, `.ui-textref`) | Stable additive | Text-reference class names and `::target-text` styling are public. Opt-in, not in the default bundle. The host owns URL text fragments and quote provenance. |
| Terms / glossary (`css/term.css`, `.ui-term`, `.ui-glossary`) | Stable additive | Term and glossary class names plus native-popover definition hooks are public. Opt-in, not in the default bundle. The host owns glossary content and terminology policy. |
| Contents rail (`css/toc.css`, `.ui-toc*`) | Stable additive | TOC rail class/part names and current-section state classes are public. Opt-in, not in the default bundle. The host owns section observation and active-state updates. |
| Tree outlines (`css/tree.css`, `.ui-tree*`) | Stable additive | Tree outline class names, depth styling, and native `<details>` composition are public. Opt-in, not in the default bundle. The host owns tree data, lazy loading, and selection state. |
| Controlled-modal focus trap (`initModal`, `useModal`, `data-bronto-modal`) | Stable additive | For the `.ui-modal.is-open` (non-`<dialog>`) path: the `data-bronto-modal` opt-in marker, the `inert`-based focus trap + focus-return, and the cancelable `bronto:modal:close` (`detail: { reason }`) event are public. The consumer still owns the `is-open` class; the behavior never changes visibility. The native `<dialog>` path (`initDialog`) is the default and gets the trap for free. |
| Keyboard-shortcut hint (`.ui-shortcut`, `.ui-shortcut__sep`) | Stable additive | Class names for the chord/sequence hint over `.ui-kbd` are public. Ships in the core layer (class-only, no recipe). |
| Agent and migration data (`llms.txt`, `MIGRATIONS.json`) | Stable additive | `llms.txt` stays shipped as the offline agent entrypoint. `MIGRATIONS.json` stays a machine-readable migration map for breaking renames/removals. New migration entries are additive; removal of a migration record requires the same breaking-change discipline as the surface it describes. |
| Generated docs shipped in npm | Stable paths | Exported docs paths stay shipped and resolvable within a compatible minor. Markdown/text assets are for reading unless your runtime has a loader. Generated content may change with the source contract. |
| Demo, examples, tests, scripts | Internal | Useful for learning and verification, but not shipped runtime API unless a path is explicitly exported in `package.json`. |

## Deprecation Policy

Public surface (`.ui-*` classes, `data-bronto-*` attributes, `cls`/token keys,
behavior signatures, and exported schema values) is removed on a
**deprecate-one-minor** cycle:

1. **Deprecate** in minor _N_: the surface keeps working unchanged, is marked
   deprecated in `CHANGELOG.md`, and, for renames, gets an entry in
   [`MIGRATIONS.json`](../MIGRATIONS.json).
2. **Remove** no earlier than minor _N+1_, with a **BREAKING** changelog entry
   and migration note.

A token/class/attribute that is provably referenced by no shipped CSS,
component, behavior, or doc may skip that window and be removed with a BREAKING
entry plus migration note; there is no working call-site to keep alive.

## Trust Boundary

Behaviors assume trusted application markup. If a delegated root includes
untrusted CMS or user HTML, sanitize it first or do not initialize behaviors on
that root. The behavior layer intentionally lets authored `data-bronto-*`,
`aria-controls`, and `id` relationships control elements inside the root.
Dialog, disclosure, and popover targets resolve root-first and then
document-wide for body/portal-mounted overlays; scoped roots are not a sandbox
for untrusted markup.

The one-node glyph mask renderer emits inline style/custom-property data. Apps
with a strict CSP should either allow the required `data:` mask/image source and
inline custom-property style path, or use the DOM dot/solid renderers.
