# @ponchia/ui

[![npm](https://img.shields.io/npm/v/@ponchia/ui?logo=npm)](https://www.npmjs.com/package/@ponchia/ui)
[![npm provenance](https://img.shields.io/badge/npm-provenance-blue?logo=npm)](https://www.npmjs.com/package/@ponchia/ui#provenance)
[![runtime deps](https://img.shields.io/badge/runtime%20deps-0-brightgreen)](https://github.com/Ponchia/bronto-ui/blob/main/package.json)
[![dist](https://img.shields.io/badge/dist-~76kB%20%2F%20~13kB%20gzip-informational)](https://github.com/Ponchia/bronto-ui/blob/main/scripts/check-dist.mjs)
[![CI](https://github.com/Ponchia/bronto-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/Ponchia/bronto-ui/actions/workflows/ci.yml)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/Ponchia/bronto-ui/badge)](https://scorecard.dev/viewer/?uri=github.com/Ponchia/bronto-ui)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue)](https://github.com/Ponchia/bronto-ui/blob/main/LICENSE)

**A CSS-first design system for interfaces that explain themselves.** It works in
plain HTML, every modern framework, and print/PDF, with no component runtime to
adopt and zero runtime dependencies.

The look is a deliberate stance: a neutral monochrome canvas with one rationed
accent (colour signals, it never decorates), dot-matrix display type, and
hairline borders — all re-skinnable from a single `--accent` knob (opt-in
amber-CRT, phosphor-green, and e-ink colorways).

Beyond the standard component set it ships an opt-in analytical & report layer —
SVG annotations, legends, leader-line connectors, a guided-focus spotlight, text
marks, a colourblind-safe data-viz palette, and a static/PDF report grammar — for
dashboards and LLM-authored reports.

### [Live demo →](https://ponchia.github.io/bronto-ui/) &nbsp;·&nbsp; [Theme playground →](https://ponchia.github.io/bronto-ui/demo/theme-playground.html)

The demo is the kitchen sink — every component, light/dark, RTL, live theming.

---

## What it is

`@ponchia/ui` ships its design as CSS, not components. You drop in one stylesheet
and style with semantic `ui-*` classes; an optional thin layer of typed
class-name recipes and SSR-safe vanilla behaviors sits on top for the few things
that genuinely need JS (theme persistence, dialogs, toasts, disclosure).

The guiding principle is that **colour is rationed and structure carries
meaning** — layout, type weight, and the hairline do the work before a hue does,
and the accent is a spotlight, not a paint bucket. Because everything lives in a
single `@layer bronto`, your own un-layered CSS overrides the framework with no
specificity fight and no `!important`.

It ships a complete, accessible **standard component set**, but that's not where it competes — its differentiator is the opt-in **analytical & communication layer** sketched above. The line that holds it together: each primitive owns only its visual grammar and pure geometry — no chart engine, no state, no hit-testing. See **[docs/frontier-primitives.md](https://github.com/Ponchia/bronto-ui/blob/main/docs/frontier-primitives.md)** for the thesis.

## Install

```bash
npm i @ponchia/ui
```

Or drop it in with no build step, straight from a CDN:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ponchia/ui/dist/bronto.css">
```

## Quick start

**1. Load the CSS.** One flattened, minified bundle — the whole standard component set, one request (~76 kB raw / ~13 kB gzip):

```css
@import '@ponchia/ui';            /* via a bundler */
```

```html
<!-- or a plain <link>, no bundler -->
<link rel="stylesheet" href="/node_modules/@ponchia/ui/dist/bronto.css">
```

> Prefer source leaves through a bundler? Use `@import '@ponchia/ui/css'` (a thin `@import` fan-out) instead. Both resolve the Doto `@font-face` with relative URLs, so there's no `/fonts` path assumption.

> The bundle is the standard component set. The opt-in analytical & report layers — `report.css`, `dataviz.css`, `annotations.css`, `legend.css`, and the rest — are **not** in `bronto.css`; link each one you need from `dist/css/`. For LLM-authored static reports see [docs/reporting.md](docs/reporting.md).

**2. Write markup with `ui-*` classes** (primary is the default button; modifiers are opt-in):

```html
<button class="ui-button">Save</button>
<button class="ui-button ui-button--ghost">Cancel</button>
<div class="ui-card">
  <span class="ui-eyebrow">Status</span>
  <span class="ui-badge ui-badge--success">Online</span>
</div>
```

**3. (Optional) typed recipes — build class strings in JS/TS:**

```js
import { ui, cx } from '@ponchia/ui/classes';

ui.button({ variant: 'ghost' });   // → "ui-button ui-button--ghost"
ui.meter({ tone: 'warning' });      // → "ui-meter ui-meter--warning"
```

**4. (Optional) behaviors — SSR-safe vanilla JS, each returns a cleanup function:**

```js
import { initThemeToggle, initDialog, toast } from '@ponchia/ui/behaviors';

initThemeToggle();   // wires [data-bronto-theme-toggle] + localStorage
initDialog();        // native <dialog> glue: [data-bronto-open] / [data-bronto-close]
toast('Saved', { tone: 'success' });   // body-anchored stack, no markup needed
```

Behaviors cover theme persistence, disclosure, dropdown menus, native-`<dialog>` modals/drawers, tabs, combobox, form validation, table sort, carousel and toasts — wired by `data-bronto-*` attributes.

**5. (Optional) display glyphs — a 48-glyph dot-matrix icon set:**

```js
import { renderGlyph } from '@ponchia/ui/glyphs';

el.innerHTML = renderGlyph('search', { label: 'Search' });  // role="img"
// or drop a placeholder and expand it: <span data-bronto-glyph="check"></span>
// import { initDotGlyph } from '@ponchia/ui/behaviors'; initDotGlyph();
```

Arrows, chevrons, check/close/plus/minus, search/menu/gear, info/warning/bell/lock, home/user/heart/star/spark and circle-family marks are rendered on the same `.ui-dotmatrix` primitive and re-skinned by the `--field-dot*` tokens. Default dot look is for **display** sizes; pass **`{ solid: true }`** to fuse the cells into a crisp pixel glyph that works as an **inline icon down to ~16px**. For dense lists/tables, `renderGlyph(name, { render: 'mask' })` emits one `.ui-icon` element backed by an internal CSS mask.

## What's in the box

- **Primitives** — buttons, cards, chips, badges, links, key/value, `ui-num`, avatars.
- **Forms** — inputs, select, textarea, search, switch, checkbox, `ui-input-icon`, `ui-input-group`.
- **Feedback** — alert/callout, toast, tooltip, `ui-progress` (task) and `ui-meter` (measured value).
- **Overlay** — modal + drawer on native `<dialog>`, dropdown menu, `ui-carousel` + `ui-lightbox` (gallery, user-driven — not an auto-slider).
- **Disclosure & nav** — tabs, accordion, segmented, breadcrumb, pagination, `ui-steps`, `ui-timeline`, `ui-pagehead`, `ui-kbd`.
- **Shells** — an admin dashboard shell (`ui-app-*`) and a content/marketing site shell (`ui-site*`, `ui-container`).
- **Prose** — `.ui-prose` styles raw, unclassed semantic HTML (Markdown / CMS / LLM output) with zero classes.
- **Analytical & communication primitives** _(opt-in)_ — `@ponchia/ui/css/analytical.css`: SVG **annotations** (subject/connector/note), standalone **legends**/data-keys, text/evidence **marks**, leader-line **connectors** (+ a pure `@ponchia/ui/connectors` geometry kernel), a guided-focus **spotlight**, a **crosshair**/readout, and a cross-cutting **selection** vocabulary. Each owns its visual grammar + pure geometry and refuses scales/state/hit-testing — figures that explain themselves, not a chart engine. Plus standalone **`source`/provenance** (trust) and **lifecycle `state`** leaves.
- **Reports** _(opt-in)_ — `@ponchia/ui/css/report.css`, a static/PDF-first report grammar for LLM-authored HTML: covers, sections, findings, evidence, figures, chart wrappers and print utilities.
- **Motion & dots** — the dot-matrix motif kit: dot grid, status dots, dot loaders, the orbital spinner, matrix reveal — all reduced-motion aware.
- **Glyphs** — `@ponchia/ui/glyphs`, a 48-glyph dot-matrix icon set on the `.ui-dotmatrix` primitive (display marks + crisp `solid` inline icons + one-node `.ui-icon` mask rendering).
- **Colorways** _(opt-in)_ — `data-bronto-skin="amber-crt | phosphor-green | e-ink"`: a root-level recolour of the one accent (OKLCH, per-theme, contrast-gated), never in the default bundle.
- **Data-viz** _(opt-in)_ — a colourblind-safe chart palette (`--chart-*` + dot-matrix pattern fills, resolved hex in `charts.json`), gated under simulated protan/deutan/tritan vision. Charts only, never UI chrome.

Full generated catalog of every class: **[docs/reference.md](https://github.com/Ponchia/bronto-ui/blob/main/docs/reference.md)**. The decision guide (which primitive when): **[docs/usage.md](https://github.com/Ponchia/bronto-ui/blob/main/docs/usage.md)**.

## Theming: one knob

Everything accent-colored derives from a single `--accent` variable via `color-mix()`. Re-brand the entire app — both light and dark — with one declaration, globally or scoped to any subtree:

```css
:root   { --accent: #2f6df6; }   /* whole app blue   */
.promo  { --accent: #16a34a; }   /* …or just this section green */
```

Buttons, focus rings, dot motifs, accent borders and soft fills all follow automatically. Light/dark is `data-theme="light"` / `"dark"` on `<html>` (defaults to `prefers-color-scheme`); `data-density` and `data-contrast` give density and contrast presets. A full re-skin (radius, display face, dot density, surfaces) is a handful more token overrides — the default monochrome look is **one skin, not the architecture**.

**One system, many skins.** That the knob is real isn't a claim — it ships: drop in `@ponchia/ui/css/skins.css` and set `data-bronto-skin="amber-crt | phosphor-green | e-ink"` on `<html>` for a complete, contrast-gated recolour (the derived accent family, focus ring, dot-matrix and glyphs all follow). Colour is governed in **tiers** — neutral canvas · one accent · locked status · display expression · opt-in data-viz — so it always earns its place; the full constitution is **[ADR-0001](https://github.com/Ponchia/bronto-ui/blob/main/docs/adr/0001-color-system.md)**.

> When you change `--accent`, contrast becomes yours: verify your hue in the **[theme playground](https://ponchia.github.io/bronto-ui/demo/theme-playground.html)** (it shows the derived family and computed WCAG ratios). Full contract: **[docs/theming.md](https://github.com/Ponchia/bronto-ui/blob/main/docs/theming.md)**.

## Accessibility

Not an afterthought — a gate. Every contractual token pairing has a declared WCAG 2.1 conformance level the build **fails** below (`docs/contrast.md`, regenerated + CI-checked), and the shipped colorways are held to the same floors. The data-viz palette is gated for distinctness under simulated protanopia/deuteranopia/tritanopia, and never relies on colour alone (dot-matrix pattern fills). APCA `Lc` is published advisory alongside WCAG. Components ship ARIA-correct markup and SSR-safe keyboard behaviors; `prefers-reduced-motion`, `prefers-contrast` and `forced-colors` are all honored.

## Works with anything

The CSS is the framework, so it works with React, Svelte/SvelteKit, Astro, Vue, Solid, Qwik or plain HTML — there's no component runtime to adopt. The optional `classes` and `behaviors` entrypoints pull in **no** UI framework and are SSR-safe. For React, Solid and Qwik there are also **optional thin bindings** — `@ponchia/ui/react`, `@ponchia/ui/solid` and `@ponchia/ui/qwik` wrap the behaviors as hooks (`useDialog`, `useToast`, …); `react`/`solid-js`/`@builder.io/qwik` are optional peer deps, so the core stays zero-dependency.

Per-framework getting-started guides + runnable example apps live in the repo:

| Stack | Guide | Example |
| ----- | ----- | ------- |
| Vanilla / Vite / plain HTML | [vanilla.md](https://github.com/Ponchia/bronto-ui/blob/main/docs/getting-started/vanilla.md) | [`examples/vanilla-vite`](https://github.com/Ponchia/bronto-ui/tree/main/examples/vanilla-vite) |
| Astro | [astro.md](https://github.com/Ponchia/bronto-ui/blob/main/docs/getting-started/astro.md) | [`examples/astro`](https://github.com/Ponchia/bronto-ui/tree/main/examples/astro) |
| SvelteKit | [sveltekit.md](https://github.com/Ponchia/bronto-ui/blob/main/docs/getting-started/sveltekit.md) | [`examples/sveltekit`](https://github.com/Ponchia/bronto-ui/tree/main/examples/sveltekit) |
| React | [react-solid.md](https://github.com/Ponchia/bronto-ui/blob/main/docs/getting-started/react-solid.md) | [`examples/react-vite`](https://github.com/Ponchia/bronto-ui/tree/main/examples/react-vite) |
| Solid | [react-solid.md](https://github.com/Ponchia/bronto-ui/blob/main/docs/getting-started/react-solid.md) | [`examples/solid-vite`](https://github.com/Ponchia/bronto-ui/tree/main/examples/solid-vite) |
| Qwik | [react-solid.md](https://github.com/Ponchia/bronto-ui/blob/main/docs/getting-started/react-solid.md) | [`examples/qwik-vite`](https://github.com/Ponchia/bronto-ui/tree/main/examples/qwik-vite) |
| Tailwind / cascade-layer interop | [tailwind.md](https://github.com/Ponchia/bronto-ui/blob/main/docs/interop/tailwind.md) | — |

## Extras

- **Tokens as data** — `import tokens, { themeColor, cssVars } from '@ponchia/ui/tokens'` (plus `tokens.json`, W3C DTCG `tokens.dtcg.json`, and `tokens/resolved.json` — concrete hex per theme for canvas/SVG/MapLibre).
- **Chart colours for dashboards** — `import charts from '@ponchia/ui/charts.json' with { type: 'json' }` in Node ESM, or the same path through a bundler JSON import (resolved hex per theme; series 1 = your accent) plus the opt-in `@ponchia/ui/css/dataviz.css`.
- **Static reports for LLMs** — add `@ponchia/ui/css/report.css` for report structure and print utilities; pair with `@ponchia/ui/css/dataviz.css` only when the report contains charts. Full cookbook: `docs/reporting.md`.
- **Modern-platform motion** — overlays (modal/drawer/popover), toasts and the `<details>` accordion animate **in and out** with zero JS (`@starting-style` + `allow-discrete`, `::details-content` + `interpolate-size`). Progressive-enhancement extras: `.ui-scroll-progress` / `.ui-scroll-reveal` (scroll-driven, no JS) and `.ui-vt` for View Transitions. All degrade to a static end-state and respect `prefers-reduced-motion`. For smooth **cross-document** navigations, add the document-global one-liner to your own top-level (unlayered) CSS: `@view-transition { navigation: auto; }`.
- **Editor IntelliSense** — point VS Code at the shipped custom-data file so every token autocompletes in `var(--…)`:
  ```json
  { "css.customData": ["node_modules/@ponchia/ui/classes/vscode.css-custom-data.json"] }
  ```
- **For AI coding agents** — the package ships `llms.txt` at its root plus `docs/reference.md`, `docs/usage.md`, `docs/reporting.md`, `docs/theming.md`, `docs/contrast.md`, `docs/stability.md`, the color constitution `docs/adr/0001-color-system.md` and the `CHANGELOG` inside the tarball, so an offline agent has the full API and rationale without guessing.

> The package root is **CSS-only**. Use `@import '@ponchia/ui'` in CSS, or `import '@ponchia/ui'` only as a CSS side-effect import in a CSS-aware bundler (Vite, Astro, SvelteKit, webpack). Do not import the package root from Node/runtime JS. JS entrypoints are explicit subpaths: `/tokens`, `/classes`, `/behaviors`, `/glyphs`, `/react`, `/solid`, `/qwik`, `/skins`, and `/charts`.
> JS subpaths are **ESM-only**. CommonJS consumers should use dynamic
> `import('@ponchia/ui/behaviors')`.

## Browser support

Recent-evergreen, by design. The framework targets the modern web platform — cascade layers, `:has()`, `color-mix()`/`oklch()`, logical properties, native `<dialog>`, and the 2026 interaction primitives (`@starting-style`, `transition-behavior: allow-discrete`, `light-dark()`). Floor: **Chrome/Edge 125+, Safari 18+, Firefox 129+** (early–mid 2025). No fallback ships below this — pin an older tag if you need it. See [ADR-0002](https://github.com/Ponchia/bronto-ui/blob/main/docs/adr/0002-scope-and-2026-baseline.md) for the scope/greenfield rationale.

## Versioning

Pre-1.0 and deliberately so. **Until `1.0.0`, breaking changes ship in the _minor_** (`0.x.0`); patches (`0.x.y`) are always non-breaking. Pin with the patch range — at `0.x`, `~0.6.0` (and equivalently `^0.6.0`) resolves to `>=0.6.0 <0.7.0`, giving you safe patches while holding back the next breaking minor. Every breaking change is called out under a **BREAKING** heading in the **[CHANGELOG](https://github.com/Ponchia/bronto-ui/blob/main/CHANGELOG.md)** with a migration note.

Contractual (changes are breaking): token **names** and documented token roles, `.ui-*` class and recipe names, `data-bronto-*` attributes, exported behavior/glyph/binding function names and each behavior's cleanup contract. Not contractual (may change any release): exact token **values** and generated colour math outputs (visual tuning) unless a doc explicitly says the value is stable, plus internal leaf-file / `@layer` boundaries. See **[docs/stability.md](https://github.com/Ponchia/bronto-ui/blob/main/docs/stability.md)** for the full public-surface matrix.

Release candidates publish to the `next` dist-tag, never to `latest` — opt in with `npm i @ponchia/ui@next` to try an upcoming version early. A plain `npm i @ponchia/ui` only ever resolves a stable release.

## Links

- **[Live demo](https://ponchia.github.io/bronto-ui/)** · **[Theme playground](https://ponchia.github.io/bronto-ui/demo/theme-playground.html)**
- **[Class reference](https://github.com/Ponchia/bronto-ui/blob/main/docs/reference.md)** · **[Usage guide](https://github.com/Ponchia/bronto-ui/blob/main/docs/usage.md)** · **[Theming](https://github.com/Ponchia/bronto-ui/blob/main/docs/theming.md)** · **[Contrast](https://github.com/Ponchia/bronto-ui/blob/main/docs/contrast.md)** · **[Color system (ADR-0001)](https://github.com/Ponchia/bronto-ui/blob/main/docs/adr/0001-color-system.md)** · **[Scope & 2026 baseline (ADR-0002)](https://github.com/Ponchia/bronto-ui/blob/main/docs/adr/0002-scope-and-2026-baseline.md)**
- **[CHANGELOG](https://github.com/Ponchia/bronto-ui/blob/main/CHANGELOG.md)** · **[Roadmap](https://github.com/Ponchia/bronto-ui/blob/main/ROADMAP.md)** · **[Contributing](https://github.com/Ponchia/bronto-ui/blob/main/CONTRIBUTING.md)** · **[Repository layout](https://github.com/Ponchia/bronto-ui/blob/main/docs/architecture.md#repository-layout)**

## License

[MIT](https://github.com/Ponchia/bronto-ui/blob/main/LICENSE) © Ponchia.

The bundled **Doto** font (`fonts/*.woff2`) is © 2024 The Doto Project Authors and licensed separately under the [SIL Open Font License 1.1](https://github.com/Ponchia/bronto-ui/blob/main/fonts/OFL.txt) — see `fonts/OFL.txt`.
