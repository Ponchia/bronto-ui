import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

// Execute the workflow's shell itself: a string-presence check cannot prove
// that a skipped dependency fails the aggregate gate or blocks deployment.
function workflowScript(file, marker) {
  const source = readFileSync(new URL(`../.github/workflows/${file}`, import.meta.url), 'utf8');
  const step = source.indexOf(marker);
  assert.notEqual(step, -1, `Missing workflow step: ${marker}`);
  const start = source.indexOf('        run: |\n', step);
  assert.notEqual(start, -1, `Missing shell body: ${marker}`);
  const lines = source.slice(start + '        run: |\n'.length).split('\n');
  const body = [];
  for (const line of lines) {
    if (line.trim() && !line.startsWith('          ')) break;
    body.push(line.slice(10));
  }
  return body.join('\n');
}

function runShell(script, env = {}) {
  return spawnSync('bash', ['--noprofile', '--norc', '-c', script], {
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

const gate = workflowScript('ci.yml', '      - name: Enforce required CI results');
const passed = {
  R_CHANGES: 'success',
  HEAVY: 'true',
  R_CHECK: 'success',
  R_EXAMPLES: 'success',
  R_E2E: 'success',
  R_LAYOUT: 'success',
  R_SAST: 'success',
};

test('CI aggregation accepts complete coverage and proven docs-only skips', () => {
  for (const env of [
    passed,
    { ...passed, HEAVY: 'false', R_EXAMPLES: 'skipped', R_E2E: 'skipped', R_LAYOUT: 'skipped' },
  ]) {
    const result = runShell(gate, env);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
});

test('CI aggregation rejects classifier failures, missing results, and unexpected skips', () => {
  const failures = [
    { R_CHANGES: 'failure', HEAVY: 'false', R_EXAMPLES: 'skipped', R_E2E: 'skipped' },
    { R_CHANGES: 'cancelled', R_EXAMPLES: 'skipped', R_E2E: 'skipped' },
    { R_CHECK: 'skipped', HEAVY: 'false' },
    { R_CHECK: 'failure' },
    { R_SAST: 'failure' },
    { R_SAST: 'skipped', HEAVY: 'false' },
    { R_SAST: 'cancelled' },
    { R_SAST: '' },
    { HEAVY: '' },
    { R_EXAMPLES: 'skipped' },
    { R_E2E: 'skipped' },
    { R_LAYOUT: 'skipped' },
    { R_LAYOUT: 'failure' },
    { R_LAYOUT: 'cancelled' },
    { R_LAYOUT: '' },
    { HEAVY: 'false', R_LAYOUT: 'failure' },
    { HEAVY: 'false', R_LAYOUT: 'cancelled' },
    { HEAVY: 'false', R_EXAMPLES: 'failure' },
    { HEAVY: 'false', R_E2E: 'cancelled' },
  ];
  for (const env of failures) {
    const result = runShell(gate, { ...passed, ...env });
    assert.equal(result.status, 1, `Gate accepted ${JSON.stringify(env)}: ${result.stdout}`);
  }
});

function classify(files, diffExit = '0') {
  const dir = mkdtempSync(join(tmpdir(), 'bronto-workflow-'));
  const output = join(dir, 'outputs');
  try {
    const script = workflowScript('ci.yml', '      - id: detect');
    const result = runShell(
      `git() { printf '%s\n' "$CHANGED_FILES"; return "$DIFF_EXIT"; }\n${script}`,
      {
        EVENT: 'push',
        BEFORE_SHA: 'a'.repeat(40),
        CHANGED_FILES: files,
        DIFF_EXIT: diffExit,
        GITHUB_OUTPUT: output,
      },
    );
    assert.equal(result.status, 0, result.stdout + result.stderr);
    return Object.fromEntries(
      readFileSync(output, 'utf8')
        .trim()
        .split('\n')
        .map((line) => line.split('=')),
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('public website and its shared build inputs receive cross-engine coverage', () => {
  for (const file of [
    'site/site.css',
    'demo/service.js',
    'scripts/build-public-site.mjs',
    'scripts/lib/doc-anchors.mjs',
    'scripts/serve.mjs',
    'docs/index.html',
    'glyphs/glyphs.js',
    'examples/vanilla-vite/index.html',
    'package-lock.json',
    '.github/workflows/e2e.yml',
  ]) {
    assert.deepEqual(classify(file), { heavy: 'true', engine_sensitive: 'true' }, file);
  }
  assert.deepEqual(classify('README.md\ndocs/usage.md'), {
    heavy: 'false',
    engine_sensitive: 'false',
  });
  assert.deepEqual(classify('README.md', '1'), { heavy: 'true', engine_sensitive: 'true' });
});

test('manual Pages deployment requires successful CI and fails closed on API errors', () => {
  const script = workflowScript(
    'pages.yml',
    '      - name: Require successful CI for manual deployment',
  );
  const mocks = `
    git() { printf '%s\n' "$TEST_SHA"; }
    gh() {
      case "$2" in
        *"head_sha=$TEST_SHA"*"status=completed"*) ;;
        *) return 9 ;;
      esac
      printf '%s\n' "$CI_PASSED"
      return "$API_EXIT"
    }
  `;
  for (const [CI_PASSED, API_EXIT, status] of [
    ['true', '0', 0],
    ['false', '0', 1],
    ['', '7', 7],
  ]) {
    const result = runShell(`${mocks}\n${script}`, {
      TEST_SHA: 'b'.repeat(40),
      REPO: 'owner/repository',
      CI_PASSED,
      API_EXIT,
    });
    assert.equal(result.status, status, result.stdout + result.stderr);
  }
});

test('Semgrep findings stay advisory while scanner execution errors fail closed', () => {
  const script = workflowScript('ci.yml', '      - name: Run Semgrep SAST');
  for (const [SCANNER_EXIT, expected] of [
    ['0', 0],
    ['1', 0],
    ['2', 2],
    ['7', 7],
    ['127', 127],
  ]) {
    const result = runShell(`semgrep() { return "$SCANNER_EXIT"; }\n${script}`, {
      SCANNER_EXIT,
    });
    assert.equal(result.status, expected, result.stdout + result.stderr);
  }
});

test('browser report retention preserves successful retries and rejects malformed reports', () => {
  const script = workflowScript('e2e.yml', '      - name: Determine browser report retention');
  const dir = mkdtempSync(join(tmpdir(), 'bronto-browser-report-'));
  const output = join(dir, 'outputs');
  mkdirSync(join(dir, 'test-results'));
  try {
    for (const [stats, expected] of [
      [{ flaky: 0 }, 'false'],
      [{ flaky: 1 }, 'true'],
      [{ flaky: 3 }, 'true'],
      [{}, null],
      [{ flaky: -1 }, null],
      [{ flaky: '1' }, null],
    ]) {
      writeFileSync(join(dir, 'test-results/results.json'), JSON.stringify({ stats }));
      writeFileSync(output, '');
      const result = runShell(`cd "$REPORT_DIR"\n${script}`, {
        REPORT_DIR: dir,
        GITHUB_OUTPUT: output,
      });
      if (expected === null) {
        assert.notEqual(result.status, 0, `Accepted invalid stats: ${JSON.stringify(stats)}`);
      } else {
        assert.equal(result.status, 0, result.stdout + result.stderr);
        assert.equal(readFileSync(output, 'utf8'), `flaky=${expected}\n`);
      }
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
