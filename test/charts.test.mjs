import { test } from 'node:test';
import assert from 'node:assert/strict';
import chartPalette, {
  charts,
  CATEGORICAL_HUES,
  CHART_CATEGORICAL,
  CHART_PATTERN_COUNT,
} from '../tokens/charts.js';
import {
  generated,
  resolveColor,
  PATTERNS,
  inkSurfaces,
  INK_CONTRAST,
} from '../scripts/gen-charts.mjs';
import {
  contrastRatio,
  deltaOklab,
  srgbToLinear,
  linearToSrgb,
  hexToRgb,
  rgbToOklch,
} from '../scripts/lib/oklch.mjs';

test('default export is the public chart palette map', () => {
  assert.equal(chartPalette, charts);
});

test('categorical has 8 named hues in fixed order, both themes, and no slot is the accent', () => {
  assert.deepEqual(
    [...CATEGORICAL_HUES],
    ['blue', 'orange', 'aqua', 'yellow', 'magenta', 'green', 'violet', 'red'],
  );
  for (const theme of ['light', 'dark']) {
    assert.equal(charts[theme].categorical.length, CHART_CATEGORICAL);
    for (const v of charts[theme].categorical) assert.match(v, /^#[0-9a-f]{6}$/);
    assert.ok(!charts[theme].categorical.includes('var(--accent)'));
  }
  assert.equal(CHART_CATEGORICAL, 8);
  assert.equal(PATTERNS.length, CHART_PATTERN_COUNT);
});

test('sequential ramps are one hue and monotonic in OKLCH lightness', () => {
  for (const theme of ['light', 'dark']) {
    const ls = charts[theme].sequential.map((h) => rgbToOklch(hexToRgb(h)).L);
    const mono =
      ls.every((l, i) => i === 0 || l > ls[i - 1]) || ls.every((l, i) => i === 0 || l < ls[i - 1]);
    assert.ok(mono, `${theme} sequential not monotonic: ${ls.join(',')}`);
  }
});

test('every --cat-N-ink holds 4.5:1 on each surface and on its own tint', () => {
  const json = JSON.parse(generated['tokens/charts.json']);
  for (const theme of ['light', 'dark'])
    json[theme].ink.forEach((ink, i) => {
      for (const ground of [...inkSurfaces(theme), json[theme].tint[i]])
        assert.ok(
          contrastRatio(hexToRgb(ink), hexToRgb(ground)) >= INK_CONTRAST,
          `${theme} ink ${i + 1} on ${ground}`,
        );
    });
});

test('adjacent categorical series stay distinguishable under simulated colourblindness', () => {
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
  // Adjacent pairs: the order is fixed, so these are the series a legend and a
  // stacked mark put side by side (all-pairs is reported by check:charts).
  for (const theme of ['light', 'dark']) {
    const cat = charts[theme].categorical.map((v) => hexToRgb(resolveColor(v, theme)));
    for (let i = 0; i + 1 < cat.length; i++) {
      for (const vision of ['protan', 'deutan'])
        assert.ok(
          deltaOklab(sim(cat[i], vision), sim(cat[i + 1], vision)) * 100 >= 6,
          `${theme}/${vision}: series ${i + 1}&${i + 2} too close`,
        );
      assert.ok(
        deltaOklab(cat[i], cat[i + 1]) * 100 >= 15,
        `${theme}/normal: series ${i + 1}&${i + 2} too close`,
      );
    }
  }
});

test('generated charts.json carries 8 resolved hex categorical, tints and inks per theme', () => {
  const json = JSON.parse(generated['tokens/charts.json']);
  assert.deepEqual(json.hues, [...CATEGORICAL_HUES]);
  for (const theme of ['light', 'dark'])
    for (const set of ['categorical', 'tint', 'ink']) {
      assert.equal(json[theme][set].length, 8);
      for (const c of json[theme][set]) assert.match(c, /^#[0-9a-f]{6}$/);
    }
});

test('css/dataviz.css defines the identity and series namespaces on :root', () => {
  const css = generated['css/dataviz.css'];
  assert.match(css, /:root\s*\{[\s\S]*--cat-1: #2a78d6;/);
  assert.match(css, /--cat-1-tint: color-mix\(in oklch, var\(--cat-1\) 16%, var\(--panel\)\);/);
  assert.match(css, /--cat-1-ink: #[0-9a-f]{6};/);
  assert.match(css, /--chart-1: var\(--cat-1\);/);
  assert.match(css, /--chart-pattern-1:/);
});
