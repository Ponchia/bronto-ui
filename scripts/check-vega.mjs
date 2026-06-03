/**
 * Gate for the opt-in Vega-Lite / Vega theme config (tokens/vega.{js,json,d.ts}).
 *
 *  1. DRIFT — the three generated files are exactly what gen-vega.mjs emits from
 *     the current token source.
 *  2. COVERAGE — both themes provide every path in REQUIRED_PATHS (the surface we
 *     commit to in docs/vega.md). A dropped slot fails CI.
 *  3. PARITY — light and dark expose the identical leaf-path set.
 *  4. RESOLVABILITY — no value contains an unresolved `var(...)` (Vega bakes
 *     colours into the SVG/canvas scene and cannot read CSS vars), every
 *     colour-valued slot is a real hex/rgb(a) colour, and every `range.*` ramp is
 *     a non-empty array of resolved colours. This is what makes "theme Vega from
 *     bronto tokens" a backed claim rather than an assertion.
 *
 * Structural only — it does NOT render with Vega, so the `check` gate takes on no
 * Vega dependency. The headless render-probe (test/vega-render.test.mjs) proves
 * the foreign slot→element mapping using the dev-only vega/vega-lite deps.
 *
 * Run: node scripts/check-vega.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildGenerated, REQUIRED_PATHS, isFontPath } from './gen-vega.mjs';
import { CSS_COLOR as COLOR } from './lib/patterns.mjs';
import { freshnessErrors } from './lib/assert-fresh.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const generated = await buildGenerated();

// --- 1. Drift ---------------------------------------------------------------
errors.push(...freshnessErrors(generated, 'npm run vega:build'));

// Flatten a config object to [dottedPath, value] leaves. Arrays (the `range.*`
// ramps) are leaves, not recursed — a ramp is one slot's value.
function leaves(obj, prefix = '') {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) out.push(...leaves(v, path));
    else out.push([path, v]);
  }
  return out;
}

// --- 2/3/4. Coverage, parity, resolvability ---------------------------------
const themes = JSON.parse(readFileSync(resolve(root, 'tokens/vega.json'), 'utf8'));
const pathsOf = (t) =>
  leaves(themes[t])
    .map(([p]) => p)
    .sort();
const lightPaths = pathsOf('light');
const darkPaths = pathsOf('dark');

if (lightPaths.join() !== darkPaths.join())
  errors.push('light and dark expose different config leaf paths (parity)');

const checkColor = (theme, path, val) => {
  if (typeof val !== 'string')
    return errors.push(`${theme}.${path}: "${val}" is not a colour string`);
  if (val.includes('var('))
    errors.push(`${theme}.${path}: unresolved "${val}" — Vega cannot read var()`);
  else if (!COLOR.test(val)) errors.push(`${theme}.${path}: "${val}" is not a resolved colour`);
};

for (const theme of ['light', 'dark']) {
  const flat = Object.fromEntries(leaves(themes[theme]));
  for (const path of REQUIRED_PATHS)
    if (!(path in flat)) errors.push(`${theme}: missing required config slot "${path}"`);

  for (const [path, val] of Object.entries(flat)) {
    if (isFontPath(path)) {
      if (typeof val !== 'string' || val.includes('var('))
        errors.push(`${theme}.${path}: font "${val}" must be a resolved string with no var()`);
    } else if (Array.isArray(val)) {
      if (!val.length) errors.push(`${theme}.${path}: empty range ramp`);
      val.forEach((c, i) => checkColor(theme, `${path}[${i}]`, c));
    } else {
      checkColor(theme, path, val);
    }
  }
}

if (errors.length) {
  console.error(`✖ ${errors.length} Vega theme-config problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `✓ vega: ${REQUIRED_PATHS.length} config slots, both themes, every colour resolved, range.* ramps populated, no var() leaks`,
);
