import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDtcg } from '../scripts/gen-dtcg.mjs';

const dt = buildDtcg();

test('DTCG: shadow tokens are typed shadow, never color', () => {
  // Regression: `--shadow: none` used to fall through to `color`.
  assert.equal(dt.color.light.shadow.DEFAULT.$type, 'shadow');
  assert.equal(dt.color.light.shadow.DEFAULT.$value, 'none');
  assert.equal(dt.color.dark.shadow.DEFAULT.$type, 'shadow');
});

test('DTCG: resolvable primitives carry real values', () => {
  assert.equal(dt.color.light.accent.DEFAULT.$type, 'color');
  assert.match(dt.color.light.accent.DEFAULT.$value, /^#[0-9a-f]{6}$/i);
  assert.equal(dt.scale.space.md.$type, 'dimension');
  assert.equal(dt.scale.ease.spring.$type, 'cubicBezier');
  assert.equal(dt.scale.ease.spring.$value.length, 4);
});

test('DTCG: CSS-runtime tokens are null + flagged, never fabricated', () => {
  const soft = dt.color.light.accent.soft;
  assert.equal(soft.$type, 'color');
  assert.equal(soft.$value, null);
  assert.match(soft.$extensions['com.ponchia.css'], /color-mix\(/);

  const raised = dt.color.light.shadow.raised;
  assert.equal(raised.$type, 'shadow');
  assert.equal(raised.$value, null);
  assert.ok(raised.$extensions['com.ponchia.css'].includes('var(--line-strong)'));
});
