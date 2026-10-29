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

test('Semgrep gates findings and preserves scanner execution failures', () => {
  const script = workflowScript('ci.yml', '      - name: Run Semgrep SAST');
  const dir = mkdtempSync(join(tmpdir(), 'bronto-semgrep-workflow-'));
  const mock = `semgrep() {
    printf '{}' > "$RUNNER_TEMP/semgrep-results/semgrep.json"
    if [ "$SARIF_PRESENT" = true ]; then
      printf '{}' > "$RUNNER_TEMP/semgrep-results/semgrep.sarif"
    fi
    return "$SCANNER_EXIT"
  }
  python3() { return "$GATE_EXIT"; }`;
  try {
    for (const [SCANNER_EXIT, GATE_EXIT, expected] of [
      ['0', '0', 0],
      ['1', '0', 0],
      ['0', '1', 1],
      ['1', '1', 1],
      ['2', '99', 2],
      ['7', '99', 7],
      ['127', '99', 127],
    ]) {
      const result = runShell(`${mock}\n${script}`, {
        SCANNER_EXIT,
        GATE_EXIT,
        RUNNER_TEMP: dir,
        SARIF_PRESENT: 'true',
      });
      assert.equal(result.status, expected, result.stdout + result.stderr);
    }
    rmSync(join(dir, 'semgrep-results/semgrep.sarif'));
    const missing = runShell(`${mock}\n${script}`, {
      SCANNER_EXIT: '0',
      GATE_EXIT: '0',
      RUNNER_TEMP: dir,
      SARIF_PRESENT: 'false',
    });
    assert.equal(missing.status, 1, 'A missing SARIF report must fail the job');
  } finally {
    rmSync(dir, { recursive: true, force: true });
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

test('WebKit Noble is an independent required non-pixel workflow and Jammy retains Chromium snapshots', () => {
  const caller = readFileSync(new URL('../.github/workflows/e2e.yml', import.meta.url), 'utf8');
  const webkit = readFileSync(
    new URL('../.github/workflows/e2e-webkit-noble.yml', import.meta.url),
    'utf8',
  );
  const config = readFileSync(new URL('../playwright.config.mjs', import.meta.url), 'utf8');

  assert.match(
    caller,
    /  webkit:\n    if: inputs\.cross_engine\n    uses: \.\/\.github\/workflows\/e2e-webkit-noble\.yml/,
  );
  assert.match(caller, /mcr\.microsoft\.com\/playwright:v1\.60\.0-jammy@sha256:[a-f0-9]{64}/);
  assert.match(webkit, /mcr\.microsoft\.com\/playwright:v1\.60\.0-noble@sha256:[a-f0-9]{64}/);
  assert.match(webkit, /shard: \[1, 2, 3\]/);
  assert.match(webkit, /name: playwright-report-webkit-/);
  assert.match(webkit, /steps\.reports\.outputs\.flaky == 'true'/);
  assert.match(config, /testMatch: NON_PIXEL_E2E_TEST_MATCH/);
  assert.match(config, /retries: process\.env\.CI \? 2 : 0/);
  assert.match(config, /trace: 'retain-on-failure'/);
  assert.doesNotMatch(webkit, /--project=chromium|--project=firefox|--update-snapshots/);

  const jammyShell = workflowScript(
    'e2e.yml',
    '      - name: Run e2e (Chromium and optional Firefox)',
  );
  const nobleShell = workflowScript(
    'e2e-webkit-noble.yml',
    '      - name: Run WebKit non-pixel e2e',
  );
  const mock = String.raw`npx() { printf '%s\n' "$*"; }` + '\n';
  for (const [crossEngine, expected] of [
    ['true', 'playwright test --project=chromium --project=firefox --shard=2/3'],
    ['false', 'playwright test --project=chromium --shard=2/3'],
  ]) {
    const result = runShell(mock + jammyShell, { CROSS_ENGINE: crossEngine, SHARD: '2' });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), expected);
    assert.doesNotMatch(result.stdout, /webkit/, 'Jammy must never include WebKit');
  }
  const webkitRun = runShell(mock + nobleShell, { SHARD: '2' });
  assert.equal(webkitRun.status, 0, webkitRun.stderr);
  assert.equal(webkitRun.stdout.trim(), 'playwright test --project=webkit --shard=2/3');
});
