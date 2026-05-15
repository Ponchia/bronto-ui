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

> Not published yet — the npm scope, a `LICENSE`, and a version bump are
> pending (see [Release](#release)). Until the first publish, depend on a
> `file:` link to a checkout or a pinned git tag:
>
> ```json
> { "dependencies": { "@ponchia/ui": "file:../bronto-ui" } }
> ```
>
> ```json
> { "dependencies": { "@ponchia/ui": "github:Ponchia/bronto-ui#semver:^0.2.0" } }
> ```

Import the full theme (includes responsive breakpoints):

```css
@import '@ponchia/ui/css';
```

Or the core bundle if the app manages its own responsive layer:

```css
@import '@ponchia/ui/css/core.css';
```

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
| `cards.css`      | personal-site semantic cards (token-driven)                   |
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

**Before the first real publish** (one-time blockers, by design):

- Add a `LICENSE` file — none exists; `package.json` says
  `"SEE LICENSE IN LICENSE"`. The license choice is the owner's.
- Create the `@ponchia` npm scope and add an `NPM_TOKEN` repo secret.
- Bump `version` to `0.2.0` (0.1.0 predates the new entrypoints) and
  retitle the CHANGELOG `Unreleased` section.

## Consumers

- `personal-site` — imports `@ponchia/ui/css/core.css`
- `polpo-admin` — imports `@ponchia/ui/css`

Both still pin the old tarball URL; they switch their dependency to
`@ponchia/ui` once it is published (separate repos — not changed here).
