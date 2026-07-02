# Documentation IA & Diátaxis — bronto-ui documentation review
**Verdict:** The docs are content-rich and contract-aware, but the consumer IA is still more inventory than learning path. `docs/reporting.md`, `docs/usage.md`, `docs/theming.md`, `docs/reference.md`, and the primitive leaf pages contain strong material; `docs/index.html` and `docs/README.md` make everything reachable, but not sufficiently categorized, searchable, or progressively staged for a new consumer.

**Grade:** B- — strong coverage, weak tutorial/search/progressive-disclosure layer.

## Strengths
- `docs/README.md` inventories all Markdown docs by broad category, and `scripts/check-doc-links.mjs` enforces parity between the README inventory and `docs/index.html`.
- `docs/reporting.md` is the best IA hub: its analytical-toolbox table routes each leaf by import, purpose, and related doc.
- `docs/reference.md` is a real generated reference: it states 644 classes across 179 groups and ties the catalog to `@ponchia/ui/classes`.
- `docs/theming.md` → `docs/contrast.md` → `docs/adr/0001-color-system.md` forms a clear concept/reference/explanation chain for color and accessibility.
- Leaf docs such as `docs/figure.md`, `docs/selection.md`, `docs/crosshair.md`, `docs/command.md`, and `docs/workbench.md` consistently explain “Bronto owns X; host owns Y,” which stabilizes comprehension.
- `docs/stability.md` and `docs/package-contract.md` make the shipped docs/public paths part of the product contract, not incidental prose.

## Weaknesses / risks
- [P1] There is no true tutorial. `docs/getting-started/*.md` are task how-tos, `README.md` has a quick start, and `docs/usage.md` is a decision guide; none walks a consumer through one learning-oriented app/report build. Cost: first-time users must infer the mental model from reference plus recipes.
- [P1] Consumer and maintainer IA are conflated. `docs/index.html` places `architecture.md`, `release.md`, `repository-map.md`, and `adding-a-primitive.md` in the same flat nav as theming/report/primitive docs; `docs/README.md` also starts with contract/governance before consumer task paths. Cost: consumers scan repo-maintenance material before product-use material.
- [P1] Offline/package findability is inconsistent. `package.json` ships 48 docs but omits `docs/README.md`, all `docs/getting-started/*`, and `docs/integration.md`, while `README.md` points framework consumers to those guides. Cost: an npm/offline consumer loses the complete docs inventory and framework onboarding.
- [P2] `docs/index.html` has a single flat route list and heading IDs, but no search, category headings, or generated in-page ToC. Cost is high on long pages like `docs/reference.md`, `docs/reporting.md`, `docs/usage.md`, `docs/annotations.md`, and `docs/theming.md`.
- [P2] Many primitive leaf pages are dead ends once landed from search. Examples with no meaningful outbound “next” path include `docs/figure.md`, `docs/bullet.md`, `docs/clamp.md`, `docs/dots.md`, `docs/glyphs.md`, `docs/sources.md`, `docs/state.md`, `docs/toc.md`, and `docs/tree.md`. Cost: readers miss the hub, import bundle, theming, contrast, and reference context.
- [P2] Diátaxis modes are often mixed. `docs/theming.md` combines explanation, rebrand how-to, token reference, and accessibility contract; `docs/reporting.md` combines cookbook, toolbox reference, semantic explanation, and LLM checklist; `docs/usage.md` mixes decision guide, behavioral reference, and warnings. Cost: good information is harder to predictably retrieve.
- [P2] The primitive docs are locally coherent but globally flat. `docs/reporting.md` provides a strong taxonomy, but `docs/index.html` lists `figure`, `annotations`, `legends`, `mermaid`, `d2`, `vega`, etc. as an undifferentiated run. Cost: consumers cannot distinguish renderer bridges, evidence primitives, figure primitives, trust surfaces, and tooling surfaces at a glance.
- [P3] Terminology is mostly stable but has search friction: `docs/legends.md` documents `css/legend.css`; `docs/theming.md` and `docs/usage.md` move between “colorways” and “skins”; `README.md` uses “identity layer,” “standard component set,” and “default bundle.” Cost: users must know aliases to search effectively.

## Top recommendations
1. [needs-writing] Add one real consumer tutorial: build a small service shell or static report end to end, then point to `usage`, `theming`, and `reference`.
2. [safe-mechanical] Add grouped navigation, search, and per-page ToC to `docs/index.html`; mirror `docs/README.md` categories rather than a single flat route list.
3. [safe-mechanical] Ship `docs/README.md`, `docs/integration.md`, and `docs/getting-started/*` in `package.json`, or explicitly mark them as web-only in `README.md`.
4. [needs-writing] Add “Related / next” footers to leaf docs: hub, import path, reference, theming/contrast, and nearest sibling primitive.
5. [needs-writing] Make mixed docs mode-explicit: split or clearly label concept, task, and reference sections in `docs/theming.md`, `docs/reporting.md`, and `docs/usage.md`.
6. [safe-mechanical] Add a small terminology/alias index covering legend/legends, skin/colorway, leaf/primitive/surface, default bundle/standard component set/identity layer.

## Notable observations
- Diátaxis map: tutorial = effectively missing; how-to = `docs/getting-started/*`, `docs/integration.md`, `docs/interop/*`, `docs/migrations/*`, `docs/release.md`, `docs/adding-a-primitive.md`; reference/component reference = `docs/reference.md`, `docs/package-contract.md`, `docs/contrast.md`, `docs/stability.md`, and most primitive leaf docs; explanation = `docs/architecture.md`, `docs/adr/*`, `docs/frontier-primitives.md`, and parts of `docs/theming.md`.
- There are no true content orphans once `docs/README.md` and `docs/index.html` are counted; `docs/README.md` itself is the notable zero-inbound page and is not routed in the viewer.
- `docs/reporting.md` is strong enough to become the model for other hubs: it teaches when to use each leaf, not just that the leaf exists.