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

Serve the Doto fonts from the app's own `/fonts` directory (the token layer
references `/fonts/doto-*.ttf`), or override `--display` / `--dot-font`.

Set `data-theme="light"` or `data-theme="dark"` on `<html>`; defaults follow
`prefers-color-scheme`.

## Layout

| File             | Contents                                                      |
| ---------------- | ------------------------------------------------------------- |
| `tokens.css`     | palette (dual light/dark), spacing, type, motion, dot tokens  |
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

## Consumers

- `personal-site` — imports `@bronto/ui/css/core.css`
- `polpo-admin` — imports `@bronto/ui/css`

Both pin a tagged release tarball, so a change ships only after a new tag is
cut. Promote to a published package once a third app adopts it or versioning
friction appears.
