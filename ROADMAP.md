# Roadmap

`@ponchia/ui` is a CSS-first, framework-agnostic UI system. The engine stays
small; roadmap work should close adoption, verification, and consumer-DX gaps
without turning the project into a per-framework component suite.

> **Source of truth is [`CHANGELOG.md`](CHANGELOG.md).** This file describes
> direction; the changelog records what actually shipped. If they disagree, the
> changelog wins. Last reconciled against `0.5.0`.
>
> **Strategic north star:** Bronto should not out-catalog generic UI kits. It
> should own framework-agnostic primitives for interfaces that explain
> themselves: explanation, provenance, relationships, command access, workbench
> ergonomics, generated reports, and durable system state. See
> [`docs/frontier-primitives.md`](docs/frontier-primitives.md).

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

- **Binding parity.** Keep React/Solid/Qwik hook options and lifecycle behavior
  in parity with vanilla behaviors, with packed-example smoke tests (all three
  build from the tarball in CI) and runtime tests for scoped roots.
- **Browser proof for new surfaces.** Maintain real-browser checks for glyph
  mask rendering, OKLCH computed colors, and behavior paths that jsdom cannot
  faithfully model.
- **Payload reporting.** Publish a per-entrypoint size report for CSS bundle,
  behavior JS, glyph JS, tarball size, and font weight. The existing budget gate
  remains the hard stop.
- **Docs contract.** Keep `docs/stability.md`, README, SECURITY, ADR, and
  CHANGELOG in sync before every release.

## Later / under consideration

- Date-time picker, command palette, tree-view, and richer data-table recipes:
  only if real consumers need them, and preferably as documented recipes before
  growing the core behavior layer.
- Optional font-weight strategy: WOFF2/subsetting or a fontless preset if the
  install-size report shows the current bundled TTF set is too heavy.

## Explicitly out of scope

No Storybook dependency, no per-framework component packages, no bundled
Style Dictionary / Renovate / Lighthouse dependency, no chart engine, no
virtualized data-grid, and no second UI accent. Native `<dialog>` / `<details>`
remain deliberate platform choices.

## Support expectations

Solo-maintained, pre-1.0. Breaking changes ship in the **minor**; patches are
non-breaking. Security issues: see `.github/SECURITY.md` for private reporting.
Best-effort response; no SLA. Adopters should pin the compatible minor and
visual-test their own app on upgrade.
