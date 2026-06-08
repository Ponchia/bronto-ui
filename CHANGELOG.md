# Changelog

|> **Versioning:** pre-1.0, breaking changes ship in the _minor_. Pin to the
|> minor — `~0.4.0` (equivalently `^0.4.0`) resolves to `>=0.4.0 <0.5.0`; a bare
|> `^0` / `*` wildcard does **not** protect you. See README → Versioning, and
|> the deprecation policy in CONTRIBUTING.md.

## 0.6.3 — 2026-06-08

Patch release to publish the WebKit release fix after the `v0.6.1` and `v0.6.2`
tag runs failed before npm publish. No public API change, no class contract
change, no `MIGRATIONS.json` entry.

The 0.6.2 test-only diagnosis was incomplete: WebKit does not reliably honor
the unprefixed `user-select: none` on the generated line-number affordances.
The actual fix is CSS-side. `css/diff.css` and `css/code.css` now include the
legacy `-webkit-user-select: none` declaration alongside the standard property,
and the built `dist/css/diff.css` / `dist/css/code.css` leaves were regenerated.

### Fixed

- **Diff/code line numbers in WebKit** — `.ui-diff__ln`,
  `.ui-diff__code::before`, and `.ui-code--numbered .ui-code__line::before`
  now opt out of selection in WebKit as well as chromium/firefox.

### Internal

- **`test/e2e/diff.spec.mjs`** — reads the CSSOM `-webkit-user-select` value
  before the standard property so the assertion verifies the prefixed WebKit
  path directly.

## 0.6.2 — 2026-06-07

Release attempt: test-only WebKit e2e patch for the `0.6.1` publish blocker. The
tag was cut but the release still did not publish. The diagnosis here was
superseded by `0.6.3`, which fixes the CSS rule itself.

### Internal

- **`test/e2e/diff.spec.mjs`** — read `getComputedStyle(el).userSelect ||
  getComputedStyle(el).webkitUserSelect` for the line-number
  `user-select: none` assertion, so the test passes on WebKit (where
  `userSelect` is `undefined` even when the standard CSS rule is
  applied) as well as chromium + firefox.

## 0.6.1 — 2026-06-07

