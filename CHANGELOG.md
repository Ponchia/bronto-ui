# Changelog

## 0.1.0 — 2026-05-15

First standalone release. Promoted out of `an Astro site/bronto-ui` into its
own package at `the workspace/bronto-ui`.

- Re-skinned to a Nothing-inspired design language: monochrome dual
  light/dark palette, single red accent, Doto dot-matrix display type, flat
  hairline surfaces, sharp radii, no soft shadows.
- New `motion.css` — keyframes (migrated from the old responsive layer so
  core-only consumers keep their animations) plus reveal / stagger /
  skeleton / spinner / caret utilities and full reduced-motion handling.
- New `dots.css` — dot-grid surfaces, dotted rule, status dot (with live
  pulse), dot loader, dot progress bar, matrix-reveal.
- New `forms.css` — input, select, textarea, search, switch, checkbox.
- New `table.css` — `ui-table` with dense / comfortable / lined variants and
  numeric helpers for admin dashboards.
- Expanded `app.css` into a full admin shell: sidebar rail with dot nav,
  sticky blurred topbar, toolbar, panel, metric tiles, empty state, mobile
  rail collapse.
- Re-skinned primitives, navigation (dot active indicator), and the
  an Astro site semantic typography/eyebrows.
- Renamed `theme.css` → `tokens.css`; dropped the `components.css`
  indirection; `core.css` now bundles the full set; `index.css` =
  core + responsive. `package.json` exports updated accordingly.
- Doto fonts vendored into `fonts/` as the canonical home.
- Added `demo/index.html` kitchen sink.
