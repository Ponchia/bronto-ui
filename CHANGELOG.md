# Changelog

## Unreleased

Architecture: keep plain CSS as the universal substrate, add thin optional
layers on top (see `docs/architecture.md`). No `css/*` selector/token values
changed — existing consumers are visually unaffected.

- **Cascade**: the whole framework now ships inside `@layer bronto`, so
  un-layered consumer CSS overrides it without specificity fights. Applied
  only at the bundle entrypoints (`core.css`, `index.css`); source files
  unchanged. _Behavioural change for consumers that override via specificity._
- **Fonts**: `@font-face` moved from `tokens.css` to `css/fonts.css` with
  package-relative URLs (`../fonts/*`) — no more absolute `/fonts`
  assumption. Bundled into `core.css`/`index.css`; exported standalone.
- **`@ponchia/ui/tokens`**: design tokens as data (`index.js` canonical,
  `index.json` generated, `themeColor()` helper, typed).
- **`@ponchia/ui/classes`**: typed class-name contract — `cls` registry,
  `ui.*` recipe builders, `cx()`. Framework-agnostic, returns strings.
- **`@ponchia/ui/behaviors`**: vanilla, SSR-safe, dependency-free helpers —
  `applyStoredTheme`, `initThemeToggle`, `dismissible`, `initDisclosure`.
- **Drift control**: `npm run check` adds `check-tokens` and
  `check-classes`; the demo now drives itself via the shipped modules.
- **Packaging**: `exports` for the new entrypoints (with `types`),
  `sideEffects` for tree-shaking, `files` widened.
- **Distribution decided**: published to npm as **`@ponchia/ui`** (the
  `@bronto` scope isn't ownable; the `@layer bronto` / `data-bronto-*`
  namespace is unchanged). `private` removed, `publishConfig`
  (`access: public`, `provenance: true`), `repository`/`homepage`/`bugs`
  added. `release.yml` now gates on a real `npm publish` job
  (`validate` → `publish-npm`). Rationale + pre-publish blockers
  (LICENSE, `NPM_TOKEN`, version bump) in `docs/architecture.md`.

## 0.1.0 — 2026-05-15

First standalone release. Promoted out of `an Astro site/bronto-ui` into its
own standalone package.

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
