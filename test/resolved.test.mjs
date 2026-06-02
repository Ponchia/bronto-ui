import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildResolved } from '../scripts/gen-resolved.mjs';

const r = buildResolved();
const STATIC = /^(#[0-9a-f]{6}|rgba\(\d+, \d+, \d+, [0-9.]+\))$/i;

test('resolved: every value is static — no var()/color-mix() leaks', () => {
  for (const theme of ['light', 'dark']) {
    for (const [name, v] of Object.entries(r[theme])) {
      assert.doesNotMatch(v, /var\(|color-mix\(/, `${theme} ${name} unresolved: ${v}`);
      assert.match(v, STATIC, `${theme} ${name} not a static colour: ${v}`);
    }
  }
});

test('resolved: light and dark expose the same token set', () => {
  const byName = (a, b) => a.localeCompare(b);
  assert.deepEqual(Object.keys(r.light).sort(byName), Object.keys(r.dark).sort(byName));
});

test('resolved: color-mix is evaluated correctly (sRGB)', () => {
  // light --accent-strong = color-mix(in srgb, #d71921 83%, #000) → ×0.83
  assert.equal(r.light['--accent-strong'], '#b2151b');
  // *-soft = color-mix(accent N%, transparent) → accent at alpha N
  assert.equal(r.light['--accent-soft'], 'rgba(215, 25, 33, 0.1)');
  // var() chains resolve through (accent-text → accent-strong)
  assert.equal(r.light['--accent-text'], r.light['--accent-strong']);
  assert.equal(r.dark['--focus-ring'], r.dark['--accent']);
});

test('resolved: OKLCH accent ramp is generated and kept in the static palette', () => {
  assert.deepEqual(
    [r.light['--accent-1'], r.light['--accent-2'], r.light['--accent-3'], r.light['--accent-4']],
    ['#ffefed', '#ffe0db', '#fbc0b9', '#f1877d'],
  );
  assert.deepEqual(
    [r.dark['--accent-1'], r.dark['--accent-2'], r.dark['--accent-3'], r.dark['--accent-4']],
    ['#020000', '#0d0101', '#330506', '#80191c'],
  );
});

test('resolved: non-colour tokens are dropped from the colour palettes', () => {
  for (const k of ['--radius-md', '--space-md', '--shadow', '--mono', '--ease-spring']) {
    assert.ok(!(k in r.light), `${k} should not be in the resolved colour map`);
  }
});

test('resolved: the scale block carries non-colour tokens, flattened, no var()/colour', () => {
  assert.equal(r.scale['--space-md'], '1rem');
  assert.equal(r.scale['--radius-md'], '2px');
  // var() chain flattened to a usable font stack (--display → --dot-font → --mono).
  assert.match(r.scale['--display'], /^'Doto',/);
  assert.doesNotMatch(r.scale['--display'], /var\(/);
  // No colour token leaked into the scale block.
  for (const [name, v] of Object.entries(r.scale)) {
    assert.doesNotMatch(v, /var\(|color-mix\(/, `scale ${name} unresolved: ${v}`);
    assert.ok(!/^#|^rgba?\(/.test(v), `scale ${name} looks like a colour: ${v}`);
  }
});
