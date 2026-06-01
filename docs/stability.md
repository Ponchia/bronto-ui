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
| Behavior attributes (`data-bronto-*`) | Stable | Attribute names and documented markup relationships are public. Behavior internals are not. |
| Behavior functions (`@ponchia/ui/behaviors`) | Stable | Exported function names, option names, custom events, SSR no-op behavior, idempotency, and cleanup-returning contract are public. |
| Glyph registry/renderers (`@ponchia/ui/glyphs`) | Stable additive | Existing glyph names stay valid. New glyphs are additive. Renderer option names and accessibility defaults are public. |
| `.ui-icon` mask renderer | Stable | Class name, `--icon-size`, currentColor inheritance, and `--icon-mask` contract are public. The internal data URL encoding is not. |
| React/Solid/Qwik bindings | Stable thin adapters | Hook/primitive names, optional peer behavior, root ref/signal/resolver support, and cleanup lifecycle are public. They remain wrappers over vanilla behaviors, not component APIs. |
| Skins (`@ponchia/ui/skins`, `css/skins.css`) | Stable additive | Existing skin names stay valid. New skins are additive. Skins are root-level choices. |
| Charts (`@ponchia/ui/charts`, `charts.json`, `css/dataviz.css`) | Stable additive | Token names, JSON shape, and 8 categorical slots are public. Exact palette values may tune if gates and release notes justify it. |
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
