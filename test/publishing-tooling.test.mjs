import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  auditPublishingTooling,
  candidate,
  verifyAudit,
  verifyBundle,
} from '../scripts/audit-publishing-tooling.mjs';

test('publisher manifest and integrity lock match the explicitly reviewed audit candidate', async () => {
  const manifest = JSON.parse(await readFile('tooling/npm/package.json', 'utf8'));
  const lock = JSON.parse(await readFile('tooling/npm/package-lock.json', 'utf8'));
  assert.equal(manifest.private, true);
  assert.deepEqual(manifest.dependencies, { npm: candidate.version });
  const cli = lock.packages['node_modules/npm'];
  assert.equal(cli.version, candidate.version);
  assert.equal(cli.resolved, candidate.tarball);
  assert.equal(cli.integrity, candidate.integrity);
});

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

test('actual inventory includes scoped packages and multiple nested versions', async (t) => {
  const { directory } = await fixture(t);
  const actual = await verifyBundle(directory);
  assert.equal(actual.size, 4);
  assert.equal(actual.get(`${dependencyPath}/node_modules/example-dependency`).version, '2.0.0');
  assert.equal(actual.get('node_modules/npm/node_modules/@example/scoped').version, '3.0.0');
});

for (const field of ['version', 'resolved', 'integrity']) {
  test(`rejects an unreviewed npm ${field}`, async (t) => {
    const f = await fixture(t);
    f.lock.packages['node_modules/npm'][field] = 'unreviewed';
    await f.save();
    await assert.rejects(verifyBundle(f.directory), /Unexpected publisher/);
  });
}
test('rejects metadata-only remediation of an installed bundled package', async (t) => {
  const f = await fixture(t);
  f.lock.packages[dependencyPath].version = '9.0.0';
  await f.save();
  await assert.rejects(verifyBundle(f.directory), /lock differs from installed bytes/);
});
test('rejects removed audit-root dependency edges', async (t) => {
  const f = await fixture(t);
  f.lock.packages[''].dependencies = {};
  await f.save();
  await assert.rejects(verifyBundle(f.directory), /Audit root must reach/);
});
test('rejects changed bundled dependency edges even with unchanged versions', async (t) => {
  const f = await fixture(t);
  f.lock.packages[dependencyPath].dependencies = { omitted: '1.0.0' };
  await f.save();
  await assert.rejects(verifyBundle(f.directory), /dependency edges differ/);
});
test('rejects a lock omitting an installed bundled package', async (t) => {
  const f = await fixture(t);
  delete f.lock.packages[dependencyPath];
  await f.save();
  await assert.rejects(verifyBundle(f.directory), /lock differs from installed bytes/);
});
test('rejects a lock declaring a package missing from disk', async (t) => {
  const f = await fixture(t);
  f.lock.packages['node_modules/npm/node_modules/missing'] = { version: '1.0.0', inBundle: true };
  await f.save();
  await assert.rejects(verifyBundle(f.directory), /exactly the same packages/);
});
test('rejects package symlinks instead of following dependencies outside the audited tree', async (t) => {
  const { directory } = await fixture(t);
  await symlink(directory, join(directory, 'node_modules/npm/node_modules/linked'));
  await assert.rejects(verifyBundle(directory), /regular directories/);
});
for (const file of ['package-lock.json', `${dependencyPath}/package.json`]) {
  test(`refuses a symlinked ${file} at open rather than checking and reopening its path`, async (t) => {
    const { directory } = await fixture(t);
    const path = join(directory, file);
    const target = join(directory, 'symlink-target.json');
    await writeFile(target, await readFile(path));
    await rm(path);
    await symlink(target, path);
    await assert.rejects(verifyBundle(directory), { code: 'ELOOP' });
  });
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
test('preserves raw malformed output on audit failure and applies a process timeout', async (t) => {
  const { directory } = await fixture(t);
  const output = join(directory, 'report.json');
  await assert.rejects(
    auditPublishingTooling(directory, output, async (command, args, options) => {
      assert.equal(command, 'npm');
      for (const arg of [
        '--package-lock-only',
        '--ignore-scripts',
        '--include=dev',
        '--audit-level=high',
        '--registry=https://registry.npmjs.org',
      ])
        assert.ok(args.includes(arg));
      assert.equal(options.timeout, 90_000);
      throw Object.assign(new Error('service unavailable'), { code: 1, stdout: '<unavailable>' });
    }),
  );
  assert.equal(await readFile(output, 'utf8'), '<unavailable>');
});
test('preserves the full high finding when refusing publication', async (t) => {
  const { directory } = await fixture(t);
  const output = join(directory, 'report.json');
  const raw = JSON.stringify(report('high'));
  await assert.rejects(
    auditPublishingTooling(directory, output, async () => {
      throw Object.assign(new Error('vulnerable'), { code: 1, stdout: raw });
    }),
    /high\/critical/,
  );
  assert.equal(await readFile(output, 'utf8'), raw);
});
