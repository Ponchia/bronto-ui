# Changelog

> **Versioning:** pre-1.0, breaking changes ship in the _minor_. Pin
> `~0.x`; `^0.x` does **not** protect you. See README → Versioning, and
> the deprecation policy in CONTRIBUTING.md.

## Unreleased — 0.3.3

Discoverability for LLM/agent consumers working in other repos. No
runtime, CSS, token, or API change — docs-only, ships with the next
functional release.

### Added

- **`llms.txt`** at the package root — a self-contained agent entrypoint
  that orients an LLM to the typed contract, the `@layer bronto` override
  rule, the import surface, and the shipped offline references.
- **`docs/reference.md` and `docs/theming.md` now ship in the npm
  tarball.** An offline coding agent in a consumer repo gets the full
  class catalog (generated + drift-checked) and the token contract from
  `node_modules/@ponchia/ui/` without network access. New `exports`
  subpaths: `./llms.txt`, `./docs/reference.md`, `./docs/theming.md`.

### Changed

- `check-pack.mjs` relaxed from a blanket `docs/` ship-block to a
  **curated allowlist** (`docs/reference.md`, `docs/theming.md` only); a
  consistency assertion fails if that set drifts from `package.json`
  `files`. The rest of `docs/` (tutorials, architecture, interop) stays
  dev-only by design — a deliberate, documented narrowing of the earlier
  runtime-only stance, justified by the agent-consumer requirement.

## 0.3.2 — 2026-05-16

Re-skin-proven adoption pass: a real content-site consumer rebuilt
several idioms bespoke because a primitive was missing or shell-locked.
This promotes the genuinely generic, token-only ones upstream. **All
additions are non-breaking** (additive classes/recipes; the metric tile
keeps its admin-shell name as a permanent alias) — a patch per the 0.x
policy.

### Added

- **`ui-stat` / `ui-statgrid`** — the metric tile is now shell-agnostic
  (label + display value + signed delta). The admin-shell
  `ui-app-metric*` / `ui-app-metrics` names remain as permanent aliases
  grouped on the same rules (byte-identical output, no baseline drift).
- **`ui-link--cta`** — the eyebrow-faced action link (accent · display ·
  uppercase + arrow glyph), composed from the same tokens as
  `ui-eyebrow`. `ui.link({ cta: true })`.
- **`ui-badge--dot`** — leading state dot; composes with any badge tone
  (`is`-tone tints the dot). `ui.badge({ tone, dot: true })`.
- **`ui-eyebrow--sm`** — restores the dense size step (was
  `eyebrow--tight` in 0.2.2). `ui.eyebrow({ sm: true })`.
- **`ui-container--wide`** — documented wide preset (`--container-wide`,
  default 82rem) for app/marketing shells. `ui.container({ wide: true })`.
- **`ui-siteheader--sticky`** — structural sticky only (the floating-card
  skin stays consumer identity, deliberately not shipped).
- **`ui-dotmatrix`** (+`__cell`, `--hot`, `--accent`) — data-bound dot
  grid, the on-brand counterpart to the decorative `ui-dotgrid`; the
  data→cell mapping stays the consumer's.
- **`ui-num`** (+`--pos`, `--neg`, `--muted`) — the tabular / end-aligned
  / P&L-tone numeric vocabulary the table has shipped since 0.1.0, freed
  from `.ui-table` so cards, stats and inline figures share one
  contract. `ui.num({ tone })`. (Two independent admin consumers were
  reinventing `.text-green`/right-align outside a table.)
- **`ui-badge--muted`** — the idle / unknown / "no signal yet" status
  tone, distinct from the default tinted badge. `ui.badge({ tone:
  'muted' })`. Token-safe, no new hue.

### Fixed

- **`ui-card--interactive`** had no keyboard cue (cards typically wrap a
  single link): added `:focus-within` border + a `--shadow-raised` ring
  on hover. a11y completeness fix.

### Changed

