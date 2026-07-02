# bronto-ui — synthesized multi-POV review

## Executive verdict
`@ponchia/ui` is a mature, coherent CSS-first design system whose core thesis mostly holds: CSS is the product, JS is optional behavior glue, and generated contracts/gates are unusually serious. Its strongest lane is identity, reports, provenance, and agent/tooling UI rather than generic component breadth. The main gaps are thesis-visible boundaries: “one accent/live reskin,” “no `!important`,” “default bundle,” and behavior-optional accessibility need sharper framing and guardrails.

## Scorecard
| POV | Grade | One-line takeaway |
|---|---:|---|
| Architecture & design-system coherence | B+ | Strong layered/token architecture, with edge cases around resolved renderer theming and cascade claims. |
| A11y / WCAG | A- | Shipped defaults are credible; arbitrary rebrands and behavior-optional widgets are the risk. |
| Developer experience & public API | B+ | Excellent contract machinery, but types, imports, recipes, and behavior setup still have footguns. |
| CSS quality & maintainability | A- | Mature CSS craft and gates; duplication, leaf dependencies, and global base behavior need tighter control. |
| JS behaviors, types & framework adapters | A- | Thin, disciplined behavior layer; adapter lifecycle and non-global document handling are the main seams. |
| Performance & bundle | B | Strong default CSS budget discipline; weaker aggregate/package budgets and JS import granularity. |
| Security & supply chain | A- | Strong npm/release posture; docs CDN, trusted-markup boundaries, and CI hygiene remain. |
| Testing & CI quality gates | A- | Broad executable gates; PR/release asymmetry and some shallow/advisory checks remain. |
| Documentation, positioning & product | A- | Deep, honest docs; target audience and roadmap freshness need cleanup. |
| **Overall** | **A-** | High-maturity pre-1.0 system with mostly bounded risks and a few claim-level corrections needed. |

## Cross-cutting themes
- **The CSS-first contract is real.** Architecture, CSS, DX, performance, security, testing, and docs all found strong evidence for layered CSS, generated artifacts, explicit exports, zero runtime deps, and package gates (`css/core.css:10`, `scripts/check-dist.mjs:70`, `package.json:242`, `scripts/check-exports.mjs:157`).
- **Public claims need more precision.** Architecture, a11y, DX, performance, and docs all flagged over-broad wording around live accents, arbitrary rebrands, “no `!important`,” default bundle size, monochrome color, and target audience (`docs/vega.md:146`, `docs/contrast.md:239`, `css/motion.css:396`, `README.md:88`, `ROADMAP.md:21`).
- **Optional JS is both a strength and an adoption hazard.** A11y, DX, behaviors, security, and testing agree that thin initializers are clean, but missing init, one-shot hooks, unlabeled command inputs, global `document`, and trusted-markup assumptions can break real users (`docs/usage.md:629`, `react/index.js:103`, `behaviors/dialog.js:88`, `.github/SECURITY.md:35-41`).
- **The gate culture is unusually strong but uneven.** CSS, performance, security, and testing praised the matrix/check system, while finding gaps in duplicate CSS, per-leaf vars, PR cross-engine coverage, security SAST, package-size budgets, and assertion depth (`knip.json:5`, `css/legend.css:149`, `.github/workflows/ci.yml:131`, `scripts/lib/ownership-proof.mjs:38`).
- **The product wants focus.** Docs/product, architecture, and DX point to a differentiated report/provenance/tooling lane, while the public README and large docs inventory can read like a broad component kit (`docs/frontier-primitives.md:9`, `README.md:11`, `docs/README.md:11`).

## Consolidated issues (severity-ranked)
No P0 issues were reported.

