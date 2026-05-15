# @bronto/ui

Shared UI framework for Bronto personal projects. Nothing-inspired:
monochrome surfaces, a single red accent, dot-matrix display type (Doto),
flat hairline borders, restrained motion. CSS-first and framework-agnostic.

## Use

Pin a tagged GitHub release tarball (reproducible, no registry needed):

```json
{ "dependencies": { "@bronto/ui": "https://github.com/Ponchia/bronto-ui/archive/refs/tags/v0.1.0.tar.gz" } }
```

For local iteration against a checkout, swap to a `file:` link instead:

```json
{ "dependencies": { "@bronto/ui": "file:../bronto-ui" } }
```

Import the full theme (includes responsive breakpoints):

```css
@import '@bronto/ui/css';
```

Or the core bundle if the app manages its own responsive layer:

```css
@import '@bronto/ui/css/core.css';
```

The Doto `@font-face` ships in `css/fonts.css` (bundled by both `css` and
`css/core.css`) with URLs relative to the package, so it resolves through a
bundler or static serving with no `/fonts` path assumption. To self-host the
font instead, import everything except `fonts.css` and override `--display` /
`--dot-font`.

Everything ships inside a single `@layer bronto`, so any un-layered CSS in
your app overrides the framework without a specificity fight or `!important`.

Set `data-theme="light"` or `data-theme="dark"` on `<html>`; defaults follow
`prefers-color-scheme`.

## Entrypoints

The CSS is the framework. These optional sibling entrypoints are thin layers
on top of it — none pull in a UI framework. See
[`docs/architecture.md`](docs/architecture.md) for the rationale.

```js
import tokens, { cssVars, themeColor } from '@bronto/ui/tokens'; // tokens as data (+ /tokens.json)
import { ui, cx } from '@bronto/ui/classes'; // typed class-name recipes
import { initThemeToggle, dismissible } from '@bronto/ui/behaviors'; // vanilla, SSR-safe
```

```js
ui.button({ variant: 'ghost' }); // → "ui-button ui-button--ghost"
themeColor('dark').accent; // → "#ff3b41"
```

`behaviors` wires `[data-bronto-theme-toggle]`, `[data-bronto-dismiss]` /
`[data-bronto-dismissible]`, and `[data-bronto-disclosure]`. Each initializer
is SSR-safe and returns a cleanup function. `demo/index.html` drives itself
with these modules, so it is also a live integration test.

## Layout

| File             | Contents                                                      |
| ---------------- | ------------------------------------------------------------- |
| `tokens.css`     | palette (dual light/dark), spacing, type, motion, dot tokens  |
| `fonts.css`      | Doto `@font-face` (relative URLs; optional if self-hosting)    |
| `base.css`       | reset, element defaults, focus, scrollbars                    |
| `motion.css`     | keyframes + animation utilities + reduced-motion              |
| `dots.css`       | dot-grid, dot rule, status dot, dot loader/bar, matrix reveal |
| `primitives.css` | `ui-*` buttons, cards, chips, badges, links, key/value        |
| `forms.css`      | inputs, select, textarea, search, switch, checkbox            |
| `table.css`      | `ui-table` dense / comfortable                                |
| `app.css`        | admin shell: rail, topbar, toolbar, panel, metrics            |
| `navigation.css` | site nav, menu, theme toggle (dot indicator)                  |
| `typography.css` | display headings, eyebrows, legacy `.button`                  |
| `cards.css`      | an Astro site semantic cards (token-driven)                   |
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
npm install        # stylelint is the only toolchain
npm run check      # lint + 3 drift checks (exports, tokens, classes) — what CI runs
npm run lint:fix   # auto-fix the safe stylistic rules
npm run tokens:build  # regenerate tokens/index.json from tokens/index.js
```

`npm run check` enforces that the data mirrors cannot drift from the CSS:
exports/import-graph integrity, `tokens.css` ⇄ `tokens/index.{js,json}`, and
the `classes` registry ⇄ the `.ui-*` selectors. CI
(`.github/workflows/ci.yml`) runs it on every branch push and PR. It never
publishes — a push to `main` ships nothing.

## Release

Releases are tag-driven and explicit:

```bash
# bump "version" in package.json to X.Y.Z first, then:
git tag vX.Y.Z && git push origin vX.Y.Z
```

The tag triggers `.github/workflows/release.yml`, which re-runs the checks,
verifies the tag matches `package.json`, and publishes a GitHub Release.
Consumers resolve the auto-generated `archive/refs/tags/vX.Y.Z.tar.gz`, so
bump their pinned URL to adopt the new version.

## Consumers

- `an Astro site` — imports `@bronto/ui/css/core.css`
- `a SvelteKit admin` — imports `@bronto/ui/css`

Both pin a tagged release tarball, so a change ships only after a new tag is
cut. Promote to a published package once a third app adopts it or versioning
friction appears.
