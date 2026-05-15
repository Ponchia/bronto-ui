# Changelog

## Unreleased

Component + mobile expansion, then a framework-grade hardening pass
(RTL, a11y, theming contract, Markdown content layer). Additive — no
existing token/selector values changed except documented WCAG fixes.

### Framework hardening

- **RTL / logical properties**: every `css/*` physical property is now
  logical (`*-inline/-block-*`), enforced by `stylelint-use-logical`
  (`csstools/use-logical: always`). Render-neutral in LTR; RTL mirrors
  cleanly (verified, incl. the drawer).
- **A11y**: `initTabs` behavior (WAI-ARIA Tabs keyboard pattern);
  `forced-colors` (Windows High Contrast) support in `base.css`; WCAG
  contrast fixes — light `--text-dim`/`--warning`, dark `--text-dim`
  now ≥ 4.5:1. Badge variants drop tone-on-tinted-tone text (failed AA
  at small bold) — tone now rides the border + tint, text inherits the
  high-contrast neutral. `.ui-eyebrow` uses `--accent-strong` so it
  clears 4.5:1 on soft surfaces too. (All surfaced by the new axe gate.)
- **Theming contract**: `--accent` is one knob — the whole accent family
  is `color-mix`-derived (ratios tuned to the prior hex, ≈ zero default
  drift). `data-density` (compact/comfortable) and `data-contrast=high`
  + `@media (prefers-contrast: more)` presets. See `docs/theming.md`.
- **content.css**: `.ui-prose` (+ `--compact`) styles raw
  Markdown-renderer HTML — headings, lists, quote, code, tables, media,
  figures — with **zero per-element classes**, keeping documents
  semantic and machine-readable.
- **CI regression safety**: Playwright visual snapshots of the demo
  (dark / light / RTL / modal) + `@axe-core/playwright` WCAG 2.1 A/AA
  gates (both themes, modal, tab keyboard pattern), as a new `visual`
  CI job pinned to the Playwright container the baselines were authored
  in (byte-stable, no cross-OS font flake). Catches CSS/markup
  regressions structure-checks can't.
- **Prebuilt bundles**: `dist/bronto.css` + `dist/bronto-core.css` —
  the `@import` graph flattened + conservatively minified into one
  `@layer bronto` file (~62 kB / ~11 kB gzip), no load waterfall.
  Exposed as `@ponchia/ui` (`.`) and `./dist/*`; `check:dist` keeps it
  byte-fresh and in a size budget; built in `prepack`. README documents
  the evergreen support floor (Chrome 111+/Safari 16.4+/Firefox 121+).

### Multi-agent review response

Acted on a deep read-only review (AgentMix `deep`), verifying each
finding against the code first:

- **Public TS contract**: `classes/index.d.ts` was stale — added the 9
  missing `ui.*` recipes (`alert`, `toast`, `progress`, `dotspinner`,
  `dotbar`, `modal`, `tab`, `avatar`, `prose`) + option types, and a new
  drift guard in `check-classes` so a recipe without a declaration now
  fails `npm run check`.
- **RTL completeness**: `[dir='rtl']` mirrors for the cases the lint
  plugin can't convert — switch thumb, theme-toggle thumb, `<select>`
  marker (`background-position`), arrow-link hover nudge.
- **Bug**: `.ui-progress__bar` transitioned the (now non-existent)
  physical `width`; animate `inline-size`.
- **Release gating**: `release.yml` now runs the containerised
  visual/a11y suite and `publish-npm`/`release-notes` depend on it — a
  tagged release can't skip what every branch push runs.
- **Hardening**: `initTabs` scopes to its own group (nested-safe);
  `initDialog` root semantics documented (dialogs are document-global
  by design); `scripts/serve.mjs` binds loopback + strict path
  containment; fixed an invalid selector in `docs/theming.md`.

### Earlier in this cycle

Component + mobile expansion. No token/selector changes to existing
classes — purely additive; existing consumers are unaffected.

- **Dot loaders**: new orbital `ui-dotspinner` (the Nothing-signature
  ring loader, `--sm`/`--lg`), `ui-dotbar--indeterminate` sweep, and a
  linear `ui-progress` (determinate via `--value`, plus
  `ui-progress--indeterminate`).
- **feedback.css**: `ui-alert` / callout (tones + dismissible), `ui-toast`
  + `ui-toast-stack`, CSS-only `ui-tooltip`.
- **overlay.css**: `ui-modal` + `ui-modal--drawer` on native `<dialog>`
  (bottom-sheet on mobile), `ui-menu` dropdown.
- **disclosure.css**: `ui-tabs` (ARIA + `.is-active` contract, scrollable
  on mobile), `ui-accordion` (styled `<details>`), `:has()`-driven
  `ui-segmented`, `ui-breadcrumb`, `ui-pagination`, `ui-avatar` /
  `ui-avatar-group`.
- **Behaviors**: `initDialog` (native `<dialog>` open/close + backdrop
  light-dismiss) and `toast()`. SSR-safe; covered by the test suite.
- **Mobile**: 44px touch targets for buttons/inputs/checkboxes on coarse
  pointers; component-level breakpoints for modal/drawer/menu/tabs.
- **Contract**: 53 new classes added to the typed `cls` registry + recipes
  (`ui.alert`, `ui.toast`, `ui.progress`, `ui.dotspinner`, `ui.modal`,
  `ui.tab`, `ui.avatar`); `npm run check` and the 20-test suite stay green.
- **Docs**: removed the stale "not published yet" install note (the
  package is live on npm); documented the new layers and behaviors.

## 0.2.1 — 2026-05-15

- Remove private project names and personal paths from docs and CSS
  comments (no code/selector/token changes). Supersedes 0.2.0, which
  carried those references in shipped CSS comments.

## 0.2.0 — 2026-05-15

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

First standalone release. Extracted into its own standalone package.

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
  semantic typography/eyebrows.
- Renamed `theme.css` → `tokens.css`; dropped the `components.css`
  indirection; `core.css` now bundles the full set; `index.css` =
  core + responsive. `package.json` exports updated accordingly.
- Doto fonts vendored into `fonts/` as the canonical home.
- Added `demo/index.html` kitchen sink.
