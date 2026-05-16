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
  assert.deepEqual(Object.keys(r.light).sort(), Object.keys(r.dark).sort());
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

test('resolved: non-colour tokens are dropped, not fabricated', () => {
  for (const k of ['--radius-md', '--space-md', '--shadow', '--mono', '--ease-spring']) {
    assert.ok(!(k in r.light), `${k} should not be in the resolved colour map`);
  }
});
