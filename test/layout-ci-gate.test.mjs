import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ci = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
const layout = readFileSync(
  new URL('../.github/workflows/layout-contract-smoke.yml', import.meta.url),
  'utf8',
);

test('the required CI gate receives real layout contract results', () => {
  assert.match(
    ci,
    /layout:\n\s*needs: changes\n\s*if: needs\.changes\.outputs\.heavy == 'true'\n\s*uses: \.\/\.github\/workflows\/layout-contract-smoke\.yml/,
  );
  assert.match(ci, /needs: \[changes, check, examples, e2e, layout, sast\]/);
  assert.match(ci, /R_LAYOUT:/);
  assert.match(ci, /for r in "\$R_EXAMPLES" "\$R_E2E" "\$R_LAYOUT"; do/);
  assert.match(ci, /if \[ "\$HEAVY" = "false" \] && \[ "\$r" = "skipped" \]/);
  assert.match(ci, /for r in "\$R_CHANGES" "\$R_CHECK" "\$R_SAST"; do/);
});

test('reusable layout workflow only runs once per normal PR/push', () => {
  assert.match(layout, /\non:\n\s+workflow_call:\n\s+workflow_dispatch:\n/);
  assert.doesNotMatch(layout, /\n\s+pull_request:\n|\n\s+push:\n/);
  for (const name of ['home.json', 'operations.json', 'service-demo.json']) {
    assert.ok(layout.includes('test/layout/' + name), name);
  }
  assert.match(layout, /CHROME_PATH: \/usr\/bin\/google-chrome/);
  assert.match(layout, /doctor --verify-launch --json/);
  assert.ok(
    layout.includes('group: bronto-layout-${{ github.event_name }}-${{ github.ref }}'),
    'Manual dispatch must not cancel a required layout run on the same ref',
  );
  assert.ok(!layout.includes('BRONTO_CHROME_NO_SANDBOX=1'));
  assert.ok(layout.includes('demo-toolbar-aligns-with-job-panel'));
});
