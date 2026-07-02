# Roadmap

`@ponchia/ui` is a CSS-first, framework-agnostic UI system. The engine stays
small; roadmap work should close adoption, verification, and consumer-DX gaps
without turning the project into a per-framework component suite or a generic
UI catalog.

> **Source of truth is [`CHANGELOG.md`](CHANGELOG.md).** This file describes
> direction; the changelog records what actually shipped. If they disagree, the
> changelog wins. Last reconciled against `0.6.10`.
>
> **Strategic north star:** Bronto should not out-catalog generic UI kits. It
> owns framework-agnostic primitives for interfaces that explain themselves —
> and its **proven core is the report lane: generated reports, explanation,
> and provenance**, the one lane with a real consumer (LLM-authored
> reports). Command access, workbench ergonomics, and durable system state
> shipped their cores and stay demand-gated behind a real app consumer for
> follow-ons.
> See [`docs/frontier-primitives.md`](docs/frontier-primitives.md).
>
> **Adoption stance:** published openly on npm with provenance and public docs,
> but built and maintained primarily for the maintainer's own agents and report
> tooling. Public-surface correctness is in scope (README, authored docs, docs
> site route list, `llms.txt`); marketing pushes are not a goal.

## Current stewardship priorities

- **Protect the default bundle.** `dist/bronto.css` is the shared service
  identity, not a warehouse. New report, analytical, trust, renderer,
  workbench, and command affordances default to opt-in leaves. A core addition
  needs a stronger argument than "useful somewhere": it must be universal
  application chrome, reduce duplicated core markup, or fix an accessibility /
  platform contract in existing core.
- **Codify refusal boundaries.** Bronto owns visual grammar, token handoff,
  pure geometry, and narrow delegated behavior. It refuses chart scales,
  fetching, persistence, routing, workflow execution, global command
  registries, virtualized data grids, and framework component APIs. Consumers
  own domain state and product policy.
- **Prefer registries over bespoke gates.** The recent quality gains came from
  making exports, examples, docs, visual baselines, generated artifacts, and
  ownership matrices derive from shared registries. Continue collapsing hand
  lists into local source-of-truth modules before adding another checker.
- **Make quality permanent, not episodic.** Audit findings should become
  native gates when they protect a public contract. Complexity budgets,
  docs-as-contract checks, packed-consumer proof, and public hygiene should
  fail locally and in CI before they need another broad cleanup pass; gate
  exceptions should be paid down into simpler code, not normalized as policy.
- **Treat the packed tarball as the highest proof tier.** Unit tests and
  source-tree checks prove wiring. Packed examples, packed consumer imports,
  packed TypeScript resolution, and real downstream app upgrades prove the
  public package. When evidence conflicts, the tarball consumer wins.
- **Work toward 1.0 by freezing doctrine, not by adding catalog surface.** A
  1.0 candidate should have stable core/opt-in boundaries, a documented
  refusal list, reliable release gates, downstream upgrade proof, and bundle
  headroom. It should not wait for one more component family.

## Recently completed through 0.6.10

- **Workbench and annotation composition.** `0.6.10` added opt-in workbench
  toolstrip primitives and clarified how the dependency-free
  `@ponchia/ui/annotations` surface composes with richer annotation engines
  without adding a runtime or public type dependency.
- **Product doctrine and gate-backed readiness.** `0.6.9` codified the
  core-vs-opt-in boundary, refusal list, packed-tarball proof, release evidence
  policy, and public stability matrix. It also consolidated registry-backed
  gates and made the native complexity budget part of the aggregate check.
- **Adoption bridges without component sprawl.** Tailwind v4 has a CSS-only
  `@theme inline` bridge plus a packed Vite example; Svelte and Vue have thin
  lifecycle adapters over the existing delegated behaviors; token handoff has
  a generated local Figma Variables artifact beside DTCG. These close consumer
  DX gaps while preserving the CSS-first, zero-runtime package contract.
- **Report-lane primitives.** `ui-figure`, `ui-interval`, `ui-clamp`, and
  `ui-highlights` extend the static report/explanation lane. They stay
  opt-in, own visual grammar only, and avoid chart scales, fetch/state, or app
  workflow logic.
- **Durable state and workbench primitives.** `ui-job`, `ui-splitter`, and
  `initSplitter` close specific persisted-state and pane-resize gaps while the
  host still owns polling, retry/cancel, persistence, collapse policy, and
  conflict-resolution workflow.
- **Local reproduction of CI risk.** `npm run test:e2e:nonpixel` captures the
  cross-engine non-screenshot browser suite, and `npm run test:examples` packs
  the real tarball, builds every example in temp dirs, and browser-smokes the
  runtime examples. Pixel baselines remain pinned-container-only.

## Shipped in 0.6.6

- **Report PDF/export hardening.** Fixed Chromium print overprint by demoting
  vertical report-flow wrappers to block flow at print time while preserving
  column grids; promoted a multi-page PDF fixture parsed with pdfjs-dist.
