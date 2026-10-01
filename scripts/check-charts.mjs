/**
 * Gate for the opt-in Tier-4 categorical + data-viz palette.
 *
 *  1. DRIFT — css/dataviz.css, tokens/charts.json, tokens/charts.d.ts are
 *     exactly what gen-charts.mjs emits from tokens/charts.js.
 *  2. SHAPE — CHART_CATEGORICAL categorical slots with one hue name each; the
 *     sequential ramp is one hue, monotonic in OKLCH lightness, each step clear
 *     of the next, and its surface end clear of the surface.
 *  3. DISTINGUISHABILITY — measured per theme against every surface the
 *     palette draws on (panel, page, and the OLED preset's in dark):
 *       lightness band   OKLCH L inside the theme's band, so no slot vanishes
 *                        into the surface or glares off it;
 *       chroma floor     OKLCH C ≥ CHROMA_FLOOR, so no slot reads as grey;
 *       CVD separation   adjacent slots (the order is fixed, so these are the
 *                        pairs a legend or a stacked mark puts side by side)
 *                        stay ≥ CVD_FLOOR apart in OKLab ΔE×100 under simulated
 *                        protanopia and deuteranopia (Machado 2009, severity 1);
 *       normal floor     adjacent slots stay ≥ NORMAL_FLOOR apart unsimulated;
 *       contrast         slots under 3:1 against a surface are REPORTED, not
 *                        failed: the pattern fill or a direct label is the
 *                        mandated relief (WCAG 1.4.1 / 1.4.11).
 *     All-pairs separation is reported for scatter/map use, where any two
 *     slots can meet; it is not a gate, because no eight-hue set clears it.
 *  4. IDENTITY — every --cat-N-ink holds 4.5:1 on each surface and on its own
 *     tint; every tint is visibly off the panel.
 *  5. OPT-IN — css/dataviz.css is not imported by css/core.css.
 *
 * Run: node scripts/check-charts.mjs
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generated, inkSurfaces, INK_CONTRAST } from './gen-charts.mjs';
import { charts, CATEGORICAL_HUES, CHART_CATEGORICAL } from '../tokens/charts.js';
import {
  contrastRatio,
  deltaOklab,
  hexToRgb,
  linearToSrgb,
  rgbToOklch,
  srgbToLinear,
} from './lib/oklch.mjs';
import { freshnessErrors } from './lib/assert-fresh.mjs';
import { reportAndExit } from './lib/gate-report.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const notes = [];

const BAND = { light: [0.43, 0.77], dark: [0.48, 0.67] };
const CHROMA_FLOOR = 0.1;
const CVD_FLOOR = 6;
const NORMAL_FLOOR = 15;
const CONTRAST_RELIEF = 3;
const SEQ_MIN_DL = 0.06;
const SEQ_SURFACE_FLOOR = 2;
const SEQ_HUE_SPREAD = 12;
const TINT_MIN_DE = 0.02;

// --- 1. Drift -----------------------------------------------------------------
errors.push(...freshnessErrors(generated, 'npm run charts:build'));
const json = JSON.parse(generated['tokens/charts.json']);

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
const simulate = (rgb, type) => {
  if (type === 'normal') return rgb;
  const m = CVD[type];
  const [r, g, b] = rgb.map((c) => srgbToLinear(c / 255));
  return [0, 1, 2].map((i) =>
    Math.max(0, Math.min(255, linearToSrgb(m[i][0] * r + m[i][1] * g + m[i][2] * b) * 255)),
  );
};
const de100 = (a, b) => deltaOklab(a, b) * 100;

// --- 2. Shape -----------------------------------------------------------------
if (CATEGORICAL_HUES.length !== CHART_CATEGORICAL)
  errors.push(
    `CATEGORICAL_HUES names ${CATEGORICAL_HUES.length} hues, expected ${CHART_CATEGORICAL}`,
  );
for (const theme of ['light', 'dark']) {
  const c = json[theme];
  if (c.categorical.length !== CHART_CATEGORICAL)
    errors.push(`${theme}: categorical has ${c.categorical.length}, expected ${CHART_CATEGORICAL}`);
  const seq = c.sequential.map((h) => rgbToOklch(hexToRgb(h)));
  const dL = seq.slice(1).map((s, i) => s.L - seq[i].L);
  if (!(dL.every((d) => d > 0) || dL.every((d) => d < 0)))
    errors.push(`${theme}: sequential ramp is not monotonic in OKLCH lightness`);
  const tight = dL.findIndex((d) => Math.abs(d) < SEQ_MIN_DL);
  if (tight >= 0)
    errors.push(
      `${theme}: sequential steps ${tight + 1}→${tight + 2} are ${Math.abs(dL[tight]).toFixed(3)} L apart (< ${SEQ_MIN_DL})`,
    );
  const hues = seq.map((s) => s.H);
  const spread = Math.max(...hues) - Math.min(...hues);
  if (spread > SEQ_HUE_SPREAD)
    errors.push(
      `${theme}: sequential ramp spans ${spread.toFixed(1)}° of hue (> ${SEQ_HUE_SPREAD}°) — keep it one hue`,
    );
  for (const surface of inkSurfaces(theme)) {
    const ratio = contrastRatio(hexToRgb(c.sequential[0]), hexToRgb(surface));
    if (ratio < SEQ_SURFACE_FLOOR)
      errors.push(
        `${theme}: sequential step 1 is ${ratio.toFixed(2)}:1 on ${surface} (< ${SEQ_SURFACE_FLOOR}) — the low end vanishes`,
      );
  }
}

// --- 3. Distinguishability ----------------------------------------------------
for (const theme of ['light', 'dark']) {
  const cat = json[theme].categorical.map(hexToRgb);
  const [lo, hi] = BAND[theme];
  cat.forEach((rgb, i) => {
    const { L, C } = rgbToOklch(rgb);
    if (L < lo || L > hi)
      errors.push(
        `${theme}: slot ${i + 1} (${CATEGORICAL_HUES[i]}) L ${L.toFixed(3)} outside ${lo}–${hi}`,
      );
    if (C < CHROMA_FLOOR)
      errors.push(
        `${theme}: slot ${i + 1} (${CATEGORICAL_HUES[i]}) C ${C.toFixed(3)} under ${CHROMA_FLOOR} — reads as grey`,
      );
  });
  for (let i = 0; i + 1 < cat.length; i++) {
    const cvd = Math.min(
      de100(simulate(cat[i], 'protan'), simulate(cat[i + 1], 'protan')),
      de100(simulate(cat[i], 'deutan'), simulate(cat[i + 1], 'deutan')),
    );
    if (cvd < CVD_FLOOR)
      errors.push(
        `${theme}: slots ${i + 1}&${i + 2} are ${cvd.toFixed(1)} apart under protan/deutan (< ${CVD_FLOOR})`,
      );
    const normal = de100(cat[i], cat[i + 1]);
    if (normal < NORMAL_FLOOR)
      errors.push(
        `${theme}: slots ${i + 1}&${i + 2} are ${normal.toFixed(1)} apart in normal vision (< ${NORMAL_FLOOR})`,
      );
  }
  for (const surface of inkSurfaces(theme)) {
    const low = cat
      .map((rgb, i) => [i + 1, contrastRatio(rgb, hexToRgb(surface))])
      .filter(([, r]) => r < CONTRAST_RELIEF);
    if (low.length)
      notes.push(
        `${theme} on ${surface}: slots ${low.map(([n, r]) => `${n} (${r.toFixed(2)}:1)`).join(', ')} need relief`,
      );
  }
  let worst = { d: Infinity };
  for (const vision of ['normal', 'protan', 'deutan', 'tritan'])
    for (let i = 0; i < cat.length; i++)
      for (let j = i + 1; j < cat.length; j++) {
        const d = de100(simulate(cat[i], vision), simulate(cat[j], vision));
        if (d < worst.d) worst = { d, i, j, vision };
      }
  notes.push(
    `${theme}: closest any-pair ${worst.i + 1}&${worst.j + 1} ΔE ${worst.d.toFixed(1)} (${worst.vision}) — patterns carry scatter/map use`,
  );
}

// --- 4. Identity: inks and tints ----------------------------------------------
for (const theme of ['light', 'dark']) {
  const { categorical, tint, ink } = json[theme];
  categorical.forEach((_, i) => {
    for (const ground of [...inkSurfaces(theme), tint[i]]) {
      const ratio = contrastRatio(hexToRgb(ink[i]), hexToRgb(ground));
      if (ratio < INK_CONTRAST)
        errors.push(
          `${theme}: --cat-${i + 1}-ink ${ink[i]} is ${ratio.toFixed(2)}:1 on ${ground} (< ${INK_CONTRAST})`,
        );
    }
    const lift = deltaOklab(hexToRgb(tint[i]), hexToRgb(inkSurfaces(theme)[0]));
    if (lift < TINT_MIN_DE)
      errors.push(
        `${theme}: --cat-${i + 1}-tint is ΔE ${lift.toFixed(3)} off the panel (< ${TINT_MIN_DE})`,
      );
  });
}

// --- 5. Opt-in ----------------------------------------------------------------
if (/dataviz\.css/.test(readFileSync(resolve(root, 'css/core.css'), 'utf8')))
  errors.push(
    'css/core.css imports dataviz.css — the categorical palette must stay opt-in, out of the default bundle',
  );

if (!errors.length) for (const n of notes) console.log(`  · ${n}`);
reportAndExit(errors, {
  label: 'categorical palette',
  ok: `categorical: ${CHART_CATEGORICAL} slots in band, above the chroma floor, adjacent pairs separated under protan/deutan and normal vision; inks hold ${INK_CONTRAST}:1; opt-in`,
});
