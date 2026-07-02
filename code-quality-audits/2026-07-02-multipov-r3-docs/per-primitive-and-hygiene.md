# Per-primitive how-tos + doc hygiene — bronto-ui documentation review
**Verdict:** The documentation is strong and unusually governed for a pre-1.0 UI package: shipped docs, CSS leaves, helper exports, behavior exports, migrations, snippets, and version literals all have explicit gates. The main consumer-doc weakness is IA consistency: many primitive pages are excellent, but the how-to shape is not uniform, so readers must relearn each page’s structure and may miss a11y/host-boundary details that exist elsewhere.

**Grade:** B+ — high coverage and governance, uneven primitive-page template.

## Strengths
- Shipped-doc scope is explicit and curated through `package.json` and `scripts/lib/shipped-docs.mjs`; `docs/README.md` clearly separates start-here, governance, reports, primitives, ADRs, and migrations.
- Surface parity is strongly gated: `scripts/check-component-matrix.mjs` covers 17 foundation CSS leaves and 29 component leaves; `scripts/check-helper-matrix.mjs` covers helper docs/type/unit ownership; `scripts/check-behavior-matrix.mjs` covers behavior docs/unit/browser ownership.
- `docs/reporting.md` is a strong IA hub: it routes report authors through every analytical/report leaf, states opt-in import boundaries, and is backed by `scripts/lib/reporting-toolbox.mjs` plus `scripts/check-report.mjs`.
- Example correctness is better than typical prose docs: `scripts/check-report.mjs`, `scripts/check-contract.mjs`, and `scripts/check-doc-recipes.mjs` validate `ui-*` classes, HTML snippet refs, documented `init*()` exports, named imports, and CDN recipes.
- Migration story is coherent: `MIGRATIONS.json`, `docs/stability.md`, `docs/migrations/0.2-to-0.3.md`, `docs/migrations/0.3-to-0.4.md`, `docs/migrations/0.4-to-0.5.md`, and `docs/migrations/0.5-to-0.6.md` line up, and `scripts/check-migrations.mjs` passes.
- Big “why” decisions are not only in commits: `docs/architecture.md`, `docs/adr/0001-color-system.md`, `docs/adr/0002-scope-and-2026-baseline.md`, and `docs/adr/0003-theme-model.md` record architecture, color, scope/browser floor, and theme-model rationale.

## Weaknesses / risks
- [P1] The per-primitive how-to template is inconsistent: rich pages like `docs/annotations.md`, `docs/legends.md`, `docs/sources.md`, `docs/d2.md`, and `docs/vega.md` are deep, while `docs/selection.md`, `docs/clamp.md`, `docs/highlights.md`, `docs/interval.md`, and `docs/crosshair.md` are short and structurally different; reader cost is slower scanning and harder comparison between primitives.
- [P1] A11y and host-boundary contracts are present globally in `docs/stability.md`, `docs/frontier-primitives.md`, and `docs/reporting.md`, but not predictably sectioned in each primitive doc; for example `docs/clamp.md` has print guidance but no explicit accessibility section, and `docs/highlights.md` has robustness but no explicit a11y fallback guidance.
- [P2] Renderer docs are excellent on theming/non-ownership but less template-aligned for consumer a11y: `docs/mermaid.md` and `docs/vega.md` emphasize resolved colors, file/CDN behavior, and renderer boundaries, while accessible text/fallback guidance is mostly in `docs/reporting.md`; standalone renderer readers may miss it.
- [P2] `CHANGELOG.md` is curated but very large at ~121 kB; it is useful as a release ledger, but upgrade readers will likely need `MIGRATIONS.json` and `docs/migrations/*.md` to avoid hunting through long narrative sections.
- [P2] Some roll-ups and foundational opt-ins do not have leaf-named how-tos: `css/report-kit.css` is documented by `docs/reporting.md`, `css/dataviz.css` by `docs/theming.md`/`docs/reporting.md`, and `css/analytical.css` by `docs/architecture.md`/`docs/reporting.md`; this is defensible, but search-by-export readers may expect `docs/report-kit.md`, `docs/dataviz.md`, or `docs/analytical.md`.
- [P3] Terminology is mostly controlled, but spelling and naming variance adds small friction: `README.md`, `docs/reporting.md`, and `docs/theming.md` mix “color/colour,” while `css/legend.css` maps to `docs/legends.md`; maintenance cost is search noise and minor reader hesitation.
- [P3] Placeholder-style CDN snippets remain in renderer docs: `docs/mermaid.md` and `docs/vega.md` use `@VERSION`, while exact stylesheet snippets elsewhere use `0.6.10`; `scripts/check-versions.mjs` gates exact literals but intentionally does not gate placeholders, so copy-paste safety is uneven.
- [P3] I could not re-run `scripts/check-doc-links.mjs` or `scripts/check-public-hygiene.mjs` in this read-only sandbox because they invoke `npm pack --dry-run --json`, which tried to write under `/home/ubuntu/.npm`; residual risk is limited because the scripts themselves define strong link/pack-target checks.

## Top recommendations
1. [needs-writing] Create a mandatory primitive-page template: What it is, when to use, imports, minimal markup, options/classes/properties, behavior/events if any, a11y, host-owned boundary, print/forced-colors limits.
2. [safe-mechanical] Add a docs-template lint/check that flags primitive docs missing expected headings or accepted aliases; start with the shipped primitive list in `package.json` and `scripts/check-component-matrix.mjs`.
3. [needs-writing] Normalize the thin docs first: `docs/selection.md`, `docs/clamp.md`, `docs/highlights.md`, `docs/interval.md`, `docs/crosshair.md`, and `docs/figure.md`.
4. [needs-writing] Add an “Upgrade guide” front door above the changelog: link current version edge, `MIGRATIONS.json`, and the relevant `docs/migrations/*.md` before readers enter `CHANGELOG.md`.
5. [safe-mechanical] Decide placeholder policy for public CDN snippets: either replace `@VERSION` with the current version literal or mark placeholder snippets with a standard “replace VERSION” comment that a gate can recognize.
6. [needs-writing] Add short export-name landing notes for roll-ups without leaf-named docs, especially `report-kit`, `analytical`, and `dataviz`, even if they just redirect to `docs/reporting.md` or `docs/theming.md`.

## Notable observations
- `docs/frontier-primitives.md` is doing ADR-like work for primitive strategy and demand gating; it is valuable, but it is not in `docs/adr/`, so the “why this primitive exists” trail is split.
- The docs are heavily optimized for LLM/static-report consumers: `llms.txt`, `docs/reporting.md`, `docs/reference.md`, `scripts/check-report.mjs`, and `scripts/check-contract.mjs` make that explicit.
- No obvious shipped primitive is completely undocumented: the better finding is not missing coverage, but uneven how-to depth and scan structure.