- dist raw size budget recalibrated 64 kB → 76 kB (post-0.3.2 bundle is
  ~64.5 kB raw / ~11.1 kB gzip; ~18% raw headroom restored). The gzip
  cap (12 kB) is unchanged — the wire-size contract still holds.

## 0.3.1 — 2026-05-16

Adoption + gap-closing pass driven by a 12-perspective review (two Opus
analyses + two five-model AgentMix deep runs). **All additions are
non-breaking** (additive classes/tokens/behaviors; short token names
kept as permanent aliases) — so this is a patch, per the 0.x policy
(only breaking changes bump the minor); the 0.3.0 legacy removal
stands. Tracked scope: ROADMAP.md.

### Added

- **Components/behaviors** (all SSR-safe, idempotent, cleanup-returning,
  dependency-free): `ui-combobox` + `initCombobox` (WAI-ARIA APG
  combobox); `ui-popover` + `initPopover` (collision-aware, native
  top-layer when available); `initFormValidation` (Constraint
  Validation → `aria-invalid`/`aria-describedby` + error summary);
  `initTableSort` (sortable `aria-sort` headers + row selection,
  `bronto:selectionchange`); `.ui-button[aria-busy]` loading state;
  toast dismiss button + separate assertive region for `danger`.
- **Forms:** `ui-input-group`(+`__addon`), `ui-file`, `ui-range`,
  `ui-error-summary`.
- **Layout:** `ui-sidebar`, `ui-switcher`, `ui-center`, `ui-ratio`;
  opt-in `ui-cq` container queries for `ui-grid` / `ui-app-metrics`.
- **Tokens:** semantic `--bronto-color-*` tier, `--accent-1..6` /
  `--surface-1..6` ramps, `--z-*` stacking scale (every framework
  `z-index` now resolves through it; values unchanged).
- **DX:** generated drift-checked `docs/reference.md`; VS Code
  `classes/vscode.css-custom-data.json` (token IntelliSense, exported
  as `./vscode.css-custom-data.json`); per-framework integration guides
  + Tailwind interop recipe; `examples/{vanilla-vite,astro,sveltekit}`
  + consumer-smoke CI matrix; README badges; `ROADMAP.md`;
  `MIGRATIONS.json` + `docs/migrations/0.2-to-0.3.md`;
  `demo/theme-playground.html` (live contrast checker).
- **a11y:** `role="switch"` contract + forced-colors switch cues;
  `@supports(anchor-name)` tooltip un-clipping.

### Fixed

- **Release hygiene:** the `0.3.0` section was still labelled
  `unreleased` after `v0.3.0` shipped to npm `latest`. Dated it
  correctly and added a `check:release` gate (in `npm run check`) that
  fails when `package.json`'s version maps to an `unreleased` changelog
  heading, so a published version can never again be marked unreleased.

### Changed

- `npm run check` is now 14 gates (+`check:release`, `check:reference`,
  `check:vscode`); `prepack` regenerates the reference + VS Code data.
- CONTRIBUTING.md documents a deprecate-one-minor policy so
  "minor may break" is predictable.

## 0.3.0 — 2026-05-16

### Multi-POV review hardening

A six-perspective review (DX/contract, CSS architecture, a11y,
release/supply-chain, plus AgentMix) drove this pass.

**BREAKING (token / contract level)**

- **New `--accent-text` token** (= `var(--accent-strong)`). Everywhere
  the accent was used as _foreground text_ (links on hover, active
  nav/tab/accordion, prose markers, eyebrows, chips, breadcrumb,
  pagination) now resolves through `--accent-text`, not raw `--accent`,
  so a pale re-brand no longer silently fails text contrast.
  _Migration:_ none for default themes (visually identical). If you
  re-brand `--accent` to a light hue, also set `--accent-text` to a
  dark-enough value (see docs/theming.md).
