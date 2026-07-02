# bronto-ui — round 3 (documentation & IA) synthesis

## Executive verdict
The documentation is unusually broad and well-governed for a pre-1.0 UI package, especially the generated reference, reporting lane, package contract, migrations, and drift gates. The consumer experience is weaker than the contract surface: onboarding is fragmented, IA is flat, examples are not first-class teaching paths, and several hand-authored docs contain confirmed code-vs-doc drift. The highest-risk debt is not missing coverage; it is wrong snippets/prose plus a missing guided path from install to confident use.

## Scorecard
| Lens | Grade | One-line takeaway |
| --- | --- | --- |
| `reference-accuracy.report.md` | B+ | Generated contracts are strong; hand-authored snippets and prose still drift from code. |
| `getting-started.report.md` | B- | First-success path works in pieces, but framework starts are uneven and one Astro snippet is materially wrong. |
| `docs-ia-diataxis.report.md` | B- | Content is rich and reachable, but the IA is inventory-like, flat, and lacks a real tutorial layer. |
| `llms-txt-machine.report.md` | B- | `llms.txt` is valuable and shipped, but hand-maintained with confirmed stale class/modifier prose. |
| `conceptual-explanatory.report.md` | B+ | The mental model is strong, but fragmented across too many pages. |
| `examples-demos-teaching.report.md` | B- | Demos/examples are excellent raw material, but framed and linked more like CI fixtures than lessons. |
| `per-primitive-and-hygiene.report.md` | B+ | Per-primitive coverage and governance are strong; page shape, a11y, and host-boundary sections are inconsistent. |
| **Overall** | **B-** | Strong source-backed documentation system, but consumer learning, navigation, and hand-authored accuracy need focused cleanup. |

## Cross-cutting themes
1. **Generated surfaces are trusted; hand-authored surfaces drift.** Raised by reference accuracy, `llms.txt`, getting-started, and primitive hygiene. Generated `docs/reference.md`, package contracts, class registries, and checks are strong, but stale prose in `docs/bullet.md`, `docs/getting-started/astro.md`, and `llms.txt` can make consumers copy no-op classes or properties.

2. **There is no single learning path.** Raised by getting-started, IA/Diátaxis, conceptual, and examples reviews. New users must assemble README + integration docs + framework guide + examples + demos to learn the sequence: install, CSS, pre-paint theme, markup, behavior adapter.

3. **Navigation is complete but too flat.** Raised by IA/Diátaxis, examples, and primitive hygiene. `docs/index.html` and `docs/README.md` make content reachable, but consumers lack grouped navigation, search, ToCs, related links, and doc/demo/example loops.

4. **The conceptual model is good but scattered.** Raised by conceptual, IA, and primitive hygiene. CSS-first, `@layer bronto`, color governance, primitive ownership, opt-in leaves, and renderer boundaries are documented, but split across README, architecture, theming, contrast, ADRs, frontier, usage, dots, and `llms.txt`.

5. **Examples and demos prove coverage more than they teach.** Raised by getting-started and examples reviews. Runnable surfaces exist across frameworks and demos, but examples often read as tarball smoke fixtures and are not linked from the relevant guides.

6. **Per-primitive docs are broad but not uniformly scannable.** Raised by IA and primitive hygiene. No shipped primitive appears completely undocumented, but pages vary in structure, depth, a11y coverage, host-boundary guidance, and “next step” routing.

## Consolidated findings (severity-ranked)
- **[P0] No P0 blocker reported.** All seven reports found usable, substantial docs; the blocking risks are P1-level wrong guidance and IA gaps rather than absent documentation.

- **[P1] Confirmed doc-vs-code drift can make copied code silently no-op.** Lenses: reference accuracy, getting-started, `llms.txt`. Evidence: `docs/getting-started/astro.md` uses `ui-themetoggle` instead of styled `ui-themetoggle__button`; `docs/bullet.md` documents `--b1` / `--b2` while `css/bullet.css` uses `--band-lo` / `--band-hi`; `llms.txt` says `ui-inspector__header` vs real `ui-inspector__head`; `llms.txt` says `ui-code__line--del` vs public `remove` option/class.

- **[P1] Renderer theming docs over-promise live CSS re-skinning.** Lenses: reference accuracy, conceptual, primitive hygiene. Evidence: `docs/mermaid.md` and `docs/vega.md` say output “re-skins for free” with `--accent`, while `README.md`, `tokens/mermaid.js`, and `tokens/vega.js` indicate helpers emit resolved theme data that must be regenerated/re-rendered.

