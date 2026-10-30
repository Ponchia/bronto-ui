import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { charts, CATEGORICAL_HUES } from '../tokens/charts.js';
import { generated, inkHex, inkSurfaces, INK_CONTRAST, tintHex } from '../scripts/gen-charts.mjs';
import { contrastRatio, hexToRgb } from '../scripts/lib/oklch.mjs';

const css = generated['css/identity.css'];

/** The declarations of the first block whose selector line matches. */
function block(selector) {
  const start = css.indexOf(`${selector} {`);
  assert.ok(start >= 0, `identity.css has a ${selector} block`);
  const body = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries(
    [...body.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value]),
  );
}

test('identity.css is generated from the measured categorical set', () => {
  assert.equal(typeof css, 'string');
  assert.match(css, /GENERATED from tokens\/charts\.js/);
});

test('each hue has a named solid, ink and tint in both themes', () => {
  const themes = { light: block(':root'), dark: block(":root[data-theme='dark']") };
  for (const theme of ['light', 'dark']) {
    CATEGORICAL_HUES.forEach((hue, i) => {
      const solid = charts[theme].categorical[i];
      assert.equal(themes[theme][`--identity-${hue}`], solid, `${theme} ${hue}`);
      assert.equal(
        themes[theme][`--identity-${hue}-ink`],
        inkHex(solid, theme),
        `${theme} ${hue} ink`,
      );
    });
  }
  for (const hue of CATEGORICAL_HUES)
    assert.equal(
      themes.light[`--identity-${hue}-tint`],
      `color-mix(in oklch, var(--identity-${hue}) 16%, var(--panel))`,
    );
});

test('every identity ink holds 4.5:1 on each surface and on its own tint', () => {
  for (const theme of ['light', 'dark']) {
    for (const solid of charts[theme].categorical) {
      const ink = hexToRgb(inkHex(solid, theme));
      for (const ground of [...inkSurfaces(theme), tintHex(solid, theme)])
        assert.ok(
          contrastRatio(ink, hexToRgb(ground)) >= INK_CONTRAST,
          `${theme} ${solid} ink on ${ground}`,
        );
    }
  }
});

test('the leaf stands alone and stays out of the default bundle', () => {
  assert.doesNotMatch(css, /--(cat|chart|data)-/, 'no data-viz token in the identity leaf');
  assert.doesNotMatch(readFileSync('css/core.css', 'utf8'), /identity\.css/);
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(pkg.exports['./css/identity.css'], './dist/css/identity.css');
  assert.equal(pkg.exports['./css/unlayered/identity.css'], './css/identity.css');
});

test('a dark scheme by preference and print both carry their own values', () => {
  const media = css.slice(css.indexOf('@media (prefers-color-scheme: dark)'));
  assert.match(media, /--identity-blue: #3987e5;/);
  const print = css.slice(css.indexOf('@media print'));
  assert.match(print, /--identity-blue: #2a78d6;/);
});
