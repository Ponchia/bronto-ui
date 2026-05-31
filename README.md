# @ponchia/ui

[![npm](https://img.shields.io/npm/v/@ponchia/ui?logo=npm)](https://www.npmjs.com/package/@ponchia/ui)
[![npm provenance](https://img.shields.io/badge/npm-provenance-blue?logo=npm)](https://www.npmjs.com/package/@ponchia/ui#provenance)
[![runtime deps](https://img.shields.io/badge/runtime%20deps-0-brightgreen)](https://github.com/Ponchia/bronto-ui/blob/main/package.json)
[![dist](https://img.shields.io/badge/dist-~73kB%20%2F%20~13kB%20gzip-informational)](https://github.com/Ponchia/bronto-ui/blob/main/scripts/check-dist.mjs)
[![CI](https://github.com/Ponchia/bronto-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/Ponchia/bronto-ui/actions/workflows/ci.yml)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/Ponchia/bronto-ui/badge)](https://scorecard.dev/viewer/?uri=github.com/Ponchia/bronto-ui)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue)](https://github.com/Ponchia/bronto-ui/blob/main/LICENSE)

**A CSS-first, framework-agnostic UI framework with a "Nothing"-inspired look — monochrome surfaces, one rationed red accent, dot-matrix display type, hairline borders, restrained motion. Zero runtime dependencies. Re-brand the whole thing with one CSS variable.**

### [Live demo →](https://ponchia.github.io/bronto-ui/) &nbsp;·&nbsp; [Theme playground →](https://ponchia.github.io/bronto-ui/demo/theme-playground.html)

The demo is the kitchen sink — every component, light/dark, RTL, live theming.

---

## What it is

`@ponchia/ui` ships its design as **CSS**, not components. You drop in one stylesheet and style with semantic `ui-*` classes; an optional thin layer of typed class-name recipes and SSR-safe vanilla behaviors sits on top for the few things that genuinely need JS (theme persistence, dialogs, toasts, disclosure). The guiding principle is **color is rationed, structure carries meaning** — layout, type weight and the hairline do the work before a hue does, and the accent is a spotlight, not a paint bucket. Because everything lives in a single `@layer bronto`, your own un-layered CSS overrides the framework with no specificity fight and no `!important`.

## Install

```bash
npm i @ponchia/ui
```

Or drop it in with no build step, straight from a CDN:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ponchia/ui/dist/bronto.css">
```

## Quick start

**1. Load the CSS.** One flattened, minified bundle — the whole framework, one request (~73 kB raw / ~13 kB gzip):

```css
@import '@ponchia/ui';            /* via a bundler */
```

```html
<!-- or a plain <link>, no bundler -->
<link rel="stylesheet" href="/node_modules/@ponchia/ui/dist/bronto.css">
```

> Prefer source leaves through a bundler? Use `@import '@ponchia/ui/css'` (a thin `@import` fan-out) instead. Both resolve the Doto `@font-face` with relative URLs, so there's no `/fonts` path assumption.

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

**5. (Optional) display glyphs — dot-matrix bitmaps, decorative by default:**

```js
import { renderGlyph } from '@ponchia/ui/glyphs';

el.innerHTML = renderGlyph('heart', { label: 'Favourite' });  // role="img"
// or drop a placeholder and expand it: <span data-bronto-glyph="check"></span>
// import { initDotGlyph } from '@ponchia/ui/behaviors'; initDotGlyph();
```

Glyphs render on the same `.ui-dotmatrix` primitive and re-skin with the `--field-dot*` tokens — no SVG, no font.

## What's in the box

- **Primitives** — buttons, cards, chips, badges, links, key/value, `ui-num`, avatars.
- **Forms** — inputs, select, textarea, search, switch, checkbox, `ui-input-icon`, `ui-input-group`.
- **Feedback** — alert/callout, toast, tooltip, `ui-progress` (task) and `ui-meter` (measured value).
- **Overlay** — modal + drawer on native `<dialog>`, dropdown menu, `ui-carousel` + `ui-lightbox` (gallery, user-driven — not an auto-slider).
- **Disclosure & nav** — tabs, accordion, segmented, breadcrumb, pagination, `ui-steps`, `ui-timeline`, `ui-pagehead`, `ui-kbd`.
- **Shells** — an admin dashboard shell (`ui-app-*`) and a content/marketing site shell (`ui-site*`, `ui-container`).
- **Prose** — `.ui-prose` styles raw, unclassed semantic HTML (Markdown / CMS / LLM output) with zero classes.
- **Motion & dots** — the dot-matrix motif kit: dot grid, status dots, dot loaders, the orbital spinner, matrix reveal — all reduced-motion aware.

Full generated catalog of every class: **[docs/reference.md](https://github.com/Ponchia/bronto-ui/blob/main/docs/reference.md)**. The decision guide (which primitive when): **[docs/usage.md](https://github.com/Ponchia/bronto-ui/blob/main/docs/usage.md)**.

## Theming: one knob

Everything accent-colored derives from a single `--accent` variable via `color-mix()`. Re-brand the entire app — both light and dark — with one declaration, globally or scoped to any subtree:

```css
:root   { --accent: #2f6df6; }   /* whole app blue   */
.promo  { --accent: #16a34a; }   /* …or just this section green */
```

Buttons, focus rings, dot motifs, accent borders and soft fills all follow automatically. Light/dark is `data-theme="light"` / `"dark"` on `<html>` (defaults to `prefers-color-scheme`); `data-density` and `data-contrast` give density and contrast presets. A full re-skin (radius, display face, dot density, surfaces) is a handful more token overrides — the "Nothing" look is the **default skin, not the architecture**.

> When you change `--accent`, contrast becomes yours: verify your hue in the **[theme playground](https://ponchia.github.io/bronto-ui/demo/theme-playground.html)** (it shows the derived family and computed WCAG ratios). Full contract: **[docs/theming.md](https://github.com/Ponchia/bronto-ui/blob/main/docs/theming.md)**.

## Works with anything

The CSS is the framework, so it works with React, Svelte/SvelteKit, Astro, Vue, Solid or plain HTML — there's no component runtime to adopt. The optional `classes` and `behaviors` entrypoints pull in **no** UI framework and are SSR-safe.

Per-framework getting-started guides + runnable example apps live in the repo:

| Stack | Guide | Example |
| ----- | ----- | ------- |
| Vanilla / Vite / plain HTML | [vanilla.md](https://github.com/Ponchia/bronto-ui/blob/main/docs/getting-started/vanilla.md) | [`examples/vanilla-vite`](https://github.com/Ponchia/bronto-ui/tree/main/examples/vanilla-vite) |
| Astro | [astro.md](https://github.com/Ponchia/bronto-ui/blob/main/docs/getting-started/astro.md) | [`examples/astro`](https://github.com/Ponchia/bronto-ui/tree/main/examples/astro) |
| SvelteKit | [sveltekit.md](https://github.com/Ponchia/bronto-ui/blob/main/docs/getting-started/sveltekit.md) | [`examples/sveltekit`](https://github.com/Ponchia/bronto-ui/tree/main/examples/sveltekit) |
| React / Solid (snippet) | [react-solid.md](https://github.com/Ponchia/bronto-ui/blob/main/docs/getting-started/react-solid.md) | — |
| Tailwind / cascade-layer interop | [tailwind.md](https://github.com/Ponchia/bronto-ui/blob/main/docs/interop/tailwind.md) | — |

## Extras

- **Tokens as data** — `import tokens, { themeColor, cssVars } from '@ponchia/ui/tokens'` (plus `tokens.json`, W3C DTCG `tokens.dtcg.json`, and `tokens/resolved.json` for charts/data-viz).
- **Editor IntelliSense** — point VS Code at the shipped custom-data file so every token autocompletes in `var(--…)`:
  ```json
  { "css.customData": ["node_modules/@ponchia/ui/classes/vscode.css-custom-data.json"] }
  ```
- **For AI coding agents** — the package ships `llms.txt` at its root plus `docs/reference.md`, `docs/usage.md` and `docs/theming.md` inside the tarball, so an offline agent has the full API without guessing.

> The package root is **CSS-only**: `@import '@ponchia/ui'` in CSS, never `import '@ponchia/ui'` in JS. The JS entrypoints are the explicit subpaths `/tokens`, `/classes`, `/behaviors`, `/glyphs`.

## Browser support

Evergreen only. The framework relies on cascade layers, `:has()`, `color-mix()`, CSS logical properties and native `<dialog>`. Floor: **Chrome/Edge 111+, Safari 16.4+, Firefox 121+** (early 2023 onward). No build-time fallback ships; pin an older tag if you need below this.

## Versioning

Pre-1.0 and deliberately so. **Until `1.0.0`, breaking changes ship in the _minor_** (`0.x.0`); patches (`0.x.y`) are always non-breaking. Pin with the patch range — at `0.x`, `~0.3.0` (and equivalently `^0.3.0`) resolves to `>=0.3.0 <0.4.0`, giving you safe patches while holding back the next breaking minor. Every breaking change is called out under a **BREAKING** heading in the **[CHANGELOG](https://github.com/Ponchia/bronto-ui/blob/main/CHANGELOG.md)** with a migration note.

Contractual (changes are breaking): the `--accent` derivation and token **names**, the `.ui-*` class and recipe names, the `data-bronto-*` attributes, and each behavior's cleanup contract. Not contractual (may change any release): token **values** (visual tuning) and internal leaf-file / `@layer` boundaries.

Release candidates publish to the `next` dist-tag, never to `latest` — opt in with `npm i @ponchia/ui@next` to try an upcoming version early. A plain `npm i @ponchia/ui` only ever resolves a stable release.

## Links

- **[Live demo](https://ponchia.github.io/bronto-ui/)** · **[Theme playground](https://ponchia.github.io/bronto-ui/demo/theme-playground.html)**
- **[Class reference](https://github.com/Ponchia/bronto-ui/blob/main/docs/reference.md)** · **[Usage guide](https://github.com/Ponchia/bronto-ui/blob/main/docs/usage.md)** · **[Theming](https://github.com/Ponchia/bronto-ui/blob/main/docs/theming.md)** · **[Contrast](https://github.com/Ponchia/bronto-ui/blob/main/docs/contrast.md)**
- **[CHANGELOG](https://github.com/Ponchia/bronto-ui/blob/main/CHANGELOG.md)** · **[Roadmap](https://github.com/Ponchia/bronto-ui/blob/main/ROADMAP.md)** · **[Contributing](https://github.com/Ponchia/bronto-ui/blob/main/CONTRIBUTING.md)**

## License

[MIT](https://github.com/Ponchia/bronto-ui/blob/main/LICENSE) © Ponchia.

The bundled **Doto** font (`fonts/*.ttf`) is © 2024 The Doto Project Authors and licensed separately under the [SIL Open Font License 1.1](https://github.com/Ponchia/bronto-ui/blob/main/fonts/OFL.txt) — see `fonts/OFL.txt`.
