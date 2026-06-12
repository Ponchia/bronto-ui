# Deep Project Review — 2026-06-11

**Headline:** `@ponchia/ui` is not AI slop. It is a disciplined CSS-first public package with unusually strong generated-contract gates, package-surface checks, accessibility tests, and release controls. The real problem is narrower and more interesting: several gates overclaim what they prove, and a few behavior/token contracts have edge-case defects that can ship green.

**Health:** good, with release-gate integrity fixes needed before the next serious release.

## Measured By

- **8 delegated Codex agents**: package contract/release, CSS/tokens, behaviors/a11y, framework adapters, scripts/build gates, tests/e2e coverage, docs/API clarity, security/supply chain.
- **Native checks**: `npm run check` passed. It covered stylelint, Prettier, export/freshness checks, classes/recipes, TypeScript, package pack checks, publint, AreTheTypesWrong, release/version metadata, docs contracts, contrast, glyph/colorway/chart/renderer checks, report/legend checks, and `check:chain`.
- **Unit tests**: `npm test` passed `224/224`.
- **Security/dependency checks**: `npm audit --audit-level=moderate` found `0` vulnerabilities. AI-slop helper reported CodeQL, gitleaks, trufflehog, trivy, knip, lint, tests, and `tsc --noEmit` passing.
- **AI-slop helper**: `/Users/zeno/bronto/llm-config/tools/ai-slop/scan.sh --deep-analysis /Users/zeno/bronto/bronto-ui` wrote `/var/folders/_k/jyfb_00d5yd4qlf5r5svcbfh0000gn/T//ai-slop/results/Users-zeno-bronto-bronto-ui/20260611T093124Z/report.md`. It failed only because the local `osemgrep` shim is broken and Checkov flagged a broad GitHub Actions policy warning.
- **Playwright e2e**: `npx playwright test --project=chromium` passed `194` tests and failed `35` visual snapshot assertions in `visual.spec.mjs`. The failures are consistent with local host/browser/font raster drift; the project explicitly says pixel baselines are authored/run in the pinned Playwright Linux container.
- **Clone scan**: `jscpd` found `1.99%` duplicated lines over an intentionally strict `0%` threshold. Most clones are demo boilerplate, tests, framework adapter symmetry, and generated/doc patterns; not evidence of sludge by itself.
- **Public-boundary search**: no confirmed private Bronto project-name leakage in the public package files reviewed.

## Do Before Next Release

| id | title | severity | why it matters | references |
|----|-------|----------|----------------|------------|
| R1 | Publish lifecycle can regenerate artifacts after checks | high | `prepublishOnly` runs `check && test`, while `prepack` is the generator chain. If npm runs `prepublishOnly` before `prepack`, the publish artifact can be regenerated after all checks passed, breaking the "checked artifact equals shipped artifact" guarantee. | `package.json:160`, `package.json:161` |
| R2 | `check:dts-emit` can false-pass when TypeScript emits nothing | high | The script ignores `tsc` failure and then walks whatever exists in the temp output. If nothing emits, there is no expected-output assertion to fail. This undermines declaration freshness. | `scripts/check-dts-emit.mjs:29`, `scripts/check-dts-emit.mjs:40`, `tsconfig.dts.json:4` |
| R3 | Prerelease version handling is broken despite prerelease release support | high | `release-prep` rewrites only stable `@ponchia/ui@X.Y.Z` literals and `check-versions` captures only `X.Y.Z`. `0.7.0-rc.1` would be captured as `0.7.0`; bumping rc1 to rc2 can produce `0.7.0-rc.2-rc.1`. | `scripts/release-prep.mjs:30`, `scripts/check-versions.mjs:21`, `.github/workflows/release.yml:20` |
| R4 | Human migration docs lag breaking-change data | high | `MIGRATIONS.json` and `CHANGELOG.md` contain 0.5 -> 0.6 chart removals, but docs migrations stop at 0.4 -> 0.5. The 0.2 -> 0.3 migration doc also omits other breaking token/import changes. | `MIGRATIONS.json:92`, `CHANGELOG.md:281`, `docs/README.md:66`, `docs/migrations/0.2-to-0.3.md:3` |
| R5 | Release preflight summary is not actually review-gated before publish | medium/high | The runbook says to review the pack manifest before publish, but the summary and `npm publish` run in the same already-approved job. If this is meant as a human control, split preflight and publish into separate jobs. | `docs/release.md:23`, `.github/workflows/release.yml:120`, `.github/workflows/release.yml:160` |