- **[P1] Foreign-renderer and arbitrary-accent theming overclaim live re-skinning and contrast safety.** POVs: architecture, a11y, DX, docs, testing. Evidence: `docs/vega.md:146`, `tokens/vega.js:14`, `tokens/mermaid.js:37`, `tokens/charts.json:2`, `scripts/emit-theme.mjs:45`, `docs/contrast.md:239`, `docs/theming.md:56`, `docs/theming.md:101`, `docs/theming.md:151`.
- **[P1] Behavior/adapters are not publicly granular by leaf, hurting no-bundler and low-parse-cost consumers.** POVs: performance, DX. Evidence: `package.json:406`, `behaviors/index.js:33`, `behaviors/index.js:54`, `react/index.js:48`, `react/index.js:73`.
- **[P1] `ui.table({ breakAnywhere: true })` is implemented but missing from `TableOpts`.** POVs: DX, testing. Evidence: `classes/index.js:933`, `classes/index.js:939`, `classes/index.d.ts:715`, `docs/reference.md:1392`.
- **[P1] PRs do not get the same cross-engine browser gate as release.** POVs: testing. Evidence: `.github/workflows/ci.yml:131`, `.github/workflows/release.yml:95`.
- **[P1] Strategic docs are stale and target-user positioning is ambiguous.** POVs: docs/product. Evidence: `ROADMAP.md:10`, `package.json:3`, `CHANGELOG.md:8`, `README.md:11`, `ROADMAP.md:21`, `ROADMAP.md:246`.

- **[P2] Behavior-required widgets can fail accessibility when init or author wiring is missed.** POVs: a11y, DX, behaviors. Evidence: `docs/usage.md:613`, `docs/usage.md:629`, `docs/usage.md:637`, `behaviors/tabs.js:20`, `docs/reference.md:1620`, `docs/command.md:29`, `behaviors/command.js:228`.
- **[P2] Adapter lifecycle semantics diverge and one-shot hooks can miss late refs/options.** POVs: DX, behaviors. Evidence: `react/index.js:85`, `react/index.js:103`, `solid/index.js:87`, `solid/index.js:105`, `qwik/index.js:94`, `qwik/index.js:122`, `svelte/index.js:88`, `vue/index.js:107`.
- **[P2] Scoped behaviors still use process-global `document` in places.** POVs: behaviors. Evidence: `behaviors/dialog.js:88`, `behaviors/combobox.js:117`, `behaviors/popover.js:71`, `behaviors/popover.js:238`, `behaviors/menu.js:21`, `behaviors/menu.js:48`.
- **[P2] Some contrast guarantees are advisory despite low ratios or blended-surface uncertainty.** POVs: a11y, testing. Evidence: `scripts/gen-contrast.mjs:166`, `docs/contrast.md:132`, `docs/contrast.md:162`, `docs/contrast.md:192`, `scripts/check-contrast.mjs:51`, `test/e2e/a11y.spec.mjs:54`.
- **[P2] Reduced-transparency support is missing while blur/translucency is used.** POVs: a11y, performance. Evidence: `css/overlay.css:23`, `css/overlay.css:194`, `css/overlay.css:453`, `css/app.css:173`.
- **[P2] “No `!important`” is directionally true but not literal.** POVs: architecture, DX, CSS. Evidence: `css/core.css:6`, `css/core.css:8`, `css/motion.css:396`, `css/motion.css:402`, `css/base.css:270`, `demo/index.html:12`.
- **[P2] Token ownership is tiered, and print palette remaps duplicate values.** POVs: architecture, CSS. Evidence: `tokens/index.js:18`, `tokens/skins.js:24`, `tokens/charts.js:4`, `scripts/gen-mermaid.mjs:36`, `scripts/gen-vega.mjs:60`, `css/tokens.css:327`, `css/report.css:686`.
- **[P2] CSS guardrails miss duplication and per-leaf variable self-containment.** POVs: CSS, testing. Evidence: `knip.json:5`, `.stylelintrc.json:9`, `scripts/check-variables.mjs:39`, `scripts/check-variables.mjs:50`, `css/legend.css:149`.
- **[P2] Global base/reset styles are intentionally host-invasive.** POVs: CSS, DX. Evidence: `css/base.css:5`, `css/base.css:11`, `css/base.css:47`, `css/base.css:71`, `css/base.css:78`.
- **[P2] Numeric CSS geometry knobs are mostly untyped, and some animations use layout/paint-heavy properties.** POVs: CSS, performance. Evidence: `css/interval.css:6`, `css/bullet.css:12`, `css/spotlight.css:15`, `css/motion.css:112`, `css/feedback.css:427`, `css/spotlight.css:42`.
- **[P2] CSS/package size visibility is too coarse and README wording can be misread as total package cost.** POVs: performance, docs. Evidence: `scripts/check-dist.mjs:75`, `scripts/build-dist.mjs:179`, `scripts/size-report.mjs:2`, `README.md:6`, `README.md:75`, `README.md:88`, `package.json:44`.
- **[P2] Import modes, docs inventory, and examples are accurate but easy for newcomers to misread.** POVs: DX, docs/product. Evidence: `llms.txt:18`, `llms.txt:36`, `llms.txt:43`, `docs/README.md:11`, `docs/README.md:63`, `examples/README.md:3`, `demo/index.html:83`.
- **[P2] Docs app executes remote CDN ESM without SRI.** POVs: security. Evidence: `docs/index.html:14`, `docs/index.html:138-139`, `docs/index.html:327-329`.
- **[P2] Security/static-analysis gates are advisory or outside required PR checks.** POVs: security, testing. Evidence: `.github/workflows/scorecard.yml:3`, `.github/workflows/scorecard.yml:31`, `code-quality-audits/2026-06-12-ai-slop-pass/report.md:63`, `.semgrepignore:1-11`.
- **[P2] Some testing proves ownership/mentions rather than assertion depth.** POVs: testing. Evidence: `scripts/check-component-matrix.mjs:1`, `scripts/lib/ownership-proof.mjs:38`, `test/e2e/marks.spec.mjs:31`, `test/e2e/demos.spec.mjs:49`.

