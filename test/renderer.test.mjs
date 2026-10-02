import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatColor,
  observeTokens,
  parseColor,
  readTokens,
  resolveColor,
  vegaConfig,
  xtermTheme,
} from '../renderer/index.js';
import { charts } from '../tokens/charts.js';

const hex = (v) => formatColor(parseColor(v));

test('parseColor reads every serialization a browser computes', () => {
  assert.equal(hex('#2a78d6'), '#2a78d6');
  assert.equal(hex('#abc'), '#aabbcc');
  assert.equal(hex('rgb(10 20 30)'), '#0a141e');
  assert.equal(hex('rgba(10, 20, 30, 0.5)'), 'rgba(10, 20, 30, 0.5)');
  assert.equal(hex('rgb(10 20 30 / 50%)'), 'rgba(10, 20, 30, 0.5)');
  assert.equal(hex('hsl(210 50% 40%)'), '#336699');
  assert.equal(hex('color(srgb 1 0 0)'), '#ff0000');
  assert.equal(hex('color(srgb 0.1 0.2 0.3 / 0.27)'), 'rgba(26, 51, 77, 0.27)');
  assert.equal(hex('color(display-p3 1 0 0)'), '#ff0000', 'out-of-gamut P3 clips into sRGB');
  assert.equal(hex('transparent'), 'rgba(0, 0, 0, 0)');
});

test('parseColor agrees with the OKLCH the palette was authored in', () => {
  // oklch(62% 0.15 250) and its number form are one colour; lab/lch round-trip close.
  assert.equal(hex('oklch(62% 0.15 250)'), hex('oklch(0.62 0.15 250deg)'));
  assert.equal(hex('oklch(0.62 0.15 250 / 0.5)'), 'rgba(47, 138, 220, 0.5)');
  assert.equal(hex('oklab(1 0 0)'), '#ffffff');
  assert.equal(hex('lab(100 0 0)'), '#ffffff');
  assert.equal(hex('lch(0 0 0)'), '#000000');
});

test('parseColor declines what only a browser can compute', () => {
  for (const v of [
    'var(--x)',
    'color-mix(in oklch, red, blue)',
    'light-dark(#fff, #000)',
    'red',
    '',
  ])
    assert.equal(parseColor(v), null, v);
});

test('resolveColor needs no DOM for a literal and returns null without one otherwise', () => {
  assert.equal(resolveColor('oklch(1 0 0)'), '#ffffff');
  assert.equal(resolveColor('var(--accent)'), null);
});

test('readTokens without a DOM returns the packaged palette for the scheme', () => {
  for (const scheme of ['light', 'dark']) {
    const t = readTokens(undefined, { scheme });
    assert.equal(t.scheme, scheme);
    assert.deepEqual(t.categorical, charts[scheme].categorical);
    assert.deepEqual(t.sequential, charts[scheme].sequential);
    assert.equal(t.categoricalTint.length, 8);
    for (const c of [...t.categoricalTint, ...t.diverging]) assert.match(c, /^#[0-9a-f]{6}$/);
    // A line that carries meaning rides the dim-text ink, never a hairline.
    assert.equal(t.edge, t.textDim);
    assert.notEqual(t.edge, t.lineStrong);
  }
});

test('observeTokens is a no-op without a DOM', () => {
  const stop = observeTokens(() => assert.fail('no DOM, no callback'));
  assert.equal(typeof stop, 'function');
  stop();
});

test('vegaConfig maps tokens to quiet chrome and the categorical range', () => {
  const t = readTokens(undefined, { scheme: 'light' });
  const lite = vegaConfig(t);
  assert.equal(lite.background, 'transparent');
  assert.deepEqual(lite.range.category, t.categorical);
  assert.deepEqual(lite.range.heatmap, t.sequential);
  assert.equal(lite.mark.color, t.categorical[0], 'a single series takes the first hue');
  assert.equal(lite.view.stroke, null);
  assert.equal(lite.axis.gridColor, t.line);
  assert.equal(lite.rect.stroke, t.panel, 'adjacent fills keep a surface gap');
  const narrow = vegaConfig(t, { narrow: true });
  assert.equal(narrow.legend.orient, 'bottom');
  assert.equal(narrow.axis.tickCount, 4);
  const raw = vegaConfig(t, { mode: 'vega', background: t.bg });
  assert.equal(raw.background, t.bg);
  assert.equal(raw.text.fill, t.text);
  assert.equal(raw.mark, undefined, 'raw Vega styles its own marks');
});

test('xtermTheme gives all six ANSI hues distinct colours', () => {
  for (const scheme of ['light', 'dark']) {
    const theme = xtermTheme(readTokens(undefined, { scheme }));
    const hues = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan'].map((k) => theme[k]);
    assert.equal(new Set(hues).size, 6, `${scheme}: ${hues.join(' ')}`);
    assert.equal(theme.cursorAccent, theme.background);
  }
});