- **`--focus-ring` is now solid `var(--accent)`** (was an unused
  50%/55% transparent mix) and every focus outline is wired to it.
  Default focus appearance is unchanged; the `[data-contrast=high]` /
  `prefers-contrast` promotion and per-theme `--focus-ring` overrides
  now actually take effect. _Migration:_ none unless you relied on the
  (previously dead) token value.
- **`classes/index.d.ts` / `tokens/index.d.ts` are now generated
  literal types.** `cls` exposes literal keys+values; token views use
  `ColorKey`/`ScaleKey`/`*TokenName` unions; `themeColor` takes
  `ThemeName`. Mistyped keys are now compile errors. _Migration:_ fix
  any code that relied on the old `Record<string,string>` (e.g. reading
  a non-existent key and getting `string` instead of an error). JS
  token keys are kebab-case — `themeColor('dark')['accent-soft']`.

**Fixed**

- **a11y (WCAG AA):** `.ui-chip--accent`, legacy `.eyebrow` group and
  `.tag-list--compact` first child no longer use raw `--accent` as
  small text (was ~3.9:1 in light).
- **a11y:** native `<dialog>` returns focus to its trigger on _every_
  close path (Esc, close button, backdrop light-dismiss, programmatic).
- **a11y:** the toast `aria-live` stack is a persistent region — no
  longer created-then-destroyed per drain, fixing dropped first /
  post-drain screen-reader announcements.
- **a11y:** `.ui-tab:focus-visible` is now visually distinct from the
  active-tab underline (inset ring).
- **DX:** the `.` export is conditional (`style`/`default`) instead of a
  bare `.css` string, so type-aware tooling no longer mis-resolves the
  package root. The root is CSS-only (documented).

**Changed (non-breaking)**

- Behavior initializers (`initThemeToggle`, `dismissible`, `initDialog`,
  `initDisclosure`, `initTabs`) are now idempotent — re-init (HMR,
  framework remount, repeat calls) replaces rather than stacking
  duplicate listeners. Tab ids use a module-global counter so separate
  islands never collide on `bronto-tab-1`.
- New drift gate `check:dts` (generated `.d.ts` ⇄ JS runtime), wired
  into `npm run check` and `prepack`. `docs/architecture.md` drift table
  and release-gating section corrected to the real four-job DAG
  (`validate` + `e2e` → `publish-npm` → `release-notes`).
- README: explicit "do not mix a bundle with a raw leaf import" hazard
  warning; a Versioning section; size/`@import`-depth prose de-drifted.
- Tests: +3 unit tests (dialog focus-return, initializer idempotency,
  global-unique tab ids); +5 e2e a11y tests (RTL axe pass, dialog
  focus-return on Escape, persistent toast live region, disclosure
  toggle, modal computed-contrast instead of a blanket rule disable);
  demo gained a `[data-bronto-disclosure]` instance (was untested).
  _Release note:_ the visual-snapshot baselines (`test/e2e/__screenshots__`)
  are intentionally stale after the contrast / focus-ring / legacy-removal
  changes (cross-OS rasterisation means they can only be authored in the
  pinned container, not on a dev machine). Regenerate them with one click:
  run the **“Update visual baselines”** workflow (`workflow_dispatch`,
  `.github/workflows/visual-baselines.yml`) from this branch — it rebuilds
  them in `mcr.microsoft.com/playwright:v1.60.0-jammy` and commits them
  back, after which the `e2e` gate goes green on its own. Red by design
  until that runs.

**BREAKING (legacy vocabulary removed / migrated)**

The whole non-`ui-*` surface is gone; everything shipped is now under the
`.ui-*` contract and the `check-classes` drift gate.

