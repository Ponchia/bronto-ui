import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// The opt-in font leaves exist to make `--sans` and `--mono` true: each one
// must declare the family its token names first, point only at files the
// package ships, and ship that family's license beside them.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(resolve(root, p), 'utf8');
const firstFamily = (token) => {
  const value = read('css/tokens.css').match(new RegExp(`${token}:\\s*([^;]+);`))?.[1] ?? '';
  return value
    .split(',')[0]
    .trim()
    .replace(/^['"]|['"]$/g, '');
};

const LEAVES = [
  { leaf: 'css/fonts-inter.css', token: '--sans', license: 'fonts/OFL-Inter.txt' },
  { leaf: 'css/fonts-jetbrains-mono.css', token: '--mono', license: 'fonts/OFL-JetBrainsMono.txt' },
];

for (const { leaf, token, license } of LEAVES) {
  test(`${leaf} declares the family ${token} names first, from shipped files`, () => {
    const css = read(leaf).replace(/\/\*[\s\S]*?\*\//g, '');
    const faces = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => m[1]);
    assert.ok(faces.length > 0, 'declares at least one face');
    for (const face of faces) {
      const family = face
        .match(/font-family:\s*([^;]+);/)?.[1]
        .trim()
        .replace(/^['"]|['"]$/g, '');
      assert.equal(family, firstFamily(token));
      assert.match(face, /font-display:\s*swap;/);
      const url = face.match(/url\('([^']+)'\)/)?.[1];
      assert.ok(url?.startsWith('../fonts/') && url.endsWith('.woff2'), url);
      assert.ok(existsSync(resolve(root, 'css', url)), `${url} ships`);
    }
    assert.match(read(license), /SIL Open Font License, Version 1\.1/);
  });
}

test('the font leaves stay out of the default bundle', () => {
  const core = read('css/core.css');
  for (const { leaf } of LEAVES) assert.ok(!core.includes(leaf.replace('css/', './')), leaf);
});
