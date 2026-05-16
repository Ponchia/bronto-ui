/**
 * Enforce: classes/index.d.ts and tokens/index.d.ts are the freshly
 * generated artifacts (run scripts/gen-dts.mjs). Keeps the literal
 * public types from drifting away from the JS runtime.
 *
 * Run: node scripts/check-dts.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generated } from './gen-dts.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

for (const [rel, expected] of Object.entries(generated)) {
  const abs = resolve(root, rel);
  if (!existsSync(abs)) errors.push(`${rel} missing — run: npm run dts:build`);
  else if (readFileSync(abs, 'utf8') !== expected)
    errors.push(`${rel} is stale — run: npm run dts:build`);
}

if (errors.length) {
  console.error(`✖ ${errors.length} d.ts problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('✓ classes/index.d.ts and tokens/index.d.ts are the generated, in-sync artifacts');
