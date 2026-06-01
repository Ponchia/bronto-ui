# Roadmap

`@ponchia/ui` is a CSS-first, framework-agnostic UI system. The engine stays
small; roadmap work should close adoption, verification, and consumer-DX gaps
without turning the project into a per-framework component suite.

> **Source of truth is [`CHANGELOG.md`](CHANGELOG.md).** This file describes
> direction; the changelog records what actually shipped. If they disagree, the
> changelog wins. Last reconciled against `0.4.1`.

## Shipped through 0.4.0

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
- **Framework bindings.** Optional `@ponchia/ui/react` and `@ponchia/ui/solid`
  hooks over the behavior layer. They are thin lifecycle adapters, not component
  libraries, and their peers remain optional.
- **Color system.** ADR-0001 steps 1-8: color-policy gate, display colorways,
  Tier-3 dot-matrix expression tokens, OKLCH-authored colorways, APCA advisory
  reporting, opt-in data-viz palette, and OKLCH core accent ramp.
- **Verification.** Unit/type/drift gates, package allowlist checks, packed
  consumer examples, component-scoped visual baselines, cross-engine non-pixel
  Playwright checks, axe, forced-colors, reduced-motion, print, and console/404
  quality gates.

## Active hardening

- **Binding parity.** Keep React/Solid hook options and lifecycle behavior in
  parity with vanilla behaviors, with packed-example smoke tests and runtime
  tests for scoped roots.
- **Browser proof for new surfaces.** Maintain real-browser checks for glyph
  mask rendering, OKLCH computed colors, and behavior paths that jsdom cannot
  faithfully model.
- **Payload reporting.** Publish a per-entrypoint size report for CSS bundle,
  behavior JS, glyph JS, tarball size, and font weight. The existing budget gate
  remains the hard stop.
- **Docs contract.** Keep `docs/stability.md`, README, SECURITY, ADR, and
  CHANGELOG in sync before every release.
- **Behavior internals.** Split high-complexity behavior internals when it
  reduces maintenance risk, while preserving the existing public barrel and
  cleanup contracts.

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
non-breaking. Security issues: see `SECURITY.md` for private reporting.
Best-effort response; no SLA. Adopters should pin the compatible minor and
visual-test their own app on upgrade.
