/**
 * Gate for the opt-in legend layer (css/legend.css).
 *
 *  1. OPT-IN — css/legend.css is not imported by css/core.css (a data key is
 *     meaningful only beside a chart; it never taxes the default bundle).
 *  2. PALETTE SUBSET — every concrete `var(--chart-N)` / `--chart-seq-N` /
 *     `--chart-div-N` the legend references is a real series in
 *     tokens/charts.js. A swatch can never key a colour the palette doesn't
 *     define (catches `--chart-9`, an off-by-one ramp stop, a typo).
 *  3. INDEX COVERAGE — there is exactly one `.ui-legend__swatch--N` index
 *     helper per categorical series, each mapped to its matching `--chart-N`.
 *     Grow the palette and this reminds you to grow (or shrink) the legend.
 *  4. TOKEN-ONLY COLOUR — a swatch colour is only ever set from a `--chart-*`
 *     token (never a raw hex/rgb), mirroring the colour-policy tier.
 *
 *  Deliberately NOT enforced (the legend's text label is itself the non-colour
 *  channel — WCAG 1.4.1): patterns are available, not mandatory. A swatch
 *  mirrors its chart mark; the author pairs `--chart-pattern-*` only where the
 *  mark is patterned.
 *
 * Run: node scripts/check-legend.mjs
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { charts, CHART_CATEGORICAL } from '../tokens/charts.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

const raw = readFileSync(resolve(root, 'css/legend.css'), 'utf8');
// Strip comments first: a token named only in prose must not satisfy the gate
// (same posture as check-classes/build-dist).
const css = raw.replace(/\/\*[\s\S]*?\*\//g, '');

const SEQ = charts.light.sequential.length;
const DIV = charts.light.diverging.length;

// --- 1. Opt-in ----------------------------------------------------------------
if (/legend\.css/.test(readFileSync(resolve(root, 'css/core.css'), 'utf8')))
  errors.push('css/core.css imports legend.css — the legend layer must stay opt-in');

// --- 2. Palette subset --------------------------------------------------------
// Author-set / consumption vars that aren't series tokens themselves.
const CONSUMPTION = new Set([
  'chart-color',
  'chart-pattern',
  'chart-pattern-size',
  'chart-pattern-ink',
]);
for (const m of css.matchAll(/var\(\s*--(chart-[\w-]+)/g)) {
  const name = m[1];
  if (CONSUMPTION.has(name)) continue;
  let ok = false;
  let mm;
  if ((mm = /^chart-(\d+)$/.exec(name))) ok = +mm[1] >= 1 && +mm[1] <= CHART_CATEGORICAL;
  else if ((mm = /^chart-seq-(\d+)$/.exec(name))) ok = +mm[1] >= 1 && +mm[1] <= SEQ;
  else if ((mm = /^chart-div-(\d+)$/.exec(name))) ok = +mm[1] >= 1 && +mm[1] <= DIV;
  if (!ok) errors.push(`legend.css references var(--${name}), not a token in tokens/charts.js`);
}

// --- 3. Index coverage --------------------------------------------------------
for (let n = 1; n <= CHART_CATEGORICAL; n++) {
  const re = new RegExp(
    `\\.ui-legend__swatch--${n}\\s*\\{[^}]*--chart-color:\\s*var\\(--chart-${n}\\)`,
  );
  if (!re.test(css))
    errors.push(`.ui-legend__swatch--${n} is missing or not mapped to var(--chart-${n})`);
}
for (const m of css.matchAll(/\.ui-legend__swatch--(\d+)/g)) {
  if (+m[1] > CHART_CATEGORICAL)
    errors.push(
      `.ui-legend__swatch--${m[1]} has no matching series (CHART_CATEGORICAL=${CHART_CATEGORICAL})`,
    );
}

// --- 4. Token-only colour -----------------------------------------------------
for (const m of css.matchAll(/--chart-color:\s*([^;}]+)/g)) {
  const val = m[1].trim();
  if (!val.startsWith('var('))
    errors.push(
      `--chart-color set to non-token value "${val}" — legend colours must come from --chart-* tokens`,
    );
}

if (errors.length) {
  console.error(`✖ ${errors.length} legend problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `✓ legend: ${CHART_CATEGORICAL} swatch index helpers map to the palette, all --chart-* refs valid, token-only colour, opt-in`,
);
