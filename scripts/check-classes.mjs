/**
 * Enforce: every class in classes/index.js `cls` exists as a selector
 * in the stylesheet, and every `.ui-*` selector in the stylesheet is
 * represented in `cls`. Recipes only emit from `cls`, so this keeps the
 * typed contract and the CSS from drifting in either direction.
 *
 * Run: node scripts/check-classes.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cls } from '../classes/index.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cssDir = resolve(root, 'css');

const inCss = new Set();
for (const f of readdirSync(cssDir)) {
  if (!f.endsWith('.css')) continue;
  const src = readFileSync(resolve(cssDir, f), 'utf8');
  for (const m of src.matchAll(/\.(ui-[\w-]+)/g)) inCss.add(m[1]);
}

const inManifest = new Set(Object.values(cls));
const errors = [];

for (const name of inManifest) {
  if (!inCss.has(name)) errors.push(`cls has "${name}" but no .${name} selector exists in css/`);
}
for (const name of inCss) {
  if (!inManifest.has(name)) errors.push(`css defines .${name} but it is missing from cls`);
}

if (errors.length) {
  console.error(`✖ ${errors.length} class-contract problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`✓ class contract: ${inManifest.size} classes match the stylesheet`);
