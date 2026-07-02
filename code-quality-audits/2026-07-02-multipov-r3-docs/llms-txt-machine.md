# llms.txt / machine-consumption surface — bronto-ui documentation review
**Verdict:** `llms.txt` is valuable public surface: it ships in the package and is exported (`package.json:62`, `package.json:352`), and it captures real import, override, class, token, and report-authoring constraints (`llms.txt:18`, `llms.txt:31`, `llms.txt:797`, `llms.txt:823`). But it is hand-maintained rather than generated (`docs/architecture.md:156`, `scripts/lib/artifacts.mjs:31`), and I found concrete drift that would make agents emit no-op classes (`llms.txt:470`, `llms.txt:610`). Treat it as a strong orientation guide, not yet as a safe canonical machine contract.

**Grade:** B- — distinctive and useful, but hand-authored with confirmed drift.

## Strengths
- It is a real shipped/contractual endpoint, not an incidental repo note: `files` includes it, exports exposes it, and stability names it as agent data (`package.json:62`, `package.json:352`, `docs/stability.md:109`).
- The import-mode guidance is unusually practical: root is CSS-only, package CSS specifiers need a bundler, plain HTML must use `dist/css`, and version-pinned CDN examples are present (`llms.txt:25`, `llms.txt:37`, `llms.txt:47`).
- It puts the override model and color constitution in front of agents: one `@layer bronto`, unlayered consumer CSS wins, no routine `!important`, and no raw chromatic component hues (`llms.txt:31`, `llms.txt:823`, `docs/adr/0001-color-system.md:72`).
- It points agents at better machine sources: literal `cls`/recipe declarations, `classes.json`, generated `reference.md`, and token data (`llms.txt:729`, `llms.txt:732`, `llms.txt:741`, `llms.txt:769`).
- Several spot checks matched source: the analytical roll-up’s nine leaves match `css/analytical.css`, and the chart accent semantics match `tokens/charts.js` (`llms.txt:220`, `css/analytical.css:15`, `tokens/charts.js:9`).

## Weaknesses / risks
- [P1] It is not generated from the registries that own the contract: generated artifacts list tokens, declarations, `reference.md`, package contract, and `classes.json`, but not `llms.txt`; `check:fresh` only checks that registry (`scripts/lib/artifacts.mjs:31`, `scripts/check-fresh.mjs:13`). Consumer cost: the highest-trust agent entrypoint can drift outside the freshness loop.
- [P1] Confirmed stale class prose: `llms.txt` says `ui-inspector` has `__header`, but the registry/docs/CSS use `ui-inspector__head` (`llms.txt:610`, `classes/index.js:613`, `docs/workbench.md:104`, `css/workbench.css:21`). Consumer cost: generated markup silently misses styling.
- [P1] Confirmed stale modifier prose: `llms.txt` says `ui-code__line--add` / `--del` / `--hl`, but the public option and class are `remove`, not `del` (`llms.txt:470`, `classes/index.js:1053`, `classes/index.d.ts:887`, `docs/code.md:7`). Consumer cost: agents emit a non-existent deletion state.
- [P2] Coverage lags newer state/workbench surfaces: the summaries name `ui-syncbar` and inspector/property/selectionbar, while source docs now include `ui-job`, `ui-toolstrip`, `ui-splitter`, and `initSplitter` (`llms.txt:583`, `llms.txt:610`, `docs/state.md:72`, `docs/workbench.md:24`, `docs/workbench.md:69`). Consumer cost: agents reimplement durable job rows or accessible split panes.
- [P2] The structure is more long-form manual than parser-friendly index: one huge “Use the framework” section carries almost all content, and the offline reference list is code-span prose rather than Markdown link inventory (`llms.txt:16`, `llms.txt:725`, `llms.txt:788`). Consumer cost: harder retrieval and poorer fixed-shape consumption.
- [P2] Static-report loading advice underplays the canonical `report-kit.css` path: `llms.txt` shows leaf-by-leaf links, while reporting docs say `report-kit.css` is the one-file complete report path and forgetting opt-in CSS is the common LLM failure (`llms.txt:637`, `docs/reporting.md:25`, `docs/reporting.md:27`).
- [P3] Existing gates miss shorthand BEM drift: `check-report` scans full `ui-*` tokens, but not prose shorthands like `__header` or `--del` (`scripts/check-report.mjs:114`, `llms.txt:470`, `llms.txt:610`). Consumer cost: class scans can pass while agent-facing prose is wrong.
- [P3] The “always-correct” / “never lie” wording is too absolute for a hand-authored guide that already contains stale prose (`llms.txt:9`, `llms.txt:12`). Consumer cost: agents may over-trust orientation text over generated contracts.

## Top recommendations
1. [safe-mechanical] Fix the concrete drifts now: `__header` → `__head`, `--del` → `--remove`, and add `ui-job`, `ui-toolstrip`, `ui-splitter`, `initSplitter` to the relevant summaries (`llms.txt:470`, `llms.txt:610`, `docs/state.md:72`, `docs/workbench.md:69`).
2. [safe-mechanical] Add `scripts/gen-llms.mjs` or a partial generator fed by `package.json`, `scripts/lib/reporting-toolbox.mjs`, `classes/classes.json`, and generated package contract (`package.json:244`, `scripts/lib/reporting-toolbox.mjs:8`, `classes/index.js:18`).
3. [safe-mechanical] Put generated `llms.txt` or generated slices into `scripts/lib/artifacts.mjs` so `check:fresh` catches drift (`scripts/lib/artifacts.mjs:31`, `scripts/check-fresh.mjs:13`).
4. [safe-mechanical] Extend `check-report`/contract checks to validate BEM shorthand fragments and documented recipe option literals, not only full `ui-*` tokens (`scripts/check-report.mjs:114`, `classes/index.d.ts:887`).
5. [needs-writing] Recast the top-level shape as a concise link/index surface plus a fuller companion or appendix; keep the “Rules an agent should respect” near the top (`llms.txt:16`, `llms.txt:795`).
6. [needs-writing] Make `report-kit.css` the default static-report recipe, then describe leaf-by-leaf imports as the payload-control path (`docs/reporting.md:27`, `css/report-kit.css:14`).

## Notable observations
- The changelog explicitly records the `ui-inspector__header` → `__head` correction, but `llms.txt` missed it (`CHANGELOG.md:276`, `llms.txt:610`).
- The repo already knows prose contracts can lie: `check-contract` was created for prior LLM-facing no-op recipes, and this review found the same failure class in shorthand prose (`scripts/check-contract.mjs:1`, `scripts/check-contract.mjs:5`).
- The reporting toolbox has a registry and gate that `llms.txt` could reuse instead of hand-copying report leaves (`scripts/lib/reporting-toolbox.mjs:8`, `scripts/check-report.mjs:598`).