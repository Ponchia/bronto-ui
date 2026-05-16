# @ponchia/ui

[![npm](https://img.shields.io/npm/v/@ponchia/ui?logo=npm)](https://www.npmjs.com/package/@ponchia/ui)
[![npm provenance](https://img.shields.io/badge/npm-provenance-blue?logo=npm)](https://www.npmjs.com/package/@ponchia/ui#provenance)
[![runtime deps](https://img.shields.io/badge/runtime%20deps-0-brightgreen)](package.json)
[![bundle](https://img.shields.io/badge/dist-~54kB%20%2F%20~10kB%20gzip-informational)](scripts/check-dist.mjs)
[![CI](https://github.com/Ponchia/bronto-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/Ponchia/bronto-ui/actions/workflows/ci.yml)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

Shared UI framework for Bronto personal projects. Nothing-inspired:
monochrome surfaces, a single red accent, dot-matrix display type (Doto),
flat hairline borders, restrained motion. CSS-first and framework-agnostic.

**New here?** → [Getting started](#getting-started) ·
[Theming](docs/theming.md) · [Roadmap](ROADMAP.md) ·
[Contributing](CONTRIBUTING.md)

**[Live demo →](https://ponchia.github.io/bronto-ui/)** — the kitchen
sink (every component, light/dark, RTL, theming) deployed from `demo/`.

## Use

Install from npm (public, no registry config):

```bash
npm i @ponchia/ui
```

> Naming: the **npm package** is `@ponchia/ui` (the `@bronto` scope isn't
> ownable). The **CSS layer** and behavior attributes stay `bronto`
> (`@layer bronto`, `data-bronto-*`) — that's the design-system namespace,
> deliberately distinct from the package name. See
> [`docs/architecture.md`](docs/architecture.md).

Import the theme (one bundle — `ui-*` components carry their own
breakpoints, so there is no separate core/full split as of 0.3.0):

```css
@import '@ponchia/ui/css';        /* === @ponchia/ui/css/core.css */
```

**Prebuilt single file (recommended for apps without a CSS bundler).**
`@ponchia/ui/css` is a wide `@import` fan-out (~14 leaves, one level
deep) — fine through a bundler, a load waterfall over plain HTTP. The
package also ships one flattened, minified bundle with no `@import`
chain:

```css
@import '@ponchia/ui';   /* → dist/bronto.css, the whole framework */
```

~54 kB raw / ~10 kB gzip, one request, same `@layer bronto`. (The
enforced ceiling lives in `scripts/check-dist.mjs`, not this prose —
treat these figures as indicative.) Source CSS, tokens/classes/behaviors
entrypoints are unchanged — use whichever fits.

> **The package root is CSS-only.** `@ponchia/ui` (the `.` export)
> resolves to a stylesheet — `@import '@ponchia/ui'` in CSS, never
> `import '@ponchia/ui'` in JS. There is no JS module at the root; the
> JS entrypoints are the explicit subpaths `@ponchia/ui/tokens`,
> `/classes`, and `/behaviors` (see [Entrypoints](#entrypoints)).

### Browser support

Evergreen only — the framework relies on cascade layers (`@layer`),
`:has()`, `color-mix()`, CSS logical properties and native `<dialog>`.
Floor: **Chrome/Edge 111+, Safari 16.4+, Firefox 121+** (early 2023
onward). No build-time fallback is shipped; pin an older tag if you must
support below this.

The Doto `@font-face` ships in `css/fonts.css` (bundled by both `css` and
`css/core.css`) with URLs relative to the package, so it resolves through a
bundler or static serving with no `/fonts` path assumption. To self-host the
font instead, import everything except `fonts.css` and override `--display` /
`--dot-font`.

Everything ships inside a single `@layer bronto`, so any un-layered CSS in
your app overrides the framework without a specificity fight or `!important`.

> **Leaf imports are layer-safe by default.** Every per-leaf export —
> `@ponchia/ui/css/primitives.css`, etc. — is self-wrapped in
> `@layer bronto`, so mixing the bundle with individual leaves (e.g.
> per-route CSS splitting in SvelteKit/Astro) is safe: no silent
> cascade inversion. The deliberate full-specificity escape hatch is
> the explicit `@ponchia/ui/css/unlayered/<leaf>.css` path — use it
> only when you *want* an unlayered override, never by accident.

Set `data-theme="light"` or `data-theme="dark"` on `<html>`; defaults follow
`prefers-color-scheme`.

**Re-brand with one knob:** `--accent` drives the whole accent family
(`color-mix`-derived). `:root { --accent: #2f6df6 }` — or scope it to a
subtree — restyles everything, both themes. Plus `data-density` and
`data-contrast` presets. Full contract: [`docs/theming.md`](docs/theming.md).

## Entrypoints

The CSS is the framework. These optional sibling entrypoints are thin layers
on top of it — none pull in a UI framework. See
[`docs/architecture.md`](docs/architecture.md) for the rationale.

```js
import tokens, { cssVars, themeColor } from '@ponchia/ui/tokens'; // tokens as data (+ /tokens.json)
import { ui, cx } from '@ponchia/ui/classes'; // typed class-name recipes
import { initThemeToggle, dismissible } from '@ponchia/ui/behaviors'; // vanilla, SSR-safe
```

```js
ui.button({ variant: 'ghost' }); // → "ui-button ui-button--ghost"
themeColor('dark').accent; // → "#ff3b41"
```

`behaviors` wires `[data-bronto-theme-toggle]`, `[data-bronto-dismiss]` /
`[data-bronto-dismissible]`, `[data-bronto-disclosure]`,
`[data-bronto-menu]` (`initMenu`: Escape / outside-click /
close-on-activate for a `<details>` `.ui-menu` dropdown), and native
`<dialog>` glue (`initDialog`: `[data-bronto-open]` / `[data-bronto-close]`
/ `[data-bronto-dialog-light]`). `toast(message, { tone, title, duration })`
pushes into a shared, body-anchored stack. Each initializer is SSR-safe and
returns a cleanup function. `demo/index.html` drives itself with these
modules, so it is also a live integration test.

## Layout

| File             | Contents                                                      |
| ---------------- | ------------------------------------------------------------- |
| `tokens.css`     | palette (dual light/dark), spacing, type, motion, dot tokens  |
| `fonts.css`      | Doto `@font-face` (relative URLs; optional if self-hosting)    |
| `base.css`       | reset, element defaults, focus, scrollbars                    |
| `motion.css`     | keyframes + animation utilities + reduced-motion              |
| `dots.css`       | dot-grid, dot rule, status dot, dot loader, orbital dot spinner, dot bar (+ indeterminate), matrix reveal |
| `primitives.css` | `ui-*` buttons, cards, chips, badges, links, key/value        |
| `forms.css`      | inputs, select, textarea, search, switch, checkbox            |
| `feedback.css`   | alert / callout, toast, tooltip, linear progress              |
| `overlay.css`    | modal + drawer (native `<dialog>`), dropdown menu             |
| `disclosure.css` | tabs, accordion (`<details>`), segmented, breadcrumb, pagination, avatar |
| `table.css`      | `ui-table` dense / comfortable                                |
| `app.css`        | admin shell: `ui-app-shell`/`-rail`/`-topbar`/`-toolbar`/`-panel`/`-nav`/`-metrics` |
| `navigation.css` | `ui-themetoggle` (dot-thumb switch)                           |
| `site.css`       | content-site shell: `ui-container`, `ui-siteheader`/`ui-sitenav` (aria-current), `ui-sitemenu`, `ui-sitefooter`, `ui-skiplink`, `ui-tags`, `ui-meta` |
| `content.css`    | `.ui-prose` Markdown/raw-HTML long-form (zero classes) + `ui-quote` pull-quote |

## Getting started

| Consumer                | Guide                                                              |
| ----------------------- | ------------------------------------------------------------------ |
| Astro                   | [`docs/getting-started/astro.md`](docs/getting-started/astro.md)   |
| SvelteKit               | [`docs/getting-started/sveltekit.md`](docs/getting-started/sveltekit.md) |
| Vanilla / Vite / plain  | [`docs/getting-started/vanilla.md`](docs/getting-started/vanilla.md) |
| React / Solid (snippet) | [`docs/getting-started/react-solid.md`](docs/getting-started/react-solid.md) |
| Tailwind / cascade-layer interop | [`docs/interop/tailwind.md`](docs/interop/tailwind.md)    |

Each covers the CSS import location, the **no-flash** `applyStoredTheme`
head-script pattern, behavior init/cleanup in that framework's lifecycle,
and SSR caveats. Index: [`docs/integration.md`](docs/integration.md).

## Demo

`demo/index.html` is a kitchen sink covering every primitive in both
themes — it drives itself with the real behavior modules, so it is also a
live integration test. Serve the package root and open `/demo/`:

```bash
python3 -m http.server -d . 8080   # then open http://localhost:8080/demo/
```

## Develop & release

Contributor setup, the 12 `check` gates, the e2e suite, the visual-
baseline workflow, the deprecation policy and the tag-driven release
flow all live in **[CONTRIBUTING.md](CONTRIBUTING.md)**. Direction and
scope: **[ROADMAP.md](ROADMAP.md)**.

## Versioning

Pre-1.0 and deliberately so. **Until `1.0.0`, breaking changes ship in
the _minor_** (`0.x.0`); patches (`0.x.y`) are non-breaking. This is the
standard 0.x reading of SemVer, stated explicitly because this framework
dresses several apps:

- Because breaking changes bump the **minor**, the protective range is
  the patch range. At `0.x` npm resolves **both** `^0.3.0` and `~0.3.0`
  to `>=0.3.0 <0.4.0` — they are equivalent here, and either gives you
  only non-breaking `0.3.x` patches while holding back the next
  (breaking) `0.4.0`. Pin either; pin an **exact** version if you want
  zero surprise and to adopt each minor deliberately.
- Every breaking change is called out in [`CHANGELOG.md`](CHANGELOG.md)
  under a **BREAKING** heading with a migration note.

**What is contractual** (changes are breaking): the `--accent`
derivation and token **names** (incl. `--accent-text`, `--focus-ring`);
the `.ui-*` class names and `cls`/recipe names; the `data-bronto-*`
behavior attributes; each behavior's return-cleanup contract. **What is
not** (may change in any release): token _values_ (visual tuning), the
internal leaf-file boundaries and `@layer` internals, and anything
explicitly marked legacy/deprecated. Full token contract:
[`docs/theming.md`](docs/theming.md).

## Consumers

Built for two shapes of app: a content/marketing site (`ui-site*`,
`ui-prose`) and an admin dashboard (`ui-app-*` shell). Both import the
one bundle `@ponchia/ui` (or `@ponchia/ui/css`); consuming apps depend
on it via `@ponchia/ui`.
