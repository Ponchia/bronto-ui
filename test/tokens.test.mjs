import { test } from 'node:test';
import assert from 'node:assert/strict';
import tokens, { cssVars, themeColor } from '../tokens/index.js';

test('themeColor resolves palettes', () => {
  assert.equal(themeColor('dark').accent, '#ff3b41');
  assert.equal(themeColor('light').accent, '#d71921');
});

test('themeColor falls back to light for unknown/empty', () => {
  assert.equal(themeColor('nope').bg, themeColor('light').bg);
  assert.equal(themeColor().bg, themeColor('light').bg);
});

test('cssVars mirror is keyed by real custom-property names', () => {
  assert.equal(cssVars.global['--radius-xl'], '4px');
  assert.equal(cssVars.light['--panel'], '#ffffff');
  assert.equal(cssVars.dark['--bg'], '#000000');
});

test('tokens is the -- stripped ergonomic view; default export === tokens', async () => {
  assert.equal(tokens.scale['radius-xl'], '4px');
  assert.equal(tokens.color.dark.accent, '#ff3b41');
  const mod = await import('../tokens/index.js');
  assert.equal(mod.default, mod.tokens);
});
