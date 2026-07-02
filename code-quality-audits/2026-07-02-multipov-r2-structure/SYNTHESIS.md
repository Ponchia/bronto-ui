# bronto-ui — round 2 (structure & architecture) synthesis

## Executive verdict
The architecture is coherent and largely scalable at the package, cascade, export, and generated-artifact boundaries: `core.css`, opt-in leaves, layered outputs, package exports, and artifact freshness gates all reinforce the same CSS-first thesis. The structural debt is mostly inside those boundaries: selector ownership is weaker than import ownership, several CSS leaves and framework adapters are too broad, and some generated/type/token contracts still depend on hand-maintained chains or implicit registries. The system honors its thesis, but the next scaling risk is contributors adding surface area through checker-mediated tribal knowledge instead of one declared manifest/playbook.

## Scorecard

| Lens | Grade | One-line takeaway |
|---|---:|---|
| Module boundaries | B- | Strong default-vs-opt-in package boundary, weaker selector ownership inside CSS leaves. |
| Token cascade graph | B+ | Robust `@layer` and token generation gates, with drift seams around skins, print, and leaf-local variables. |
| CSS organization | B- | Distribution contract is clean; large bucket files and cross-file selector ownership weaken cohesion. |
| Build pipeline/types | B+ | Artifact freshness is disciplined, but script orchestration and recipe types are not fully source-derived. |
| JS module architecture | B+ | Behavior graph is clean and granular for vanilla users; adapters remain monolithic and class-coupled. |
| Package export surface | A- | Excellent public contract machinery, with gaps around behavior leaves, internal type leakage, and root CSS TS smoke. |
| Repo structure conventions | B+ | Layout is intentional and documented; newcomer workflow is too scattered across docs, scripts, and checkers. |
| Overall | B+ | Strong architecture at the public boundary; main debt is intra-layer ownership, manifest centralization, and contributor ergonomics. |

## Cross-cutting structural themes

1. Public/import boundaries are a real strength. Module boundaries, token cascade, CSS organization, package exports, and repo structure all point to the same coherent model: root CSS, explicit opt-in leaves, generated layered outputs, and checked package contracts (`css/core.css:12`, `css/analytical.css:15`, `package.json:242`, `scripts/check-dist.mjs:22`, `docs/architecture.md:134`).

2. Selector ownership is weaker than module ownership. Module and CSS reviewers both found selectors crossing conceptual layers: app-shell aliases in primitives, core prose knowing about opt-in marks, table/prose/report overlap, carousel split across disclosure/overlay, and forced-colors/print overrides centralized in `base.css` (`css/primitives.css:163`, `css/content.css:107`, `css/report.css:367`, `css/overlay.css:178`, `css/base.css:204`).

3. Several registries are implicit or duplicated. Build, JS, package, and repo reviews all found “checked but not declared once” surfaces: artifact scripts, recipe types, behavior leaf exports, CSS leaves across package exports/files, and add-a-primitive steps (`package.json:200`, `scripts/gen-dts.mjs:26`, `package.json:410`, `scripts/build-dist.mjs:83`, `scripts/check-component-matrix.mjs:475`).

4. Granularity is uneven. CSS leaf exports are fine-grained, but `primitives.css`, `disclosure.css`, `report.css`, `workbench.css`, and framework adapters bundle many concerns behind broad files or barrels (`css/primitives.css:6`, `css/disclosure.css:400`, `css/report.css:300`, `css/workbench.css:11`, `react/index.js:49`).

5. Generated systems are strong but not fully single-source. Token and build reviewers both found seams where generated discipline stops: skin-unaware renderer palettes, hand-authored print remaps, global variable checks, handwritten recipe option types, and regex-based recipe validation (`tokens/skins.js:20`, `scripts/gen-charts.mjs:24`, `css/tokens.css:327`, `scripts/check-variables.mjs:39`, `scripts/check-recipe-types.mjs:13`).

## Consolidated findings (severity-ranked)

- [P0] No structural blocker identified. The public-root/no-`src` layout is deliberate and documented rather than accidental (`docs/architecture.md:104`, `docs/architecture.md:158`).

- [P1] CSS selector/layer ownership is not enforced at selector granularity. Raised by module boundaries and CSS organization; evidence: app-shell selectors live in primitives, and existing gates check imports/coverage rather than cross-layer selector placement (`css/primitives.css:163`, `css/primitives.css:759`, `scripts/lib/css-leaves.mjs:17`, `scripts/check-component-matrix.mjs:1`).

- [P1] Large CSS leaves are acting as category buckets. Raised by module boundaries and CSS organization; evidence: primitives, disclosure, workbench, and report each bundle multiple separable concerns (`css/primitives.css:6`, `css/disclosure.css:8`, `css/workbench.css:11`, `css/report.css:300`).