- **Module report rendering.** `scripts/render-pdf.mjs --serve` renders module
  reports over loopback HTTP, waits for `data-report-ready`, and surfaces
  page/console failures instead of silently dropping relative module figures
  over `file://`.
- **Gate/list consolidation.** Reporting and pack checks derive their scan
  surfaces from registries instead of hand lists, cross-engine e2e runs on
  engine-sensitive pushes to `main`, and release prep is scripted through
  `npm run release:prep -- X.Y.Z`.

## Shipped in 0.6.5

- **`initSources` + report decision/evidence/claim grammar.** Optional
  citation→source backref behavior, decision blocks, severity-labelled
  findings, evidence packets/ledgers, claim status, and action
  owner/due/criteria rows; plus `docs/package-contract.md` and release
  hardening. See the CHANGELOG `0.6.5` section.

## Shipped in 0.6.4

- **Dot-matrix + report hardening.** Expands the generated glyph/readout
  surface and docs, and tightens standalone static-report print/table behavior
  for local HTML/PDF workflows.

## Shipped in 0.6.3

- **WebKit release fix.** Adds `-webkit-user-select: none` beside the standard
  `user-select: none` on diff/code line-number affordances and updates the
  cross-engine e2e assertion to read the prefixed CSSOM property directly. This
  is a CSS/runtime patch with no public API, class contract, or migration entry.

## Shipped in 0.6.2

- **Release attempt, superseded by 0.6.3.** Tried to fix the WebKit-only e2e
  failure with a test-side computed-style fallback. The follow-up cross-engine
  repro showed the CSS itself also needed the prefixed WebKit property.

## Shipped in 0.6.1

- **Dev-only patch.** Refreshes the SHA-pinned GitHub Actions used by CI
  (`actions/checkout` 6.0.2 → 6.0.3, `github/codeql-action` 4.36.0 → 4.36.2)
  and the `dev` Dependabot group (`react`/`react-dom` 19.2.6 → 19.2.7,
  `stylelint` 17.12.0 → 17.13.0). No public API, no published CSS/JS, no
  `MIGRATIONS.json` entry. All bumps landed through Dependabot PRs #109 + #110.

## Shipped in 0.6.0

- **Vega-Lite theme target.** `@ponchia/ui/vega` (`brontoVegaConfig(theme)`,
  `vega.json`) — an on-brand Vega-Lite / Vega `config` resolved per theme, the
  same tokens-as-data path as Mermaid and D2, gated by a headless render-probe.
  **Breaking:** the local static-bar renderer (`.ui-chart*`) is **removed** — a
  chart needs scales + data binding, which the analytical layer refuses to own.
  The `--chart-*` palette (`tokens/charts.json`) and the legend layer are
  unchanged. Pin `~0.5` → re-pin `~0.6`; see `MIGRATIONS.json` (`0.5`→`0.6`).
- **On-brand foreign-renderer themes.** Token-driven **Mermaid**
  (`@ponchia/ui/mermaid`) and **D2** (`@ponchia/ui/d2`) theme maps, resolved hex
  baked from the token source and drift-gated.
- **Reporting kit for LLM-from-other-systems.** Core `ui-delta` trend indicator
  and report-layer `ui-compare` before/after layout; `@ponchia/ui/classes.json`
  language-neutral class manifest; `tokens/resolved.json` `scale` block;
  `--display-weight` token; load-path/CDN docs; print/PDF fidelity +
  `scripts/render-pdf.mjs`.
- **Hardening.** Multi-agent audit passes closed a backlog of accessibility,
  contract, scoped-root and code-quality gaps; new drift/quality gates
  (`check:fresh`, `check:doc-recipes`, `check:versions`, dist-coverage,
  dts-map); responsive/all-size pass with a dedicated spec.

## Shipped in 0.5.0

- **Analytical communication primitives.** An opt-in suite for analytical and
  generated-report UI, each owning only its visual grammar + pure geometry (no
  scales/state/hit-testing, no chart engine): SVG **annotations**, **legends**,
  text/evidence **marks**, leader-line **connectors** (+ the pure
  `@ponchia/ui/connectors` geometry kernel that annotations now build on),
  guided-focus **spotlight**, **crosshair**/readout, a cross-cutting
  **selection** vocabulary, and a 1-D `declutterLabels` helper. The
  `@ponchia/ui/css/analytical.css` roll-up bundles them. New gates:
  `check:legend`, `check:helpers-dts`. Three breaking changes (minor): the report
  kit's chart key moved to the legend layer, annotation arrowheads now use the
  shared geometry kernel, and the marks rationed-accent tone was renamed
  `evidence`→`accent`. See the CHANGELOG `0.5.0` section and
  [`docs/migrations/0.4-to-0.5.md`](docs/migrations/0.4-to-0.5.md).

## Shipped through 0.4.1

- **Lifecycle and docs.** Release-hygiene gate, dated changelog,
  `MIGRATIONS.json`, deprecation policy, per-framework guides, Tailwind
  interop, generated `docs/reference.md`, VS Code custom data, `llms.txt`, and
  curated offline docs in the package.
