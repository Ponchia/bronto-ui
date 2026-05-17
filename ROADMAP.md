# Roadmap

`@ponchia/ui` is a CSS-first, framework-agnostic UI system. The engine is
intentionally small and the contract is machine-checked; the roadmap is
about closing **adoption** and **consumer-DX** gaps without compromising
the zero-runtime-dependency, CSS-first ADR (see `docs/architecture.md`).

Direction is set by periodic multi-perspective reviews. This list is
indicative, not a commitment, and a solo-maintained project — see
"Support expectations" below.

> **Source of truth is [`CHANGELOG.md`](CHANGELOG.md).** This file
> describes *direction*; the changelog records what actually shipped. If
> the two disagree, the changelog wins — this file was last reconciled
> against it at 0.3.3.

## Shipped (0.3.1 → 0.3.3)

The entire original 0.3.1 adoption checklist is **done** and has been for
several releases — kept here as a delivered summary, not a to-do list.
Per-item detail is in the dated CHANGELOG sections.

- **Lifecycle & docs** — release-hygiene gate + dated CHANGELOG;
  `MIGRATIONS.json` + deprecation policy; per-framework getting-started
  (Astro / SvelteKit / vanilla / React-Solid snippet); Tailwind /
  cascade-layer interop; generated drift-checked `docs/reference.md`;
  VS Code `css.customData` artifact; `examples/` built from `npm pack`
  in CI; README badges; `llms.txt` agent entrypoint; shipped offline
  docs.
- **Tokens & layout** — semantic `--bronto-color-*` tier; stepped colour
  scale (`--accent-1..6`, `--surface-1..6`); `--z-*` scale; layout
  primitives `ui-sidebar` / `ui-switcher` / `ui-center` / `ui-ratio`;
  opt-in container queries.
- **Components & behaviors** — `ui-combobox` + `initCombobox` (APG);
  collision-aware `ui-popover` + `initPopover`; `initFormValidation`;
  sortable `aria-sort` table + `initTableSort` + selection;
  `aria-busy` button loading; toast dismiss + assertive danger path;
  `role=switch`; `ui-stat`/`ui-num`/`ui-empty-state` freed from the
  shell; `tokens/resolved.json`; controlled `ui-modal` (`is-open`).
- **Accessibility surface** — published, **CI-gated** WCAG 2.1 contrast
  matrix (`docs/contrast.md`): every contractual token pairing has a
  declared conformance level the build enforces. Decorative hairlines
  are reported but 1.4.11-exempt by design.
- **Guidance** — hand-written `docs/usage.md` decision guide (badge vs
  chip vs dot, default density, prose-in-card, when to add a behavior),
  shipped in the tarball alongside the generated reference.

## Open / under active consideration

Genuinely not done. Driven by real consumer evidence, not speculation.

- **Framework-binding layer (React/Solid).** The remaining duplication
  two consumers feel is the *binding* glue, not the agnostic surface
  (which is ARIA-driven and complete). Still **deliberately deferred** —
  the most likely thing to force the next *minor* if a third consumer
  hits it. Tracked, not forgotten.
- **"Prove the knob" — alternative themes.** External reviews converge
  on one strategic risk: the project sells the *skin* (Nothing) more
  than the *system* (token-driven restraint). Direction: lead docs with
  the architecture and ship at least one credible non-default theme to
  demonstrate `--accent`/identity is truly swappable. Spike findings
  (what is token-reskinnable today vs. hardcoded) tracked in the
  theme-spike notes.
- **Token gaps surfaced by the contrast/theme work** — no
  secondary-brand slot. (`--info` shipped 0.3.4 with a gated contrast
  row.) Additive, patch-safe, ship on real demand.
- **APCA contrast (informational, non-gated).** WCAG 2.1 stays the
  enforced legal/axe baseline; APCA could be published alongside for
  guidance only.

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
