/**
 * Gate for the opt-in Mermaid theme map (tokens/mermaid.{js,json,d.ts}).
 *
 *  1. DRIFT — the three generated files are exactly what gen-mermaid.mjs emits
 *     from the current token source.
 *  2. COVERAGE — both themes provide every key in REQUIRED_KEYS (the surface we
 *     commit to in docs/mermaid.md). A dropped key fails CI.
 *  3. PARITY — light and dark expose the identical key set.
 *  4. RESOLVABILITY — no value contains an unresolved `var(...)` (Mermaid's
 *     theming engine can't read CSS vars), and every colour-valued key is a real
 *     hex/rgb(a) colour. This is what makes "theme Mermaid from bronto tokens" a
 *     backed claim rather than an assertion.
 *
 * Structural only — it does NOT render with Mermaid, so the repo takes on no
 * mermaid dependency. Run: node scripts/check-mermaid.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildGenerated, REQUIRED_KEYS, NON_COLOR_KEYS } from './gen-mermaid.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const generated = await buildGenerated();

// A resolved colour: #rgb/#rgba/#rrggbb/#rrggbbaa, or rgb()/rgba().
const COLOR = /^(#[0-9a-f]{3,8}|rgba?\([^)]+\))$/i;

// --- 1. Drift ---------------------------------------------------------------
for (const [rel, expected] of Object.entries(generated)) {
  const abs = resolve(root, rel);
  if (!existsSync(abs)) errors.push(`${rel} missing — run: npm run mermaid:build`);
  else if (readFileSync(abs, 'utf8') !== expected)
    errors.push(`${rel} is stale — run: npm run mermaid:build`);
}

// --- 2/3/4. Coverage, parity, resolvability ---------------------------------
const themes = JSON.parse(readFileSync(resolve(root, 'tokens/mermaid.json'), 'utf8'));
const lightKeys = Object.keys(themes.light).sort();
const darkKeys = Object.keys(themes.dark).sort();

if (lightKeys.join() !== darkKeys.join())
  errors.push('light and dark expose different themeVariable keys (parity)');

for (const theme of ['light', 'dark']) {
  const vars = themes[theme];
  for (const key of REQUIRED_KEYS)
    if (!(key in vars)) errors.push(`${theme}: missing required themeVariable "${key}"`);

  if (typeof vars.darkMode !== 'boolean' || vars.darkMode !== (theme === 'dark'))
    errors.push(`${theme}: darkMode must be ${theme === 'dark'}`);

  for (const [key, val] of Object.entries(vars)) {
    if (key === 'darkMode') continue;
    if (typeof val === 'string' && val.includes('var('))
      errors.push(`${theme}.${key}: unresolved "${val}" — Mermaid cannot read var()`);
    else if (!NON_COLOR_KEYS.has(key) && !(typeof val === 'string' && COLOR.test(val)))
      errors.push(`${theme}.${key}: "${val}" is not a resolved colour`);
  }
}

if (errors.length) {
  console.error(`✖ ${errors.length} Mermaid theme-map problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `✓ mermaid: ${REQUIRED_KEYS.length} base themeVariables, both themes, every value resolved to a colour, no var() leaks`,
);
