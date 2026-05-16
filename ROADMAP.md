# Roadmap

`@ponchia/ui` is a CSS-first, framework-agnostic UI system. The engine is
intentionally small and the contract is machine-checked; the roadmap is
about closing **adoption** and **consumer-DX** gaps without compromising
the zero-runtime-dependency, CSS-first ADR (see `docs/architecture.md`).

Direction is set by periodic multi-perspective reviews. This list is
indicative, not a commitment, and a solo-maintained project — see
"Support expectations" below.

## 0.3.1 — adoption + gap-closing (shipped)

Driven by a 12-perspective review (two Opus analyses + two five-model
AgentMix deep runs). All additions are **non-breaking**.

**Lifecycle & docs**

- [x] Release-hygiene gate (`check:release`) + dated CHANGELOG
- [x] `MIGRATIONS.json` + `docs/migrations/*` + deprecation policy
- [ ] Per-framework getting-started (Astro / SvelteKit / vanilla; React/Solid snippet)
- [ ] Tailwind v4 / cascade-layer interop recipe
- [ ] Generated, drift-checked component/token reference
- [ ] VS Code `css.customData` artifact (class + custom-property IntelliSense)
- [ ] `examples/` apps installed from `npm pack` + consumer CI smoke matrix
- [ ] README badges + consumer/maintainer doc split

**Tokens & layout**

- [ ] Semantic `--bronto-*` token tier + stepped colour scale + `--z-*` scale (additive; short names kept as aliases)
- [ ] Layout primitives: `ui-sidebar`, `ui-switcher`, `ui-center`, `ui-ratio`
- [ ] Opt-in container queries on `ui-grid` / `ui-app-metrics` / `ui-card`

**Components & behaviors**

- [ ] Button loading / `aria-busy` state; toast dismiss + assertive/danger path
- [ ] Forms: `ui-input-group` / file / range; `initFormValidation` + error-summary
- [ ] `ui-combobox` + `initCombobox` (APG, dependency-free)
- [ ] Collision-aware tooltip/popover (native Popover API + CSS anchor positioning)
- [ ] Data-table: `aria-sort` headers + `initTableSort` + selection contract
- [ ] `role=switch` ARIA contract for `ui-switch`
- [ ] Theme + contrast preview tool in the demo

## Later / under consideration

- Date-time picker, command palette, tree-view — only as documented
  recipes or behavior-backed components if real consumers need them; not
  as a reason to grow the core.
- Per-entrypoint published bundle-size report.
- Canary / `next` dist-tag for testing an upcoming minor before `latest`.

## Explicitly out of scope (stable decisions)

Per `docs/architecture.md` / CHANGELOG "Declined": no Storybook, no
per-framework component packages, no bundled Style Dictionary / Renovate
/ Lighthouse dependency, no chart engine, no virtualized data-grid. The
native `<dialog>` / `<details>` strategy is a feature, not a gap.

## Support expectations

Solo-maintained, pre-1.0. Breaking changes ship in the **minor** (pin
`~0.x`). Security issues: see `SECURITY.md` (private reporting).
Best-effort response; no SLA. Adopters should pin exact and visual-test
their own app on upgrade.
