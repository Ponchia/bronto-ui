import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('manual WebKit crash probe uses the exact original test without weakening CI', async () => {
  const workflow = await readFile('.github/workflows/webkit-crash-diagnostics.yml', 'utf8');
  for (const required of [
    'workflow_dispatch:',
    'contents: read',
    'mcr.microsoft.com/playwright:v1.60.0-jammy@sha256:',
    'workers: [1, 3]',
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
