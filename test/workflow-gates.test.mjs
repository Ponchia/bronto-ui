import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
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
};

test('CI aggregation accepts complete coverage and proven docs-only skips', () => {
  for (const env of [
    passed,
    { ...passed, HEAVY: 'false', R_EXAMPLES: 'skipped', R_E2E: 'skipped' },
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
    { HEAVY: '' },
    { R_EXAMPLES: 'skipped' },
    { R_E2E: 'skipped' },
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
