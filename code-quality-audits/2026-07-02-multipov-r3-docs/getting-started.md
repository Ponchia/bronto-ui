# Getting-started / onboarding — bronto-ui documentation review
**Verdict:** The docs have a strong contract story and a mostly correct package-surface story, but the install-to-first-success path is not yet smooth. README and reporting docs are good; framework onboarding is uneven, and one early Astro snippet is materially wrong for styling. The main IA problem is that newcomers must combine README + integration + one framework guide + examples to learn the correct order: CSS → pre-paint theme → markup/components → behavior adapter.
**Grade:** B- — strong surface accuracy, weakened by uneven framework starts and first-snippet friction.
## Strengths
- README leads with the differentiated lane: CSS-first identity for services/tools/reports, provenance, print/PDF, zero runtime deps. `README.md`
- The root CSS import is accurately documented: `@import '@ponchia/ui'` maps to `dist/bronto.css`, matching `package.json` exports. `README.md`, `package.json`, `docs/package-contract.md`
- The report/PDF path is unusually clear: default bundle excludes report layers, `report-kit.css` is the one-file opt-in, CDN/local `dist/css/` paths are shown, and Chromium PDF constraints are explicit. `docs/reporting.md`
- Behavior vs CSS-native tiering is well explained, including what breaks without JS. `docs/usage.md`
- Adapter APIs in the guides match real exports for React/Solid/Qwik hooks, Svelte actions, and Vue directives/plugin. `docs/getting-started/react-solid.md`, `docs/getting-started/sveltekit.md`, `docs/getting-started/vue.md`, `react/index.js`, `solid/index.js`, `qwik/index.js`, `svelte/index.js`, `vue/index.js`
- Runnable examples cover the real consumer surfaces and are aligned by checks. `examples/react-vite/src/main.jsx`, `examples/solid-vite/src/main.jsx`, `examples/qwik-vite/src/main.jsx`, `examples/vue-vite/src/App.vue`, `scripts/check-examples.mjs`
## Weaknesses / risks
- [P1] Astro’s first behavior snippet uses `class="ui-themetoggle"`, but the actual styled class is `ui-themetoggle__button`; `ui-themetoggle` is a parts-only namespace with no standalone CSS rule. Newcomer cost: the copied toggle behavior works but renders unstyled, teaching a phantom base class. `docs/getting-started/astro.md`, `css/navigation.css`, `classes/index.js`, `test/classes-json.test.mjs`
- [P1] Vue guide omits the no-flash theme step even though integration says every guide shows it. Newcomer cost: Vue users get theme flash or assume the directive alone handles pre-paint persistence. `docs/integration.md`, `docs/getting-started/vue.md`
- [P2] React/Solid/Qwik guide opens with adapter hooks before CSS/no-flash setup. Newcomer cost: the first pasted snippet can compile but not produce a styled page unless the reader later discovers the CSS section. `docs/getting-started/react-solid.md`, `package.json`
- [P2] Local plain-HTML path uses `/node_modules/...` without saying “serve the project root” or warning against opening from `file://`; reporting docs use clearer relative `./node_modules/...` standalone paths. Newcomer cost: first saved HTML can load no CSS/JS depending on how it is opened. `README.md`, `docs/getting-started/vanilla.md`, `docs/reporting.md`
- [P2] Framework parity is uneven: React/Solid/Qwik share one dense guide, Vue is much thinner, and only Astro/Svelte/vanilla/React-family discuss theme pre-paint. Newcomer cost: Qwik/Vue/Solid users have to infer more from examples than React/Svelte users. `README.md`, `docs/getting-started/react-solid.md`, `docs/getting-started/vue.md`, `docs/getting-started/sveltekit.md`
- [P2] There is no single minimal “first styled page” per framework; onboarding jumps from README snippets to adapter lifecycle details, while usable full pages live in examples. Newcomer cost: first success requires stitching docs together. `README.md`, `docs/getting-started/*.md`, `examples/*`
- [P3] Getting-started guides are GitHub-only, not in the npm shipped docs allowlist/export matrix. Newcomer cost: an offline consumer/agent in `node_modules/@ponchia/ui` gets `usage.md` and reporting docs but not framework starts. `package.json`, `README.md`, `docs/package-contract.md`
- [P3] Current gates validate named imports/CDN paths and many class mentions, but not whole framework first-page snippets or ordered onboarding parity. Newcomer cost: docs can be “contract-valid” while still failing as a pasted first page. `scripts/check-contract.mjs`, `scripts/check-doc-recipes.mjs`, `scripts/check-report.mjs`
## Top recommendations
1. [safe-mechanical] Fix the Astro snippet to use `ui-themetoggle__button` plus its child parts, or use a plain `ui-button` consistently.
2. [needs-writing] Add the no-flash theme section to Vue, matching integration and the Vue example app.
3. [needs-writing] Reorder every getting-started guide to the same sequence: install → CSS → inline theme → minimal styled markup → behavior adapter.
4. [needs-writing] Add one copy-paste “first styled page” block per framework before advanced lifecycle/scoping notes.
5. [safe-mechanical] Change local no-build HTML examples to relative `./node_modules/...` paths and state the serving/opening assumption.
6. [safe-mechanical] Add `docs/getting-started/*.md` to shipped docs, or explicitly label them GitHub-only in README/docs IA.
## Notable observations
- Reporting/PDF onboarding is the strongest path; app/framework onboarding should copy its precision around opt-in CSS and standalone URLs.
- The docs already know the right universal model in `docs/integration.md`; the issue is propagation into individual framework guides.
- `check-report` explicitly allows parts-only group names, which is reasonable for reference headings but lets the Astro `ui-themetoggle` copy-paste problem evade snippet-level review.