## Confirmed Product/Code Defects

| id | title | severity | why it matters | references |
|----|-------|----------|----------------|------------|
| B1 | `initDialog` cleanup leaves per-open focus listeners alive | medium | A dialog opened before cleanup can still focus the old opener when later closed. That violates the public cleanup contract. Track/remove close listeners or use an `AbortController`. | `behaviors/dialog.js:32`, `behaviors/dialog.js:73`, `docs/stability.md:26` |
| B2 | Dynamic validated forms can keep `noValidate` after cleanup | medium | Forms added after init are set `noValidate = true` during submit/blur, but only forms present at init are snapshotted and restored. | `behaviors/forms.js:153`, `behaviors/forms.js:168`, `behaviors/forms.js:185`, `behaviors/forms.js:193` |
| B3 | `initLegend` accepts `role="button"` but only click-wires it | medium | The behavior treats role-button items as acceptable but does not add keyboard activation. Either require real `<button>` consistently or add tabindex plus Enter/Space handling. | `behaviors/legend.js:31`, `behaviors/legend.js:73`, `docs/legends.md:99` |
| B4 | `DelegateOpts` omits supported `root: null` | medium | Runtime and framework bindings use `root: null` as a no-op "scope requested but not ready" sentinel, but the generated type excludes it. | `behaviors/internal.js:20`, `behaviors/internal.d.ts:19` |
| B5 | Accent tint contrast is not gated where components use it as text | medium | `.ui-tag--accent` renders `--text-xs` text using `--accent-text` on `--accent-soft`. That pair is advisory-only in the contrast model and dark-mode docs already show it as weak. Promote contextual tint contrast to a real component gate or redesign the tag color pair. | `css/site.css:317`, `css/site.css:321`, `scripts/gen-contrast.mjs:140`, `docs/contrast.md:82` |
| B6 | Analytical CSS roll-up can silently empty under valid import syntax | medium | `build-dist` recognizes only `@import url(...)`; `check-exports` accepts string imports but only scans `core.css`. A valid `@import './x.css' layer(bronto)` in `analytical.css` can produce an empty roll-up and still pass. | `scripts/build-dist.mjs:29`, `scripts/build-dist.mjs:119`, `scripts/check-exports.mjs:44`, `scripts/check-exports.mjs:45` |
| B7 | `check:recipe-types` misses helper-backed unions | medium | Published unions such as badge/alert/meter tones are controlled by helper maps, but the checker only extracts inline `key === 'literal'` comparisons. Runtime and `.d.ts` can drift where helpers are used. | `scripts/check-recipe-types.mjs:41`, `classes/index.js:708`, `classes/index.js:815`, `classes/index.d.ts:624` |

## Documentation/Public Surface Drift

- `MIGRATIONS.json` ships and describes itself as machine-readable migration data, but it is not exported. `import('@ponchia/ui/MIGRATIONS.json', { with: { type: 'json' } })` fails with `ERR_PACKAGE_PATH_NOT_EXPORTED`, while `tokens.json` and `classes.json` resolve.
- README and architecture docs list JS subpaths but omit exported public entries: `/annotations`, `/connectors`, `/mermaid`, `/d2`, `/vega`, and related JSON paths.
- React/Solid/Qwik docs say there is a `useX` for each behavior but list only part of the exported hook surface.
- Some no-build/CDN docs use unpinned URLs or stale version examples despite pre-1.0 minor releases being breaking.
- Some HTML `<link>` snippets use bare package specifiers that only work in bundlers, while the reporting docs correctly warn that standalone HTML needs concrete CSS paths.
- `llms.txt` says `docs/architecture.md` is not shipped, but `package.json` includes and exports it.

## Security/Supply Chain

Overall posture is strong: zero runtime dependencies, explicit `files`, npm provenance, mostly least-privilege workflow permissions, SHA-pinned Actions, `npm audit` clean, no verified secret leaks, and CodeQL passed.

