// Release pipeline and fail-closed audit contract for the active source publisher.
// Historical vulnerable npm bundles are not executable inputs or lockfiles.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { verifyAudit } from '../scripts/lib/publisher-audit.mjs';

test('both release stages require a successful actual-bundle audit before package execution', async () => {
  const workflow = await readFile('.github/workflows/release.yml', 'utf8');
  for (const [name, command] of [
    ['publish-preflight', 'pack --dry-run --ignore-scripts'],
    ['publish-npm', 'publish --ignore-scripts'],
  ]) {
    const body = workflow.split(`\n  ${name}:\n`)[1].split(/\n  [a-z][\w-]*:\n/)[0];
    const audit = body.indexOf(
      'node scripts/source-publisher.mjs audit "${RUNNER_TEMP}/bronto-publisher"',
    );
    const install = body.indexOf(
      'node scripts/source-publisher.mjs prepare "${RUNNER_TEMP}/bronto-publisher"',
    );
    assert.ok(audit > install && install >= 0);
    assert.ok(body.indexOf(command) > audit);
    assert.ok(!body.slice(0, body.indexOf(command)).includes('continue-on-error'));
    assert.ok(body.includes('if: always()'));
    assert.ok(body.includes('publishing-tooling-audit.json*'));
  }
});

const dependencyPath = 'node_modules/npm/node_modules/example-dependency';
const inventory = new Map([[dependencyPath, { name: 'example-dependency', version: '1.0.0' }]]);
function report(severity) {
  const vulnerabilities = severity
    ? { 'example-dependency': { name: 'example-dependency', severity, nodes: [dependencyPath] } }
    : {};
  const counts = { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: severity ? 1 : 0 };
  if (severity) counts[severity] = 1;
  return { auditReportVersion: 2, vulnerabilities, metadata: { vulnerabilities: counts } };
}

async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'publisher-audit-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const packages = {
    '': { name: 'publisher-audit', dependencies: { npm: candidate.version } },
    'node_modules/npm': {
      version: candidate.version,
      resolved: candidate.tarball,
      integrity: candidate.integrity,
    },
    [dependencyPath]: { version: '1.0.0', inBundle: true },
    [`${dependencyPath}/node_modules/example-dependency`]: { version: '2.0.0', inBundle: true },
    'node_modules/npm/node_modules/@example/scoped': { version: '3.0.0', inBundle: true },
  };
  for (const [path, entry] of Object.entries(packages)) {
    if (!path) continue;
    await mkdir(join(directory, path), { recursive: true });
    const name = path === 'node_modules/npm' ? 'npm' : path.split('/node_modules/').at(-1);
    await writeFile(
      join(directory, path, 'package.json'),
      JSON.stringify({ name, version: entry.version }),
    );
  }
  const lock = { lockfileVersion: 3, packages };
  const save = () => writeFile(join(directory, 'package-lock.json'), JSON.stringify(lock));
  await save();
  return { directory, lock, save };
}

test('accepts a complete clean audit and retains moderate findings', () => {
  verifyAudit(report(), 0, inventory);
  assert.equal(verifyAudit(report('moderate'), 0, inventory).moderate, 1);
});
for (const level of ['high', 'critical']) {
  test(`blocks ${level} findings even if the CLI incorrectly exits zero`, () => {
    assert.throws(() => verifyAudit(report(level), 0, inventory), /high\/critical/);
    assert.throws(() => verifyAudit(report(level), 1, inventory), /high\/critical/);
  });
}
for (const value of [
  {},
  [],
  null,
  { ...report(), error: { code: 'E503' } },
  { ...report(), auditReportVersion: 3 },
]) {
  test(`rejects malformed or unavailable audit result ${JSON.stringify(value)}`, () => {
    assert.throws(() => verifyAudit(value, 0, inventory));
  });
}
test('blocks inconsistent counters and findings outside the inventory', () => {
  const high = report('high');
  high.metadata.vulnerabilities.high = 0;
  assert.throws(() => verifyAudit(high, 0, inventory), /counts differ/);
  const outside = report('moderate');
  outside.vulnerabilities['example-dependency'].nodes = ['node_modules/other'];
  assert.throws(() => verifyAudit(outside, 0, inventory), /outside installed inventory/);
  const malformed = report();
  malformed.metadata.vulnerabilities.total = '0';
  assert.throws(() => verifyAudit(malformed, 0, inventory), /Invalid audit total/);
});
test('blocks unsuccessful CLI exits even with clean JSON', () => {
  for (const code of [1, 2, 'ENOENT', undefined])
    assert.throws(() => verifyAudit(report(), code, inventory));
});

test('the old bundled npm candidate is not a committed dependency graph', async () => {
  const { access } = await import('node:fs/promises');
  await assert.rejects(access('tooling/npm/package-lock.json'), { code: 'ENOENT' });
  await assert.rejects(access('tooling/npm/package.json'), { code: 'ENOENT' });
  const workflow = await readFile('.github/workflows/release.yml', 'utf8');
  assert.match(workflow, /source-publisher\.mjs/);
  assert.doesNotMatch(workflow, /tooling\/npm\//);
});
