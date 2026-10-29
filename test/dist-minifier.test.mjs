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
  const browserFeatures = {
    '@starting-style': /@starting-style\b/,
    '@property': /@property\b/,
    'forced-colors media query': /forced-colors:\s*active/,
    'reduced-motion media query': /prefers-reduced-motion:\s*reduce/,
    'print media query': /@media\s+print\b/,
    ':has selector': /:has\(/,
    'selection pseudo-element': /::selection\b/,
  };
  for (const [name, pattern] of Object.entries(browserFeatures)) {
    assert.match(css, pattern, `Optimizer lost ${name}`);
  }
});

test('token serialization and scroll-timeline longhands remain browser-compatible', () => {
  const css = buildBundles()['dist/bronto.css'];
  // Values are public to consumers reading computed custom properties.
  for (const declaration of ['--bg:#000000', '--space-xs:0.5rem']) {
    assert.ok(css.includes(declaration), `Custom property changed bytes: ${declaration}`);
  }
  assert.ok(
    css.includes('--btn-ink:#ffffff') || css.includes('--button-text:#ffffff'),
    'Keep the light-safe print ink token',
  );
  // Browsers do not accept the optimizer's shorthand 'animation:... scroll(root)'.
  assert.match(css, /animation:uiScrollGrow linear;animation-timeline:scroll\(root block\)/);
  assert.match(css, /animation:uiScrollReveal linear both;animation-timeline:view\(\)/);
  assert.doesNotMatch(css, /animation:[^;}]*uiScrollGrow scroll\(/);
});

test('CSS build parser uses a patched, integrity-locked PostCSS version', () => {
  // GHSA-6g55-p6wh-862q, GHSA-qx2v-qp2m-jg93,
  // GHSA-fxqj-rqcc-2cmp, GHSA-r28c-9q8g-f849 are fixed by 8.5.23.
  // A previous generated lock reintroduced vulnerable 8.5.6 despite green
  // CSS checks; require the actual lock, not merely a declared range.
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
  const versions = Object.entries(lock.packages)
    .filter(([name]) => name === 'node_modules/postcss' || name.endsWith('/node_modules/postcss'))
    .map(([name, entry]) => ({ name, version: entry.version, integrity: entry.integrity }));
  assert.ok(versions.length >= 1, 'PostCSS build parser must be installed');
  assert.equal(pkg.devDependencies.postcss, lock.packages['node_modules/postcss'].version);
  for (const entry of versions) {
    assert.match(
      entry.integrity,
      /^sha512-[A-Za-z0-9+/]+=*$/,
      `${entry.name}: missing registry integrity`,
    );
    const parts = entry.version.split('.').map(Number);
    assert.ok(
      parts.length === 3 &&
        (parts[0] > 8 || (parts[0] === 8 && (parts[1] > 5 || (parts[1] === 5 && parts[2] >= 23)))),
      `${entry.name}: known vulnerable PostCSS ${entry.version} (requires >=8.5.23)`,
    );
  }
});