Hardening still worth doing:

- Move OIDC availability later in the release job or install with `npm ci --ignore-scripts`; the publish job grants `id-token: write` before `npm ci`, and the lockfile includes install-script packages such as `esbuild`.
- Enforce release tag ancestry against `main` before publish approval.
- Split publish preflight from publish if the manifest/size summary is intended as a human control.
- Consider self-hosting docs viewer dependencies instead of importing `marked`/`DOMPurify` from jsDelivr under a relaxed CSP.
- Tighten manual Pages deploy so a dispatched non-CI ref cannot publish the public demo/docs site unintentionally.

Scanner caveats:

- Checkov `CKV_GHA_7` on the CI `workflow_dispatch` boolean is likely a false positive; the input only enables extra browser coverage.
- Semgrep did not run because local `osemgrep` is a broken `mise` shim, not because of repo findings.

## Test-Credibility Gaps

- Known mobile overflow for `/demo/` and `/demo/version-history-report.html` is documented but excluded from the mobile overflow gate. These are public showcase surfaces, so either fix them or explicitly downgrade their public promise.
- Theme playground is mostly smoke-tested; it should assert that typed accent values update swatches, PASS/FAIL ratios, CSS output, DTCG output, and theme recomputation.
- Example browser smoke excludes Astro/Qwik and there is no Vue example despite README claiming broad framework compatibility including Vue.
- `marks.spec.mjs` has a vacuous `bareCount >= 0` assertion.
- Local visual snapshot runs are not portable by design. The docs explain this, but a convenient "run all non-pixel e2e locally" script would reduce confusion.

## Size/Architecture Pressure

- `dist/bronto.css` is at `89,420` raw / `15,421` gzip bytes against a hard `90,000` / `15,500` budget: only `580` raw and `79` gzip bytes remain.
- The latest pressure is the reporting dot family in `css/dots.css`, which is imported by core. Decide whether report-only dot primitives belong in core, move them to an opt-in analytical/report leaf, or deliberately raise the budget with a changelog note.
- CSS-only OLED/print palette overrides live outside the structured token/contrast model. They are carefully commented, but future token changes can leave those raw values stale while freshness checks still pass.

## AI-Slop Assessment

This does **not** read like AI slop. The package has real contract discipline:

- generated artifacts are committed and byte-checked;
- package exports and pack contents are gated;
- class registries, docs examples, behavior attributes, renderer configs, glyphs, chart palettes, skins, contrast docs, and dist files all have targeted checks;
- tests cover DOM behavior, SSR no-op paths, cleanup, a11y, visual baselines, forced colors, print, reduced motion, PDF export, token generation, and adapter parity;
- release workflows are reusable, SHA-pinned, permission-scoped, and provenance-aware.

The slop risk is instead **meta-slop**: a few gates have comments that sound stronger than what the code actually enforces. Fixing those gate-integrity holes will improve the repo more than broad rewrites.

## Refactor Order I Would Use

1. **Fix publish/check integrity first.** Create one build-artifact target, make the final publish path run generation before checks, assert full `.d.ts` emit, and centralize CSS import parsing for every bundled entrypoint.
2. **Fix behavior cleanup/type defects.** `initDialog`, dynamic form `noValidate`, legend role-button keyboard semantics, and `DelegateOpts root: null`.
3. **Promote component-context contrast gates.** Especially accent text on translucent accent tints where components render small text.
4. **Harden release workflow.** Separate preflight and publish, reduce OIDC exposure during install, enforce tag ancestry, and align runbook with actual workflow behavior.
5. **Regenerate docs from contracts where possible.** Public subpath lists, adapter hook inventories, migration index, and shipped-doc inventory should derive from package metadata or one local registry.
6. **Fix public demo coverage.** Remove mobile-overflow carve-outs or document the limitation honestly; add theme playground behavior tests.
7. **Address size pressure deliberately.** Move report-only dot primitives out of the default bundle or raise the default budget with explicit release notes.

## Bottom Line

Do not rewrite this project. It has a solid architecture and a high-quality quality gate culture. The right next work is a focused reliability pass: make the release/generation gates honest, fix the handful of behavior cleanup/a11y edge cases, and update docs/migration surfaces so public promises match the shipped API.
