// Dist-tag routing for release.yml: `latest` only moves forward.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { distTagFor } from '../scripts/release-dist-tag.mjs';

test('a newer or equal stable takes latest', () => {
  assert.equal(distTagFor('0.18.2', '0.18.1'), 'latest');
  assert.equal(distTagFor('0.19.0', '0.18.1'), 'latest');
  assert.equal(distTagFor('1.0.0', '0.18.1'), 'latest');
  assert.equal(distTagFor('v0.18.1', '0.18.1'), 'latest');
  assert.equal(distTagFor('0.18.10', '0.18.9'), 'latest');
});

test('an older stable goes to its maintenance line, never latest', () => {
  assert.equal(distTagFor('0.17.2', '0.18.1'), 'maint-0.17');
  assert.equal(distTagFor('0.18.0', '0.18.1'), 'maint-0.18');
  assert.equal(distTagFor('0.9.9', '0.10.0'), 'maint-0.9');
  assert.equal(distTagFor('0.18.9', '1.0.0'), 'maint-0.18');
});

test('prereleases go to next whatever latest is', () => {
  assert.equal(distTagFor('0.19.0-rc.1', '0.18.1'), 'next');
  assert.equal(distTagFor('0.17.3-rc.1', '0.18.1'), 'next');
  assert.equal(distTagFor('0.19.0-rc.1', ''), 'next');
});

test('build metadata does not count as a prerelease', () => {
  assert.equal(distTagFor('0.18.2+build.1', '0.18.1'), 'latest');
});

test('invalid or unknown versions fail closed', () => {
  for (const latest of ['', undefined, 'latest', '0.18', '0.18.1-rc.1'])
    assert.throws(() => distTagFor('0.18.2', latest));
  for (const version of ['', '0.18', 'v', '01.2.3', '0.18.1 '])
    assert.throws(() => distTagFor(version, '0.18.1'));
});

test('the CLI prints the tag and exits 2 on invalid input', () => {
  const run = (...args) =>
    spawnSync(process.execPath, ['scripts/release-dist-tag.mjs', ...args], { encoding: 'utf8' });
  const ok = run('0.17.2', '0.18.1');
  assert.equal(ok.status, 0);
  assert.equal(ok.stdout, 'maint-0.17\n');
  const bad = run('0.18.2', '');
  assert.equal(bad.status, 2);
  assert.equal(bad.stdout, '');
});

test('maintenance tags keep a prefix: npm refuses a tag that parses as a SemVer range', () => {
  // A bare `0.17` or `v0.17` is the range >=0.17.0 <0.18.0-0, so `npm publish --tag` rejects it.
  assert.match(distTagFor('0.17.2', '0.18.1'), /^maint-\d+\.\d+$/);
});

test('release.yml routes the npm tag and GitHub Latest through the router', async () => {
  const workflow = await readFile('.github/workflows/release.yml', 'utf8');
  const publish = workflow.split('\n  publish-npm:\n')[1].split('\n  release-notes:\n')[0];
  const router = publish.indexOf('node scripts/release-dist-tag.mjs');
  assert.ok(router > 0);
  assert.ok(publish.indexOf('view @ponchia/ui dist-tags.latest') < router);
  assert.ok(publish.indexOf('publish --ignore-scripts --tag "$dist_tag"') > router);
  assert.match(publish, /dist_tag: \$\{\{ steps\.dist-tag\.outputs\.dist_tag \}\}/);
  assert.doesNotMatch(publish, /dist_tag=latest/);
  const notes = workflow.split('\n  release-notes:\n')[1];
  assert.match(notes, /make_latest: \$\{\{ needs\.publish-npm\.outputs\.dist_tag == 'latest' \}\}/);
});