- [P1] Renderer/token projections can drift under skins. Raised by token cascade; evidence: skins repoint live accent tokens while chart/Mermaid/Vega generators resolve core light/dark values only (`tokens/skins.js:20`, `css/dataviz.css:11`, `scripts/gen-charts.mjs:24`, `scripts/gen-mermaid.mjs:117`, `scripts/gen-vega.mjs:184`).

- [P1] Artifact verification and recipe typing are incomplete as an architectural contract. Raised by build pipeline/types; evidence: `verify:artifacts` omits semantic checks, and recipe option interfaces are handwritten with partial runtime cross-checks (`package.json:149`, `package.json:187`, `package.json:200`, `package.json:201`, `scripts/gen-dts.mjs:26`, `scripts/check-recipe-types.mjs:13`).

- [P1] Framework adapters defeat some per-leaf behavior granularity. Raised by JS architecture; evidence: adapters import the full behavior barrel and re-export the class registry (`react/index.js:49`, `react/index.js:108`, `react/index.js:161`, `solid/index.js:51`, `vue/index.js:38`).

- [P1] Contributor workflow for adding a primitive is scattered. Raised by repo structure; evidence: admission rules, class registry, exports, docs/demo/e2e ownership, and regeneration live across docs, manifest scripts, and checker source (`docs/architecture.md:114`, `CONTRIBUTING.md:77`, `package.json:200`, `scripts/check-component-matrix.mjs:475`).

- [P2] Direct leaf dependencies are not checked per import graph. Raised by token cascade and module boundaries; evidence: `check-variables` is repo-global, `content.css` relies on `base.css`, and standalone legend modes assume dataviz tokens (`scripts/check-variables.mjs:39`, `css/content.css:83`, `css/base.css:34`, `css/legend.css:104`, `css/legend.css:149`).

- [P2] Public/private JS boundary leaks through declarations. Raised by JS architecture and package exports; evidence: `behaviors/internal.js` is documented internal but public `.d.ts` files reference it (`behaviors/internal.js:1`, `behaviors/index.d.ts:22`, `behaviors/dialog.d.ts:16`, `react/index.d.ts:8`).

- [P2] Behavior leaf exports lack the inverse checks CSS leaves have. Raised by JS architecture and package exports; evidence: CSS inverse checks exist, but behavior matrices own the barrel while `package.json` manually lists leaf subpaths (`scripts/check-exports.mjs:77`, `scripts/check-behavior-matrix.mjs:165`, `package.json:410`).

- [P2] Cross-file CSS co-ownership and duplication are accumulating. Raised by CSS organization; evidence: tables span `table`, `content`, and `report`; metadata labels and link/details idioms repeat across files (`css/table.css:6`, `css/content.css:250`, `css/report.css:367`, `css/report.css:614`, `css/workbench.css:157`).

- [P2] Token SSOT has hand-authored tails. Raised by token cascade; evidence: print palette remaps and report print semantics live outside the canonical JS token source (`css/tokens.css:327`, `css/tokens.css:352`, `scripts/gen-tokens-css.mjs:120`, `css/report.css:687`).

- [P2] Root CSS side-effect import is documented but not covered by packed TS smoke. Raised by package exports; evidence: docs recommend `import '@ponchia/ui'`, while consumer type checks skip the root CSS export because it has no `types` condition (`docs/getting-started/react-solid.md:182`, `package.json:243`, `scripts/check-consumer-types.mjs:49`).

- [P2] Repo navigation is checker-mediated in high-change areas. Raised by repo structure; evidence: flat `test/`, undocumented `demo/` local taxonomy, and overloaded `package.json` task routing (`test/types.test-d.ts`, `test/e2e/_report-print.fixture.html`, `test/e2e/demos.spec.mjs:15`, `package.json:115`, `package.json:191`).

- [P3] Class and naming surfaces create avoidable lookup friction. Raised by module boundaries, CSS organization, and repo structure; evidence: one flat class registry spans layers, abbreviated selector families differ from file names, and `legend`/`legends` varies across surfaces (`classes/index.js:12`, `classes/index.js:612`, `css/selection.css:10`, `package.json:272`, `demo/legends.html`).

- [P3] Some documentation names the wrong side of generated contracts. Raised by token cascade and package exports; evidence: generated renderer files are described as source of truth, and behavior leaf stability is less explicit than the barrel (`docs/package-contract.md:317`, `tokens/mermaid.js:1`, `docs/stability.md:70`).

## Top recommendations (highest leverage first)

