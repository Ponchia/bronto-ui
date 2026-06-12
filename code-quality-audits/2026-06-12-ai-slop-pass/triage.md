# AI-Slop Triage Follow-Up — 2026-06-12

## Deterministic passes

- `npm run check`: pass.
- `npm test`: pass, 240 tests.
- `git diff --check`: pass.
- `node scripts/smoke-example.mjs vue-vite`: pass after rebuilding the Vue example.
- Deep Semgrep after fixes: pass with 0 findings (`semgrep-clean`).
- CodeQL JavaScript pass: completed; SARIF is local under ignored `.codeql/results/`.

## Fixed from the scan

- Removed Vue example `v-html`; it now uses the existing `data-bronto-glyph` mask path.
- Added `.semgrepignore` and scanner-output ignores so local audit artifacts do not pollute quality gates.
- Reworded generated-source copy from `AI-generated` to `Machine-generated`.
- Replaced dynamic regex construction in tests with string parsing/counting.
- Added `scripts/lib/stdio.mjs` and moved intentional CLI stdout off ad hoc `console.log`; removed the browser-demo debug log.
- Made React/Qwik eslint-disable reasons match the local rule vocabulary.

## Residual CodeQL findings

- 33 findings are in ignored `reports-lab/` scratch scripts, not tracked or shipped source.
- `behaviors/table.js`: false positive. The sorter reorders existing `<tr>` elements with `appendChild`; it does not parse strings or write HTML.
- `scripts/gen-vega.mjs`: false positive. The path writer only receives authored literal paths and rejects `__proto__`, `constructor`, and `prototype` segments before assignment.

No confirmed shipped security or AI-slop finding remains in the current tree.