- **[P3] Trusted-markup assumptions need to be closer to behavior docs.** POVs: security, behaviors. Evidence: `.github/SECURITY.md:35-41`, `behaviors/internal.js:81-88`, `behaviors/dialog.js:14-16`, `behaviors/popover.js:171-177`.
- **[P3] Type declaration generation can emit weak `any` declarations.** POVs: behaviors, DX. Evidence: `tsconfig.dts.json:4`, `tsconfig.dts.json:14`, `behaviors/internal.d.ts:1`, `react/index.d.ts:38`.
- **[P3] Cleanup edge cases remain for open dialogs and toast transition timers.** POVs: behaviors. Evidence: `behaviors/dialog.js:29`, `behaviors/dialog.js:48`, `behaviors/dialog.js:90`, `behaviors/toast.js:110`, `behaviors/toast.js:111`.
- **[P3] Form progressive-enhancement story is undercut by copyable `novalidate` demo markup.** POVs: a11y. Evidence: `behaviors/forms.js:213`, `behaviors/forms.js:255`, `demo/index.html:475`.
- **[P3] Color-policy comments and `generated.css` naming can mislead maintainers.** POVs: architecture, CSS, performance. Evidence: `scripts/check-color-policy.mjs:159`, `scripts/check-color-policy.mjs:381`, `scripts/check-color-policy.mjs:386`, `css/generated.css:1`.
- **[P3] Primitive CSS carries app-shell aliases, weakening conceptual boundaries.** POVs: architecture. Evidence: `css/primitives.css:163`, `css/primitives.css:168`, `css/primitives.css:759`, `css/app.css:257`.
- **[P3] Visual coverage remains Chromium-centered and full reports are not pixel-snapshotted.** POVs: testing. Evidence: `playwright.config.mjs:45`, `test/e2e/report.spec.mjs:158`, `test/e2e/report-print.spec.mjs:79`.
- **[P3] CI/dependency hygiene has manual lanes and write-capable automation paths.** POVs: security, testing. Evidence: `.github/workflows/visual-baselines.yml:64-87`, `.github/dependabot.yml:21-40`, `package-lock.json:3194-3209`.

