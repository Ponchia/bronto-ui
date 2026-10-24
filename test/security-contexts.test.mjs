import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { hasWord } from '../scripts/lib/ownership-proof.mjs';

test('ownership word matching treats regex metacharacters as literal text', () => {
  for (const needle of ['ui.name', 'ui+name', 'ui(name)token', 'ui[name]token', 'ui.*name']) {
    assert.equal(hasWord(`Uses ${needle} here`, needle), true, needle);
    assert.equal(hasWord('Uses uiXname here', needle), false, needle);
  }
});

test('release section matching cannot interpret a caller version as a regex', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  for (const version of ['.*', pkg.version.replaceAll('.', 'x'), '(a+)+$']) {
    const result = spawnSync(process.execPath, ['scripts/changelog-section.mjs', version], {
      encoding: 'utf8',
      timeout: 5000,
    });
    assert.equal(result.status, 0, result.stderr);
    assert.ok(result.stdout.startsWith(`Release ${version}. See `), result.stdout);
  }
  const actual = spawnSync(process.execPath, ['scripts/changelog-section.mjs', pkg.version], {
    encoding: 'utf8',
  });
  assert.equal(actual.status, 0, actual.stderr);
  assert.ok(!actual.stdout.startsWith(`Release ${pkg.version}. See `));
});
