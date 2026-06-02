/**
 * Gate for the opt-in D2 theme map (tokens/d2.{js,json,d.ts}).
 *
 *  1. DRIFT — the three generated files are exactly what gen-d2.mjs emits from
 *     the current token source.
 *  2. COVERAGE — both themes provide every D2 colour slot in REQUIRED_KEYS.
 *  3. PARITY — light and dark expose the identical slot set.
 *  4. RESOLVABILITY — no value contains an unresolved `var(...)` (D2 compiles to
 *     a frozen SVG and can't read CSS vars), and every slot is a real hex/rgb(a)
 *     colour.
 *
 * Structural only — it does NOT render with D2, so the repo takes on no D2
 * dependency. Run: node scripts/check-d2.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildGenerated, REQUIRED_KEYS } from './gen-d2.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const generated = await buildGenerated();

const COLOR = /^(#[0-9a-f]{3,8}|rgba?\([^)]+\))$/i;

// --- 1. Drift ---------------------------------------------------------------
for (const [rel, expected] of Object.entries(generated)) {
  const abs = resolve(root, rel);
  if (!existsSync(abs)) errors.push(`${rel} missing — run: npm run d2:build`);
  else if (readFileSync(abs, 'utf8') !== expected)
    errors.push(`${rel} is stale — run: npm run d2:build`);
}

// --- 2/3/4. Coverage, parity, resolvability ---------------------------------
const themes = JSON.parse(readFileSync(resolve(root, 'tokens/d2.json'), 'utf8'));
const lightKeys = Object.keys(themes.light).sort();
const darkKeys = Object.keys(themes.dark).sort();

if (lightKeys.join() !== darkKeys.join())
  errors.push('light and dark expose different D2 slots (parity)');

for (const theme of ['light', 'dark']) {
  const slots = themes[theme];
  for (const key of REQUIRED_KEYS)
    if (!(key in slots)) errors.push(`${theme}: missing required D2 slot "${key}"`);

  for (const [key, val] of Object.entries(slots)) {
    if (typeof val === 'string' && val.includes('var('))
      errors.push(`${theme}.${key}: unresolved "${val}" — D2 cannot read var()`);
    else if (!(typeof val === 'string' && COLOR.test(val)))
      errors.push(`${theme}.${key}: "${val}" is not a resolved colour`);
  }
}

if (errors.length) {
  console.error(`✖ ${errors.length} D2 theme-map problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `✓ d2: ${REQUIRED_KEYS.length} theme slots, both themes, every value resolved to a colour, no var() leaks`,
);
