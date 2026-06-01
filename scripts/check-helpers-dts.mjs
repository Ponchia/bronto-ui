/**
 * Name-parity gate for the hand-maintained geometry helper modules
 * (annotations/, connectors/): every runtime `export function|const` has a
 * matching `export declare function|const` in the sibling index.d.ts, and vice
 * versa. These .d.ts are curated (not generated), so without this gate a new
 * helper could ship untyped, or a declaration could outlive its runtime — the
 * same drift `check-bindings`/`check-dts` close for the other layers.
 *
 * Source-parsed (no import) so it needs no build step. Type-only exports
 * (`export interface`/`export type`) are intentionally ignored. This checks
 * export *names* only — not parameter/return signatures (tsc on
 * test/types.test-d.ts exercises the actual call shapes).
 *
 * Run: node scripts/check-helpers-dts.mjs
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

const VALUE_EXPORT = /export\s+(?:declare\s+)?(?:function|const)\s+(\w+)/g;
const names = (src) => new Set([...src.matchAll(VALUE_EXPORT)].map((m) => m[1]));

for (const mod of ['annotations', 'connectors']) {
  const js = names(readFileSync(resolve(root, `${mod}/index.js`), 'utf8'));
  const dts = names(readFileSync(resolve(root, `${mod}/index.d.ts`), 'utf8'));
  for (const n of js)
    if (!dts.has(n))
      errors.push(`${mod}/index.js exports \`${n}\` but ${mod}/index.d.ts does not declare it`);
  for (const n of dts)
    if (!js.has(n))
      errors.push(`${mod}/index.d.ts declares \`${n}\` but ${mod}/index.js does not export it`);
  if (js.size === 0)
    errors.push(`${mod}/index.js exports no functions — parser bug or empty module`);
}

if (errors.length) {
  console.error(`✖ ${errors.length} helper type-parity problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('✓ helpers: annotations/ and connectors/ exports ⇄ their .d.ts declarations match');
