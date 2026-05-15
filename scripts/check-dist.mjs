/**
 * Enforce: dist/ is the freshly built, in-budget artifact of css/.
 *
 *  - Rebuilds the bundles in memory and byte-compares them to the
 *    committed files (so dist can't drift from source — same contract
 *    as check-tokens for tokens.json).
 *  - Asserts each bundle is within the raw + gzip size budget.
 *
 * Run: node scripts/check-dist.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildBundles, BUDGET, sizes } from './build-dist.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

for (const [rel, expected] of Object.entries(buildBundles())) {
  const abs = resolve(root, rel);
  if (!existsSync(abs)) {
    errors.push(`${rel} missing — run: npm run dist:build`);
    continue;
  }
  if (readFileSync(abs, 'utf8') !== expected) {
    errors.push(`${rel} is stale — run: npm run dist:build`);
    continue;
  }
  const s = sizes(expected);
  if (s.raw > BUDGET.raw) errors.push(`${rel} raw ${s.raw}B over budget ${BUDGET.raw}B`);
  if (s.gzip > BUDGET.gzip) errors.push(`${rel} gzip ${s.gzip}B over budget ${BUDGET.gzip}B`);
}

if (errors.length) {
  console.error(`✖ ${errors.length} dist problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('✓ dist/ is the fresh, in-budget build of css/');
