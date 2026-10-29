# Bronto UI

`@ponchia/ui` — CSS building blocks for tools, dashboards, and reports.

[![npm](https://img.shields.io/npm/v/@ponchia/ui?logo=npm)](https://www.npmjs.com/package/@ponchia/ui)
[![npm provenance](https://img.shields.io/badge/npm-provenance-blue?logo=npm)](https://www.npmjs.com/package/@ponchia/ui#provenance)
[![runtime deps](https://img.shields.io/badge/runtime%20deps-0-brightgreen)](https://github.com/Ponchia/bronto-ui/blob/main/package.json)
[![default CSS](https://img.shields.io/badge/default%20CSS-~94kB%20%2F%20~17kB%20gzip-informational)](https://github.com/Ponchia/bronto-ui/blob/main/scripts/check-dist.mjs)
[![CI](https://github.com/Ponchia/bronto-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/Ponchia/bronto-ui/actions/workflows/ci.yml)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/Ponchia/bronto-ui/badge)](https://scorecard.dev/viewer/?uri=github.com/Ponchia/bronto-ui)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue)](https://github.com/Ponchia/bronto-ui/blob/main/LICENSE)

Bronto UI provides semantic `ui-*` classes, design tokens, and optional vanilla
JavaScript behaviors. Use normal HTML or your framework's templates to build
interfaces with shared typography, controls, themes, and information layout.
The package has **zero runtime dependencies** and no framework peers.

**[Website](https://ponchia.github.io/bronto-ui/)** ·
**[Examples](https://ponchia.github.io/bronto-ui/examples/)** ·
**[Components](https://ponchia.github.io/bronto-ui/components/)** ·
**[Documentation](https://ponchia.github.io/bronto-ui/docs/)** ·
[Laboratory](https://ponchia.github.io/bronto-ui/lab/)

[![An operations dashboard built using Bronto UI](https://raw.githubusercontent.com/Ponchia/bronto-ui/main/site/assets/operations.jpg)](https://ponchia.github.io/bronto-ui/examples/operations/)

**Pre-1.0:** minor releases can contain breaking changes. The
[upgrade checklist](https://ponchia.github.io/bronto-ui/docs/getting-started/upgrade.html)
and [stability contract](docs/stability.md) explain what to review.

## Start here

| Your task | Start with |
| --- | --- |
| Try Bronto UI | [One-file example](https://ponchia.github.io/bronto-ui/demo/first-steps.html) and [first-component tutorial](https://ponchia.github.io/bronto-ui/docs/getting-started/first-component.html) |
| Build an application | The quick start below, then the [usage guide](docs/usage.md) and a framework guide |
| Build a report or evidence view | [Report cookbook](docs/reporting.md) and [composition recipes](docs/compositions.md) |
| Customize the visual identity | [Theming](docs/theming.md) and the [theme playground](https://ponchia.github.io/bronto-ui/demo/theme-playground.html) |
| Contribute | [Contributing](https://github.com/Ponchia/bronto-ui/blob/main/CONTRIBUTING.md) and [repository map](https://github.com/Ponchia/bronto-ui/blob/main/docs/repository-map.md) |
| Integrate with an agent or generator | [llms.txt](llms.txt), [class reference](docs/reference.md), and [package contract](docs/package-contract.md) |

## Quick start

### 1. Load the CSS

Install the package:

```bash
npm install @ponchia/ui
```

Import it from your application stylesheet through a CSS-aware bundler:

```css
@import '@ponchia/ui';
```

Or use a stylesheet URL in plain HTML, with no installation or build step:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ponchia/ui@0.18.2/dist/bronto.css" />
```

These are alternative ways to load the same default bundle
(~94 kB raw / ~17 kB gzip). That size covers `dist/bronto.css`; fonts, optional
stylesheets, JavaScript, and the complete package tarball are separate.

The package root is **CSS-only**. A side-effect `import '@ponchia/ui'` also works
in a CSS-aware bundler such as Vite, Astro, or SvelteKit. Node/runtime JavaScript
must use an explicit JS subpath, such as `@ponchia/ui/classes`.

### 2. Write semantic markup

```html
<article class="ui-card">
  <span class="ui-eyebrow">Deployment</span>
  <h2>Production service</h2>
  <p>The rollout completed and checks passed.</p>
  <span class="ui-badge ui-badge--success">Healthy</span>
  <button type="button" class="ui-button">View deployment</button>
</article>
```

Classes style the elements; your application supplies content, actions, labels,
and state. The [first-component tutorial](https://ponchia.github.io/bronto-ui/docs/getting-started/first-component.html)
puts this into a complete runnable page.

### 3. Add helpers when needed

Typed class recipes return plain strings:

```js
import { ui, cx } from '@ponchia/ui/classes';

ui.button({ variant: 'ghost' }); // "ui-button ui-button--ghost"
cx(ui.button({ variant: 'ghost' }), 'my-action');
```

Optional behaviors wire the documented `data-bronto-*` markup. Initialize them
after the DOM exists and retain their cleanup functions for route changes or
component unmounts:

```js
import { initThemeToggle, initDialog, toast } from '@ponchia/ui/behaviors';

const stopTheme = initThemeToggle(); // [data-bronto-theme-toggle]
const stopDialog = initDialog();    // native <dialog> open/close controls
const dismissToast = toast('Saved', { tone: 'success' });

// Call stopTheme(), stopDialog(), and dismissToast() when this view is disposed.
```

Importing a behavior does not initialize it. Initializers are SSR-safe and
idempotent; `toast()` returns a dismissal function. For persisted themes, apply
the small inline script in the
[integration guide](https://github.com/Ponchia/bronto-ui/blob/main/docs/integration.md)
before first paint. JS subpaths are **ESM-only**; CommonJS consumers can use
`import('@ponchia/ui/behaviors')` dynamically.

### 4. Check your markup

The installed package includes a consumer validator. Run it against your
application's source files:

```bash
npx --no-install bronto-ui-check src index.html
```

Use paths that exist in your project; add `--json` for machine-readable findings
or `--help` for options. The command checks literal `ui-*` names and unresolved
Bronto-like `var(--*)` references against the installed package, and exits
nonzero when it finds a problem. It skips dependency and build directories.

This is a source check: it does not evaluate dynamically assembled class names,
confirm that an optional stylesheet is loaded, or verify accessibility and
behavior. Follow it with the browser checks below. The
[class reference](docs/reference.md) describes valid classes, required markup,
and opt-in stylesheets.

## Choose the surface you need

The default stylesheet covers application structure, forms, tables, feedback,
overlays, disclosure, navigation, and shared typography. Specialized surfaces
have explicit imports:

| Surface | Import | What it provides |
| --- | --- | --- |
| Application CSS | `@ponchia/ui` | Default flattened bundle, including the Doto font declarations |
| Source CSS entrypoint | `@ponchia/ui/css` | The same core through a bundler-resolved import fan-out; use instead of the default bundle |
| Reports | `@ponchia/ui/css/report-kit.css` | Report layout, findings, evidence, source references, analytical leaves, and print utilities |
| Analytical figures | `@ponchia/ui/css/analytical.css` | Figure frames, annotations, legends, marks, connectors, spotlight, crosshair, selection, and highlights |
| Tool panels | `@ponchia/ui/css/workbench.css`, `@ponchia/ui/css/command.css` | Inspectors, property rows, splitters, selection bars, and command-palette styling |
| Trust and state | `@ponchia/ui/css/sources.css`, `@ponchia/ui/css/generated.css`, `@ponchia/ui/css/state.css` | Citations, provenance, generated-content labels, lifecycle states, and job progress |
| Data visualization | `@ponchia/ui/css/dataviz.css`, `@ponchia/ui/charts` | Categorical colors, chart palettes, ramps, and pattern fills |
| JavaScript helpers | `@ponchia/ui/classes`, `@ponchia/ui/tokens`, `@ponchia/ui/behaviors` | Typed class strings, token data, and optional interaction wiring |
| Geometry and rendering | `@ponchia/ui/connectors`, `@ponchia/ui/renderer` | DOM leader lines and live theme values; the deprecated `@ponchia/ui/annotations` geometry moves to [`@ponchia/annotations`](https://github.com/Ponchia/bronto-annotations) |
| Display glyphs | `@ponchia/ui/glyphs` | Dot-matrix glyphs, solid inline forms, and one-node CSS-mask icons |
| Renderer themes | `@ponchia/ui/mermaid`, `@ponchia/ui/d2`, `@ponchia/ui/vega` | Resolved theme data for renderers installed by the consumer |

Add specialized leaves alongside the core. A narrow report can import
`@ponchia/ui/css/report.css` plus only the leaves it uses. In plain HTML, use a
real URL ending in `dist/css/<leaf>.css`; a browser cannot resolve a bare
`@ponchia/ui/css/...` package specifier in `<link href>`.

The [usage guide](docs/usage.md) explains which primitive to choose; the
[generated class reference](docs/reference.md) lists the vocabulary. The
[package contract](docs/package-contract.md) is the complete export inventory.

Bronto owns styling, accessible interaction patterns, and small geometry
helpers. Applications own routing, persistence, chart scales, data fetching,
selection state, and command execution. The richer annotation engine is the
separate `@ponchia/annotations` package; this package keeps the dependency-free
Bronto helper surface without depending on that engine.

## Theming

Ordinary application CSS overrides Bronto's `@layer bronto` without a
specificity contest. Start with a root accent override:

```css
:root { --accent: #2f6df6; }
```

Use `data-theme="light"` or `data-theme="dark"` on `<html>` to choose a theme;
without an explicit choice, the CSS follows `prefers-color-scheme`. The accent
family is derived at the root. A scoped `--accent` override changes direct uses
but does not recompute every inherited derived token in that subtree.

The opt-in `@ponchia/ui/css/skins.css` provides `amber-crt`, `phosphor-green`, and
`e-ink` through `data-bronto-skin` on `<html>`. `data-density` and `data-contrast`
provide convenience presets. Status and data-viz colors keep their own roles.

Check both themes when changing the accent: custom colors are outside the
shipped palette's contrast proof. See the [theming guide](docs/theming.md),
[contrast matrix](docs/contrast.md), and
[theme playground](https://ponchia.github.io/bronto-ui/demo/theme-playground.html).
Mermaid, D2, and Vega theme exports contain resolved values; a later CSS override
does not automatically recolor an already-rendered diagram.

**Annotations migration:** all annotation functionality now belongs to the independent
[`@ponchia/annotations`](https://github.com/Ponchia/bronto-annotations) package;
UI annotation helpers/styles are deprecated for 0.17 but remain available until a later
breaking minor. See [migration instructions](docs/migrations/0.16-to-0.17.md).

## Framework integration

CSS works in normal HTML, server-rendered templates, and framework components.
Framework consumers initialize vanilla behaviors in their own mount/cleanup
lifecycle. No React, Vue, Svelte, Solid, or Qwik adapter is required or shipped.

| Stack | Guide | Maintained packed example |
| --- | --- | --- |
| Vanilla / Vite / plain HTML | [Vanilla](https://github.com/Ponchia/bronto-ui/blob/main/docs/getting-started/vanilla.md) | [vanilla-vite](https://github.com/Ponchia/bronto-ui/tree/main/examples/vanilla-vite) |
| Astro | [Astro](https://github.com/Ponchia/bronto-ui/blob/main/docs/getting-started/astro.md) | [astro](https://github.com/Ponchia/bronto-ui/tree/main/examples/astro) |
| SvelteKit | [SvelteKit](https://github.com/Ponchia/bronto-ui/blob/main/docs/getting-started/sveltekit.md) | [sveltekit](https://github.com/Ponchia/bronto-ui/tree/main/examples/sveltekit) |
| React | [React lifecycle](https://github.com/Ponchia/bronto-ui/blob/main/docs/getting-started/react-solid.md) | [react-vite](https://github.com/Ponchia/bronto-ui/tree/main/examples/react-vite) |
| Tailwind v4 | [Cascade-layer bridge](docs/interop/tailwind.md) | [tailwind-vite](https://github.com/Ponchia/bronto-ui/tree/main/examples/tailwind-vite) |
| Static reports | [Report cookbook](docs/reporting.md) | [report-static](https://github.com/Ponchia/bronto-ui/tree/main/examples/report-static) |

[Vue](https://github.com/Ponchia/bronto-ui/blob/main/docs/getting-started/vue.md),
[Solid, and Qwik](https://github.com/Ponchia/bronto-ui/blob/main/docs/getting-started/react-solid.md)
have integration recipes, but are not separate packed examples in the current
test matrix. The maintained examples build against the actual npm tarball;
see [how to run them](https://github.com/Ponchia/bronto-ui/blob/main/examples/README.md).

## Accessibility and verification

The repository checks declared token contrast pairings in both themes and
shipped colorways, and publishes the results in [docs/contrast.md](docs/contrast.md).
APCA values are advisory. Browser fixtures exercise keyboard behavior, ARIA
relationships, reduced motion, forced colors, RTL, print, and responsive layout.
Committed pixel baselines use a pinned Linux/Chromium environment; behavioral
coverage also runs in Firefox and WebKit.

Those checks cover the library and its fixtures. They do not certify a consumer
application: semantic markup, accessible names, content, custom colors, and
application workflows still need review. Class names alone do not add ARIA
relationships or make an arbitrary control accessible.

One public consumer is [Sense6](https://sense6.net/en/), whose browser experiments
use Bronto's shared shell, controls, responsive layout, and themes while keeping
their experiment-specific styling in the application.

## Browser support

Floor: **Chrome/Edge 125+, Safari 18+, Firefox 129+**. Core CSS uses cascade
layers, `:has()`, `color-mix()`/`oklch()`, logical properties, and native dialog
and popover primitives. Browsers below the floor are unsupported.

Newer motion and positioning features, including scroll-driven animations,
View Transitions, and intrinsic-size transitions, are progressive enhancements;
exact animation behavior can differ by browser. Essential content and controls
must remain usable without those effects. See
[ADR-0002](docs/adr/0002-scope-and-2026-baseline.md) for the platform policy.

## Versioning

Until `1.0.0`, breaking changes ship in the **minor** (`0.x.0`); patches
(`0.x.y`) preserve the documented API. A range such as `~0.16.2` or `^0.16.2`
accepts compatible patches while holding back `0.17.0`. Review the
[CHANGELOG](CHANGELOG.md) and
[upgrade checklist](https://ponchia.github.io/bronto-ui/docs/getting-started/upgrade.html)
before crossing a minor boundary.

Documented names, roles, paths, and behavior contracts are versioned. Exact
token values and visual tuning can change, so check important screens even on
a patch upgrade. [docs/stability.md](docs/stability.md) defines the full policy.
Release candidates use the `next` npm dist-tag; a plain installation uses
`latest`.

## Contributing and support

Created and maintained by [Zeno Trevisan (@Ponchia)](https://github.com/Ponchia).

Read [CONTRIBUTING.md](https://github.com/Ponchia/bronto-ui/blob/main/CONTRIBUTING.md)
for setup and review gates, and the
[roadmap](https://github.com/Ponchia/bronto-ui/blob/main/ROADMAP.md) for project direction.
Report reproducible bugs through [GitHub Issues](https://github.com/Ponchia/bronto-ui/issues).
You can support maintenance through [Ko-fi](https://ko-fi.com/ponchia).
Use the [security policy](https://github.com/Ponchia/bronto-ui/blob/main/.github/SECURITY.md)
for private vulnerability reports.

## License

[MIT](LICENSE) © Zeno Trevisan (Ponchia).

The bundled fonts have separate SIL Open Font License 1.1 notices:
[Doto](fonts/OFL.txt) (© 2024 The Doto Project Authors), opt-in
[Inter](fonts/OFL-Inter.txt) (© 2016 The Inter Project Authors), and opt-in
[JetBrains Mono](fonts/OFL-JetBrainsMono.txt) (© 2020 The JetBrains Mono Project Authors).
