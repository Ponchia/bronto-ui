import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { buildBundles } from '../scripts/build-dist.mjs';

// `css/tool.css` is the default bundle for a tool: core in core's order, less
// the four leaves of site and app chrome. A leaf added to core lands in the
// tool entry too unless it is one of those four, and nothing it keeps may lean
// on what it drops.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(resolve(root, p), 'utf8');
const imports = (p) =>
  [...read(p).matchAll(/@import url\('\.\/([a-z0-9-]+)\.css'\) layer\(bronto\);/g)].map(
    (m) => m[1],
  );
const DROPPED = ['navigation', 'site', 'table', 'app'];

test('the tool entry is core without the site and app chrome, in core order', () => {
  assert.deepEqual(
    imports('css/tool.css'),
    imports('css/core.css').filter((leaf) => !DROPPED.includes(leaf)),
  );
  for (const leaf of DROPPED) assert.ok(imports('css/core.css').includes(leaf), leaf);
});

test('the tool bundle defines every keyframe it animates with', () => {
  const css = buildBundles()['dist/css/tool.css'].replace(/\/\*[\s\S]*?\*\//g, '');
  const defined = new Set([...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]));
  const used = new Set();
  for (const m of css.matchAll(/animation(?:-name)?\s*:([^;}]+)/g)) {
    for (const name of m[1].match(/\b(?:ui|pulse|dotmatrix)[A-Z][\w-]*/g) ?? []) used.add(name);
  }
  assert.ok(used.size > 0, 'found the animations');
  for (const name of used) assert.ok(defined.has(name), `${name} is animated but not defined`);
});

test('the tool bundle drops the chrome selectors and keeps what a tool draws', () => {
  const css = buildBundles()['dist/css/tool.css'];
  // A kept leaf may NAME a dropped class (base's print rules hide the site nav),
  // so look for the rule that defines it.
  for (const cls of ['ui-app-shell', 'ui-sitenav', 'ui-table', 'ui-themetoggle__button']) {
    assert.ok(
      !new RegExp(`\\.${cls}\\s*\\{`).test(css),
      `${cls} should not be defined in the tool bundle`,
    );
  }
  for (const cls of [
    'ui-button',
    'ui-icon',
    'ui-empty-state',
    'ui-alert',
    'ui-prose--blocks',
    'ui-meta',
  ]) {
    assert.ok(new RegExp(`\\.${cls}\\b`).test(css), `${cls} should ship in the tool bundle`);
  }
  assert.ok(css.length < buildBundles()['dist/bronto.css'].length);
});
