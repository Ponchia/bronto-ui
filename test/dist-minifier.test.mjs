import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { buildBundles, EXTRA_LEAVES, leafFiles } from '../scripts/build-dist.mjs';
import { stripCssComments } from '../scripts/lib/patterns.mjs';

// The independent CSS class registry checks authoring sources. Also prove the
// optimized published artifacts have not dropped their authored class names.
const uiClasses = (source) =>
  new Set([...source.matchAll(/\.ui-[a-z0-9_-]+/g)].map(([name]) => name));

test('optimized stylesheet leaves retain every authored public UI class', () => {
  const bundles = buildBundles();
  for (const leaf of [...new Set([...leafFiles(), ...EXTRA_LEAVES])]) {
    const authored = uiClasses(stripCssComments(readFileSync(join('css', leaf), 'utf8')));
    const emitted = bundles[`dist/css/${leaf}`];
    assert.ok(emitted, `Missing generated leaf ${leaf}`);
    const actual = uiClasses(emitted);
    for (const name of authored) {
      assert.ok(actual.has(name), `${leaf}: optimizer dropped ${name}`);
    }
  }
});

test('default minification preserves modern browser/media feature vocabulary', () => {
  const css = buildBundles()['dist/bronto.css'];
  assert.ok(css.startsWith('@layer bronto{'));
  assert.ok(css.endsWith('}\n'));
  for (const token of [
    '@starting-style',
    '@property',
    'forced-colors:active',
    'prefers-reduced-motion:reduce',
    '@media print',
    ':has(',
    '::selection',
  ]) {
    assert.ok(css.includes(token), `Optimizer lost ${token}`);
  }
});
