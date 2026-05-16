/**
 * Enforce: docs/reference.md is the freshly generated artifact (run
 * scripts/gen-reference.mjs). Keeps the browsable reference from
 * drifting away from the class/token registries.
 *
 * Run: node scripts/check-reference.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generated } from './gen-reference.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

for (const [rel, expected] of Object.entries(generated)) {
  const abs = resolve(root, rel);
  if (!existsSync(abs)) errors.push(`${rel} missing — run: npm run reference:build`);
  else if (readFileSync(abs, 'utf8') !== expected)
    errors.push(`${rel} is stale — run: npm run reference:build`);
}

if (errors.length) {
  console.error(`✖ ${errors.length} reference problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('✓ docs/reference.md is the generated, in-sync class+token reference');
