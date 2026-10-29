import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('manual WebKit crash probe uses the exact original test without weakening CI', async () => {
  const workflow = await readFile('.github/workflows/webkit-crash-diagnostics.yml', 'utf8');
  for (const required of [
    'workflow_dispatch:',
    'contents: read',
    'mcr.microsoft.com/playwright:v1.60.0-jammy@sha256:',
    'distro: jammy',
    'distro: noble',
    'workers: 1',
    'workers: 3',
    'image: ${{ matrix.image }}',
    'mcr.microsoft.com/playwright:v1.60.0-noble@sha256:9bd26ad900bb5e0f4dee75839e957a89ae89c2b7ab1e76050e559790e946b948',
    'webkit-crash-${{ matrix.distro }}-workers-${{ matrix.workers }}',
    '--project=webkit',
    '--repeat-each=30',
    '--retries=0',
    'public site — each example points to real source and has a mobile fallback',
    'webkit-processes.log',
    '/sys/fs/cgroup/memory.events',
    "awk '$2 ~ /WebKit|MiniBrowser|WebProcess|NetworkProcess/ { print }'",
    'if: always()',
  ])
    assert.ok(workflow.includes(required), required);
  for (const forbidden of ['id-token:', 'contents: write', 'pull-requests: write', 'npm publish']) {
    assert.ok(!workflow.includes(forbidden), forbidden);
  }
});

test('manual WebKit A/B keeps two pinned OS variants and worker counts paired', async () => {
  const workflow = await readFile('.github/workflows/webkit-crash-diagnostics.yml', 'utf8');
  // Match fixed, reviewed matrix syntax. No non-literal regular expressions
  // are needed in the security-gated public test source.
  const rows = [...workflow.matchAll(/- distro: (jammy|noble)\n\s+workers: (\d+)/g)];
  assert.equal(rows.length, 4, 'four independent A/B cells, no hidden extra runs');
  for (const distro of ['jammy', 'noble']) {
    assert.deepEqual(
      rows
        .filter((match) => match[1] === distro)
        .map((match) => Number(match[2]))
        .sort(),
      [1, 3],
      `${distro} must have 1 and 3 workers`,
    );
  }
  assert.equal((workflow.match(/--retries=0/g) ?? []).length, 1);
});
