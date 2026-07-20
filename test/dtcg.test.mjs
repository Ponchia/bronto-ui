import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDtcg } from '../scripts/gen-dtcg.mjs';
import { validateDtcg } from '../scripts/check-dtcg.mjs';

const dt = buildDtcg();

test('DTCG: the complete generated document passes the typed-value validator', () => {
  const result = validateDtcg(dt);
  assert.deepEqual(result.errors, []);
  assert.ok(result.tokens > 100);
});

test('DTCG: colours and dimensions use structured 2025.10 values', () => {
  assert.equal(dt.color.light.accent.DEFAULT.$type, 'color');
  assert.deepEqual(dt.color.light.accent.DEFAULT.$value, {
    colorSpace: 'srgb',
    components: [0.843137, 0.098039, 0.129412],
    alpha: 1,
    hex: '#d71921',
  });
  assert.equal(dt.scale.space.md.$type, 'dimension');
  assert.deepEqual(dt.scale.space.md.$value, { value: 1, unit: 'rem' });
  assert.equal(dt.scale.tracking, undefined, 'em tracking is not a valid DTCG dimension');
  assert.equal(dt.scale.ease.spring.$type, 'cubicBezier');
  assert.equal(dt.scale.ease.spring.$value.length, 4);
  assert.match(dt.$schema, /schemas\/2025\.10\/format\.json$/);
});

test('DTCG: CSS-runtime colours are resolved while authored expressions remain traceable', () => {
  const soft = dt.color.light.accent.soft;
  assert.equal(soft.$type, 'color');
  assert.equal(soft.$value.colorSpace, 'srgb');
  assert.equal(soft.$value.alpha, 0.1);
  assert.match(soft.$extensions['com.ponchia.css'].authoredValue, /color-mix\(/);
  assert.equal(dt.$extensions['com.ponchia.ui'].rawCssArtifact, 'tokens.json');
});
