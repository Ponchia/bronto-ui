/**
 * Enforce: classes/vscode.css-custom-data.json is the freshly generated
 * artifact (run scripts/gen-vscode-data.mjs). Keeps editor token
 * IntelliSense from drifting away from the token registry.
 *
 * Run: node scripts/check-vscode-data.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generated } from './gen-vscode-data.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

for (const [rel, expected] of Object.entries(generated)) {
  const abs = resolve(root, rel);
  if (!existsSync(abs)) errors.push(`${rel} missing — run: npm run vscode:build`);
  else if (readFileSync(abs, 'utf8') !== expected)
    errors.push(`${rel} is stale — run: npm run vscode:build`);
}

if (errors.length) {
  console.error(`✖ ${errors.length} vscode-data problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('✓ classes/vscode.css-custom-data.json is the generated, in-sync token data');
