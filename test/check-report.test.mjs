import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkOptions, runChecks } from '../scripts/run-checks.mjs';

const scripts = { lint: 'lint', 'check:first': 'a', other: 'ignored', 'check:new': 'b' };

test('the manifest remains complete and serial; a failed gate does not hide later verdicts', () => {
  const seen = [],
    reports = [];
  const result = runChecks(scripts, {
    execute(name) {
      seen.push(name);
      return { status: name === 'check:first' ? 2 : 0 };
    },
    report(value) {
      reports.push(value);
    },
  });
  assert.deepEqual(seen, ['lint', 'check:first', 'check:new']);
  assert.equal(result.state, 'failed');
  assert.deepEqual(
    result.results.map(({ name, state, exitCode }) => [name, state, exitCode]),
    [
      ['lint', 'passed', 0],
      ['check:first', 'failed', 2],
      ['check:new', 'passed', 0],
    ],
  );
  assert.ok(result.results.every((gate) => gate.seconds >= 0));
  assert.ok(
    reports[0].results.every((gate) => gate.state === 'not-run'),
    'earlier snapshots stay unchanged',
  );
  assert.deepEqual(reports.at(-1), result);
});

test('bail and signals retain explicit not-run rows, never a false pass', () => {
  for (const response of [{ status: 1 }, { status: null, signal: 'SIGTERM' }]) {
    const result = runChecks(scripts, { bail: true, execute: () => response });
    assert.equal(result.results[0].state, response.signal ? 'interrupted' : 'failed');
    assert.ok(result.results.slice(1).every((gate) => gate.state === 'not-run'));
    assert.notEqual(result.state, 'passed');
  }
});

test('spawn failures retain the cause and a complete successful run reports all gates', () => {
  const error = runChecks(scripts, {
    execute: () => ({ status: null, error: new Error('spawn refused') }),
  });
  assert.equal(error.state, 'failed');
  assert.ok(
    error.results.every((gate) => gate.error === 'spawn refused' && gate.exitCode === null),
  );
  const pass = runChecks(scripts, { execute: () => ({ status: 0 }) });
  assert.equal(pass.state, 'passed');
  assert.equal(pass.results.length, 3);
});

test('the optional report has an explicit absolute destination; unsupported execution flags refuse', () => {
  assert.deepEqual(checkOptions([]), { bail: false, report: undefined });
  assert.deepEqual(checkOptions(['--bail', '--report=/tmp/checks.json']), {
    bail: true,
    report: '/tmp/checks.json',
  });
  for (const option of ['--report=', '--report=relative.json', '--jobs=2', '--oops'])
    assert.throws(() => checkOptions([option]));
});

import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

test('the real serial npm runner writes complete reports without losing lifecycle output', () => {
  const repository = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  for (const bail of [false, true]) {
    const root = mkdtempSync(join(tmpdir(), 'bronto-check-report-'));
    try {
      mkdirSync(join(root, 'scripts/lib'), { recursive: true });
      for (const file of [
        'scripts/run-checks.mjs',
        'scripts/lib/emit.mjs',
        'scripts/lib/stdio.mjs',
      ])
        copyFileSync(join(repository, file), join(root, file));
      writeFileSync(
        join(root, 'package.json'),
        JSON.stringify({
          private: true,
          type: 'module',
          scripts: {
            lint: 'node scripts/pass.mjs',
            'precheck:first': 'node scripts/pass.mjs',
            'check:first': 'node scripts/fail.mjs',
            'check:last': 'node scripts/last.mjs',
          },
        }),
      );
      writeFileSync(join(root, 'scripts/pass.mjs'), 'console.log("lifecycle-output");');
      writeFileSync(
        join(root, 'scripts/fail.mjs'),
        'console.error("original-finding"); process.exitCode=2;',
      );
      writeFileSync(join(root, 'scripts/last.mjs'), 'console.log("last-ran");');
      const report = join(root, 'report.json');
      const run = spawnSync(
        process.execPath,
        ['scripts/run-checks.mjs', `--report=${report}`, ...(bail ? ['--bail'] : [])],
        { cwd: root, encoding: 'utf8', timeout: 10000 },
      );
      assert.equal(run.error, undefined);
      assert.equal(run.status, 1);
      assert.match(run.stderr, /original-finding/);
      assert.equal(run.stdout.split('lifecycle-output').length - 1, 2);
      const result = JSON.parse(readFileSync(report, 'utf8'));
      assert.equal(result.state, 'failed');
      assert.deepEqual(
        result.results.map((gate) => gate.state),
        ['passed', 'failed', bail ? 'not-run' : 'passed'],
      );
      assert.equal(run.stdout.includes('last-ran'), !bail);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }
});
