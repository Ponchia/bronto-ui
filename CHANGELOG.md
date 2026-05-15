# Changelog

## Unreleased

Content-site layer — promotes the proven, hand-rolled site shell into
the first-class typed contract so consumers stop reimplementing it.
Feature-sized; warrants a **0.3.0** when released. Legacy `site-*` /
`.tag-list` classes are kept as undocumented back-compat (removal slated
for a future major).

- **`site.css`**: `ui-container` (+`--narrow`), `ui-siteheader`
  (`__brand`/`__actions`), `ui-sitenav` (active via `aria-current`, dot
  cue, responsive collapse into `ui-sitemenu` — native `<details>`, no
  JS), `ui-sitefooter` (`__links`), `ui-skiplink`, `ui-tags`/`ui-tag`
  (`--accent`; neutral content labels, distinct from interactive
  `ui-chip`), `ui-meta` (dot-separated meta row).
- **`ui-quote`** (+ `__cite`) in `content.css`: a pull-quote companion
  to `.ui-prose` — emphasis by scale + a short accent rule, not a box.
- **Shiki**: `@ponchia/ui/shiki/nothing.json` — a documented optional
  VS Code/TextMate theme (rationed: brand accent + greyscale),
  drift-checked (`check:shiki` keeps it on-palette and in sync with the
  dark `--accent`). Bring-your-own-highlighter, like `tokens.dtcg.json`.
- Full contract treatment: 18 classes + `ui.container`/`ui.tag` recipes
  + `.d.ts` (guarded), cascade/exports/dist wired, demo + docs. The
  `not-a-gap` items from the source review (theme-toggle CSS already
  exists in `navigation.css`; `ui-timeline` too consumer-specific) were
  deliberately excluded.

## 0.2.2 — 2026-05-15

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

### Second review pass (PR #3)

Independent Opus review said SHIP; the AgentMix `deep` mix flagged
more — verified each, fixed the real ones:

- **Release hygiene**: `package-lock.json` synced to `0.2.2`;
  `release.yml` `release-notes` now `needs: publish-npm` (no GitHub
  Release for a version that failed to publish — no split-brain).
- **RTL**: `.ui-toast-stack` used physical `inset` → logical
  `inset-block`/`inset-inline` so the stack mirrors in RTL.
- **`initTabs`**: a `root` that *is* the `[data-bronto-tabs]` element is
  now initialised (querySelectorAll only sees descendants); tabs are
  cross-linked to panels via `aria-controls`/`aria-labelledby`
  (APG-complete), ids minted only where absent.
- **Toast**: dropped the per-item `role="status"` nested inside the
  `aria-live` stack (double-announcement risk).
- **DTCG**: `--shadow: none` was typed `color` (name matched the colour
  regex, value failed the shadow test) — shadows are now classified by
  name first → `$type: "shadow"`.
- **Tests**: new `ui.*` recipe-output coverage + a `.d.ts`-declaration
  assertion; `initTabs` root-self/APG test; `tokens.dtcg.json` shape
  test (shadow typing + the null-+-extension invariant); `serve.mjs`
  `safePath` traversal unit test. The RTL e2e now waits for the
  mirrored end-state instead of racing a fixed sleep (the CSS was
  correct; the old test read mid-transition).

### Discovered follow-ups

Closed the remaining items surfaced across the review/verification:

- **Regression tests for the review fixes**: `serve.mjs` refactored to a
  pure exported `safePath()` with a traversal/sibling-prefix unit test;
  `initTabs` nested-isolation test — which **caught a real bug in the
  first nested fix** (the outer group's delegated click still fired for
  nested tabs); now gated on owned membership, not DOM containment. New
  e2e assertion that RTL truly mirrors the switch transform + select
  marker (not just box model).
- **Print** (`@media print` in `base.css`): ink-on-white, chrome hidden,
  `break-inside` guards, prose link URLs surfaced, `@page` margin.
- **prefers-reduced-data**: points `--display`/`--dot-font` at the mono
  stack so the Doto webfont is never fetched for data-saver users.
- **DTCG export**: `@ponchia/ui/tokens.dtcg.json` (W3C Design Tokens
  format) generated from the model, drift-checked (`check:dtcg`), built
  in `prepack`. Runtime-derived tokens are spec-shaped with
  `$value:null` + `$extensions` rather than fabricated numbers.

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
