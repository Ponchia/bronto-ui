/**
 * Shared drift-gate helper for the pure generated-artifact freshness checks
 * (check-dts / check-reference / check-vscode-data / check-resolved /
 * check-dtcg). Each of those asserts the same invariant: the committed file
 * is byte-identical to what its generator produces right now. The per-gate
 * domain logic lives in the generators; this is only the compare-and-report
 * frame they all share.
 *
 * Gates with extra logic (a parser, a budget, CVD/contrast math) keep their
 * own bodies — this helper is deliberately just the freshness frame.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * Assert every committed artifact equals its freshly-generated content.
 *
 * @param {Record<string, string>} artifacts repo-relative path → expected (generated) string
 * @param {{ label: string, buildHint: string }} opts
 *   `label` is printed on success and in the failure header; `buildHint` is the
 *   command suggested for each stale/missing file (e.g. `npm run dts:build`).
 */
export function assertFresh(artifacts, { label, buildHint }) {
  const errors = [];
  for (const [rel, expected] of Object.entries(artifacts)) {
    const abs = resolve(root, rel);
    if (!existsSync(abs)) errors.push(`${rel} missing — run: ${buildHint}`);
    else if (readFileSync(abs, 'utf8') !== expected)
      errors.push(`${rel} is stale — run: ${buildHint}`);
  }

  if (errors.length) {
    console.error(`✖ ${errors.length} ${label} problem(s):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`✓ ${label}`);
}
