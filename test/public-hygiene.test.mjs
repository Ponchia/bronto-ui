import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isPublicTextFile,
  isRepositorySourceFile,
  publicSourceNoteProblems,
} from '../scripts/lib/public-hygiene.mjs';

test('public hygiene scans all public text source extensions used by the package', () => {
  for (const rel of [
    'index.js',
    'index.cjs',
    'index.mjs',
    'index.cts',
    'index.mts',
    'index.d.ts',
    'index.d.cts',
    'index.d.mts',
    'docs/usage.md',
    'tokens.json',
    'style.css',
  ]) {
    assert.equal(isPublicTextFile(rel), true, rel);
  }

  assert.equal(isPublicTextFile('font.woff2'), false);
  assert.equal(isPublicTextFile('image.png'), false);
});

test('repository source hygiene includes JS, CSS, TS, and declarations', () => {
  for (const rel of [
    'x.css',
    'x.js',
    'x.cjs',
    'x.mjs',
    'x.ts',
    'x.cts',
    'x.mts',
    'x.tsx',
    'x.d.mts',
  ]) {
    assert.equal(isRepositorySourceFile(rel), true, rel);
  }

  assert.equal(isRepositorySourceFile('README.md'), false);
  assert.equal(isRepositorySourceFile('demo/page.html'), false);
  assert.equal(isRepositorySourceFile('x.mjsx'), false);
  assert.equal(isRepositorySourceFile('x.ctsx'), false);
});

test('public source notes catch audit markers without flagging calendar quarters', () => {
  assert.deepEqual(publicSourceNoteProblems(['capacity plan (Q', '1)'].join('')), []);
  assert.deepEqual(publicSourceNoteProblems(['fixed after', 'review', 'C1'].join(' ')), [
    'internal review ticket marker',
  ]);
  assert.deepEqual(publicSourceNoteProblems(`${['component', 'audit'].join('-')} follow-up`), [
    'internal component audit marker',
  ]);
  assert.deepEqual(publicSourceNoteProblems(`case ${['(C', '12.)'].join('')}`), [
    'internal audit ticket shorthand',
  ]);
});