- **Deleted (had `ui-*` equivalents):** `css/layout.css`, `css/cards.css`,
  `css/typography.css` and their entire vocabulary — `.hero`,
  `.project-*`, `.post-card`, `.essay-*`, `.metric-tile`, `.callout`,
  `.eyebrow`, bare `.button`, `.section-head`, `.tag-list`,
  `.profile-link-list`, `.page-*`, `.home-*`, `.signal-panel`,
  `.worklog-summary`, … _Migration:_ use the `ui-*` content layer —
  `.ui-prose`/`.ui-quote` (long-form), `.ui-card`, `.ui-eyebrow`,
  `.ui-button`, `.ui-tag`/`.ui-tags`, `.ui-grid`/`.ui-stack`, the
  `ui-site*` shell. `.skip-link` → `.ui-skiplink`; `.site-nav` →
  `.ui-sitenav`; `.site-menu` → `.ui-sitemenu` (responsive nav) or the
  new `.ui-menu-host` (a `<details>` + `.ui-menu` dropdown wrapper).
- **Renamed → first-class:** the admin shell `.app-*` → **`.ui-app-*`**
  (`ui-app-shell`/`-rail`/`-topbar`/`-toolbar`/`-nav`/`-panel`/
  `-content`/`-main`/`-metrics`/`-metric`/`-empty-state`, with the same
  `__part` / `--mod` suffixes). The theme toggle `.theme-toggle__*` →
  **`.ui-themetoggle__*`**. _Migration:_ rename these class strings in
  consumer markup (or use the new `cls.app*` / `cls.themetoggle*` /
  `cls.menuHost` entries). They are now typed and drift-checked.
- **Bundle collapsed:** `css/responsive.css` and `css/index.css` removed.
  `ui-*` components own their breakpoints, so there is no core/full
  split: `@ponchia/ui/css` now resolves to `css/core.css` (one bundle),
  `@ponchia/ui` → the single `dist/bronto.css` (~54 kB / ~10 kB gzip,
  was ~70/12). _Removed exports:_ `./css/index.css`,
  `./css/responsive.css`, `./dist/bronto-core.css`, and the deleted
  leaves' `./css/{layout,typography,cards}.css`. _Migration:_ import
  `@ponchia/ui` or `@ponchia/ui/css`.

**BREAKING (per-leaf imports are now layer-safe)**

- Every `@ponchia/ui/css/<leaf>.css` export now resolves to a
  self-`@layer bronto`-wrapped build (`dist/css/<leaf>.css`), so a
  direct leaf import is layered by default and safe to mix with the
  bundle — the silent cascade-inversion footgun is gone. The raw,
  full-specificity source is still available as a deliberate escape
  hatch at the explicit **`@ponchia/ui/css/unlayered/<leaf>.css`**
  path. _Migration:_ none if you import the bundle. If you imported a
  raw leaf *expecting* unlayered/full-specificity behaviour, switch
  that import to the `css/unlayered/*` path; otherwise the now-layered
  leaf is the correct (safe) default. Drift-checked by `check-dist`.

### Tooling (external-review triage)

Adopted what fits the CSS-first / zero-runtime-dep / curated-artifact
ADR; declined what doesn't (recorded so the decision isn't re-litigated).

**Added**

- **TypeScript type gate** — `tsconfig.json` + `test/types.test-d.ts`
  + `check:types` (in `npm run check`). Compiles the published `.d.ts`
  and asserts, via `@ts-expect-error`, that the generated literal
  `cls`/token types reject typos and `themeColor` rejects non-`ThemeName`.
  Completes the review's "auto-generate .d.ts, kill drift" item
  (generation + `check-dts` landed earlier this minor; this proves the
  result). `typescript` is devDep-only — no runtime/types-export change.
- **Prettier** — `.prettierrc` + `check:format`/`format`, in
  `npm run check`. Scoped to hand-authored non-CSS source; CSS stays
  Stylelint-owned, generated artifacts and the curated Markdown/`demo`
  are `.prettierignore`d so formatters never fight generators.
- **GitHub issue/PR templates** — collect `@ponchia/ui` version,
  consuming framework, and surface; PR template carries the
  contract/SemVer/a11y checklist.
- **Bundle-size budget tightened** — `check-dist` `BUDGET` recalibrated
  90 kB→64 kB raw / 16 kB→12 kB gzip (bundle is ~54/~10 post-cleanup),
  so regrowth is gated, not just catastrophic blowouts. (Dependabot was
  already added earlier this minor.)

