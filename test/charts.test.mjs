import { test } from 'node:test';
import assert from 'node:assert/strict';
import { charts, ACCENT, CHART_CATEGORICAL, CHART_PATTERN_COUNT } from '../tokens/charts.js';
import { generated, resolveColor, PATTERNS } from '../scripts/gen-charts.mjs';
import { deltaOklab, srgbToLinear, linearToSrgb, hexToRgb } from '../scripts/lib/oklch.mjs';
import { buildResolved } from '../scripts/gen-resolved.mjs';

test('categorical has 8 series and series 1 is the live accent, both themes', () => {
  for (const theme of ['light', 'dark']) {
    assert.equal(charts[theme].categorical.length, CHART_CATEGORICAL);
    assert.equal(charts[theme].categorical[0], ACCENT);
  }
  assert.equal(CHART_CATEGORICAL, 8);
  assert.equal(PATTERNS.length, CHART_PATTERN_COUNT);
});

test('series 1 resolves to the theme accent', () => {
  const R = buildResolved();
  assert.equal(resolveColor(ACCENT, 'light'), R.light['--accent']);
  assert.equal(resolveColor(ACCENT, 'dark'), R.dark['--accent']);
});

test('sequential ramps are monotonic in OKLCH lightness', () => {
  const L = (s) => Number.parseFloat(/oklch\(\s*([\d.]+)%/.exec(s)[1]);
  for (const theme of ['light', 'dark']) {
    const ls = charts[theme].sequential.map(L);
    const mono =
      ls.every((l, i) => i === 0 || l > ls[i - 1]) || ls.every((l, i) => i === 0 || l < ls[i - 1]);
    assert.ok(mono, `${theme} sequential not monotonic: ${ls.join(',')}`);
  }
});

test('categorical series stay distinguishable under simulated colourblindness', () => {
  // Machado 2009 severity 1.0, linear sRGB.
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
  const lin = (c) => srgbToLinear(c / 255);
  const delin = (c) => linearToSrgb(c) * 255;
  const sim = (rgb, t) => {
    if (t === 'normal') return rgb;
    const m = CVD[t];
    const [r, g, b] = rgb.map(lin);
    return [0, 1, 2].map((i) =>
      Math.max(0, Math.min(255, delin(m[i][0] * r + m[i][1] * g + m[i][2] * b))),
    );
  };
  for (const theme of ['light', 'dark']) {
    const cat = charts[theme].categorical.map((v) => hexToRgb(resolveColor(v, theme)));
    for (const vision of ['normal', 'protan', 'deutan', 'tritan']) {
      const s = cat.map((c) => sim(c, vision));
      for (let i = 0; i < s.length; i++)
        for (let j = i + 1; j < s.length; j++)
          assert.ok(
            deltaOklab(s[i], s[j]) >= 0.05,
            `${theme}/${vision}: series ${i + 1}&${j + 1} too close`,
          );
    }
  }
});

test('generated charts.json carries 8 resolved hex categorical per theme', () => {
  const json = JSON.parse(generated['tokens/charts.json']);
  for (const theme of ['light', 'dark']) {
    assert.equal(json[theme].categorical.length, 8);
    for (const c of json[theme].categorical) assert.match(c, /^#[0-9a-f]{6}$/);
  }
});

test('css/dataviz.css is opt-in (defines --chart-* on :root, not imported by core)', () => {
  const css = generated['css/dataviz.css'];
  assert.match(css, /:root\s*\{[\s\S]*--chart-1:/);
  assert.match(css, /--chart-pattern-1:/);
});