- **[P1] The docs lack a true tutorial / first-success spine.** Lenses: getting-started, IA/Diátaxis, examples. Evidence: `docs/getting-started/*.md`, `README.md`, and `docs/usage.md` exist, but none walks through one learning-oriented app or report build; framework guides omit or reorder CSS/no-flash/theme/adapter steps.

- **[P1] Consumer IA mixes product-use docs with maintainer/governance material.** Lenses: IA/Diátaxis, conceptual. Evidence: `docs/index.html` places `architecture.md`, `release.md`, `repository-map.md`, and `adding-a-primitive.md` beside theming/report/primitive docs; `docs/README.md` starts with contract/governance before consumer task paths.

- **[P1] Package/offline docs omit key onboarding surfaces.** Lenses: getting-started, IA/Diátaxis, examples. Evidence: `package.json` ships many docs but omits `docs/README.md`, `docs/integration.md`, and `docs/getting-started/*`; examples/demos are also not published, while README points framework consumers to those guides.

- **[P1] Examples and demos are not first-class teaching IA.** Lenses: examples, getting-started, IA. Evidence: `examples/README.md` leads with npm-pack/tarball CI mechanics; `docs/index.html` routes only markdown docs; framework guides omit direct example/demo links; `demo/service.html`, `demo/workbench.html`, and `demo/command.html` lack consistent doc backlinks.

- **[P1] Per-primitive how-to structure is inconsistent.** Lenses: per-primitive, IA. Evidence: richer pages such as `docs/annotations.md`, `docs/legends.md`, `docs/sources.md`, `docs/d2.md`, and `docs/vega.md` contrast with thinner or differently shaped `docs/selection.md`, `docs/clamp.md`, `docs/highlights.md`, `docs/interval.md`, and `docs/crosshair.md`.

- **[P2] Framework onboarding parity is uneven.** Lenses: getting-started, examples. Evidence: `docs/getting-started/react-solid.md` opens with adapter hooks before CSS/no-flash setup; `docs/getting-started/vue.md` omits the no-flash theme step; React/Solid/Qwik examples are richer than Vue/Svelte, while vanilla/Astro are minimal.

- **[P2] Search/findability support is thin for long pages and leaf docs.** Lenses: IA/Diátaxis, primitive hygiene. Evidence: `docs/index.html` has a flat route list with no search, category headings, or generated ToC; long pages include `docs/reference.md`, `docs/reporting.md`, `docs/usage.md`, `docs/annotations.md`, and `docs/theming.md`.

- **[P2] Leaf docs often dead-end instead of routing readers onward.** Lenses: IA, examples, primitive hygiene. Evidence: `docs/figure.md`, `docs/bullet.md`, `docs/clamp.md`, `docs/dots.md`, `docs/glyphs.md`, `docs/sources.md`, `docs/state.md`, `docs/toc.md`, and `docs/tree.md` need related links to hubs, imports, demos, theming/contrast, and reference.

- **[P2] Accessibility and host-boundary contracts are not predictably sectioned per primitive.** Lenses: per-primitive, conceptual. Evidence: global guidance exists in `docs/stability.md`, `docs/frontier-primitives.md`, and `docs/reporting.md`, but `docs/clamp.md`, `docs/highlights.md`, `docs/mermaid.md`, and `docs/vega.md` do not consistently surface standalone a11y/fallback expectations.

- **[P2] `llms.txt` is too hand-authored for its trust level.** Lenses: `llms.txt`, reference accuracy. Evidence: `llms.txt` is shipped/exported via `package.json`, but not generated through `scripts/lib/artifacts.mjs` or checked by `scripts/check-fresh.mjs`; existing gates miss shorthand BEM drift like `__header` and `--del`.

- **[P2] Conceptual vocabulary and taxonomy create avoidable search friction.** Lenses: IA, conceptual, primitive hygiene. Evidence: “tier” means color governance, token families, and display-expression levels across `README.md`, `docs/adr/0001-color-system.md`, `docs/theming.md`, and `docs/dots.md`; `skin`/`colorway`, `legend`/`legends`, and `color`/`colour` vary.

- **[P2] Upgrade and changelog entry points are heavy.** Lenses: per-primitive. Evidence: `CHANGELOG.md` is very large; readers need a front door pointing to `MIGRATIONS.json` and `docs/migrations/*.md`.

