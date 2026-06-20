import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  isAlwaysIncludedPackageFile,
  isUnderPackageFiles,
  npmPackFiles,
} from '../scripts/lib/shipped-files.mjs';

test('npmPackFiles returns repo-relative POSIX tarball paths', () => {
  const root = mkdtempSync(join(tmpdir(), 'bronto-ui-shipped-files-'));
  try {
    mkdirSync(join(root, 'src'));
    writeFileSync(
      join(root, 'package.json'),
      JSON.stringify({ name: 'pack-fixture', version: '1.0.0', files: ['src'] }),
    );
    writeFileSync(join(root, 'README.md'), 'fixture');
    writeFileSync(join(root, 'src', 'index.js'), '');
    writeFileSync(join(root, 'src', 'index.d.ts'), '');
    writeFileSync(join(root, 'omitted.js'), '');

    assert.deepEqual(npmPackFiles(root).sort(), [
      'README.md',
      'package.json',
      'src/index.d.ts',
      'src/index.js',
    ]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('package file membership helpers cover normalized file and directory entries', () => {
  const pkg = { files: ['css/', './tokens/index.js', 'docs/usage.md'] };

  assert.equal(isAlwaysIncludedPackageFile('package.json'), true);
  assert.equal(isAlwaysIncludedPackageFile('./package.json'), true);
  assert.equal(isAlwaysIncludedPackageFile('README.md'), true);
  assert.equal(isAlwaysIncludedPackageFile('README\\docs.md'), false);
  assert.equal(isAlwaysIncludedPackageFile('CHANGELOG.md'), true);
  assert.equal(isAlwaysIncludedPackageFile('docs/usage.md'), false);

  assert.equal(isUnderPackageFiles(pkg, 'css/core.css'), true);
  assert.equal(isUnderPackageFiles(pkg, './tokens/index.js'), true);
  assert.equal(isUnderPackageFiles(pkg, 'tokens/index.d.ts'), false);
  assert.equal(isUnderPackageFiles(pkg, 'docs/usage.md'), true);
  assert.equal(isUnderPackageFiles(pkg, 'docs/usage.md/child'), false);
  assert.equal(isUnderPackageFiles({ files: ['docs\\'] }, 'docs\\usage.md'), true);
  assert.equal(isUnderPackageFiles(pkg, 'docs/other.md'), false);
  assert.equal(isUnderPackageFiles({ files: ['dist'] }, 'dist/bronto.css'), true);
  assert.equal(isUnderPackageFiles({ files: ['dist'] }, 'dist/nested/file.js'), true);
  assert.equal(isUnderPackageFiles({ files: ['llms.txt'] }, 'llms.txt/child'), false);
});