- **Core CSS system.** Semantic `--bronto-color-*` tier, `--accent-1..6`
  OKLCH ramp, `--surface-1..6`, `--z-*`, layout primitives, site/app shells,
  prose, forms, overlay, disclosure, feedback, tables, motion, and dot-matrix
  primitives.
- **Behaviors.** SSR-safe, delegated, cleanup-returning vanilla behavior layer:
  theme toggle, dismissible, disclosure, menu, form validation, combobox,
  popover, table sort/select, tabs, native dialog glue, carousel, toasts, and
  dot-glyph expansion.
- **Glyphs.** `@ponchia/ui/glyphs`: 48 registered 16x16 dot-matrix glyphs,
  generated `GlyphName` types, display/solid DOM renderers, `initDotGlyph`, and
  the one-node `.ui-icon` mask renderer for dense icon-at-scale use.
- **Framework bindings.** Optional `@ponchia/ui/react`, `@ponchia/ui/solid`, and
  `@ponchia/ui/qwik` (`useVisibleTask$`) hooks over the behavior layer. They are
  thin lifecycle adapters, not component libraries, and their peers remain
  optional.
- **CSS-native motion + theme model (0.4.1).** Zero-JS enter/exit for native
  `<dialog>`, popover, toast, and accordion (`@starting-style` +
  `transition-behavior: allow-discrete` / `::details-content`); scroll-driven
  (`.ui-scroll-progress`/`.ui-scroll-reveal`) and View Transitions (`.ui-vt`) as
  progressive enhancement; the `data-surface="oled"` true-black variant; the
  readable dark re-tune; and [ADR-0002](docs/adr/0002-scope-and-2026-baseline.md)
  (2026 baseline) + [ADR-0003](docs/adr/0003-theme-model.md) (theme model). See
  the CHANGELOG for the full 0.4.1 surface.
- **Color system.** ADR-0001 steps 1-8: color-policy gate, display colorways,
  Tier-3 dot-matrix expression tokens, OKLCH-authored colorways, APCA advisory
  reporting, opt-in data-viz palette, and OKLCH core accent ramp.
- **Verification.** Unit/type/drift gates, package allowlist checks, packed
  consumer examples, component-scoped visual baselines, cross-engine non-pixel
  Playwright checks, axe, forced-colors, reduced-motion, print, and console/404
  quality gates.

## Active hardening

- **Core/opt-in boundary audits.** Review new and existing CSS in terms of
  identity vs toolbox. If a rule mostly serves reports, analysis, provenance,
  generated-content disclosure, command access, or workbench ergonomics, keep
  it out of the default bundle unless it also solves a universal app-shell
  problem.
- **Binding parity.** Keep React/Solid/Qwik/Svelte hooks/actions and Vue
  directives in parity with vanilla behaviors, with packed-example smoke tests
  building from the tarball in CI and runtime tests for scoped roots.
- **Browser proof for new surfaces.** Maintain real-browser checks for glyph
  mask rendering, OKLCH computed colors, and behavior paths that jsdom cannot
  faithfully model.
- **Registry consolidation.** Before adding a new check, ask whether it can
  consume `scripts/lib/*` package, docs, examples, CSS-leaf, or artifact
  registries. A new manual list is acceptable only when it represents a new
  concept that should become a registry itself.
- **1.0 readiness ledger.** Track whether each public surface is stable,
  merely additive, or still pre-1.0-tunable in `docs/stability.md`. The path to
  1.0 is evidence that the existing contract is mature, not a shopping list.
- **Payload reporting.** Publish a per-entrypoint size report for CSS bundle,
  behavior JS, glyph JS, tarball size, and font weight. The existing budget gate
  remains the hard stop.
- **Docs contract.** Keep `docs/stability.md`, README, SECURITY, ADR, and
  CHANGELOG in sync before every release.

## Later / under consideration

- Date-time picker, richer data-table recipes, and workbench drag/drop
  affordances: only if real consumers need
  them, and preferably as documented recipes before growing the core behavior
  layer. (The command palette and tree outline shipped in 0.5.0/0.6.0; their
  follow-ons are demand-gated — see `docs/frontier-primitives.md`.)
- Optional font-weight strategy: WOFF2/subsetting or a fontless preset if the
  install-size report shows the current bundled TTF set is too heavy.

## Explicitly out of scope

No Storybook dependency, no per-framework component packages, no bundled
Style Dictionary / Renovate / Lighthouse dependency, no chart engine, no
virtualized data-grid, no app router, no persistence/cache layer, no global
command/action registry, no workflow engine, no theme marketplace, and no
second UI accent. Native `<dialog>` / `<details>` remain deliberate platform
choices.

## Support expectations

Solo-maintained, pre-1.0. Breaking changes ship in the **minor**; patches are
non-breaking. Security issues go through `.github/SECURITY.md`; general support
expectations live in `.github/SUPPORT.md`. Best-effort response; no SLA.
Adopters should pin the compatible minor and visual-test their own app on
upgrade.
