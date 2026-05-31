/**
 * Enforce: every runtime export of behaviors/index.js has a matching
 * declaration in behaviors/index.d.ts, and vice versa.
 *
 * Unlike classes/tokens (whose .d.ts is generated + drift-checked), the
 * behaviors .d.ts is hand-maintained — so a new `export function` could ship
 * with no types and nothing in `npm run check` would notice (exactly how
 * `initDotGlyph` first landed untyped). This closes that blind spot: a pure
 * name-parity gate, no TS parsing beyond the `export declare` surface.
 *
 * Run: node scripts/check-behaviors.mjs
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as runtime from '../behaviors/index.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dts = readFileSync(resolve(root, 'behaviors/index.d.ts'), 'utf8');
const errors = [];

// Runtime value exports (functions/consts) — what a consumer imports.
const runtimeNames = Object.keys(runtime).sort();

// This gate only understands inline `export declare function|const NAME`. The
// `export { … }` / `export default` forms would slip past the name regex and
// silently go blind, so refuse to vouch for a d.ts that uses them — fail loud
// rather than false-pass. (behaviors/index.d.ts uses only inline declarations.)
if (/^\s*export\s+(\{|default\b)/m.test(dts))
  errors.push(
    'behaviors/index.d.ts uses an `export {…}`/`export default` form that this name-parity gate cannot see — declare exports inline as `export declare function|const`, or extend check-behaviors.mjs',
  );

// Declared value exports in the .d.ts. `export declare function|const NAME`
// covers the value surface; `interface`/`type` are type-only and ignored.
const declared = new Set(
  [...dts.matchAll(/export declare (?:function|const)\s+(\w+)/g)].map((m) => m[1]),
);

for (const name of runtimeNames) {
  if (!declared.has(name))
    errors.push(
      `behaviors/index.js exports \`${name}\` but behaviors/index.d.ts does not declare it`,
    );
}
for (const name of declared) {
  if (!runtimeNames.includes(name))
    errors.push(
      `behaviors/index.d.ts declares \`${name}\` but behaviors/index.js does not export it`,
    );
}

if (errors.length) {
  console.error(`✖ ${errors.length} behaviors type-parity problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `✓ behaviors: all ${runtimeNames.length} runtime exports are declared in behaviors/index.d.ts`,
);
