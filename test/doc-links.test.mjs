import test from 'node:test';
import assert from 'node:assert/strict';
import { publicDocHref } from '../scripts/lib/doc-links.mjs';

test('public documentation links preserve query and fragment destinations', () => {
  assert.equal(
    publicDocHref('docs/concepts.md', './usage.md?source=guide#meter-vs-progress'),
    './usage.html?source=guide#meter-vs-progress',
  );
  assert.equal(
    publicDocHref('docs/getting-started/astro.md', '../../CONTRIBUTING.md#setup'),
    'https://github.com/Ponchia/bronto-ui/blob/main/CONTRIBUTING.md#setup',
  );
  assert.equal(publicDocHref('docs/concepts.md', './usage.md'), './usage.html');
});

test('public documentation links leave external URLs and fragment names intact', () => {
  for (const href of [
    '#reporting.md',
    'https://example.test/README.md#setup',
    '//example.test/README.md',
    '/docs/usage.md',
    './example.html?source=guide',
    '../../outside.md',
  ]) {
    assert.equal(publicDocHref('docs/concepts.md', href), href);
  }
});