Dev-only patch: refreshes the SHA-pinned GitHub Actions used by CI
([`actions/checkout`](https://github.com/actions/checkout) 6.0.2 → 6.0.3 —
SHA-256 repository init fix, expanded SHA regex; and
[`github/codeql-action`](https://github.com/github/codeql-action) 4.36.0 →
4.36.2 — CLI version caching, exponential-backoff SARIF polling, CodeQL
bundle 2.25.6) plus a small DevDeps bump ([react](https://github.com/facebook/react)
/[react-dom](https://github.com/facebook/react) 19.2.6 → 19.2.7 — Server
Components `FormData` fix; [stylelint](https://github.com/stylelint/stylelint)
17.12.0 → 17.13.0). No public API, no published CSS/JS, no `MIGRATIONS.json`
entry. All bumps were authored by Dependabot and landed through #109 + #110.

### Internal

- Bump the **actions** Dependabot group: `actions/checkout` 6.0.2 → 6.0.3 and
  `github/codeql-action` 4.36.0 → 4.36.2 (CI only, SHA-pinned in
  `.github/workflows/*.yml`).
- Bump the **dev** Dependabot group: `react`/`react-dom` 19.2.6 → 19.2.7 and
  `stylelint` 17.12.0 → 17.13.0 (devDependencies only — the package itself
  ships zero runtime deps).

## 0.6.0 — 2026-06-03

Accumulates the post-0.5.0 work: a multi-agent audit pass (accessibility
hardening, a behavior/binding scope-safety fix, codegen/gate tightening) plus a
**breaking** charting realignment. The local static-bar renderer
(`.ui-chart*`) is **removed** — a chart needs scales + data binding, which the
analytical layer refuses to own. In its place, bronto becomes a themeable target
for **Vega-Lite** (`@ponchia/ui/vega`), the same tokens-as-data path as Mermaid
and D2. The data-viz **palette** (`--chart-*`, `tokens/charts.json`) and the
**legend** layer are unchanged. Pin `~0.5` → re-pin `~0.6`; see
[`MIGRATIONS.json`](./MIGRATIONS.json) (`0.5`→`0.6`).

### Added

- **`@ponchia/ui/vega`** (+ `vega.json`) — an on-brand Vega-Lite / Vega
  [`config`](https://vega.github.io/vega-lite/docs/config.html) resolved per
  theme (the idiomatic `vega-themes` shape): monochrome chrome + one rationed
  accent, `range.category/ordinal/ramp/heatmap/diverging` from the CVD-safe
  data-viz palette. `brontoVegaConfig(theme)`. Resolved hex (Vega bakes colours
  into SVG/canvas, can't read `var()`); gated structurally **and** by a headless
  render-probe that asserts the colours land on a rendered chart. Vega is the
  consumer's renderer — config only, not a dependency. See `docs/vega.md`.
- **`ui-delta`** — a standalone trend/change indicator (core primitive): an
  arrow glyph (the non-colour channel) plus the figure, with
  `--up`/`--down`/`--flat`, and `--invert` to swap only the tone when "up" is
  the bad direction (latency, error rate, cost). `ui.delta({ dir, invert })`.
- **`ui-compare`** — a fluid side-by-side / before-after layout for the report
  layer (`css/report.css`): `__col`, `__head`, and `--2up`.
  `ui.compare({ cols })`.
- **`@ponchia/ui/classes.json`** — the class vocabulary as language-neutral
  data (`groups`/`classes`/`states`/`customProperties`), so a non-JS/non-TS
  host or an external linter can validate emitted markup without executing the
  ESM `cls` map or parsing the `.d.ts`. Generated from `cls`; drift-checked and
  its `states`/`customProperties` gated against the stylesheet.
- **`tokens/resolved.json` `scale` block** — the resolved non-colour scales
  (spacing/radius/type/z/motion, `var()` chains flattened), completing the
  token contract for non-CSS hosts (previously colour-only).
- **`--display-weight` / `--display-weight-strong`** (700 / 800) — the weight of
  the Doto dot-matrix display face, now a token. Themes/skins can re-tune how
  heavy display text renders in one place.
- On-brand **Mermaid** (`@ponchia/ui/mermaid`, `mermaid.json`) and **D2**
  (`@ponchia/ui/d2`, `d2.json`) theme maps — resolved per-theme palettes
  projected from the same tokens, gated. Diagrams stay the consumer's renderer;
  these are config only.
- Annotation geometry options: `connectorElbow({ mid })` (turn position along the
  dominant axis), `notePlacement({ inset })` (reserve the title stroke-halo so a
  placement that "fits" doesn't clip), and a `spread` half-angle on both
  `connectorEndArrow` and the shared `arrowHead` kernel.
- **`brontoVegaAccent(theme)` / `brontoVegaNeutral(theme)`** (`@ponchia/ui/vega`)
  — the exact per-theme hexes for `range.category`'s accent (series 1) and
  neutral (last series), so spending the accent on one emphasised mark needs no
  palette-index reverse-engineering.
- **`--on-accent`** token — the readable ink for a label on **any accent fill**
  (button, badge, themed chart bar, a Vega/D2 node). Resolves to `--button-text`
  (white on the light accent, black on the dark) and is gated ≥ 4.5:1 in
  `docs/contrast.md`. Use it instead of `--accent-text`, which is the inverse
  (accent-coloured text for a *neutral* background, ~1.3:1 on an accent fill).
- **`.ui-src`** standalone trust pill (`cls.src`, `css/sources.css`) — wears a
  `.ui-src--*` tone (verified / reviewed / generated / unverified / stale /
  conflict) on its own, for a bare trust label outside a citation or source card.
  Previously the `.ui-src--*` modifiers only painted a `--src-tone` with no
  standalone host, so a lone pill validated against `classes.json` yet rendered
  nothing.

### Removed

- **BREAKING: the local static bar-chart renderer (`.ui-chart`, `.ui-chart__plot`,
  `__bar`, `__label`, `__track`, `__fill`, `__fallback`, `__caption`).** A chart
  needs scales and data binding — out of scope for a CSS-first analytical layer
  (ADR-0002). Replace with a Vega-Lite chart themed via `@ponchia/ui/vega`, or a
  hand-authored token-themed inline `<svg>`, inside a `.ui-report__figure` with a
  `.ui-report__caption` and a `.ui-legend` key. The `--chart-value` inline knob
  is gone; the `--chart-color`/`--chart-pattern` swatch knobs remain (legend).
  See `MIGRATIONS.json` (`0.5`→`0.6`) and `docs/vega.md`.

### Changed

- **Annotation connectors are crisper.** `connectorEndArrow` now defaults to a
  sharper head (half-angle 0.32 ≈ 37°, size 8 vs the former blunt 0.45 / 7).
  Author-facing geometry only; the `arrowHead` kernel default is unchanged, so
  node-connector arrowheads don't move.

### Accessibility

- **Coarse-pointer tap-target floors extended to navigation.** The 2.9 rem
  touch floor (already on primitives/forms/feedback) now also covers
  `.ui-sitenav a`, `.ui-app-nav a`, `.ui-sitemenu > summary`, and
  `.ui-themetoggle__button` under `@media (pointer: coarse)` — the primary nav
  affordances were below the 44 px target on touch.
- **App shell uses dynamic viewport units.** `100vh` → `100dvh` (shell/body) and
  the scrolling rail → `100svh`, so the rail and its pinned account/footer no
  longer fall under the mobile URL bar.
- **Forced-colors status dots stay distinct.** `.ui-dot--success/--warning/--danger/--info`
  and `.ui-dotmatrix__cell--hot/--accent` now map to distinct system colors
  under Windows High Contrast instead of collapsing to one — the only signal
  these carry is colour.
- **Keyboard affordance parity.** `.ui-menu__item:focus-visible` gets the same
  row highlight as hover; the segmented control's focus ring is now inset so the
  container's `overflow: hidden` no longer clips it.
- **Reduced-motion skeleton.** `.ui-skeleton` flattens to a solid placeholder
  under `prefers-reduced-motion` instead of freezing mid-shimmer.

### Fixed

- **Published-type drift (code-quality audit).** `ui.meter({ tone: 'info' })` and
  `ui.bracketNote({ tone: 'success' })` emit real classes at runtime, but the
  generated `.d.ts` tone unions (hand-mirrored in `gen-dts.mjs`) omitted them, so
  a TS consumer got a spurious type error for a value that renders. The unions
  now match the factory; a new `check:recipe-types` gate cross-checks every
  factory's string-literal options against its `*Opts` union so this whole class
  of drift fails CI.
- **Component-library audit (16-agent dogfood pass) — the validates-but-no-ops
  cluster.** A whole-surface audit found the meter-style trap (a class/token that
  validates and paints but silently does nothing without an undocumented
  precondition) recurring across components. Fixed:
  - `aria-disabled="true"` on `.ui-button` / `.ui-link` now sets
    `pointer-events: none` — it looked dead but a real `<a>` still navigated.
  - Disabled affordance reaches the controls that wrap a native input
    (`.ui-switch` / `.ui-check` / `.ui-segmented__option` via `:has(input:disabled)`,
    plus `.ui-range` / `.ui-file`) — they previously looked operable and their
    label kept `cursor: pointer`.
  - Bare `[aria-current]` selectors (`.ui-sitenav`, `.ui-breadcrumb__item`) now
    scope `:not([aria-current='false'])`, so a correctly-authored
    `aria-current="false"` link is no longer styled as current.
  - The active-tab forced-colors re-assert moved from `base.css` to
    `disclosure.css` (after the default rule) — an earlier bundle leaf let the
    accent default override it, so the selected tab lost its only HC cue.
  - `.ui-meter__fill` / `.ui-progress__bar` get a system colour under
    `forced-colors`, so the measured proportion stays visible.
  - `.ui-search` gains a 2px keyboard focus ring to match every sibling input
    (it had only a 1px border-colour shift).
  - `.ui-prose` gets `overflow-wrap: break-word` — long tokens in
    machine-generated Markdown forced horizontal page scroll.
  - `.ui-mark--draw` is scoped to fill styles (`:not(--underline, --box, --strike)`)
    so it no longer looks applied while doing nothing.
  - `.ui-cq` hardcodes its container-name (the `@container bronto` collapse
    queries hardcode it, so a `--cq-name` override silently killed the collapse).
  - `initPopover()` seeds resting ARIA (`aria-haspopup`, `aria-controls`,
    `aria-expanded`) and syncs `aria-expanded` when the UA closes a native
    popover; `toast()` validates `tone` (an unknown string rendered an unstyled
    neutral toast) and warns; the combobox listbox gets an accessible name.
  - `.ui-error-summary__title` uses the legible sans, not the low-legibility Doto
    display face. `.ui-input` / `.ui-search` autofill stays on-theme.
  - `.ui-reveal` hidden state is gated on `scripting: enabled` (genuinely degrades
    visible with no JS; the prior comment lied) — and `ui-scroll-reveal` is the
    documented zero-JS path.
  - Parity modifiers added: `.ui-meter--info`, `.ui-bracket-note--success`.
- Responsive/mobile hardening across the framework: `rem`-rooted type for WCAG
  1.4.4, coarse-pointer tap-target floors, combobox/tour-note viewport clamps,
  and `@media (hover)` gating — with a new responsive e2e sweep.
- **Faint numbers on stat cards.** `.ui-stat__value` / `.ui-app-metric__value`
  (and the report cover/section titles, rail brand, panel titles, `.ui-display`,
  `.ui-quote`) set the Doto display face but no weight, so they rendered at the
  thinnest cut (400). They now apply `--display-weight(-strong)` — visibly bolder
  and more legible, on screen and in print.
- **Painted data surfaces dropped in the PDF.** Headless-Chromium print drops
  backgrounds by default, silently blanking the data-bearing fills. Dot-matrix
  cells, the segmented meter, status dots, masked glyphs, highlight marks,
  connector lines, and progress/meter fills now carry `print-color-adjust: exact`
  so they survive the A4 print/PDF that the report kit targets.
- **Dark-theme cards/tables printed dark-on-white.** The dark→ink token remap was
  scoped to `.ui-report`; it is now lifted to the print `:root` (in the exempt
  token-definition file), so a bare `.ui-card` / `.ui-statgrid` / `.ui-table` —
  the markup an external LLM emits — also prints legibly.
- Inline `ui-citation` no longer dumps its full URL mid-sentence when printed
  (the reference list carries the URL); `ui-legend--with-values` values are
  right-aligned for a clean tabular column.
- **Annotation elbow connector was a 45° chamfer, not a dogleg.**
  `connectorElbow` turned by `min(|dx|,|dy|)`, drawing a diagonal stub the
  `stroke-linejoin` bevel never matched. It now delegates to the connectors
  geometry kernel's right-angle `elbowPath` (H/V/H), so an annotation leader and
  a node connector draw the same elbow.
- **Scoped behaviors no longer hijack the whole document on a null root.**
  `init*({ root })` with an explicitly-provided-but-unready root (a framework
  ref still `null` at mount, a conditional that hasn't rendered) now no-ops
  instead of silently widening to document-wide delegation. The react/solid/qwik
  bindings emit `root: null` for the not-ready case so the distinction survives
  the boundary; passing no `root` still delegates from `document` exactly as
  before. Affects every delegated behavior (dialog, menu, combobox, …).
- **`--report-width` / `--report-padding-block` are now declared defaults** on
  `.ui-report` — they were read with inline fallbacks but never declared, so the
  override surface was undiscoverable and `--report-measure` looked like the
  width knob when it isn't.
- Carousel's IntersectionObserver is now set up and torn down in lockstep with
  its event binding, removing a one-tick window where a re-init left two
  observers on the same slides.
- **`ui-meter` / `ui-progress` fill painted a 0×0 box.** `.ui-meter__fill` and
  `.ui-progress__bar` set `block-size`/`inline-size` but no `display`, so on the
  documented `<span>` fill (an inline box ignores width/height) the bar rendered
  empty — a "validates-but-renders-nothing" trap the registry and docs both
  hid. They are now `display: block`. Found by a second multi-agent dogfood
  pass; guarded going forward by a render-geometry e2e (below).

### Documentation

- LLM-authored static reports: a prominent CSS-loading note (bundler vs
  `node_modules` vs CDN) and a copy-pasteable CDN report in
  `docs/reporting.md`; clarified that `dist/bronto.css` does **not** include the
  opt-in report/chart/legend/annotation layers; number/date formatting
  guidance; and a standalone, no-build report reference
  (`demo/report-standalone.html`).
- Resolved the `is-*` self-contradiction: the framework's own
  `is-num`/`is-pos`/`is-neg`/`is-key`/`is-open` state hooks are valid even
  though they deliberately live outside `cls` (documented in
  `docs/reference.md` and `classes.json`).
- Clarified two standing contracts in `docs/architecture.md`: `css/analytical.css`
  is the roll-up of exactly the seven figure leaves (annotations, legend, marks,
  connectors, spotlight, crosshair, selection) — `sources`/`state`/`generated`/
  `workbench`/`command` are adjacent leaves imported individually — and the root
  `.` export is CSS-only (no runtime JS at the root). Pre-1.0 stability/pinning
  spelled out in `docs/stability.md`. `docs/workbench.md` notes that
  `.ui-selectionbar` is unrelated to the `.ui-sel--*` selection-emphasis classes.
- Honest JSDoc limits: combobox/command read options from the DOM at init
  (re-run after replacing them); popover restores focus on Escape but not on
  outside-click; the table sorter is locale-naive display-text; mask-mode glyphs
  are single-tone.
- **Foreign-renderer recipes hardened after a multi-agent dogfooding pass**
  (build five real reports across the whole stack, review from every POV). The
  Vega CDN recipe now pins the `/build/*.min.js` UMD bundles and `renderer:'svg'`
  (a bare `cdn.jsdelivr.net/npm/vega@6` tag has no `window.vega`, so the previous
  recipe rendered nothing); the file://-portable path (inline the config — an
  imported/fetched config is CORS-blocked from disk) is now explicit. New
  `docs/reporting.md` recipes: "Theming a live report" (the theme-toggle/re-embed
  foot-guns — clear the host, container-width-while-hidden, Mermaid source vs
  output), live charts are `ui-screen-only` while the table prints (a kept live
  chart bakes the on-screen theme), `ui-meter`/`ui-quote` markup, and the
  sequential/diverging frozen-figure ramp. `docs/d2.md` gains a frozen
  inline-`<svg>`-from-slots recipe and on-accent-ink guidance; `docs/vega.md`
  documents the theme-inverting ramp and the OKLCH-vs-d3 gradient-key drift.
- `docs/annotations.md` states the rule in both directions: a data annotation
  must stay readable (not `aria-hidden`), a decorative one must be hidden.
- **A second dogfood pass closed the foreign-renderer/contract gaps it found.**
  `docs/sources.md` + `llms.txt` now document the standalone `.ui-src` trust
  pill and state that a `ui-src--*` tone class **needs a host** (a bare
  `<span class="ui-src--verified">` validates but renders nothing), and name the
  source-card body part as `__excerpt` (not `__detail`). `docs/mermaid.md`:
  `gantt`/`timeline` are **not** covered by the base `themeVariables` (they
  render with Mermaid's own defaults — prefer the native `ui-timeline` for a
  report). `docs/mermaid.md` + `docs/d2.md` gain the same `file://` CORS caveat
  Vega carries (inline the map or pre-render). `docs/vega.md`: select the themed
  ramp with `scale: { range: 'heatmap' }` — **not** `scheme:`, which throws — and
  the accent/neutral series map to `--chart-1` / `--chart-8`, so a legend keys
  them with `ui-legend__swatch--1`/`--8` (`docs/legends.md`). `docs/reporting.md`:
  the live-theme recipe now `finalize()`s the prior Vega view before re-embed
  (was leaking a view per toggle), and notes `ui-meter --value` clamps at 100
  (put an over-target figure in the written label). `docs/marks.md`: `ui-mark`
  is a behind-text highlight (contrast-safe; never needs `--on-accent`).

### Internal

- **New `check:versions` gate** — every `@ponchia/ui@X.Y.Z` literal in a shipped
  doc (`llms.txt`, `docs/reporting.md`, …) must equal `package.json`, so a stale
  CDN pin can't ship to LLM/copy-paste consumers on the next bump.
- **Dev-dependency Vega bumped to the v6 stack** — the render-probe now runs on
  `vega@^6.2.0` + `vega-lite@^6.4.3` (Vega-Lite 6 peers Vega 6; a Vega-Lite-6 ÷
  Vega-5 mix is incoherent). The theme `config` is version-independent resolved
  hex, so the artifacts and the probe assertions are unchanged; the documented
  CDN recipe is re-pinned to the matching majors (`vega@6.2.0` / `vega-lite@6.4.3`
  / `vega-embed@7.1.0`, all still shipping a UMD `/build/*.min.js`). Vega remains
  the consumer's renderer, not a runtime dependency.
- **New `check:doc-recipes` gate** — a `<script src>` CDN recipe in a shipped doc
  must pin a jsDelivr `/build/*.min.js` UMD bundle, never a bare
  `cdn.jsdelivr.net/npm/<pkg>@N` redirect (which serves a module bundle with no
  global and renders nothing). Docs are otherwise an untested surface; this is
  the structural guard that closes the broken-recipe class the dogfood pass
  found. `<link href>` CSS and prose mentions are exempt.
- **`classes.json` `customProperties` expanded** to cover the load-bearing,
  no-op-without-it knobs the audit found undocumented: the **required**
  `--icon-mask` (a bare `.ui-icon` paints a solid square without it) and
  `--ui-vt-name` (`.ui-vt` is inert without it), plus `--icon-size`. The
  `states` manifest comment now explicitly names the runtime-managed hooks it
  deliberately excludes (`is-leaving`/`is-visible`/`is-in`/`is-on`) so the
  omission reads as intentional, not a gap. `--on-accent` is annotated at its
  token source as a read-only export for foreign renderers (in-DOM ink is
  `--button-text`). `contrast.md` now prints APCA `Lc` to one decimal so an
  advisory shortfall (e.g. `Lc 44.9`) no longer rounds to a passing-looking `45`.
- Raw bundle budget 81 → 82 kB for the component-audit accessibility/state
  blocks (gzip held ~14.1 kB — the additions are repetitive media-query and
  `:has()`/`:not()` rules that compress well).
- **Code-quality audit (16-agent) — two new gates + targeted dedup, no churn.**
  A code-health pass (complexity / duplication / AI-slop / missing-best-practice)
  that deliberately left working, gate-protected code alone. Added:
  `check:recipe-types` (factory↔`.d.ts` option parity, above) and `check:chain`
  (every `check:*` script is wired into the aggregate `check` chain — closes the
  silent-coverage-drop class; it would have caught a forgotten gate). Reconciled
  a latent bug — `clamp()` had silently diverged between `connectors` and
  `annotations`; the two now share one scalar/geometry kernel (the guarded form).
  Dedup that removed real duplication: a shared `collectHosts()` /
  `scrollIntoViewSafe()` / `wrapIndex()` in `behaviors/internal.js` (~9 behaviors),
  a `freshnessErrors()` helper reused by 7 drift gates, the shared `CSS_COLOR`
  regex across the 3 foreign-renderer gates, `check-report`'s opt-in list as a
  loop, `check-pack`'s shipped-docs derived from `pkg.files`, and a looser
  `check-classes` recipe-scrape. README hero de-densified; `srcTone` matched to
  `stateTone`'s idiom; the intentional badge accent-mix (45% vs 40%) documented.
- **`check:dist` now asserts source-coverage** — every `css/*.css` leaf must be
  bundled, an opt-in `EXTRA_LEAVES` entry, or a roll-up; an orphaned leaf that
  would ship nothing now fails loudly (the inverse of the existing stale-dist
  guard).
- **`check:dts-emit` now compares `.d.ts.map`** mapping data (volatile `sources`
  path normalized), closing a drift hole the code comment had acknowledged.
- DTCG export types `--display-weight*` as the spec `fontWeight` type (was
  `number`). Corrected stale `check-tokens.mjs` doc references (the real gate is
  `check:fresh`).
- Tests: binding hook-surface parity is now **derived** from the modules (the old
  hard-coded list silently omitted the five analytical hooks); a new
  `analytical-boundary` test makes the "no scales/state/fetch/global-hotkey"
  contract executable; a new behavior test pins the null-root no-op.
- Removed four dead keyframes (`scan`/`growBar`/`drawLine`/`pulseNode`) from
  `motion.css`. Raw bundle budget 80 → 81 kB for the accessibility blocks (gzip
  held ~14.0 kB).
- **`classes.json` `--value` retargeted** to `.ui-meter__fill, .ui-progress__bar`
  (was the `.ui-meter, .ui-progress` track parent) — the custom property is read
  on the fill child, so the machine-readable manifest now matches where an author
  actually sets it.
- **New render-geometry e2e** (`test/e2e/render-geometry.spec.mjs`) — launches a
  browser at the demo's real report primitives and asserts the `.ui-meter__fill`
  / `.ui-progress__bar` fills and the standalone `.ui-src` pill paint a non-zero
  box (via `getBoundingClientRect`, not the inline-box-lying
  `getComputedStyle().inlineSize`). Closes the validates-but-renders-nothing
  category that hid the meter regression. The demo gains a standalone `.ui-src`
  pill row to exercise it.

## 0.5.0 — 2026-06-02

A **minor** that builds out the "analytical & generated-report UI" identity: a
full suite of opt-in **communication primitives** — SVG annotations, legends,
text/evidence marks, leader-line connectors, a guided-focus spotlight, a
crosshair/readout, a selection-state vocabulary, label declutter + direct labels
(`declutterLabels`/`directLabels`), and a source/citation/provenance **trust
layer** — plus a consolidation pass over them. Each owns its visual grammar and
pure geometry and refuses to own scales/state/hit-testing (no chart engine).

Per the project's versioning policy, breaking changes ship in the minor. This
release carries three: the opt-in report kit's chart data key moved into the new
legend layer (`.ui-chart__legend`/`__swatch` removed — see Changed and
[`MIGRATIONS.json`](MIGRATIONS.json)), annotation arrowheads now render via
the shared connectors geometry kernel (a small path-shape change), and the
opt-in marks' rationed-accent tone was renamed `evidence`→`accent` to match the
rest of the analytical tone vocabulary. Everything else is additive and opt-in,
save for the tiny `.ui-shortcut` keyboard-hint primitive that joins the core
layer; the rest of the default `dist/bronto.css` is unchanged. Also folds in the
0.4.x maintenance hardening that had not yet been released.

### Added

- **SVG annotations** (`@ponchia/ui/css/annotations.css`,
  `@ponchia/ui/annotations`, `.ui-annotation*`, `ui.annotation()`): an opt-in
  annotation layer for charts, reports, and analytical figures, following the
  d3-annotation grammar (a **subject** marks the thing, a **connector** points
  away, a **note** carries the text). Ships a class grammar (variants for
  label/callout/elbow/curve/circle/rect/threshold/badge/bracket/band/slope/
  compare/cluster/axis/timeline/evidence, six tones, and opt-in
  `draw`/`reveal`/`pulse`/`focus` motion that respects `prefers-reduced-motion`)
  plus tiny geometry helpers that return SVG strings only — they own no chart
  scales, mutate no DOM, and provide no edit mode. Documented in
  [`docs/annotations.md`](docs/annotations.md) and gated by `check:report`.
- **Legends / data keys** (`@ponchia/ui/css/legend.css`, `.ui-legend*`,
  `ui.legend()`/`ui.legendItem()`/`ui.legendSwatch()`, `initLegend`): an opt-in,
  standalone data-key layer that reads the `--chart-*` palette tokens.
  Categorical, continuous gradient (sequential + `--diverging`), threshold, and
  pattern keys; swatch colour set inline (`--chart-color`) or via
  `.ui-legend__swatch--1..8` index helpers; vertical/compact/with-values
  layouts. WCAG 1.4.1 by construction (the text label is the non-colour
  channel), with `forced-colors` and print care. Optional interactive
  (series-toggling) entries are `<button aria-pressed>` controls: `initLegend`
  flips `aria-pressed`/`.is-inactive` and emits `bronto:legend:toggle`
  (`{ series, active }`) — the host owns hiding the series and any `aria-live`
  announcement (it is never a chart engine). Optional `useLegend` hook in the
  React/Solid/Qwik bindings. New `check:legend` gate proves swatch colours are a
  subset of `tokens/charts.js` and never a raw hex. Documented in
  [`docs/legends.md`](docs/legends.md).
- **Text marks / evidence** (`@ponchia/ui/css/marks.css`, `.ui-mark*`,
  `.ui-bracket-note*`, `ui.mark()`/`ui.bracketNote()`): an opt-in layer of
  sober, report-grade emphasis for running prose — the counterpart to SVG
  annotations (annotations call out a figure, marks call out a sentence). Inline
  `.ui-mark` (highlight/underline/box/strike; `--accent` + status
  tones; `--draw` reduced-motion-safe sweep) for use on `<mark>`, and
  `.ui-bracket-note` for bracketing a whole passage. Pure CSS on semantic
  tokens, monochrome by default, with `forced-colors` care. Documented in
  [`docs/marks.md`](docs/marks.md).
- **Connectors / leader lines** (`@ponchia/ui/css/connectors.css`,
  `@ponchia/ui/connectors`, `.ui-connector*`, `initConnectors`, `ui.connector()`):
  an opt-in layer that draws a line between two DOM elements (the
  page-coordinate cousin of annotations). Pure geometry helpers
  (`connectRects`/`connectorPath`/`arrowHead`/…) that return SVG strings and own
  no DOM, an `.ui-connector` overlay grammar (straight/elbow/curve, arrow/dot
  ends, tones, dashed, `--draw`), and an optional `initConnectors` behavior that
  draws + tracks on resize/scroll. `useConnectors` in the bindings. Documented in
  [`docs/connectors.md`](docs/connectors.md).
- **Spotlight / guided focus** (`@ponchia/ui/css/spotlight.css`, `.ui-spotlight*`,
  `.ui-tour-note*`, `initSpotlight`, `ui.spotlight()`): an opt-in guided-focus
  overlay — a box-shadow cutout over a target element, optional ring, and a
  callout note. `initSpotlight` positions the cutout (`--spot-x/y/w/h`) and
  re-places on resize/scroll and when `data-target` changes. Deliberately **not**
  a tour engine — the host owns step order/advancing/visibility. `useSpotlight`
  in the bindings. Documented in [`docs/spotlight.md`](docs/spotlight.md).
- **Crosshair / readout** (`@ponchia/ui/css/crosshair.css`, `.ui-crosshair*`,
  `.ui-readout`, `initCrosshair`, `ui.crosshair()`): an opt-in plot ruler +
  pinned readout. `initCrosshair` tracks the pointer over a
  `[data-bronto-crosshair]` plot, sets `--crosshair-x/y`, and dispatches
  `bronto:crosshair:move` with px + 0–1 fractions — it reports position only and
  never maps pixels to data (that needs the host's scales). `useCrosshair` in the
  bindings. Documented in [`docs/crosshair.md`](docs/crosshair.md).
- **Selection states** (`@ponchia/ui/css/selection.css`, `.ui-sel*`,
  `ui.sel()`): a tiny cross-cutting selection-emphasis vocabulary
  (`--on`/`--off`/`--maybe`) reusable on chart marks, table rows, list items, or
  map regions. The carve-out from brush/lasso — Bronto styles the states; the
  host owns the selection/hit-test logic. Documented in
  [`docs/selection.md`](docs/selection.md).
- **Sources, citations & provenance** (`@ponchia/ui/css/sources.css`,
  `.ui-citation`/`.ui-source-card`/`.ui-source-list`/`.ui-provenance`,
  `ui.citation()`/`ui.source()`/`ui.provenance()`): an opt-in, CSS-only **trust
  layer** for generated reports and AI output — the grammar for "where did this
  come from?". A cross-cutting `.ui-src--*` state (verified/reviewed/generated/
  unverified/stale/conflict) sets a rationed tone, always paired with an
  author-written label (never colour alone). Bronto owns the grammar + states;
  the host owns fetching, citation numbering, and trust. The first
  frontier-primitive beyond the analytical suite. Documented in
  [`docs/sources.md`](docs/sources.md).
- **Keyboard-shortcut hint** (`.ui-shortcut` + `.ui-shortcut__sep`, core): a tiny
  universal-chrome primitive that lays out one or more `.ui-kbd` keys as a chord
  (`⌘`+`K`) or sequence (`G` then `I`) with a dim connective. The command tier's
  smallest piece, broadly useful outside a palette (menu items, buttons,
  tooltips). Class-only, like `.ui-kbd`.
- **Lifecycle / system state** (`@ponchia/ui/css/state.css`, `.ui-state`
  (+`__label`/`__detail`/`--busy`) with canonical state modifiers
  (saving/saved/queued/offline/stale/conflict/error/locked/reviewed/
  needs-review), `.ui-syncbar`, `ui.state()`): an opt-in, CSS-only vocabulary for
  the states apps actually live in — a labelled state object with a rationed tone
  and a page/document sync bar. The label is the state (never colour alone);
  `--busy` pulses the indicator (reduced-motion-safe). Bronto ships the visual
  states + canonical wording; the host owns the state machine, retry, and
  persistence. Frontier candidate #2. Documented in [`docs/state.md`](docs/state.md).
- **Generated content & AI trust** (`@ponchia/ui/css/generated.css`,
  `.ui-generated`/`.ui-origin-label`/`.ui-reasoning`/`.ui-tool-log`/`.ui-tool-call`,
  `ui.originLabel()`): an opt-in, CSS-only set of **trust surfaces** for AI /
  system-generated content — a marked region, an origin label, and quiet
  native-`<details>` reasoning + tool-call logs. Not a chat kit; no
  fabricated-confidence widget. Bronto styles disclosure/origin/trace, the host
  owns model metadata, redaction, and safety. Pairs with the source layer.
  Documented in [`docs/generated.md`](docs/generated.md).
- **Workbench** (`@ponchia/ui/css/workbench.css`, `.ui-inspector`/`.ui-property`/
  `.ui-selectionbar`): an opt-in, CSS-only core for tool UIs — a selected-object
  inspector panel, denser property rows, and a raised selection action bar.
  Layout + affordances only; resizable split panes and drag handles are
  deferred. Documented in [`docs/workbench.md`](docs/workbench.md).
- **Command palette** (`@ponchia/ui/css/command.css`, `.ui-command` (+
  `__input`/`__list`/`__group`/`__item`/`__shortcut`/`__meta`/`__empty`),
  `initCommand`, `useCommand`): an opt-in CSS shell + behavior — filter +
  keyboard-navigate a DOM-authored command list (roving focus, group hiding,
  full keyboard), emitting `bronto:command:select` ({ value, label }) and
  `bronto:command:close`. Bronto navigates; the host owns the action registry,
  routing, and execution. No global Cmd/Ctrl+K. Completes the command tier
  (frontier #3) atop the shipped `ui-shortcut`. Documented in
  [`docs/command.md`](docs/command.md).
- **Label declutter** (`@ponchia/ui/annotations` `declutterLabels`): a
  deterministic, order-preserving **1-D** label de-overlap helper (sort, push
  apart by `size + gap`, slide to fit `max`) — pure, no DOM/scales. Not a 2-D
  collision solver. Documented in [`docs/annotations.md`](docs/annotations.md).
- **Direct labels** (`@ponchia/ui/annotations` `directLabels`): the
  direct-labeling companion to `declutterLabels` — it declutters labels along an
  axis **and** draws the leader from each anchor to its placed label, reusing the
  connectors geometry kernel. Returns `[{ x, y, anchor, key, d }]` (the `d` feeds
  a `ui-annotation__connector`). Deterministic and pure: no scales, no DOM, no
  2-D placement (the 1-D core of Labella, completed with leaders). Documented in
  [`docs/annotations.md`](docs/annotations.md).
- **Connectors** (`@ponchia/ui/connectors`, `@ponchia/ui/css/connectors.css`,
  `initConnectors`, `useConnectors`, `ui.connector()`) and **Spotlight**
  (`css/spotlight.css`, `initSpotlight`, `ui.spotlight()`) — leader lines between
  DOM elements and a guided-focus overlay; both opt-in, geometry/visual only
  (the host owns layout/tour state).
- **Crosshair / readout** (`css/crosshair.css`, `initCrosshair`,
  `ui.crosshair()`) and **selection states** (`css/selection.css`, `ui.sel()`) —
  a plot ruler that reports pointer position (not data), and a cross-cutting
  `.ui-sel--on/off/maybe` emphasis vocabulary (the host owns brush/hit-test).
- **`@ponchia/ui/css/analytical.css`** — a convenience roll-up that bundles the
  seven analytical leaves (annotations, legend, marks, connectors, spotlight,
  crosshair, selection) into one import. Add `dataviz.css`/`report.css`
  separately as needed.

### Fixed

- The optional Qwik binding (`@ponchia/ui/qwik`) is now built from the packed
  tarball in CI **and** release, alongside React/Solid — closing a coverage gap
  (it was documented as optimizer-proven but no job actually built it). Also
  covered by `check:pack`, the size report, and the dead-code config.

### Changed

- **Breaking (opt-in report kit):** the chart data key moved out of
  `css/report.css` into the standalone `css/legend.css`. `.ui-chart__legend` →
  `.ui-legend` (now with `.ui-legend__item`/`.ui-legend__label` rows) and
  `.ui-chart__swatch` → `.ui-legend__swatch`. Import `@ponchia/ui/css/legend.css`
  beside the report kit; see [`MIGRATIONS.json`](MIGRATIONS.json) and
  [`docs/legends.md`](docs/legends.md). The `--chart-color`/`--chart-pattern`
  swatch contract is unchanged, so the rename is mechanical.
- **Breaking (opt-in marks):** the rationed-accent **tone** on `.ui-mark` and
  `.ui-bracket-note` was renamed `evidence` → `accent` (`ui-mark--evidence` →
  `ui-mark--accent`, `ui-bracket-note--evidence` → `ui-bracket-note--accent`;
  `ui.mark({ tone: 'accent' })` / `ui.bracketNote({ tone: 'accent' })`) so the
  accent tone reads the same across every analytical primitive (it already was
  `accent` on `ui.connector`/`ui.annotation`). `.ui-annotation--evidence` is
  **unchanged** — it is a marker _variant_ (a proof/source shape), not a tone.
  Mechanical whole-token rename; see [`MIGRATIONS.json`](MIGRATIONS.json).
- **Consolidation:** the SVG geometry is single-sourced in the `connectors`
  kernel — `@ponchia/ui/annotations` now builds its connectors on it, so a
  line/curve/arrow/dot is drawn one way across both. `connectorLine`/`Curve`/
  `EndDot` output is byte-identical; **`connectorEndArrow` is the one
  (minor-breaking) shape change** — the arrowhead now matches the connectors
  arrowhead. New `check:helpers-dts` gate keeps the hand-maintained
  `annotations`/`connectors` `.d.ts` in parity with their runtime exports.
- The Doto webfont now ships as **woff2 only** (Brotli) instead of uncompressed
  TTF: ~5.7 kB per weight vs ~137 kB, cutting the six-weight payload from ~823 kB
  to ~35 kB (the dot-matrix glyphs compress ~96%) and shrinking the unpacked
  tarball by roughly the same. No TTF fallback is carried — woff2 is supported by
  the entire browser floor (ADR-0002: Chrome 125 / Safari 18 / Firefox 129).
  `@font-face` is internal, so this is transparent to consumers; only self-hosts
  that referenced `fonts/doto-*.ttf` directly need to point at `*.woff2`.
- `docs/architecture.md` now ships in the package, so the offline rationale the
  shipped ADRs link to resolves inside the tarball.
- `docs/stability.md` clarifies that `data-surface`/`data-density`/
  `data-contrast` are **convenience presets**, not part of the stability
  contract; `data-theme` (light/dark) remains the contractual base.

### Internal

- Token values are single-sourced in `tokens/index.js` (`cssVars`); the
  `css/tokens.css` palette is generated from it, so the dark palette is authored
  once instead of in three places (the shipped CSS is byte-identical).
- `behaviors/index.js` is split into per-behavior modules behind the same public
  barrel (no surface change).
- Drift-gate consolidation (`assertFresh`), a Qwik type smoke + stronger
  class-recipe wiring test, the APCA advisory widened to the accent text across
  the core palette and every colorway (still advisory; WCAG 2.1 AA stays the
  hard gate), an OLED computed-style smoke test, and several doc reconciliations.
- New `demos.spec` e2e sweep runs the console-error / uncaught-exception /
  failed-response guards **and** an axe scan over every per-feature demo page
  (annotations, legends, marks, connectors, spotlight, crosshair, selection,
  report) in both themes and cross-browser — previously only `/demo/` was
  guarded, so a throw or 404 on those SVG-heavy pages could not fail CI.
- The `check:dist` payload ceiling was raised to 80 kB raw / 14.5 kB gzip (from
  78 kB / 13.5 kB). The default bundle was sitting ~21 bytes under the old gzip
  gate — the analytical primitives are opt-in leaves and stay out of it, so this
  is residual prior growth; the bump restores a real ~3% raw / ~7% gzip margin
  so an ordinary token addition no longer trips an unrelated PR.

## 0.4.1 — 2026-06-01

Patch hardening for the public framework surface, plus the first step of the
modern-platform motion direction (see [ADR-0002](docs/adr/0002-scope-and-2026-baseline.md)).

### Added

- **Static report kit — `@ponchia/ui/css/report.css` + `docs/reporting.md`.**
  An opt-in, PDF-first report layer for LLM-authored and hand-authored HTML:
  report covers, headers, section numbering, summaries, findings, evidence
  blocks, source/appendix/footnote blocks, chart wrappers/legends/fallback
  tables, and print utilities (`ui-print-only`, `ui-screen-only`,
  `ui-break-before`, `ui-break-after`, `ui-keep`, `ui-print-exact`). It stays
  out of the default bundle, ships with the offline LLM docs, and is covered by
  a report fixture, package/export checks, and class-contract validation.
  The layer also includes compact covers, unnumbered report sections, simple
  static chart-bar primitives, and evidence-table framing rules so generated
  reports need less private CSS.
- **Zero-JS enter _and_ exit motion for native-`<dialog>` overlays.** Modal and
  drawer (and their backdrop) now fade/scale **both ways** via `@starting-style`
  + `transition-behavior: allow-discrete` — previously they only animated in and
  vanished on close. Pure CSS, reduced-motion-aware (snaps with no flash), scoped
  to `dialog.ui-modal` so the controlled `.is-open` path is unchanged.
- **Enter/exit motion extended to popover, toast, and accordion** (ADR-0002
  "next, same approach"):
  - **Popover** (`.ui-popover`) fades + slides both ways via the same
    `@starting-style` + `allow-discrete` recipe, covering both the native
    `[popover]` top-layer path and the `.is-open` fallback. Zero JS,
    reduced-motion-aware.
  - **Toast** (`.ui-toast`) now plays a CSS fade-out on dismiss instead of being
    yanked from the DOM. The `toast()` behavior adds `.is-leaving` and removes
    the node on `transitionend` (with a timeout fallback); it falls back to
    instant removal under reduced-motion or where no transition is computed, so
    the persistent `aria-live` region is undisturbed.
  - **Accordion** (`.ui-accordion`, native `<details>`) animates auto-height
    open/close via `::details-content` + `interpolate-size: allow-keywords` +
    `content-visibility … allow-discrete`. Strict progressive enhancement —
    gated on `@supports selector(::details-content)`; engines without it (today,
    Firefox/Safari) simply snap, exactly as before.
- **Scroll-driven motion (progressive enhancement).** `.ui-scroll-progress` (a
  reading-progress bar on a `scroll(root block)` timeline, RTL-aware) and
  `.ui-scroll-reveal` (a JS-free, IntersectionObserver-free reveal on a `view()`
  timeline). Both are gated on `@supports (animation-timeline: …)` and
  `prefers-reduced-motion: no-preference`, so engines without scroll timelines
  (today, Firefox/Safari) keep a static end-state and reduced-motion users get
  no movement.
- **View Transitions (progressive enhancement).** A `.ui-vt` helper
  (`view-transition-name: var(--ui-vt-name)`) to morph an element across a
  same-document `startViewTransition()` or a cross-document navigation, an
  on-brand default for the `::view-transition-*(root)` cross-fade, and a
  **reduced-motion kill-switch** for the `::view-transition-*` pseudo-tree
  (which the platform does *not* quiet automatically). Cross-document nav stays
  a documented one-liner you add yourself (`@view-transition { navigation: auto }`
  is document-global, so it can't be layered or scoped by the framework).
- **Optional Qwik bindings — `@ponchia/ui/qwik`.** Same thin-adapter shape as
  the React/Solid bindings (`useDialog`, `useToast`, … `useBrontoBehavior`, plus
  the `cls`/`ui`/`cx` + `applyStoredTheme` re-exports), wrapping the SSR-safe
  behaviors in Qwik's `useVisibleTask$` (run on visible, cleanup on dispose) so a
  resumable page stays zero-JS until interaction. Scope a behavior with a Qwik
  signal: `useDialog({ root: useSignal() })`. `@builder.io/qwik` is an **optional**
  peer dependency, so the core stays zero-dependency. New `examples/qwik-vite`
  builds it through the real Qwik optimizer.
- **OLED true-black surface variant — `data-surface="oled"`.** The dark base is
  now a readable elevated near-black (see Changed); this opt-in root attribute
  restores pure black for OLED power-saving and the original "Nothing" look.
  CSS-only preset (like `data-density`/`data-contrast`), scoped to the dark
  theme. Documented in `docs/theming.md`.
- **APCA advisory for dark text.** `check:contrast` now emits a non-failing
  warning when a dark text pairing falls below its perceptual APCA target (WCAG
  stays the hard gate) — the early-warning that would have caught the illegible
  dim text. The kitchen-sink demo gains a unified theme picker (theme × colorway
  × surface, all persisted).
- **[ADR-0003](docs/adr/0003-theme-model.md)** records the theme model: a binary
  light/dark base × one-knob derivation × orthogonal axes (colorway, surface,
  contrast, density), and why a flat named-theme catalog is rejected.
- React and Solid Vite examples, CI/release matrix coverage for those examples,
  runtime binding tests, public API stability docs, a release runbook, and
  `npm run size:report`.

### Changed

- **Dark theme re-tuned for readability.** The dark base moved off pure `#000`
  to an elevated near-black (`--bg #121212`, panels `#1c1c1c`/`#222`/`#242424`,
  lines `#383838`/`#555`); body text eased `#f2f2f2 → #e6e6e6` (APCA Lc 99 → ~91,
  removing halation) and **dim/meta text raised `#858585 → #a0a0a0`** (APCA
  Lc ~36 → ~49 — the actual "hard to read" fix). WCAG 2.x over-rates contrast on
  pure black, so pairings "passed" while reading poorly; the re-tune clears WCAG
  AA on every pairing and lifts perceptual (APCA) contrast. Accent and status
  colours are unchanged; true black stays available via `data-surface="oled"`.
- **Browser floor raised to Chrome/Edge 125+, Safari 18+, Firefox 129+**
  (early–mid 2025). A deliberate greenfield stance (ADR-0002) so the framework
  can build natively on `@starting-style`, `transition-behavior: allow-discrete`,
  `oklch()`/relative color, and `light-dark()`. No fallbacks ship below the
  floor; not-yet-cross-engine features (View Transitions, scroll-driven
  animations) are enhancement-only and degrade to a static end-state.
- Bundle budget nudged for the new motion: gzip 13.0 → 13.5 kB (for the dialog
  enter/exit work) and raw 76 → 77 kB (for the popover/toast/accordion motion
  plus the scroll-driven + view-transition CSS). Gzip held at ~13.1 kB — it
  compresses well — so the compressed payload still has headroom.

### Fixed

- React and Solid bindings now resolve scoped roots on mount, so `{ root: ref }`
  and resolver callbacks work after framework refs are assigned. Nullish resolver
  results normalize to default behavior instead of crashing destructuring
  behavior initializers.
- Scoped behavior roots now resolve controlled ids root-first, then
  document-wide. This keeps existing body/portal-mounted dialogs, popovers, and
  disclosure panels working while preventing earlier duplicate ids outside an
  island from shadowing the in-root target.
- `data-bronto-dismiss="<selector>"` ignores malformed selectors instead of
  throwing during event handling.
- The one-node glyph mask path now includes a WebKit-prefixed mask declaration,
  and the OKLCH accent ramp uses an explicit white/black neutral endpoint for
  cross-engine browser parity.

## 0.4.0 — 2026-05-31

The color-system release — [ADR-0001](docs/adr/0001-color-system.md) steps 1–8.
A governed evolution beyond pure monochrome: the tier model is written down and
**enforced** (`check:color-policy`), and the "Nothing" look is proven to be a
_skin, not the architecture_ — opt-in **colorways** (amber CRT · phosphor green ·
e-ink), a **data-viz palette** for dashboards (colourblind-safe, gated under
simulated protan/deutan/tritan vision), Tier-3 dot-matrix display tokens, OKLCH
authoring, and an APCA advisory contrast track all ship. Plus a reframed README
+ a rendered docs site, and the curated CHANGELOG is now the GitHub Release body.

**The default build is unchanged** — the red accent, every retained token name,
and both theme palettes render identically; colorways and data-viz are opt-in
entrypoints, never in the default bundle. The only breaking change is the
removal of the orphan `--orange` token (undocumented, unused) — see below.

**BREAKING (orphan token removed)** — **`--orange` / `--orange-soft`** are
removed. They were defined in every token mirror (`css/tokens.css`,
`tokens/index.js`, `tokens.dtcg.json`, `resolved.json`, `index.d.ts`,
`reference.md`) but **referenced by no component and documented nowhere**, and
untiered under the new color model. As a provably-unreferenced token this is
removed in a single minor under the CONTRIBUTING.md deprecation-policy
exception (no working call-site to wind down). Removed rather than adopted; if
categorical color lands later it ships as a governed, opt-in data-viz module
(ADR-0001 tier 4), not a stray top-level token. _Migration:_ if you referenced
`--orange`/`--orange-soft`, define it yourself in a consumer override.

### Added

- **The `--accent-1..6` ramp is now perceptually even (OKLCH).** Steps 1–4 mix
  the accent `in oklch` instead of using the old sRGB ramp (ADR-0001 step 8), so
  the ramp reads as evenly-spaced. `scripts/gen-resolved.mjs` learned to resolve
  `color-mix(in oklch,…)` → hex with the same one-channel tolerance browsers
  show, so `tokens/resolved.json`, the DTCG export, and `docs/reference.md` all
  carry the new values. These are
  token **values** (non-contractual under the 0.x policy) and the ramp is not
  consumed by any shipped component, so there is **no change to any component's
  rendering** — only consumers using `var(--accent-1..4)` directly see the
  (intended) shift.
- **Framework bindings — `@ponchia/ui/react` + `@ponchia/ui/solid`.** Optional,
  thin hooks over the SSR-safe `init*` behaviors (run on mount, clean up on
  unmount/dispose): `useDialog`, `useTabs`, `useMenu`, `useCombobox`,
  `usePopover`, `useDisclosure`, `useFormValidation`, `useTableSort`,
  `useCarousel`, `useDismissible`, `useThemeToggle`, `useDotGlyph`,
  `useToast()`, and the generic `useBrontoBehavior(init, opts)`; `cls`/`ui`/`cx`
  re-exported for one-import DX. `react` / `solid-js` are **optional peer
  dependencies** — the core stays zero-runtime-dependency. Thin adapters over
  the canonical CSS/behaviors layer, not a component library (architecture ADR).
- **Glyphs: a one-node icon-at-scale render path + a `.ui-icon` wrapper + 5
  circle-family glyphs.** `renderGlyph(name, { render: 'mask', size })` now
  returns a **single** `.ui-icon` element masked by the glyph bitmap (one DOM
  node instead of 256 cells) — for an icon in every table row. It scales with
  the text (`--icon-size`, default `1em`) and inherits `currentColor`. New
  `.ui-icon` CSS primitive (`cls.icon`) drives it. Vocabulary grows to 48 with
  `circle`, `check-circle`, `x-circle`, `plus-circle`, `minus-circle`.
- **Data-viz colour module — `@ponchia/ui/css/dataviz.css` + `@ponchia/ui/charts.json`.**
  An opt-in Tier-4 chart palette for dashboards (ADR-0001 step 7). **Hybrid
  accent-led**: series 1 is the live `var(--accent)` (the brand stays series 1);
  series 2–8 are the Okabe-Ito colourblind-safe set; plus a sequential ramp
  (heatmaps) and a diverging ramp (gains/losses). **Colour is never the sole
  signal** — each series ships a matching `--chart-pattern-*` dot-matrix fill
  (WCAG 1.4.1). The categorical palette is **gated for distinguishability under
  normal + simulated protan/deutan/tritan vision** (`check:charts`, OKLab ΔE),
  not just eyeballed. Resolved hex per theme in `tokens/charts.json` for
  canvas/SVG/charting libs; typed `ChartTokenName` (`./charts`). **Charts-only,
  never UI chrome** (`check:color-policy` fails on `var(--chart-*)` in core CSS)
  and **never in the default bundle** (separate entrypoint). Sourced from
  `tokens/charts.js` (generated → drift-checked by `check:charts`).
- **Display colorways — `@ponchia/ui/css/skins.css`.** Opt-in
  `data-bronto-skin="amber-crt | phosphor-green | e-ink"`, a **root-level**
  choice like `data-theme` (apply on `<html>`). Each re-points the one accent
  to a different single hue — the derived accent family, focus ring, dot-matrix
  and glyphs follow automatically; status colours and the neutral canvas are
  untouched. Authored in **OKLCH**, per-theme (a dark + light accent, like the
  core red), and **every skin accent is contrast-gated** to the same WCAG AA /
  3:1 floors as the core (see `docs/contrast.md`). Shipped as a **separate
  entrypoint, never in the default `dist/bronto.css`** — zero cost unless you
  import it. Sourced from `tokens/skins.js` (generated → drift-checked by
  `check:skins`).
- **Tier-3 dot-matrix "display expression" tokens** (`css/dots.css`):
  `--dotmatrix-glow` (phosphor bloom on lit cells), `--dotmatrix-pulse-min`
  (the `--pulse` floor), documented `--dotmatrix-reveal-step` (scan cadence).
  All default to a **no-op**, so the default render is unchanged; the phosphor
  colorways use the glow in dark.
- **APCA advisory contrast** in `docs/contrast.md`. Every pairing (core **and**
  every colorway) now shows an APCA-W3 `Lc` column beside the WCAG ratio — a
  perceptual cross-check. **Advisory only**: WCAG 2.1 AA stays the hard gate
  (`check:contrast`). Implemented dependency-free, alongside an OKLCH→sRGB
  converter so OKLCH-authored values can be measured.
- **`check:color-policy` gate** (`scripts/check-color-policy.mjs`, wired into
  `npm run check`). Enforces the color constitution: every color-defining token
  (across `global`/`light`/`dark`) must be classified into a tier (this is what
  would have caught `--orange`); the `--chart-*` / `--cat-*` / `--data-*`
  data-viz namespace is reserved; and component CSS may not use raw chromatic
  color (only tiered tokens, with neutral grays / `color-mix()` endpoints).
- **`check:skins` gate** — `css/skins.css` can't drift from `tokens/skins.js`,
  every skin defines `--accent`, and colorways stay out of the default bundle.
- **[ADR-0001 — Color system](docs/adr/0001-color-system.md)** — the five-tier
  color constitution and the backward-compatible roadmap. Steps 1–8 are
  implemented in this release: gate + colorways + Tier-3 tokens + OKLCH for new
  work + APCA advisory + data-viz + OKLCH core accent ramp.

## 0.3.6 — 2026-05-31

Display glyphs: a small `@ponchia/ui/glyphs` subpath of dot-matrix bitmaps
rendered on the existing `.ui-dotmatrix` primitive — no SVG, no icon font,
re-skinned by the same `--field-dot*` tokens. All additive — a new optional
JS subpath plus one backward-compatible CSS var → a patch under the 0.x
policy.

### Added

- **`@ponchia/ui/glyphs` — a 43-glyph dot-matrix display-icon set.** A frozen
  16×16 bitmap registry (`GLYPHS`, `GLYPH_NAMES`, `GLYPH_SIZE`) with `glyph()`,
  `glyphCells()`, and `renderGlyph(name, { label, grid, solid, anim, dot, gap })`
  — an SSR-safe HTML string, decorative (`aria-hidden`) by default and
  `role="img"` when labelled. Covers navigation (`arrow-*`, `chevron-*`),
  actions (`check`, `close`, `plus`, `minus`, `search`, `menu`, `gear`,
  `edit`, `trash`, `download`, `upload`, `link`, `refresh`), media (`play`,
  `pause`), state (`eye`, `eye-off`), theming (`sun`, `moon`), objects
  (`mail`, `file`, `folder`, `clock`, `home`, `user`, `heart`, `star`,
  `bell`, `lock`, `info`, `warning`), layout (`grid`, `more-vertical`,
  `more-horizontal`) and `spark` (the two-tone accent demo). Three knobs from
  one source: the default dot look for **display** sizes; **`solid: true`**
  (or `data-bronto-glyph-solid`) which fuses the cells into a square, gapless
  pixel glyph legible as an **inline icon down to ~16px**; and opt-in
  **`anim`** (`reveal` powers the cells on in a scan, `pulse` makes the glyph
  breathe) — decorative only, disabled under `prefers-reduced-motion`, with
  the meaning kept in the static frame + label. `renderGlyph` returns a
  `<span>` (valid inline / inside a `<button>`) and accepts any string for
  dynamic dispatch (`GlyphNameInput = GlyphName | (string & {})`) — unknown
  names hit the documented `''`/`[]`/`undefined` fallback — while the
  `GlyphName` union itself stays strict (typos in annotations are errors). The
  union is generated and CI-drift-checked from the runtime, like the
  `cls`/token maps.
- **`initDotGlyph()` behavior.** Expands `[data-bronto-glyph]` placeholders
  into a `.ui-dotmatrix` grid in place (optional `data-bronto-glyph-label`),
  idempotent, with a cleanup that fully reverts — the DOM counterpart to
  `renderGlyph`.

### Changed

- **`.ui-dotmatrix` gains `--dotmatrix-dot` and `--dotmatrix-dot-radius`
  knobs** — the former for intrinsic dot sizing (`grid-template-columns`
  falls back to the previous `minmax(0, 1fr)` when unset), the latter to
  square off the cells (`--dotmatrix-dot-radius: 0`) for the solid pixel-glyph
  look. Both default to the prior behaviour, so existing matrices are
  unchanged. Adds opt-in `ui-dotmatrix--reveal` / `ui-dotmatrix--pulse`
  animation modifiers (`cls.dotmatrixReveal` / `cls.dotmatrixPulse`), both
  reduced-motion-aware; `--dotmatrix-reveal-step` tunes the reveal scan speed
  (per-cell delay, default `3ms`).

## 0.3.5 — 2026-05-29

A consumer-evidence pass: six small primitives that adopters were
repeatedly hand-rolling, added as pure CSS in
`@layer bronto` reusing existing tokens. All additive — no new token, no
new gated contrast pairing, no breaking change → a patch under the 0.x
policy.

### Added

- **`ui-pagehead` — the in-page title bar.** `ui-pagehead` +
  `__title` + `__actions`: eyebrow/breadcrumb + title on the start,
  an actions cluster on the end, one hairline beneath. Composes the
  existing `ui-eyebrow` / `ui-breadcrumb` rather than duplicating them.
  Parts-only (no recipe), like `ui-panel`.
- **`ui-steps` — a stepper for multi-step flows.** `ui-steps` (an `<ol>`)
  + `__item` + `__item--done`, auto-numbered by CSS counter with hairline
  connectors. State is ARIA-driven: the active step is `aria-current="step"`
  (no class); completed steps take `--done`.
- **`ui-timeline` — a vertical event list.** `ui-timeline` (an `<ol>`) +
  `__item` + `__time`, on a hairline spine with a per-item marker dot;
  `aria-current` marks the live event (accent marker).
- **`ui-meter` — a labelled proportion / threshold bar.** `ui-meter` +
  `__fill` + tone modifiers `--accent` / `--success` / `--warning` /
  `--danger`, with a `ui.meter({ tone })` recipe + `MeterOpts`. Distinct
  from `ui-progress` (task progress, can be indeterminate): a meter shows
  a measured static value (coverage, capacity, a KPI). Width is the same
  shared `--value` knob progress uses; author `role="meter"` +
  `aria-valuenow/min/max`.
- **`ui-kbd` — an inline keyboard-key glyph.** Wrap a `<kbd>`; one per key
  for a shortcut.
- **`ui-input-icon` — a leading/trailing icon *inside* a control.**
  `ui-input-icon` + `__icon` + `--end`, with a `ui.inputIcon({ end })`
  recipe + `InputIconOpts`. Distinct from `ui-input-group` (an *adjacent*
  affix): the icon overlays inside one `.ui-input`, which keeps full width
  and gains padding on the icon side. Closes the "no framework primitive"
  gap consumers were filling with a bespoke absolute overlay.
- **`ui-carousel` + `initCarousel` — an image gallery / carousel, and a
  lightbox built on it.** `ui-carousel` (`__stage` / `__viewport` /
  `__slide` / `__prev` / `__next` / `__thumbs` / `__thumb` / `__status`)
  is a **scroll-snap** track, so touch + trackpad swipe (with momentum)
  are the browser's, not hand-rolled. `initCarousel` adds prev/next,
  keyboard (Arrow/Home/End), a thumbnail strip with `aria-current` sync,
  the position counter, and carousel ARIA, keeping a JS index in sync with
  the scroll position both ways (`IntersectionObserver` where available);
  `data-bronto-carousel-loop` wraps; it emits `bronto:change`
  (`{ index }`). A **full-screen lightbox** is the same markup inside a
  native `<dialog class="ui-lightbox">` (+ `ui-lightbox__close`) opened by
  the existing `initDialog` — so the top layer, focus-trap, Escape and
  focus-return come from `<dialog>` with zero new focus code. Closes the
  gallery/lightbox/carousel gap consumers were filling by hand (one
  adopter had shipped three overlapping hand-rolled versions). SSR-safe,
  idempotent, returns a cleanup; declared in `behaviors/index.d.ts` and
  demoed.
- Demo gains a **"0.3.5 additions"** kitchen-sink section; `docs/usage.md`
  gains meter-vs-progress and steps/timeline/kbd/input-icon guidance; the
  generated `docs/reference.md`, `classes/index.d.ts`,
  `classes/vscode.css-custom-data.json` and `dist/*` pick the new surface
  up automatically.

### Changed

- **Bundle gzip budget 12 kB → 13 kB** (raw cap unchanged at 76 kB). The
  six new primitives plus the carousel/lightbox grew `dist/bronto.css` to
  ~73 kB raw / ~12.7 kB gzip (against the 76 kB / 13 kB caps); the gzip cap
  is recalibrated per the bump-deliberately rule in
  `scripts/build-dist.mjs`.

### Packaging & docs

- **`fonts/OFL.txt`** — the bundled Doto font is now shipped with its SIL
  Open Font License 1.1 text and attribution (© 2024 The Doto Project
  Authors), as required to redistribute it; README gained a font-license
  note. No code change.
- **README rewritten** for the npm package page (de-duplicated, accurate
  install/quick-start/theming, absolute links); `package.json` gained a
  compelling `description` + `keywords`; `ROADMAP.md` reconciled to 0.3.5.
- **Visual regression reworked** to component-scoped per-section snapshots
  (`data-shot` slugs, auto-discovered) so adding a primitive no longer
  drifts every baseline; the `visual-baselines` workflow's change-gate now
  detects brand-new (untracked) baselines.

## 0.3.4 — 2026-05-17

A review-driven accessibility + adoption pass (three external reviews →
independent Opus review → AgentMix deep multi-POV review). All additive:
new gated artifact, two new shipped docs, one new token. No breaking
change → a patch under the 0.x policy.

### Added

- **`docs/contrast.md` — a published, CI-gated WCAG 2.1 contrast
  matrix.** Every contractual token pairing, the conformance level it is
  *held to*, and its measured sRGB ratio per theme. Generated from the
  resolved token model (`scripts/gen-contrast.mjs`) so it cannot drift
  from the palette, and **gated**: the new `check:contrast` fails
  `npm run check` (and so release) if any gated pairing drops below its
  floor. Text pairings are held to AA 4.5:1; non-text UI to 3:1;
  decorative hairlines are reported but WCAG-1.4.11-exempt by design
  (the low ratio is published, not hidden). New `exports`/`files`
  entry; indexed in `llms.txt` + README.
- **`docs/usage.md` — the decision guide.** When to use which primitive
  (badge vs chip vs status dot), the unset density default and its two
  presets, prose-in-card, when to reach for a behavior. Hand-written and
  stable (contract, like `theming.md`); ships in the tarball for offline
  agents/consumers.
- **`info` status tone — token wired through the full status family.**
  New `--info` / `--info-soft` tokens (+ `--bronto-color-info` semantic
  alias), dual-theme, **and** the consumers that make it real:
  `ui-badge--info`, `ui-alert--info`, `ui-toast--info`, `ui-dot--info`,
  with `ui.badge`/`ui.alert`/`ui.dot` recipes, `BadgeOpts`/`DotOpts`/
  `Tone` types, the toast `ToastOpts` tone, the generated reference and
  the demo. This deliberately reverses the 0.3.2 `ui-badge--info`
  deferral: shipping a token no component consumes would be the exact
  dead-token defect this release exists to remove. Its gated contrast
  row is now a real indicator (measured ≥3:1 on surface — light 5.77:1,
  dark 8.41:1). Status hues (`success`/`warning`/`danger`/`info`) are
  outside the rationed-accent rule by design.
- **`docs/theming.md` — a full re-skin recipe.** Demonstrates that the
  "Nothing" identity is a token skin, not the architecture: a per-theme
  override block (measured AA-passing accents) restyles the whole system
  with no fork.

### Changed

- `.ui-dotbar i` radius `1px` → `var(--radius-sm)` (byte-identical
  render — `--radius-sm` *is* `1px` — but now responds to a radius
  re-skin; no visual-baseline drift).
- **`--dot-font` is now a live knob.** It and `--display` were defined
  identically and nothing consumed `--dot-font`, yet README / Astro
  guide / `fonts.css` all advertised it as a self-host/re-skin override
  (a documented dead token — the exact defect this release exists to
  remove). `--display` now derives from `--dot-font`
  (`--display: var(--dot-font)`): byte-identical render today, but
  overriding `--dot-font` as documented finally works. Removing the
  token instead would have been breaking (names are contractual), so
  the patch-safe fix is to make the advertised knob real.
- Contrast gate now also covers text on `--surface-muted`
  (`--text-soft`, `--text-dim`) — that surface is rendered as a fill by
  forms/disclosure and `--text-dim` there is the tightest real margin
  (~4.7:1). Passing today; now gated so a future palette nudge can't
  silently regress it. (Found by the full-codebase audit.)
- ROADMAP reconciled against shipped reality: the entire original 0.3.1
  checklist has been delivered for several releases. CHANGELOG is now
  the stated source of truth.

### Fixed

- `scripts/gen-contrast.mjs` colour parser now rejects non-finite
  channels and handles percent alpha, so a `NaN` ratio can no longer
  silently pass the gate (`check:contrast` also fails explicitly on a
  non-finite ratio). Found by the AgentMix review.
- `demo/theme-playground.html` WCAG linearisation threshold aligned to
  the canonical `0.04045` (was `0.03928`); points at the gated
  implementation as the source of truth.
- `check-classes` now strips CSS comments before scraping selectors. It
  is the one contract check that scrapes CSS rather than diffing a
  generator, so a `.ui-*` named only inside a comment could previously
  satisfy the `cls`⇄selector contract — a real (if currently
  unexercised) drift hole. Closed by the full-codebase audit.
- **`ToastOpts` was runtime-public but type-private.** `toast()` has
  always accepted (and tested) `assertive` / `closable`, but the typed
  `ToastOpts` stopped at `tone`/`title`/`duration`, so a TypeScript
  consumer couldn't pass documented options. Added both (+ a type
  test). `check:dts` covers only the *generated* classes/tokens `.d.ts`,
  not the hand-written behaviors one — this drift was invisible to the
  gate.
- **`initFormValidation` suppressed native bubbles too late.**
  `form.noValidate` was set inside the submit/blur handlers, so the
  *first* invalid real-browser submit of a pre-existing form showed the
  UA bubble instead of the Bronto error summary (the demo masked it
  with authored `novalidate`). It is now set at init for matched forms
  and restored on cleanup; dynamically-added forms stay covered by the
  in-handler set.
- **Combobox could select a filtered-out option.** Typing a query that
  hid the active option left `aria-activedescendant` stale; Enter then
  selected the hidden option. `filter()` now clears stale active state
  and Enter is visibility-guarded (WAI-ARIA APG correctness).
- `check-dist` now also asserts the on-disk `dist/**/*.css` set exactly
  matches the generated bundles — since the whole `dist/` ships, a
  stale/renamed leaf would otherwise reach npm undetected.
- README bundle-size figures refreshed (~64 kB raw / ~11 kB gzip; the
  enforced ceiling remains `check-dist`'s budget). Prior `~54/~10`
  prose had drifted since 0.3.2.

## 0.3.3 — 2026-05-16

A second consumer-evidence pass ("felt it twice") plus
agent-discoverability. All additive — new classes/recipes, a new
generated artifact, a widened input type, a freed primitive with a
permanent alias. No breaking change → a patch under the 0.x policy.

### Added

- **`@ponchia/ui/tokens/resolved.json`** — every colour token resolved
  to a static `#rrggbb` / `rgba(...)` per theme, with `var()` and sRGB
  `color-mix()` evaluated at build time. For render targets that cannot
  read CSS custom properties: MapLibre GPU paint, `<canvas>`, WebGL,
  SVG, server-side image gen. Generated + drift-checked (new
  `check:resolved` gate); no new colours introduced (`check:shiki`
  unaffected). Resolves the deferred charts-palette gap now that a 2nd,
  non-charting consumer has hit it.
- **`ui-button--sm` / `ui-button--lg`** — token-driven size scale for
  dense tooling (toolbars, pagination, table actions) and hero CTAs.
  `ui.button({ size: 'sm' | 'lg' })`. Default size unchanged.
- **`ui-empty-state`** — the empty-state primitive is now
  shell-agnostic; `ui-app-empty-state` remains a permanent grouped alias
  (byte-identical render, no baseline drift). Same playbook as 0.3.2
  `ui-stat`.
- **`ui-app-rail__account`** — a framework-blessed identity / sign-out
  slot, so admin shells stop hand-rolling it; stays visible when the
  rail collapses on mobile.
- **`ui-modal` controlled (`is-open`) path** — a portal/React modal that
  can't be a native `<dialog>` wears the same skin + open layout via
  `is-open` (`ui.modal({ open: true })`). Backdrop and focus-trap remain
  the consumer's responsibility (the `<dialog>` path still gets them
  free).
- **`llms.txt`** at the package root — a self-contained agent entrypoint
  (typed contract, the `@layer bronto` override rule, import surface,
  shipped offline references).
- **`docs/reference.md` and `docs/theming.md` now ship in the npm
  tarball** — an offline coding agent gets the full class catalog and
  token contract from `node_modules/@ponchia/ui/`. The reference also
  now documents the table-local `is-num`/`is-pos`/`is-neg` state classes
  and the ARIA-driven composition/state model. New `exports` subpaths:
  `./llms.txt`, `./docs/reference.md`, `./docs/theming.md`,
  `./tokens/resolved.json`.

### Changed

- **`ClassValue` widened to clsx parity** (`string | number | boolean |
  null | undefined | …`). The idiomatic React `reactNode && 'cls'` guard
  (where the node may be `0` / `''`) now type-checks; the runtime `cx`
  already skipped every falsy value, so this is a non-breaking type
  relaxation.
- `check-pack.mjs` relaxed from a blanket `docs/` ship-block to a
  **curated allowlist** (`docs/reference.md`, `docs/theming.md` only); a
  consistency assertion fails if that set drifts from `package.json`
  `files`. The rest of `docs/` stays dev-only by design — a deliberate,
  documented narrowing of the earlier runtime-only stance.

### Deferred (deliberately not shipped)

- **React/Solid binding layer.** The duplicated form/badge "glue" two
  consumers feel is ARIA-driven by design (`aria-invalid`, `aria-busy`,
  `aria-describedby`), so the agnostic surface is already complete; the
  remaining duplication is the framework-binding layer, still deferred.
  The reference now documents the composition model explicitly.
- **`ui-app-rail__foot` mobile `display:none`.** Whether the foot should
  survive the mobile breakpoint is a visual/possibly-breaking call; the
  new `__account` slot (which does survive) covers the actual need
  without changing existing behaviour.

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
