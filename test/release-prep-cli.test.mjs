import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
  existsSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('../', import.meta.url));
const tracked = [
  'package.json',
  'package-lock.json',
  'CHANGELOG.md',
  'README.md',
  'llms.txt',
  'docs/README.md',
  'docs/integration.md',
  'docs/stability.md',
  '.github/ISSUE_TEMPLATE/bug_report.yml',
];

function fixture(t, heading = '## Unreleased') {
  const root = mkdtempSync(join(tmpdir(), 'bronto-release-prep-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const write = (name, text) => {
    mkdirSync(dirname(join(root, name)), { recursive: true });
    writeFileSync(join(root, name), text);
  };
  const pkg = {
    name: '@ponchia/ui',
    version: '0.6.5',
    type: 'module',
    files: ['docs/stability.md'],
    devDependencies: { locked: '^1.0.0' },
  };
  const lock = {
    name: pkg.name,
    version: pkg.version,
    lockfileVersion: 3,
    packages: {
      '': { ...pkg },
      'node_modules/locked': {
        version: '1.0.0',
        resolved: 'https://registry.example.test/locked.tgz',
        integrity: 'test-lock-integrity',
      },
    },
  };
  write('package.json', JSON.stringify(pkg, null, 2) + '\n');
  write('package-lock.json', JSON.stringify(lock, null, 2) + '\n');
  write(
    'CHANGELOG.md',
    `# Changelog\n\n${heading}\n\n### Fixed\n\nA fix.\n\n## 0.6.5 — 2026-06-09\n\nHistorical notes.\n`,
  );
  for (const name of ['README.md', 'llms.txt', 'docs/README.md', 'docs/integration.md'])
    write(name, 'Install @ponchia/ui@0.6.5/css/report.css\n');
  write('docs/stability.md', 'PATCH releases (`0.6.x`)\n');
  write('.github/ISSUE_TEMPLATE/bug_report.yml', "placeholder: '0.6.5'\n");
  for (const name of [
    'scripts/release-prep.mjs',
    'scripts/lib/version-surfaces.mjs',
    'scripts/lib/shipped-docs.mjs',
    'scripts/lib/stdio.mjs',
  ]) {
    mkdirSync(dirname(join(root, name)), { recursive: true });
    cpSync(join(repo, name), join(root, name));
  }
  // A version-only operation must not resolve/install dependencies. Fail if
  // release:prep tries invoking npm, even when the normal host is online.
  write('bin/npm', '#!/bin/sh\nexit 79\n');
  const read = (name) => readFileSync(join(root, name), 'utf8');
  const snapshot = () =>
    Object.fromEntries(
      tracked.map((name) => [name, existsSync(join(root, name)) ? read(name) : null]),
    );
  const run = (...args) =>
    spawnSync(process.execPath, [join(root, 'scripts/release-prep.mjs'), ...args], {
      cwd: root,
      encoding: 'utf8',
      timeout: 10000,
      env: { ...process.env, PATH: join(root, 'bin') },
    });
  return { root, read, write, snapshot, run, lock };
}

test('release prep dates a plain heading and changes only lock root version metadata offline', (t) => {
  const f = fixture(t);
  const result = f.run('0.7.0');
  assert.equal(result.status, 0, result.stderr + result.stdout);
  const pkg = JSON.parse(f.read('package.json'));
  const lock = JSON.parse(f.read('package-lock.json'));
  assert.equal(pkg.version, '0.7.0');
  assert.equal(lock.version, '0.7.0');
  assert.equal(lock.packages[''].version, '0.7.0');
  assert.deepEqual(lock.packages['node_modules/locked'], f.lock.packages['node_modules/locked']);
  assert.deepEqual(lock.packages[''].devDependencies, f.lock.packages[''].devDependencies);
  assert.match(f.read('CHANGELOG.md'), /^## 0\.7\.0 — \d{4}-\d{2}-\d{2}$/m);
  assert.match(f.read('README.md'), /@ponchia\/ui@0\.7\.0/);
  assert.equal(f.read('docs/stability.md'), 'PATCH releases (`0.7.x`)\n');
  assert.equal(f.read('.github/ISSUE_TEMPLATE/bug_report.yml'), "placeholder: '0.7.0'\n");
  const before = f.snapshot();
  assert.equal(f.run('0.7.0').status, 0, 'repeating a prepared release is a no-op');
  assert.deepEqual(f.snapshot(), before);
});

test('release prep names the plain prerelease section without dating it', (t) => {
  const f = fixture(t);
  const result = f.run('0.7.0-rc.1');
  assert.equal(result.status, 0, result.stderr + result.stdout);
  assert.match(f.read('CHANGELOG.md'), /^## Unreleased — 0\.7\.0$/m);
  assert.doesNotMatch(f.read('CHANGELOG.md'), /^## 0\.7\.0 — /m);
  assert.match(f.read('README.md'), /@ponchia\/ui@0\.7\.0-rc\.1/);
  assert.equal(f.run('0.7.0').status, 0, 'a candidate can become stable');
  assert.match(f.read('CHANGELOG.md'), /^## 0\.7\.0 — \d{4}-\d{2}-\d{2}$/m);
});

for (const heading of [
  '## Unreleased — 0.8.0',
  '## Unreleased\n\n## Unreleased — 0.7.0',
  '## Unreleased\n\n## 0.7.0 — 2026-06-10',
]) {
  test(`release prep refuses missing/ambiguous target headings without partial changes: ${heading.replaceAll('\n', ' ')}`, (t) => {
    const f = fixture(t, heading);
    const before = f.snapshot();
    const result = f.run('0.7.0');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /CHANGELOG/);
    assert.deepEqual(f.snapshot(), before);
  });
}

test('release prep rejects a mismatched lock before writing any files', (t) => {
  const f = fixture(t);
  f.lock.packages[''].version = '0.6.4';
  f.write('package-lock.json', JSON.stringify(f.lock));
  const before = f.snapshot();
  assert.notEqual(f.run('0.7.0').status, 0);
  assert.deepEqual(f.snapshot(), before);
});

test('release prep rejects a missing documented file before writing any files', (t) => {
  const f = fixture(t);
  rmSync(join(f.root, 'docs/stability.md'));
  const before = f.snapshot();
  assert.notEqual(f.run('0.7.0').status, 0);
  assert.deepEqual(f.snapshot(), before);
});

test('release prep rejects malformed SemVer and extra arguments without changes', (t) => {
  const f = fixture(t);
  const before = f.snapshot();
  for (const args of [['01.7.0'], ['0.7.0-01'], ['0.7.0-rc..1'], ['0.7.0', 'extra']]) {
    const result = f.run(...args);
    assert.notEqual(result.status, 0, args.join(' '));
    assert.deepEqual(f.snapshot(), before);
  }
});
