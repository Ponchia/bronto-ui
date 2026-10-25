import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkPaths } from '../bin/bronto-ui-check.mjs';

const checkerPath = resolve(dirname(fileURLToPath(import.meta.url)), '../bin/bronto-ui-check.mjs');

test('consumer checker reports unknown classes and unresolved reserved tokens', () => {
  const root = mkdtempSync(resolve(tmpdir(), 'bronto-ui-check-'));
  try {
    writeFileSync(
      resolve(root, 'page.html'),
      '<div class="ui-alert ui-notice"><span style="color: var(--space-4)">x</span></div>',
    );
    writeFileSync(
      resolve(root, 'style.css'),
      '.local { --space-local: 1rem; gap: var(--space-local); font-family: ui-monospace, monospace; }',
    );
    mkdirSync(resolve(root, 'node_modules'));
    writeFileSync(resolve(root, 'node_modules/ignored.html'), '<div class="ui-phantom"></div>');
    mkdirSync(resolve(root, 'playwright-report'));
    writeFileSync(
      resolve(root, 'playwright-report/report.html'),
      '<div class="ui-mode ui-mode-sidebar"></div>',
    );
    mkdirSync(resolve(root, 'test-results'));
    writeFileSync(resolve(root, 'test-results/trace.js'), 'const cls = "ui-generated";');
    mkdirSync(resolve(root, '.venv'));
    writeFileSync(resolve(root, '.venv/playwright.js'), 'const cls = "ui-mode";');

    const result = checkPaths([root]);
    assert.equal(result.files, 2);
    assert.deepEqual(
      result.findings.map(({ kind, name }) => [kind, name]),
      [
        ['class', 'ui-notice'],
        ['token', '--space-4'],
      ],
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('consumer checker supports explicit allowlists', () => {
  const root = mkdtempSync(resolve(tmpdir(), 'bronto-ui-check-'));
  try {
    const file = resolve(root, 'page.astro');
    writeFileSync(file, '<div class="ui-local" style="gap:var(--space-local)"></div>');
    const result = checkPaths([file], {
      allowClasses: ['ui-local'],
      allowTokens: ['--space-local'],
    });
    assert.deepEqual(result.findings, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('consumer checker ignores comments but keeps real string and selector literals', () => {
  const root = mkdtempSync(resolve(tmpdir(), 'bronto-ui-check-comments-'));
  try {
    writeFileSync(
      resolve(root, 'style.css'),
      '/* conceptual: ui-themetoggle and var(--space-4) */\n.ui-notice { color: red; }',
    );
    writeFileSync(
      resolve(root, 'app.js'),
      '// conceptual: ui-phantom and var(--space-4)\n' +
        'const reportPath = "../../reports/ui-smoke/index.html";\n' +
        'const className = "ui-app";',
    );
    writeFileSync(
      resolve(root, 'page.html'),
      '<!-- conceptual: ui-ghost and var(--space-4) -->\n<div class="ui-local"></div>',
    );
    writeFileSync(
      resolve(root, 'component.vue'),
      '<script>\n// conceptual: ui-phantom and var(--space-4)\nconst cls = "ui-hybrid";\n</script>',
    );
    writeFileSync(resolve(root, 'README.md'), 'Conceptual prose about ui-themetoggle.');

    const result = checkPaths([root]);
    assert.equal(result.files, 4, 'Markdown prose is outside the runtime-source scan');
    assert.deepEqual(
      result.findings.map(({ kind, name }) => [kind, name]),
      [
        ['class', 'ui-app'],
        ['class', 'ui-hybrid'],
        ['class', 'ui-local'],
        ['class', 'ui-notice'],
      ],
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('consumer checker executes through an npm-style bin symlink', () => {
  const root = mkdtempSync(resolve(tmpdir(), 'bronto-ui-check-bin-'));
  try {
    const link = resolve(root, 'bronto-ui-check');
    symlinkSync(checkerPath, link);
    const output = execFileSync(link, ['--help'], { encoding: 'utf8' });
    assert.match(output, /^Usage: bronto-ui-check/m);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('consumer checker CLI pins clean, finding, JSON, and invocation exit contracts', () => {
  const root = mkdtempSync(resolve(tmpdir(), 'bronto-ui-check-cli-'));
  try {
    const clean = resolve(root, 'clean.html');
    const invalid = resolve(root, 'invalid.html');
    writeFileSync(clean, '<div class="ui-alert"></div>');
    writeFileSync(invalid, '<div class="ui-notice"></div>');
    const run = (...args) =>
      spawnSync(process.execPath, [checkerPath, ...args], { encoding: 'utf8', cwd: root });

    const cleanResult = run('--json', clean);
    assert.equal(cleanResult.status, 0);
    assert.deepEqual(JSON.parse(cleanResult.stdout).findings, []);

    const findingResult = run('--json', invalid);
    assert.equal(findingResult.status, 1);
    assert.deepEqual(
      JSON.parse(findingResult.stdout).findings.map(({ kind, name }) => [kind, name]),
      [['class', 'ui-notice']],
    );

    const invocationResult = run('--unknown-option');
    assert.equal(invocationResult.status, 2);
    assert.match(invocationResult.stderr, /Unknown option/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('consumer checker suggests same-component modifier repairs without accepting aliases', () => {
  const root = mkdtempSync(resolve(tmpdir(), 'bronto-ui-check-hints-'));
  try {
    const file = resolve(root, 'page.html');
    writeFileSync(
      file,
      '<table class="ui-table ui-table--compact"></table>' +
        '<article class="ui-prose ui-prose--dense"></article>' +
        '<button class="ui-button ui-button--ghots">Cancel</button>' +
        '<div class="ui-unknown-part--dense"></div>',
    );
    const result = checkPaths([file]);
    assert.deepEqual(
      result.findings.map(({ name, suggestion }) => [name, suggestion || null]),
      [
        ['ui-table--compact', 'ui-table--dense'],
        ['ui-prose--dense', 'ui-prose--compact'],
        ['ui-button--ghots', 'ui-button--ghost'],
        ['ui-unknown-part--dense', null],
      ],
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('consumer checker hints are visible in text and optional in JSON', () => {
  const root = mkdtempSync(resolve(tmpdir(), 'bronto-ui-check-hints-cli-'));
  try {
    const file = resolve(root, 'page.html');
    writeFileSync(file, '<table class="ui-table ui-table--compact"></table>');
    const run = (...args) =>
      spawnSync(process.execPath, [checkerPath, ...args], { encoding: 'utf8', cwd: root });
    const textResult = run(file);
    assert.equal(textResult.status, 1);
    assert.match(textResult.stderr, /did you mean ui-table--dense\?/);
    const jsonResult = run('--json', file);
    assert.equal(jsonResult.status, 1);
    assert.equal(JSON.parse(jsonResult.stdout).findings[0].suggestion, 'ui-table--dense');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('consumer checker can be imported by a stdin-driven ESM caller', () => {
  const entry = new URL('../bin/bronto-ui-check.mjs', import.meta.url).href;
  const result = spawnSync(process.execPath, ['--input-type=module', '-'], {
    encoding: 'utf8',
    input: `const module = await import(${JSON.stringify(entry)}); console.log(typeof module.checkPaths);`,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), 'function');
});
