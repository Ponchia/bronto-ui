# @ponchia/ui

Shared UI framework for Bronto personal projects. Nothing-inspired:
monochrome surfaces, a single red accent, dot-matrix display type (Doto),
flat hairline borders, restrained motion. CSS-first and framework-agnostic.

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

Import the full theme (includes responsive breakpoints):

```css
@import '@ponchia/ui/css';
```

Or the core bundle if the app manages its own responsive layer:

```css
@import '@ponchia/ui/css/core.css';
```

**Prebuilt single file (recommended for apps without a CSS bundler).**
`@ponchia/ui/css` is a 17-deep `@import` graph — fine through a bundler,
a load waterfall over plain HTTP. The package also ships flattened,
minified bundles with no `@import` chain:

```css
@import '@ponchia/ui';               /* → dist/bronto.css, full   */
@import '@ponchia/ui/dist/bronto-core.css';   /* core, no responsive */
```

~62 kB raw / ~11 kB gzip, one request, same `@layer bronto`. Source CSS,
tokens/classes/behaviors entrypoints are unchanged — use whichever fits.

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
The layer is applied by the `css` and `css/core.css` bundles only —
importing an individual leaf such as `@ponchia/ui/css/primitives.css`
directly is **unlayered** (full specificity), which is an intentional
escape hatch, not the default path.

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
`[data-bronto-dismissible]`, `[data-bronto-disclosure]`, and native
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
| `app.css`        | admin shell: rail, topbar, toolbar, panel, metrics            |
| `navigation.css` | site nav, menu, theme toggle (dot indicator)                  |
| `typography.css` | display headings, eyebrows, legacy `.button`                  |
| `content.css`    | `.ui-prose` — Markdown/raw-HTML long-form, zero per-element classes |
| `cards.css`      | semantic content cards (token-driven)                         |
| `layout.css`     | site shell, hero, grids                                       |
| `responsive.css` | breakpoint overrides                                          |

## Demo

`demo/index.html` is a kitchen sink covering every primitive in both themes.
Serve the package root and open `/demo/`:

```bash
python3 -m http.server -d . 8080   # then open http://localhost:8080/demo/
```

## Develop

```bash
npm install        # stylelint + jsdom (test only)
npm run check      # lint + 4 integrity checks (exports, tokens, classes, pack)
npm test           # node:test — pure modules + jsdom behavior tests
npm run lint:fix   # auto-fix the safe stylistic rules
npm run tokens:build  # regenerate tokens/index.json from tokens/index.js
```

`npm run check` enforces that the data mirrors cannot drift from the CSS:
exports/import-graph integrity, `tokens.css` ⇄ `tokens/index.{js,json}`, the
`classes` registry ⇄ the `.ui-*` selectors, and that the published tarball
ships only the intended files. CI
(`.github/workflows/ci.yml`) runs it on every branch push and PR. It never
publishes — a push to `main` ships nothing.

## Release

Releases publish to npm and are tag-driven:

```bash
# 1. bump "version" in package.json, land on main, let CI go green
git tag vX.Y.Z && git push origin vX.Y.Z
```

The tag triggers `.github/workflows/release.yml`: `validate` (read-only
checks + tag↔version match) → `publish-npm` (only if validate passes) +
`release-notes`. **The npm publish is the gate** — a failing check means
the version never reaches npm, so consumers never resolve it. GitHub also
serves the raw tag tarball ungated, but that is a legacy/fallback path, not
the documented install. See [`docs/architecture.md`](docs/architecture.md).

Published: `@ponchia/ui` is live on npm (latest `0.2.1`), released by CI
with provenance. The `@ponchia` scope and the `NPM_TOKEN` repo secret are
in place, so a pushed `vX.Y.Z` tag is all a release needs.

## Consumers

Built for two shapes of app: a content/marketing site (imports
`@ponchia/ui/css/core.css`) and an admin dashboard (imports the full
`@ponchia/ui/css`). Consuming apps depend on it via `@ponchia/ui`.
