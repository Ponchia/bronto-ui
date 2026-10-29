import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync('.github/workflows/firefox-dialog-diagnostics.yml', 'utf8');

test('Firefox diagnostic is manual-only and cannot change production browser policy', () => {
  assert.match(workflow, /^on:\n  workflow_dispatch:/m);
  assert.doesNotMatch(workflow, /^  (push|pull_request|schedule):/m);
  assert.match(workflow, /^permissions:\n  contents: read/m);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(
    workflow,
    /v1\.60\.0-jammy@sha256:e1529a04087193966ea15d4a1617345bdaa0791690a24ab2c42b65f9ce5b2cdc/,
  );
  assert.match(workflow, /matrix:\n        workers: \[1, 3\]/);
  assert.match(workflow, /--project=firefox/);
  assert.match(workflow, /test\/e2e\/quality\.spec\.mjs/);
  assert.match(workflow, /quality — demo runs clean/);
  assert.match(workflow, /--repeat-each=40/);
  assert.match(workflow, /--retries=0/);
  assert.match(workflow, /DEBUG: 'pw:api,pw:browser\*'/);
  assert.match(workflow, /test-results\//);
  assert.match(workflow, /retention-days: 14/);
  for (const unsafe of [
    'continue-on-error:',
    'npm publish',
    'id-token: write',
    '--update-snapshots',
    'test.skip',
    '--timeout',
    'sleep 10',
  ]) {
    assert.ok(!workflow.includes(unsafe), `The manual diagnostic must not use ${unsafe}`);
  }
});
