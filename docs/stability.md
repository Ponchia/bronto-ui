# Public API Stability

`@ponchia/ui` is pre-1.0. Breaking changes ship in the minor (`0.x.0`), and
patches are non-breaking. In practical terms: **PATCH releases (`0.5.x`) are
non-breaking bug-fixes and additive changes — safe to upgrade without review;
MINOR releases (`0.x.0`) may include breaking changes and consumers should
review the CHANGELOG before upgrading.** Pin `~0.x` (tilde) to accept only
patches, or `^0.x` only if you accept minor-level churn. This policy holds
until `1.0.0` is tagged. This matrix defines what counts as public API.

| Surface | Stability | Contract |
| --- | --- | --- |
| CSS package root (`@ponchia/ui`) | Stable | CSS-only entrypoint. CSS side-effect imports are supported in CSS-aware bundlers; Node/runtime JS root imports are not. |
| JS module format | Stable | JS subpaths are ESM-only. CommonJS consumers use dynamic `import()`. |
| CSS class names (`.ui-*`) | Stable | Names and documented modifier semantics are public. Internal selector structure and leaf-file boundaries may change. |
| Class recipes (`@ponchia/ui/classes`) | Stable | Exported `cls`, `ui`, `cx`, recipe names, and option unions are public. |
| Class vocabulary as data (`@ponchia/ui/classes.json`) | Stable additive | The JSON shape (`groups`/`classes`/`states`/`customProperties`) and its entries are public — for validating markup from a non-JS/non-TS host. Generated from `cls` (the `classes` list cannot drift from the CSS); `states`/`customProperties` are gated against the stylesheet. New classes/hooks are additive. |
| Design tokens | Stable names/roles | Token names and documented roles are public. Exact values and generated colour math outputs may change for visual tuning before 1.0. |
| `--accent-1..6` | Stable names/roles | A subtle-to-bold accent ramp derived from `--accent`. Exact resolved values are visual tuning; algorithm changes require release-note visibility and resolver/browser checks. |
| Tokens as data (`tokens.json`, `tokens.dtcg.json`, `tokens/resolved.json`) | Stable additive | The JSON shapes are public for non-CSS/non-JS consumers. `resolved.json` exposes `light`/`dark` (resolved colours) and `scale` (resolved non-colour scales). Token names/roles are stable; exact resolved values are visual tuning (pin `~0.x`). |
| Theme axes | Mixed | `data-theme` (light/dark) is the **contractual** base. `data-surface="oled"`, `data-density`, and `data-contrast` are **convenience presets** — best-effort visual variants, **not** part of the stability contract; their presence and exact values may change for tuning. (A computed-style smoke test guards the OLED `--bg` flip; the others are unverified.) |
| Behavior attributes (`data-bronto-*`) | Stable | Attribute names and documented markup relationships are public. Behavior internals are not. |
| Behavior functions (`@ponchia/ui/behaviors`) | Stable | Exported function names, option names, custom events, SSR no-op behavior, idempotency, and cleanup-returning contract are public. |
| Glyph registry/renderers (`@ponchia/ui/glyphs`) | Stable additive | Existing glyph names stay valid. New glyphs are additive. Renderer option names and accessibility defaults are public. |
| `.ui-icon` mask renderer | Stable | Class name, `--icon-size`, currentColor inheritance, and `--icon-mask` contract are public. The internal data URL encoding is not. |
| React/Solid/Qwik bindings | Stable thin adapters | Hook/primitive names, optional peer behavior, root ref/signal/resolver support, and cleanup lifecycle are public. They remain wrappers over vanilla behaviors, not component APIs. |
| Skins (`@ponchia/ui/skins`, `css/skins.css`) | Stable additive | Existing skin names stay valid. New skins are additive. Skins are root-level choices. |
| Charts (`@ponchia/ui/charts`, `charts.json`, `css/dataviz.css`) | Stable additive | Token names, JSON shape, and 8 categorical slots are public. Exact palette values may tune if gates and release notes justify it. |
| Reports (`css/report.css`, `.ui-report*`, print utilities) | Stable additive | Report class names, BEM part names, and print utility names are public. Report CSS is opt-in and not imported by the default bundle. The data key now lives in the standalone Legends layer (below), not `css/report.css`; charting is via the Vega theme target (`@ponchia/ui/vega`, see [vega](./vega.md)) or a token-themed inline SVG, not a shipped renderer. |
| Annotations (`@ponchia/ui/annotations`, `css/annotations.css`, `.ui-annotation*`) | Stable additive | SVG annotation class names, recipe option names, and helper function names are public. Helper internals and exact path-control heuristics may tune before 1.0. |
| Legends (`css/legend.css`, `.ui-legend*`, `@ponchia/ui/behaviors` `initLegend`) | Stable additive | Legend class names, recipe option names, and the `bronto:legend:toggle` event contract (`aria-pressed="true"` ⇒ shown) are public. Opt-in, not in the default bundle; swatch colours are gated to the `--chart-*` palette. |
| Marks (`css/marks.css`, `.ui-mark*`, `.ui-bracket-note*`) | Stable additive | Text-mark and bracket-note class names and recipe option names are public. Opt-in, not in the default bundle. Uses semantic tones only. |
| Connectors (`@ponchia/ui/connectors`, `css/connectors.css`, `.ui-connector*`, `initConnectors`) | Stable additive | Connector class names, the `data-bronto-connector` attribute contract, geometry helper function names, and recipe options are public. Helper internals/heuristics may tune before 1.0. Opt-in, not in the default bundle. |
| Spotlight (`css/spotlight.css`, `.ui-spotlight*`, `.ui-tour-note*`, `initSpotlight`) | Stable additive | Spotlight/tour-note class names, the `--spot-*` custom-property contract, and the `data-bronto-spotlight`/`data-target` attributes are public. Opt-in, not in the default bundle. Not a tour engine. |
| Crosshair (`css/crosshair.css`, `.ui-crosshair*`, `.ui-readout`, `initCrosshair`) | Stable additive | Crosshair/readout class names, the `--crosshair-x/y` properties, the `data-bronto-crosshair` attribute, and the `bronto:crosshair:move`/`:leave` event contract are public. Opt-in. Reports pointer position only — no data mapping. |
| Selection states (`css/selection.css`, `.ui-sel*`) | Stable additive | The `.ui-sel`/`--on`/`--off`/`--maybe` emphasis classes and recipe options are public. Opt-in, cross-cutting. The host owns selection logic; Bronto only styles the states. |
| Analytical roll-up (`css/analytical.css`) | Stable additive | A convenience `@import` of the seven analytical leaves (annotations, legend, marks, connectors, spotlight, crosshair, selection). The set of leaves it bundles may grow additively; each leaf also stays individually exported. Opt-in, not in the default bundle. |
| Sources / provenance (`css/sources.css`, `.ui-citation*`, `.ui-source-card*`, `.ui-source-list*`, `.ui-provenance*`, `.ui-src--*`) | Stable additive | Citation/source/provenance class names, the cross-cutting `.ui-src--*` trust-state modifiers (always paired with an author label), and the `ui.citation`/`ui.source`/`ui.provenance` recipes + `cls.sourceList` are public. Opt-in, not in the default bundle. |
| Lifecycle state (`css/state.css`, `.ui-state*`, `.ui-syncbar`) | Stable additive | The `.ui-state`/`__label`/`__detail`/`--busy` classes, the canonical lifecycle state modifiers, `.ui-syncbar`, and the `ui.state` recipe are public. Opt-in, not in the default bundle. |
| Generated / AI-trust (`css/generated.css`, `.ui-generated*`, `.ui-origin-label*`, `.ui-reasoning*`, `.ui-tool-log`, `.ui-tool-call*`) | Stable additive | The generated-content, origin-label (incl. `--ai`), reasoning-trace and tool-log/tool-call class names and the `ui.originLabel` recipe are public. Opt-in, not in the default bundle. Not a chat kit; no confidence widget. |
| Workbench (`css/workbench.css`, `.ui-inspector*`, `.ui-property*`, `.ui-selectionbar*`) | Stable additive | Inspector, property-row and selection-bar class + BEM part names are public (class-only — no recipe). Opt-in, not in the default bundle. Splitters/drag handles are out of scope. |
| Command palette (`css/command.css`, `.ui-command*`, `initCommand`, `useCommand`) | Stable additive | Command class/part names, the `data-bronto-command` attribute, and the event contract — `bronto:command:select` (`detail: { value, label }`) and `bronto:command:close` — are public, plus the `useCommand` binding hook. Bronto filters + navigates (APG combobox/listbox); the host owns the action registry/execution. Opt-in, not in the default bundle, no global hotkey. |
| Controlled-modal focus trap (`initModal`, `useModal`, `data-bronto-modal`) | Stable additive | For the `.ui-modal.is-open` (non-`<dialog>`) path: the `data-bronto-modal` opt-in marker, the `inert`-based focus trap + focus-return, and the cancelable `bronto:modal:close` (`detail: { reason }`) event are public. The consumer still owns the `is-open` class; the behavior never changes visibility. The native `<dialog>` path (`initDialog`) is the default and gets the trap for free. |
| Keyboard-shortcut hint (`.ui-shortcut`, `.ui-shortcut__sep`) | Stable additive | Class names for the chord/sequence hint over `.ui-kbd` are public. Ships in the core layer (class-only, no recipe). |
| Generated docs shipped in npm | Stable paths | `llms.txt` and exported docs paths stay shipped and resolvable within a compatible minor. Markdown/text assets are for reading unless your runtime has a loader. Generated content may change with the source contract. |
| Demo, examples, tests, scripts | Internal | Useful for learning and verification, but not shipped runtime API unless a path is explicitly exported in `package.json`. |

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
