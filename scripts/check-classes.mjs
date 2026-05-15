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
import { cls, ui } from '../classes/index.js';

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

// Every runtime `ui.*` recipe must be declared on the `Ui` interface in
// classes/index.d.ts — so the published TypeScript surface can't silently
// drift behind the JS (a real consumer-facing break otherwise).
const dts = readFileSync(resolve(root, 'classes/index.d.ts'), 'utf8');
const declared = new Set([...dts.matchAll(/^\s*(\w+)\s*\(opts\?:/gm)].map((m) => m[1]));
for (const name of Object.keys(ui)) {
  if (!declared.has(name)) {
    errors.push(`ui.${name}() exists in classes/index.js but is not declared on Ui in classes/index.d.ts`);
  }
}

if (errors.length) {
  console.error(`✖ ${errors.length} class-contract problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`✓ class contract: ${inManifest.size} classes match the stylesheet`);
