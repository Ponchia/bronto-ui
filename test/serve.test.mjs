import { test } from 'node:test';
import assert from 'node:assert/strict';
import { basename, sep } from 'node:path';
import { safePath, root } from '../scripts/serve.mjs';

test('safePath resolves normal paths under root', () => {
  assert.equal(safePath('/css/core.css'), `${root}${sep}css${sep}core.css`);
  assert.equal(safePath('/'), `${root}${sep}index.html`);
  assert.equal(safePath('/demo/'), `${root}${sep}demo${sep}index.html`);
  assert.equal(safePath('/.'), root); // normalises to exactly root → allowed
});

test('safePath rejects traversal and sibling-prefix escapes', () => {
  assert.equal(safePath('/../../etc/passwd'), null);
  assert.equal(safePath('/../secret'), null);
  // A sibling dir that shares the root name as a prefix must NOT pass.
  assert.equal(safePath(`/../${basename(root)}-evil/x`), null);
});
