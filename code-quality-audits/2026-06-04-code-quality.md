# Code-Quality & Architecture Audit — 2026-06-04

**Headline:** @ponchia/ui is a healthy, unusually disciplined CSS-first library — zero confirmed shipped defects, zero dead code, avg CCN 1.8 — and the only worthwhile work is one trivial dedup plus a few latent symmetry gates; everything else is taste or refuted tool noise.

**Health:** healthy

## Measured by

- **loc-complexity**: ran → `/tmp/claude-501/loc-complexity/results/bronto-ui/20260604-202621/report.md`
- **dead-code**: ran → `/tmp/claude-501/dead-code/results/bronto-ui/20260604-202621/report.md`
- **semgrep**: ran → `/tmp/claude-501/code-audit/semgrep/semgrep.json`
- **codeql**: ran → `/tmp/claude-501/code-audit/codeql/javascript.sarif`

Tooling summary: tokei = 40,404 code LOC; lizard = 1,431 functions, avg CCN 1.8, only 3 functions >15 (all essential ARIA/keyboard/render handlers in `behaviors/`). knip = zero unused files/exports/deps. semgrep = 51 hits, ALL verified false positives (local devtools rules only; zero registry-security hits). CodeQL = 22 warnings, ALL either unshipped `reports-lab/` CLI scripts or 2 verified shipped-code false positives. Net: clean security posture, no dead code, no complexity knots.

## Do now

| id | title | kind | severity | effort | raised-by | rationale |
|----|-------|------|----------|--------|-----------|-----------|
| Q1 | `writeAll()` in `scripts/lib/artifacts.mjs` reimplements `writeGenerated()` + re-derives `repoRoot` | duplication | nit | trivial | architecture, io-and-boundaries, complexity, ai-slop, best-practices, roi | Verified: `artifacts.mjs:46-51` is a byte-identical copy of `emit.mjs:22-27` and `:31` re-derives the `repoRoot` that `emit.mjs:13` already exports. One-import change, output byte-identical (guarded by `check:fresh`), zero risk. It's the exact straggler the Q11/Q12 dedup pass intended to remove — close it. |

## Do later

| id | title | kind | severity | effort | raised-by | rationale |
|----|-------|------|----------|--------|-----------|-----------|
| Q2 | No inverse gate that every shippable CSS leaf has BOTH `./css/<leaf>.css` and `./css/unlayered/<leaf>.css` export keys | best-practice | minor | small | architecture, correctness-risk, complexity, ai-slop, best-practices, roi | `check-exports.mjs:31-60` is one-directional; `check-dist.mjs:33` error text says "plus an exports entry" but nothing enforces it. A leaf added to `EXTRA_LEAVES`+dist but forgotten in `pkg.exports` would build, ship a dist file, pass `check`, yet be unreachable via subpath import. Latent only — counts are in sync today (41 layered / 39 unlayered, +2 rollups) — so not urgent, but it converts the documented ~13-touchpoint hand-checklist into a structural gate, matching the repo's own `check-chain` philosophy. ~15 lines; `build-dist` already owns the canonical leaf list. |
| Q3 | `render-pdf.mjs` can leak a Chromium process if a render throws mid-loop | error-handling | minor | trivial | core-logic(io), error-handling, complexity, ai-slop, best-practices, roi | `render-pdf.mjs:58` launches, `:80` closes only after the loop succeeds; no try/finally around `page.goto`/`page.pdf`. Real, but it's a dev/CI-only helper NOT in `package.json` `files`, and a crashed Node process is reaped by the OS — cleanliness, not a shipped defect. Worth a 3-line try/finally only when this file is next touched; do not open a standalone PR. |

## Considered and deliberately NOT doing

