import { test } from 'node:test';
import assert from 'node:assert/strict';
import mermaidTheme, { brontoMermaidTheme, mermaid } from '../tokens/mermaid.js';
import d2Vars, { brontoD2Overrides, brontoD2Vars, d2 } from '../tokens/d2.js';
import vegaConfig, {
  brontoVegaAccent,
  brontoVegaConfig,
  brontoVegaNeutral,
  vega,
} from '../tokens/vega.js';

function assertNoVarReferences(value, path = 'value') {
  if (typeof value === 'string') {
    assert.ok(!value.includes('var('), `${path} must be resolved, got ${value}`);
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    assertNoVarReferences(child, `${path}.${key}`);
  }
}

test('renderer theme default exports point at the public helper functions', () => {
  assert.equal(mermaidTheme, brontoMermaidTheme);
  assert.equal(d2Vars, brontoD2Vars);
  assert.equal(vegaConfig, brontoVegaConfig);
});

test('Mermaid helper selects base theme variables and falls back to light', () => {
  const light = brontoMermaidTheme();
  const dark = brontoMermaidTheme('dark');
  const unknown = brontoMermaidTheme('midnight');

  assert.equal(light.theme, 'base');
  assert.equal(light.themeVariables, mermaid.light);
  assert.equal(dark.theme, 'base');
  assert.equal(dark.themeVariables, mermaid.dark);
  assert.equal(unknown.themeVariables, mermaid.light);
  assert.equal(light.themeVariables.darkMode, false);
  assert.equal(dark.themeVariables.darkMode, true);
  assertNoVarReferences(light.themeVariables, 'mermaid.light');
  assertNoVarReferences(dark.themeVariables, 'mermaid.dark');
});

test('D2 helpers expose both override maps and a resolved source vars block', () => {
  assert.equal(brontoD2Overrides(), d2.light);
  assert.equal(brontoD2Overrides('dark'), d2.dark);
  assert.equal(brontoD2Overrides('midnight'), d2.light);

  const source = brontoD2Vars();
  assert.equal(d2Vars(), source);
  assert.match(source, /theme-overrides:/);
  assert.match(source, /dark-theme-overrides:/);
  assert.ok(!source.includes('var('), 'D2 vars source must use resolved colors');

  for (const [slot, hex] of Object.entries(d2.light)) {
    assert.ok(source.includes(`${slot}: "${hex}"`), `missing light slot ${slot}`);
  }
  for (const [slot, hex] of Object.entries(d2.dark)) {
    assert.ok(source.includes(`${slot}: "${hex}"`), `missing dark slot ${slot}`);
  }
});

test('Vega helpers select configs, accent, and quiet neutral from the resolved palette', () => {
  assert.equal(brontoVegaConfig(), vega.light);
  assert.equal(brontoVegaConfig('dark'), vega.dark);
  assert.equal(brontoVegaConfig('midnight'), vega.light);
  assert.equal(vegaConfig('light'), vega.light);

  assert.equal(brontoVegaAccent(), vega.light.range.category[0]);
  assert.equal(brontoVegaAccent('dark'), vega.dark.range.category[0]);
  assert.equal(brontoVegaAccent('midnight'), vega.light.range.category[0]);

  assert.equal(brontoVegaNeutral(), vega.light.range.category.at(-1));
  assert.equal(brontoVegaNeutral('dark'), vega.dark.range.category.at(-1));
  assert.equal(brontoVegaNeutral('midnight'), vega.light.range.category.at(-1));
  assertNoVarReferences(vega.light, 'vega.light');
  assertNoVarReferences(vega.dark, 'vega.dark');
});