- **[P3] Smaller accuracy/hygiene gaps remain outside primary flows.** Lenses: reference accuracy, primitive hygiene, conceptual. Evidence: `docs/usage.md` says 48 glyphs while README/runtime indicate 71; `docs/reference.md` omits `.ui-app-metric__delta` state support; renderer docs use `@VERSION` placeholders while exact snippets elsewhere use `0.6.10`; `docs/contrast.md` points to a theming anchor that does not exist.

## Top recommendations (highest leverage first)
1. **Fix confirmed no-op/wrong guidance immediately** — `ui-themetoggle__button`, `--band-lo` / `--band-hi`, `ui-inspector__head`, `--remove`, glyph count, missing import leaves. Lenses: reference accuracy, getting-started, `llms.txt`. **Tag: safe-mechanical.**

2. **Add one canonical consumer tutorial and one “first styled page” per framework.** Use the same order everywhere: install → CSS → inline no-flash theme → minimal styled markup → behavior adapter. Lenses: getting-started, IA, examples. **Tag: needs-writing.**

3. **Upgrade docs IA: grouped nav, search, page ToCs, and related/next footers.** Mirror `docs/README.md` categories in `docs/index.html`, route primitive leaves to hubs/imports/reference/theming/demos, and separate consumer from maintainer paths. Lenses: IA, examples, primitive hygiene. **Tag: safe-mechanical plus light writing.**

4. **Make examples/demos part of the learning loop.** Add guide → example → live demo/source links; add doc backlinks from demo pages; write per-example notes that distinguish recommended app code from test-only scaffolding. Lenses: examples, getting-started. **Tag: needs-writing.**

5. **Create a canonical mental-model page.** Cover CSS-first/no-runtime, `@layer bronto`, color tiers, primitive ownership, opt-in leaves, renderer token generation, package shape, and override rules. Lenses: conceptual, IA. **Tag: needs-writing.**

6. **Generate or partially generate `llms.txt`, then gate it.** Feed it from `package.json`, `classes/classes.json`, reporting-toolbox registry, generated package contract, and reference data; extend checks to BEM shorthands and option literals. Lenses: `llms.txt`, reference accuracy. **Tag: safe-mechanical.**

7. **Normalize primitive-page templates.** Require sections for what/when, imports, minimal markup, options/classes/properties, behavior/events, a11y, host-owned boundary, print/forced-colors, and related links; start with thin pages. Lenses: per-primitive, IA. **Tag: needs-writing.**

8. **Clarify package/offline docs policy.** Either ship `docs/README.md`, `docs/integration.md`, and `docs/getting-started/*`, or clearly mark framework starts as web/GitHub-only. Lenses: getting-started, IA. **Tag: safe-mechanical.**

## Documentation strengths worth preserving
- Generated contract discipline: `docs/reference.md`, `classes.json`, package contract, recipe checks, class checks, migration checks, and freshness gates are a real advantage.
- Reporting/PDF documentation is the strongest consumer path: `docs/reporting.md`, `report-kit.css`, standalone report guidance, and Chromium/PDF constraints are precise.
- The conceptual foundation is strong: CSS-first, zero runtime, `@layer bronto`, color rationing, primitive ownership, renderer boundaries, and stability policy are all documented.
- Runnable breadth is broad: vanilla, Astro, SvelteKit, Vue, React, Solid, Qwik, Tailwind, static report, service demo, and kitchen-sink demo all exist.
- Per-primitive coverage is substantial; the issue is uniformity and routing, not absence.
- Migration/governance docs are unusually mature for a pre-1.0 package.

## Tensions & disagreements
- **Completeness vs teachability:** The docs cover a lot, but the same breadth makes `docs/index.html`, `docs/README.md`, and primitive leaves feel like inventory rather than a guided path.
- **Generated contracts vs authored explanation:** Generated docs are safer, but the most useful consumer guidance is hand-authored; that is where drift appears.
- **Examples as CI fixtures vs examples as lessons:** The current packed-tarball smoke framing protects release quality, but learners need curated examples with teaching notes.
- **Kitchen-sink demo vs decision guidance:** `demo/index.html` is valuable as a visual reference, while `docs/usage.md` correctly warns that a kitchen sink cannot teach when to choose each primitive.
- **Consumer docs vs maintainer docs:** Architecture, release, repository maps, and primitive-addition docs are useful, but putting them beside consumer task docs dilutes the first-time reader path.
- **Broad primitive coverage vs standardized templates:** Rich custom pages preserve nuance, but inconsistent structure slows comparison and makes a11y/host-boundary expectations easy to miss.