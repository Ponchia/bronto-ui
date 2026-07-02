# Demo tree

`demo/` is the hand-authored showcase and fixture surface for `@ponchia/ui`.
The tree is flat. It contains this README plus 34 demo files: 32 HTML pages
plus `index.css` and `index.js`.

## Page map

- [`index.html`](./index.html) is the kitchen-sink showcase. It loads the core
  bundle, opt-in skins, data-viz, analytical, app-tier, and report leaves, then
  uses [`index.css`](./index.css) for demo-only layout.
- [`index.js`](./index.js) wires demo-only behavior: theme controls, skin and
  surface persistence, glyph galleries, command/legend/crosshair host echoes,
  and the behavior specimens.
- [`service.html`](./service.html) is the service-shell fixture for app rail,
  topbar, filters, metrics, tables, and lifecycle state.
- [`report.html`](./report.html), [`report-standalone.html`](./report-standalone.html),
  and [`version-history-report.html`](./version-history-report.html) are static
  report fixtures. `report-standalone.html` is the no-build, no-JS report pattern
  covered by a dedicated Playwright spec.
- Feature specimen pages cover the opt-in leaves and helpers:
  `annotations`, `figure`, `legends`, `marks`, `connectors`, `spotlight`,
  `crosshair`, `selection`, `sources`, `interval`, `clamp`, `highlights`,
  `diff`, `code`, `spark`, `sidenote`, `textref`, `bullet`, `term`, `toc`,
  `tree`, `state`, `generated`, `workbench`, `command`, and `dots`.
- [`theme-playground.html`](./theme-playground.html) is the contrast and
  colorway instrument linked from theming docs.

## Local taxonomy

- Use one top-level `*.html` file per route. `test/e2e/demos.spec.mjs` scans only
  top-level `demo/*.html`.
- Use `index.html` for broad component coverage and `data-shot` sections that
  feed the visual baseline inventory.
- Use standalone specimen pages when a leaf needs focused markup, geometry,
  print, or accessibility coverage that would make the kitchen sink too dense.
- Keep demo-only styling in `index.css`. Standalone pages should mostly prove
  the package CSS they link from `../dist/`.

## E2E and Pages

- [`playwright.config.mjs`](../playwright.config.mjs) serves the repo root on
  port 8123, so `/demo/` and `/demo/<name>.html` match the GitHub Pages layout.
- `test/e2e/a11y.spec.mjs` and `test/e2e/quality.spec.mjs` exercise the
  kitchen sink. `test/e2e/visual.spec.mjs` screenshots `index.html` sections
  marked with `data-shot`.
- [`test/e2e/demos.spec.mjs`](../test/e2e/demos.spec.mjs) sweeps the standalone
  demo pages for console errors, page errors, failed requests, axe issues where
  applicable, and DOM/SVG structure. It guard-checks the theme playground but
  skips axe there because the swatches use blend-mode styling.
- The same routes are published on GitHub Pages. See the root
  [`README.md`](../README.md) for the live entry points instead of copying them
  here.