1. Add selector-boundary and co-ownership gates. Motivated by module boundaries and CSS organization; risk/effort: safe-mechanical if first advisory, needs-design for final policy. Cover `.ui-app-*` in primitives, opt-in selectors in core, table/prose/report, carousel, and mode overrides (`css/primitives.css:163`, `css/content.css:107`, `css/report.css:367`, `css/base.css:204`).

2. Create a single primitive admission playbook plus manifest. Motivated by repo structure, build pipeline, package exports, and CSS organization; risk/effort: mostly safe-mechanical. Sequence lane choice, CSS/classes/tokens, exports/files, docs/demo/e2e matrix, generation, and checks (`docs/architecture.md:114`, `package.json:200`, `scripts/check-component-matrix.mjs:475`).

3. Replace script-chain artifact knowledge with a declared artifact DAG. Motivated by build pipeline and token cascade; risk/effort: needs-design. Include sources, outputs, builders, semantic checks, and generated npm chains (`scripts/lib/artifacts.mjs:31`, `package.json:200`, `package.json:201`).

4. Make behavior leaf exports registry-backed and fix internal type leakage. Motivated by JS architecture and package exports; risk/effort: safe-mechanical for checks, needs-design for public type placement. Exclude `internal.js`, add `behaviors/types.js` or equivalent, and smoke leaf subpaths (`package.json:410`, `behaviors/internal.js:1`, `react/index.d.ts:8`).

5. Split broad CSS buckets internally while preserving public roll-ups. Motivated by module boundaries and CSS organization; risk/effort: safe-mechanical if exports stay stable. Start with `primitives`, `disclosure`, `workbench`, and report sub-grammars (`css/primitives.css:6`, `css/disclosure.css:400`, `css/workbench.css:205`, `css/report.css:622`).

6. Make token projections first-class for skins and print. Motivated by token cascade and build pipeline; risk/effort: needs-design. Either document renderer themes as core-only or generate skin-aware projections; move print remaps into the token source/model (`tokens/skins.js:37`, `scripts/gen-charts.mjs:102`, `css/tokens.css:348`).

7. Decouple framework adapters from the full behavior barrel and class registry where practical. Motivated by JS architecture; risk/effort: moderate, needs bundler/tree-shaking verification. Import behavior leaves directly and factor shared adapter resolver/root helpers (`react/index.js:49`, `react/index.js:75`, `svelte/index.js:62`, `vue/index.js:64`).

8. Add focused navigation docs for high-friction directories and task families. Motivated by repo structure and package exports; risk/effort: safe-mechanical. Add `test/README.md`, `demo/README.md`, a task map, and export-family conventions (`playwright.config.mjs:24`, `test/e2e/visual.spec.mjs:8`, `package.json:115`, `docs/package-contract.md:7`).

## Structural strengths worth preserving

- Root CSS-only package entry with explicit JS subpaths (`package.json:242`, `package.json:340`, `package.json:401`).
- Single `@layer bronto` model with generated flattened/layered dist checks (`css/core.css:10`, `scripts/build-dist.mjs:53`, `scripts/check-dist.mjs:70`).
- Opt-in analytical/report/tooling leaves and roll-ups that keep default identity CSS narrow (`css/core.css:12`, `css/analytical.css:15`, `css/report-kit.css:14`).
- Generated artifact freshness registry and byte-compare discipline (`scripts/lib/artifacts.mjs:31`, `scripts/check-fresh.mjs:13`).
- Thin, SSR-safe behavior modules with clean downward dependency direction (`docs/architecture.md:74`, `behaviors/internal.js:17`, `behaviors/connectors.js:2`).
- Tarball-level package checks and packed consumer smoke tests (`scripts/check-pack.mjs:74`, `scripts/check-consumer-surface.mjs:314`).
- Explicit architecture/stability/package-contract docs that make the unusual root layout understandable (`docs/architecture.md:134`, `docs/stability.md:45`, `docs/package-contract.md:1`).

## Tensions & disagreements

- Granularity vs cohesion: reviewers agree broad leaves are a maintainability risk, but the current roll-up/public export model is also a strength. Split authored internals first; avoid public subpath churn.

- Generated safety vs pipeline complexity: artifact gates are strong, but the more checks added, the more `package.json` becomes an opaque router. A declared DAG would preserve safety while reducing script sprawl.

- Adapter breadth vs ergonomic framework imports: package-surface review sees adapter aggregators as structurally defensible, while JS architecture flags their barrel/class coupling as a tree-shaking and parse-cost risk.

- Strict selector ownership vs compatibility aliases: app metric/empty-state aliases in primitives are documented compatibility, but they still weaken primitive ownership. A selector-boundary gate needs explicit allowlists.

- Token dynamism vs static renderer artifacts: live CSS skins are runtime-variable, while diagram/chart renderer outputs are static projections. The project needs to choose skin-aware generation or document core-only renderer themes.