## Top recommendations (highest leverage first)
1. **Tighten the theming contract:** add custom-accent audit tooling, gate or ban accidental text use on accent-tint surfaces, and either support skin/custom accents in renderer bridges or remove “re-skins for free” claims. Motivated by architecture, a11y, DX, docs, testing.
2. **Make behavior adoption harder to misuse:** add behavior-required markup checklists/snippets, accessible-name guards for command, owner-document scoping, late-root/rebind guidance, and trusted-markup warnings near initializers. Motivated by a11y, DX, behaviors, security.
3. **Close CI asymmetry:** run cross-engine e2e on risky PRs, add required lightweight security/static analysis, improve assertion-depth proof, and machine-check branch protection expectations. Motivated by testing, security.
4. **Add performance/package granularity:** budget root CSS, analytical/report CSS, largest leaf, total generated CSS, fonts, and packed tarball; add behavior leaf exports; reword size badges as default CSS bundle only. Motivated by performance, DX, docs.
5. **Strengthen CSS maintainability gates:** add duplicate/overlap detection, per-leaf variable prerequisites or fallbacks, more `@property` registrations, reduced-transparency fallbacks, and an allowlist for layout-heavy animation/root `:has()`. Motivated by CSS, a11y, performance.
6. **Fix concrete correctness/documentation drifts:** `TableOpts.breakAnywhere`, ROADMAP version, `novalidate` demo, color-policy comments, `generated.css` banner, and absolute `llms.txt` claims. Motivated by DX, docs, a11y, architecture, CSS.
7. **Refocus onboarding:** put role-based “Start here” paths and the frontier/report thesis ahead of inventory; make examples teach integration patterns, not only packed-tarball verification. Motivated by docs/product, DX.
8. **Name the token model honestly:** document “tiered sources with generated projections,” centralize or gate print remaps, and assign ownership to renderer slot maps. Motivated by architecture, CSS, docs.

## Strengths worth preserving
- The single `@layer bronto` default cascade, paired with explicit raw escape-hatch exports and drift checks (`css/core.css:10`, `scripts/check-dist.mjs:70`, `docs/package-contract.md:16`).
- The generated token/artifact pipeline, including DTCG/resolved projections, contrast gates, class registry, package contract, and migration metadata (`tokens/index.js:7`, `scripts/lib/artifacts.mjs:31`, `docs/contrast.md:9`, `MIGRATIONS.json:1`).
- Thin, optional, cleanup-returning behavior initializers and framework adapters that do not become component runtimes (`behaviors/internal.js:19`, `behaviors/internal.js:62`, `react/index.js:103`, `vue/index.js:101`).
- Zero-runtime-dependency package posture, npm provenance, SHA-pinned Actions, tag-gated release, and `npm publish --ignore-scripts` (`package.json:205-240`, `package.json:34-37`, `.github/workflows/release.yml:175-199`).
- The differentiated report/provenance/explanation tooling lane, where Bronto owns grammar and geometry while hosts own state/data (`docs/frontier-primitives.md:9`, `docs/reporting.md:76`, `docs/figure.md:64`).
- The broad quality-gate culture: packed consumer checks, visual baselines, behavior/component matrices, a11y scans, contrast checks, report grammar validation, and workflow self-checks (`package.json:146`, `scripts/check-chain.mjs:37`, `test/e2e/visual.spec.mjs:8`).

## Tensions & disagreements
- **CSS-first freedom vs consumer burden:** zero runtime and authored markup are core strengths, but they push ARIA, behavior init, trusted markup, and contrast verification onto adopters.
- **Simple “one accent” identity vs real color tiers:** the brand story is memorable, but status colors, data-viz ramps, skins, print remaps, and static renderer outputs make the actual model more tiered.
- **Layered override promise vs protective exceptions:** consumer CSS usually wins cleanly, but reduced-motion, print, and global base/reset rules are deliberately more forceful.
- **Breadth vs focus:** the system has many surfaces, but the strongest product argument is narrower: maintainer-owned tools, agents, static reports, and provenance-heavy UIs.
- **Stable tests vs exhaustive tests:** Chromium pixel baselines, structural report tests, and ownership matrices keep CI practical, but they leave cross-browser visual drift and shallow assertions as residual risk.
- **Secure package vs broader project surface:** the npm package/release path is strong; docs CDN dependencies, dev install scripts, and write-capable automation are the remaining realistic supply-chain surfaces.