- **Binding/behavior hook-parity gate (REFUTED).** Multiple reviewers flagged "no gate enforces react/solid/qwik parity with the behaviors barrel" — but `test/bindings.test.mjs:204` already DERIVES `expectedHooks` from the barrel and asserts each binding matches (verified). The invariant is enforced and fails loudly in CI; the finding only grepped `scripts/check-*.mjs` and missed the unit test. Adding a `check:*` gate would duplicate an existing test. No action.
- **Extract the react/solid/qwik `resolveMaybe/resolveRoot/resolveOpts` trio into a shared module (low-ROI, skip).** Real duplication (react/solid byte-identical; qwik adds a signal `value` branch), but memory records a prior `binding-resolver dedup (rejected)` decision, the helpers are ~20 lines × 2, frozen, and test-covered. Threading a shared module through 3 published peerDep entrypoints exceeds the payoff. Revisit only if a binding is edited anyway.
- **`*:build` → `prepack` symmetric meta-gate (low-ROI, defer).** Completes the symmetry `check-chain.mjs` prizes, but freshness artifacts are already caught by `check:fresh` and dist by `check:dist`; only a future bespoke-gated generator could slip. Defer unless adding such a generator.
- **3 functions with CCN>15 — `initCombobox` (20), `initCarousel` (19), `initDotGlyph` (17) (REFUTED/taste).** Irreducible WAI-ARIA keyboard/render/teardown widgets, each documented with APG rationale and covered in depth (e.g. `behaviors.test.mjs:798-932`). The lizard `FAIL(exit 1)` is a `>15` threshold artifact, not a tool error. Splitting them would scatter load-bearing a11y logic — leave as-is.
- **`spark.spec.mjs:23` weak `toBeTruthy` (taste/trivial).** `expect(label && label.trim().length).toBeTruthy()` vs the suite's exact-value norm. The `&&` short-circuit still fails on a null/blank label, so it is not a coverage hole. Polish to `expect((label ?? '').trim().length).toBeGreaterThan(0)` only while touching the file.
- **`docs/frontier-primitives.md` is a churning status ledger pitched as "the thesis" (taste, opportunistic).** README links it as the thesis but it is NOT in `package.json` `files`, so it never ships — only repo browsers hit it, blunting the "external readers land on stale churn" harm. If editing docs anyway, split the evergreen boundary thesis (lines ~1-48) from the per-candidate shipped/deferred ledger (move to ROADMAP/CHANGELOG). No structural payoff.
- **README rationed-accent thesis stated twice / usage.md silent-no-op caveat stated 3× (taste, skip).** Deliberate brand vocabulary and standalone-readable reference caveats per the docs analyzer's own strengths; the README "rationed×6" claim was inflated (actual ×2). Consolidating trades skimmability for line count.
- **All semgrep + CodeQL hits (REFUTED).** 51 semgrep = local-rule FPs (CLI `console.log`, `eslint-disable` lines that DO carry `-- reason`, "Claude"/"AI-generated" in `.gitignore` + product UI text). 22 CodeQL = unshipped `reports-lab/` CLI path-injection + 2 verified shipped FPs (`table.js:106` trusted `<tr>` reparenting; `gen-vega.mjs:124` `setPath` already guards `UNSAFE_KEY`). Zero confirmed exploitable defects. No action — do not suppress legitimate CLI output or product text.

## What the codebase does well

- **Single source-of-truth pipeline, mechanically enforced.** `tokens/index.js` is the sole authored source; `tokens.css`/`index.json`/`dtcg`/`resolved`/`d.ts` are all generated and byte-compared against committed mirrors via one flat registry (`scripts/lib/artifacts.mjs`) + `check:fresh`. No derived artifact has two owners.
- **Clean, acyclic, downward-only dependency graph.** `behaviors → {glyphs, connectors}`, `annotations → connectors`; no cycles, no sideways edges, behaviors import only `./internal.js`. The connectors geometry kernel is genuinely reused and a previously-diverged local clamp was deliberately deduped.
- **Complexity is honest and contained.** avg CCN 1.8; the 3 hotspots are essential ARIA widgets with documented rationale, sharing centralized kernels (`wrapIndex`, `focusInto`, `collectHosts`, `bindOnce`, `resolveHost`) in `internal.js` rather than copy-pasting.
- **Load-bearing defensiveness, not slop.** Every try/catch carries a comment and a real fallback (localStorage private-mode, native-popover already-hidden, `scrollIntoView` in jsdom); idempotency centralized in `bindOnce()` with a Symbol registry; `progTimer?.unref?.()` so timers don't pin a Node test process; precise teardown (forms restores `noValidate`, glyph restores every mutated attr/style, modal un-inerts exactly what it inerted). Zero empty/silent catches repo-wide.
- **Boundary hardening.** `safePath` (serve.mjs) has strict traversal containment with a sibling-prefix guard and is unit-test-exported; `render-pdf` parseArgs documents an off-by-one; `emit-theme.mjs` wraps untrusted JSON with a structured per-location error.
- **Strong meta-gating.** `check-chain.mjs` structurally guarantees every `check:*` is wired into the aggregate chain; `check:contract` proves documented `init*()` names/attrs/custom-properties/class-bases resolve against real source (closing the "validates but no-ops for an LLM" class); `test/bindings.test.mjs` derives binding parity so it cannot go stale.
- **Test suite catches real breakage.** 481 `assert.equal` vs 112 `assert.ok`; OKLCH monotonicity, colorblind separation (Machado 2009 matrices), injection sanitization tested as real properties; disciplined per-test JSDOM teardown; near-flake-free e2e (2 post-interaction `waitForTimeout` across 30 specs, gated CI retries, `data-demo-ready` signal); executable architecture guardrails scan source for forbidden imports.
- **CI/CD is lean-SOTA.** Reusable `e2e`/`examples` `workflow_call` shared by CI + release; single aggregating `ci-gate` required check; SHA-pinned actions, least-privilege permissions, Environment-gated npm publish with `--ignore-scripts`; docs-only fast-path fails safe.
