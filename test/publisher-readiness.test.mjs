import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, mkdir, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { candidate } from '../scripts/audit-publishing-tooling.mjs';
import { verifyPublisherReadiness } from '../scripts/verify-publisher-readiness.mjs';

async function fixture(t, failure) {
  const outputParent = await mkdtemp(join(tmpdir(), 'publisher-readiness-test-'));
  t.after(() => rm(outputParent, { recursive: true, force: true }));
  const calls = [];
  const run = async (command, args) => {
    calls.push({ command, args });
    if (command === 'npm') {
      assert.deepEqual(args.slice(0, 2), ['ci', '--prefix']);
      for (const flag of ['--ignore-scripts', '--no-audit', '--no-fund'])
        assert.ok(args.includes(flag));
      const prefix = args[2];
      assert.ok(prefix.startsWith(outputParent));
      await mkdir(join(prefix, 'node_modules/npm'), { recursive: true });
      if (failure === 'install') throw new Error('registry unavailable');
      return { stdout: 'installed locked distribution\n', stderr: '' };
    }
    assert.equal(command, process.execPath);
    assert.ok(
      calls.some((call) => call.command === 'audit'),
      'Candidate executed before audit',
    );
    if (args.includes('--version'))
      return { stdout: failure === 'version' ? '0.0.0\n' : candidate.version + '\n' };
    assert.deepEqual(args.slice(1), ['pack', '--dry-run', '--ignore-scripts', '--json']);
    if (failure === 'assembly') return { stdout: 'invalid' };
    const manifest = JSON.parse(await readFile('package.json', 'utf8'));
    return {
      stdout: JSON.stringify([
        { name: manifest.name, version: manifest.version, files: [{ path: 'package.json' }] },
      ]),
    };
  };
  const audit = async (prefix, report) => {
    calls.push({ command: 'audit' });
    assert.deepEqual(
      JSON.parse(await readFile(join(prefix, 'package-lock.json'))),
      JSON.parse(await readFile('tooling/npm/package-lock.json')),
    );
    if (failure === 'audit') {
      await writeFile(report, '{"unavailable":true}\n');
      throw new Error('Publishing tooling has high/critical vulnerabilities');
    }
    await writeFile(
      report,
      JSON.stringify({
        metadata: {
          vulnerabilities: { info: 0, low: 0, moderate: 1, high: 0, critical: 0, total: 1 },
        },
      }),
    );
  };
  return { outputParent, run, audit, calls };
}

test('a qualified publisher is not a release approval or publication', async (t) => {
  const f = await fixture(t);
  const before = await readFile('tooling/npm/package-lock.json', 'utf8');
  const result = await verifyPublisherReadiness(
    { projectRoot: resolve('.'), outputParent: f.outputParent },
    f,
  );
  assert.equal(result.status, 'publisher-qualified');
  assert.equal(result.phase, 'complete');
  assert.equal(result.published, false);
  assert.equal(result.oidcVerified, false);
  assert.equal(result.releaseGatesRequired, true);
  assert.equal(result.auditCounts.moderate, 1);
  assert.equal(await readFile('tooling/npm/package-lock.json', 'utf8'), before);
  await assert.rejects(access(join(result.directory, 'tooling/node_modules')), { code: 'ENOENT' });
  assert.equal(
    JSON.parse(await readFile(join(result.directory, 'readiness.json'))).status,
    result.status,
  );
  assert.deepEqual(
    f.calls.map((call) => call.command),
    ['npm', 'audit', process.execPath, process.execPath],
  );
});

for (const phase of ['install', 'audit', 'version', 'assembly']) {
  test(`${phase} failure stays blocked, preserves evidence and removes candidate executables`, async (t) => {
    const f = await fixture(t, phase);
    const result = await verifyPublisherReadiness({ outputParent: f.outputParent }, f);
    assert.equal(result.status, 'blocked');
    assert.equal(result.published, false);
    assert.ok(result.error);
    await access(join(result.directory, 'failure.json'));
    await assert.rejects(access(join(result.directory, 'tooling/node_modules')), {
      code: 'ENOENT',
    });
    if (phase === 'audit') {
      assert.equal(
        await readFile(join(result.directory, 'audit.json'), 'utf8'),
        '{"unavailable":true}\n',
      );
      assert.deepEqual(
        f.calls.map((call) => call.command),
        ['npm', 'audit'],
      );
    }
    if (phase === 'install')
      assert.deepEqual(
        f.calls.map((call) => call.command),
        ['npm'],
      );
  });
}

test('repeat observations never overwrite earlier evidence', async (t) => {
  const f = await fixture(t, 'audit');
  const first = await verifyPublisherReadiness({ outputParent: f.outputParent }, f);
  const second = await verifyPublisherReadiness({ outputParent: f.outputParent }, f);
  assert.notEqual(first.directory, second.directory);
  await access(join(first.directory, 'readiness.json'));
  await access(join(second.directory, 'readiness.json'));
});

test('manual hosted readiness has no publishing identity and retains blocked evidence', async () => {
  const workflow = await readFile('.github/workflows/publisher-readiness.yml', 'utf8');
  assert.match(workflow, /on:\s*\n  workflow_dispatch:/);
  assert.match(workflow, /permissions:\s*\n  contents: read/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /package-manager-cache: false/);
  assert.match(workflow, /npm run publisher:readiness -- "\$RUNNER_TEMP"/);
  assert.match(workflow, /if: always\(\)/);
  assert.match(workflow, /readiness\.json/);
  assert.match(workflow, /audit\.json/);
  for (const forbidden of [
    'id-token:',
    'environment:',
    'continue-on-error:',
    'npm publish',
    'git tag',
  ]) {
    assert.ok(!workflow.includes(forbidden), forbidden);
  }
});
