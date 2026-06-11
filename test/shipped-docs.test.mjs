import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shippedDocs } from '../scripts/lib/shipped-docs.mjs';

test('shippedDocs includes npm always-included README and listed markdown docs once', () => {
  const docs = shippedDocs({
    files: ['README.md', 'llms.txt', 'docs/reference.md', 'dist', 'docs/usage.md'],
  });

  assert.equal(docs[0], 'README.md');
  assert.ok(docs.includes('llms.txt'));
  assert.ok(docs.includes('docs/reference.md'));
  assert.ok(docs.includes('docs/usage.md'));
  assert.equal(docs.filter((d) => d === 'README.md').length, 1);
  assert.ok(!docs.includes('dist'));
});