**Declined (rationale)** — Storybook (heavy React/Vite toolchain vs the
framework-agnostic zero-dep ADR; `demo/index.html` is the self-driving
surface); Style Dictionary as a dependency (the shipped
`tokens.dtcg.json` *is* the deliberate bring-your-own platform interop;
no native consumers exist — consumers run SD themselves);
standard-version/auto-changelog (the curated narrative CHANGELOG is an
asset; commits are already conventional); Renovate (Dependabot chosen);
Lighthouse CI (the axe a11y gate + size budget already cover the
regression vectors).

### Post-review fixes (independent Opus + AgentMix pass on this branch)

- **Fixed (HIGH, regression introduced here):** the persistent-toast
  rAF deferral could resurrect an already-dismissed first toast into the
  `aria-live` region (dismiss within the first frame). Now guarded by a
  `dismissed` flag; `dismiss()` is idempotent. +2 unit tests polyfilling
  rAF (the jsdom env had no `requestAnimationFrame`, so the path was
  previously untested).
- **Fixed (HIGH, regression introduced here):** the layered per-leaf
  `@ponchia/ui/css/fonts.css` (now `dist/css/fonts.css`) referenced
  `url(../fonts/*)`, which from `dist/css/` resolves to the unshipped
  `dist/fonts/`. `build-dist` now rewrites `../fonts/` → `../../fonts/`
  for the deeper per-leaf files (the flattened bundle at `dist/` is
  unaffected and unchanged). `check-dist` now also resolves every
  `url(...)` in each generated file against its own location, so this
  class of depth bug can't recur.
- **Fixed (docs):** README SemVer guidance was wrong — at `0.x` npm
  resolves `^0.3.0` and `~0.3.0` identically (`>=0.3.0 <0.4.0`); both
  hold back the breaking `0.4.0`. Corrected. Removed the stale
  "legacy `site-*`/`.tag-list` kept as back-compat" line (they were
  deleted this release). De-duplicated the `check-dist` paragraph in
  architecture.md.
- **Hardened:** the release `publish-npm` step uses
  `npm publish --ignore-scripts`, so `NODE_AUTH_TOKEN` is never exposed
  to the prepack/prepublishOnly lifecycle; it ships the artifacts already
  byte-verified by `validate` on the same commit.

### Further discovered-issue cleanup

Bounded, sensible items surfaced by the reviews, now closed:

- **a11y:** new `initMenu` behavior — Escape / outside-click /
  close-on-activate (with focus return to `<summary>`) for a native
  `<details data-bronto-menu>` `.ui-menu` dropdown. Deliberately a
  disclosure of buttons, not an over-claimed ARIA menu (review M3).
  Wired in the demo; unit-tested.
- **a11y:** the active tab's selected state is re-asserted under
  `forced-colors: active` (`border/colour: Highlight`) — it was
  invisible in Windows High Contrast (review L3).
- **a11y (demo):** the pagination "previous" control is now a real
  `disabled` button (was a focusable/clickable `aria-disabled`,
  misleading on the axe-gated integration surface); arrow controls
  gained accessible names; active page uses `aria-current="page"`
  (review M1).
- **CI:** GitHub Pages now deploys only after the `CI` workflow
  concludes **successfully** on `main` (`workflow_run` trigger, not a
  bare push) — a red-e2e/broken demo can no longer be published
  independently of the gates.
- **docs:** theming.md documents the one accent surface the framework
  can't tune — native control `accent-color` under a pale re-brand
  (review css M2).

### Content-site layer

Promotes the proven, hand-rolled site shell into the first-class typed
contract so consumers stop reimplementing it. (The legacy `site-*` /
`.tag-list` back-compat classes referenced here were **removed** in the
same release — see the "legacy vocabulary removed / migrated" BREAKING
section above; they are not shipped.)

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
