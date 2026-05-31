/**
 * Gate for the opt-in Tier-4 data-viz palette.
 *
 *  1. DRIFT — css/dataviz.css, tokens/charts.json, tokens/charts.d.ts are
 *     exactly what gen-charts.mjs emits from tokens/charts.js.
 *  2. SHAPE — categorical has CHART_CATEGORICAL entries, series 1 is the live
 *     accent, the sequential ramp is monotonic in OKLCH lightness.
 *  3. DISTINGUISHABILITY — every pair of categorical series is perceptibly
 *     distinct (OKLab ΔE ≥ THRESHOLD) under NORMAL vision AND simulated
 *     protanopia / deuteranopia / tritanopia (Machado 2009, severity 1.0), and
 *     every series is distinct from the theme background. Colour is never the
 *     sole signal — the `--chart-pattern-*` fills are the mandated second
 *     channel — but the palette must still not collapse for a colourblind viewer.
 *  4. OPT-IN — css/dataviz.css is not imported by css/core.css.
 *
 * Run: node scripts/check-charts.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generated, resolveColor } from './gen-charts.mjs';
import { charts, ACCENT, CHART_CATEGORICAL } from '../tokens/charts.js';
import { deltaOklab } from './lib/oklch.mjs';
import { buildResolved } from './gen-resolved.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

// Min perceptible ΔE (OKLab) between two categorical series, incl. under CVD.
// Calibrated to the shipped palette's worst pair (~0.076) with margin; the
// pattern fills are the backstop for close-but-passing pairs.
const PAIR_THRESHOLD = 0.05;
const BG_THRESHOLD = 0.06;

// --- 1. Drift -----------------------------------------------------------------
for (const [rel, expected] of Object.entries(generated)) {
  const abs = resolve(root, rel);
  if (!existsSync(abs)) errors.push(`${rel} missing — run: npm run charts:build`);
  else if (readFileSync(abs, 'utf8') !== expected)
    errors.push(`${rel} is stale — run: npm run charts:build`);
}

// --- 2. Shape -----------------------------------------------------------------
const oklchL = (s) => {
  const m = /oklch\(\s*([\d.]+)%/.exec(s);
  return m ? Number.parseFloat(m[1]) : null;
};
for (const theme of ['light', 'dark']) {
  const c = charts[theme];
  if (c.categorical.length !== CHART_CATEGORICAL)
    errors.push(`${theme}: categorical has ${c.categorical.length}, expected ${CHART_CATEGORICAL}`);
  if (c.categorical[0] !== ACCENT)
    errors.push(`${theme}: categorical[0] must be the accent (${ACCENT})`);
  const Ls = c.sequential.map(oklchL);
  if (Ls.some((l) => l == null))
    errors.push(`${theme}: sequential must be oklch() with a % lightness`);
  else {
    const inc = Ls.every((l, i) => i === 0 || l > Ls[i - 1]);
    const dec = Ls.every((l, i) => i === 0 || l < Ls[i - 1]);
    if (!inc && !dec)
      errors.push(`${theme}: sequential ramp is not monotonic in lightness (${Ls.join(', ')})`);
  }
}

// --- 3. Distinguishability (normal + CVD) ------------------------------------
const resolved = buildResolved();
const hexToRgb = (h) => {
  h = h.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
// Machado 2009 severity-1.0 CVD matrices, applied in linear sRGB.
const CVD = {
  protan: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deutan: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritan: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};
const lin = (c) => (c / 255 <= 0.04045 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4);
const delin = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055) * 255;
const simulate = (rgb, type) => {
  if (type === 'normal') return rgb;
  const m = CVD[type];
  const [r, g, b] = rgb.map(lin);
  return [0, 1, 2].map((i) =>
    Math.max(0, Math.min(255, delin(m[i][0] * r + m[i][1] * g + m[i][2] * b))),
  );
};

for (const theme of ['light', 'dark']) {
  const cat = charts[theme].categorical.map((v) => hexToRgb(resolveColor(v, theme)));
  const bg = hexToRgb(resolved[theme]['--bg']);
  for (const vision of ['normal', 'protan', 'deutan', 'tritan']) {
    const sim = cat.map((c) => simulate(c, vision));
    for (let i = 0; i < sim.length; i++) {
      for (let j = i + 1; j < sim.length; j++) {
        const d = deltaOklab(sim[i], sim[j]);
        if (d < PAIR_THRESHOLD)
          errors.push(
            `${theme}/${vision}: series ${i + 1} & ${j + 1} collide (ΔE ${d.toFixed(3)} < ${PAIR_THRESHOLD}) — colourblind-unsafe`,
          );
      }
    }
  }
  // Each series visible against the theme background (normal vision).
  cat.forEach((c, i) => {
    const d = deltaOklab(c, bg);
    if (d < BG_THRESHOLD)
      errors.push(
        `${theme}: series ${i + 1} barely differs from --bg (ΔE ${d.toFixed(3)} < ${BG_THRESHOLD})`,
      );
  });
}

// --- 4. Opt-in ----------------------------------------------------------------
if (/dataviz\.css/.test(readFileSync(resolve(root, 'css/core.css'), 'utf8')))
  errors.push(
    'css/core.css imports dataviz.css — the data-viz palette must stay opt-in, out of the default bundle',
  );

if (errors.length) {
  console.error(`✖ ${errors.length} data-viz palette problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `✓ data-viz: ${CHART_CATEGORICAL} categorical series distinguishable under normal + protan/deutan/tritan, ramps monotonic, opt-in`,
);
