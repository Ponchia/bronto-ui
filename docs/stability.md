# Public API Stability

`@ponchia/ui` is pre-1.0. Breaking changes ship in the minor (`0.x.0`), and
patches are non-breaking. This matrix defines what counts as public API.

| Surface | Stability | Contract |
| --- | --- | --- |
| CSS package root (`@ponchia/ui`) | Stable | CSS-only entrypoint. CSS side-effect imports are supported in CSS-aware bundlers; Node/runtime JS root imports are not. |
| JS module format | Stable | JS subpaths are ESM-only. CommonJS consumers use dynamic `import()`. |
| CSS class names (`.ui-*`) | Stable | Names and documented modifier semantics are public. Internal selector structure and leaf-file boundaries may change. |
| Class recipes (`@ponchia/ui/classes`) | Stable | Exported `cls`, `ui`, `cx`, recipe names, and option unions are public. |
| Design tokens | Stable names/roles | Token names and documented roles are public. Exact values and generated colour math outputs may change for visual tuning before 1.0. |
| `--accent-1..6` | Stable names/roles | A subtle-to-bold accent ramp derived from `--accent`. Exact resolved values are visual tuning; algorithm changes require release-note visibility and resolver/browser checks. |
| Theme axes | Mixed | `data-theme` (light/dark) is the **contractual** base. `data-surface="oled"`, `data-density`, and `data-contrast` are **convenience presets** — best-effort visual variants, **not** part of the stability contract; their presence and exact values may change for tuning. (A computed-style smoke test guards the OLED `--bg` flip; the others are unverified.) |
| Behavior attributes (`data-bronto-*`) | Stable | Attribute names and documented markup relationships are public. Behavior internals are not. |
| Behavior functions (`@ponchia/ui/behaviors`) | Stable | Exported function names, option names, custom events, SSR no-op behavior, idempotency, and cleanup-returning contract are public. |
| Glyph registry/renderers (`@ponchia/ui/glyphs`) | Stable additive | Existing glyph names stay valid. New glyphs are additive. Renderer option names and accessibility defaults are public. |
| `.ui-icon` mask renderer | Stable | Class name, `--icon-size`, currentColor inheritance, and `--icon-mask` contract are public. The internal data URL encoding is not. |
| React/Solid/Qwik bindings | Stable thin adapters | Hook/primitive names, optional peer behavior, root ref/signal/resolver support, and cleanup lifecycle are public. They remain wrappers over vanilla behaviors, not component APIs. |
| Skins (`@ponchia/ui/skins`, `css/skins.css`) | Stable additive | Existing skin names stay valid. New skins are additive. Skins are root-level choices. |
| Charts (`@ponchia/ui/charts`, `charts.json`, `css/dataviz.css`) | Stable additive | Token names, JSON shape, and 8 categorical slots are public. Exact palette values may tune if gates and release notes justify it. |
| Reports (`css/report.css`, `.ui-report*`, `.ui-chart*`, print utilities) | Stable additive | Report class names, BEM part names, chart helper class names, and print utility names are public. Report CSS is opt-in and not imported by the default bundle. The data key now lives in the standalone Legends layer (below), not `css/report.css`. |
| Annotations (`@ponchia/ui/annotations`, `css/annotations.css`, `.ui-annotation*`) | Stable additive | SVG annotation class names, recipe option names, and helper function names are public. Helper internals and exact path-control heuristics may tune before 1.0. |
| Legends (`css/legend.css`, `.ui-legend*`, `@ponchia/ui/behaviors` `initLegend`) | Stable additive | Legend class names, recipe option names, and the `bronto:legend:toggle` event contract (`aria-pressed="true"` ⇒ shown) are public. Opt-in, not in the default bundle; swatch colours are gated to the `--chart-*` palette. |
| Marks (`css/marks.css`, `.ui-mark*`, `.ui-bracket-note*`) | Stable additive | Text-mark and bracket-note class names and recipe option names are public. Opt-in, not in the default bundle. Uses semantic tones only. |
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
