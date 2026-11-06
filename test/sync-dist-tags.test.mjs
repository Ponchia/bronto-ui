import test from 'node:test';
import assert from 'node:assert/strict';
import { compareVersions, planDistTags } from '../scripts/sync-dist-tags.mjs';

test('version precedence follows Semantic Versioning 2.0.0', () => {
  const ordered = [
    '0.1.0-alpha',
    '0.1.0-alpha.1',
    '0.1.0-alpha.beta',
    '0.1.0-beta',
    '0.1.0-beta.2',
    '0.1.0-beta.11',
    '0.1.0-rc.1',
    '0.1.0',
    '0.2.0-beta.0',
    '0.2.0',
    '1.0.0',
  ];
  for (let i = 0; i < ordered.length; i++)
    for (let j = 0; j < ordered.length; j++)
      assert.equal(
        compareVersions(ordered[i], ordered[j]),
        Math.sign(i - j),
        `${ordered[i]} vs ${ordered[j]}`,
      );
  assert.equal(compareVersions('1.0.0+build.1', '1.0.0'), 0);
  assert.throws(() => compareVersions('v1.0.0', '1.0.0'), /Not a semantic version/);
});

test('latest follows the newest beta while no stable version exists', () => {
  assert.deepEqual(
    planDistTags({
      tags: { latest: '0.2.0-beta.1', beta: '0.2.0-beta.2' },
      versions: ['0.2.0-beta.0', '0.2.0-beta.1', '0.2.0-beta.2'],
      released: '0.2.0-beta.2',
    }),
    [{ action: 'add', tag: 'latest', version: '0.2.0-beta.2' }],
  );
  assert.deepEqual(
    planDistTags({
      tags: { latest: '0.5.0-beta.2', beta: '0.5.0-beta.3' },
      versions: ['0.0.0-stage', '0.5.0-beta.2', '0.5.0-beta.3'],
      released: '0.5.0-beta.3',
    }),
    [{ action: 'add', tag: 'latest', version: '0.5.0-beta.3' }],
  );
});

test('a registry read older than the release plans nothing and refuses', () => {
  // Acting on it would remove the beta tag the publish has just moved.
  assert.throws(
    () =>
      planDistTags({
        tags: { latest: '0.5.0-beta.2', beta: '0.5.0-beta.2' },
        versions: ['0.0.0-stage', '0.5.0-beta.2'],
        released: '0.5.0-beta.3',
      }),
    /Registry state predates 0\.5\.0-beta\.3/,
  );
});

test('latest never moves backwards or to a prerelease once a stable version exists', () => {
  assert.deepEqual(
    planDistTags({
      tags: { latest: '0.2.0-beta.3', beta: '0.2.0-beta.3' },
      versions: ['0.2.0-beta.1', '0.2.0-beta.3'],
      released: '0.2.0-beta.1',
    }),
    [],
  );
  assert.deepEqual(
    planDistTags({
      tags: { latest: '0.8.1', next: '0.9.0-rc.1' },
      versions: ['0.8.1', '0.9.0-rc.1'],
      released: '0.9.0-rc.1',
    }),
    [],
  );
});

test('a channel tag below latest is removed and other tags are kept', () => {
  assert.deepEqual(
    planDistTags({
      tags: { latest: '0.8.1', next: '0.7.0-rc.3', legacy: '0.6.0' },
      versions: ['0.6.0', '0.7.0-rc.3', '0.8.1'],
      released: '0.8.1',
    }),
    [{ action: 'rm', tag: 'next', version: '0.7.0-rc.3' }],
  );
  assert.deepEqual(
    planDistTags({
      tags: { latest: '0.2.0-beta.2', beta: '0.2.0-beta.2' },
      versions: ['0.2.0-beta.2'],
      released: '0.2.0-beta.2',
    }),
    [],
    'a channel tag equal to latest stays',
  );
});

test('the CLI refuses packages outside @ponchia and invalid versions before any registry call', async () => {
  const { execFileSync } = await import('node:child_process');
  const script = new URL('../scripts/sync-dist-tags.mjs', import.meta.url);
  const run = (...args) =>
    execFileSync(process.execPath, [script.pathname, ...args], { encoding: 'utf8', stdio: 'pipe' });
  assert.throws(
    () => run('--package', 'left-pad', '--version', '1.0.0', '--npm-cli', '/nonexistent'),
    /Only @ponchia packages/,
  );
  assert.throws(
    () => run('--package', '@ponchia/x', '--version', 'latest', '--npm-cli', '/nonexistent'),
    /Not a semantic version/,
  );
  assert.throws(
    () => run('--package', '@ponchia/x', '--version', '1.0.0'),
    /--npm-cli is required/,
  );
});
