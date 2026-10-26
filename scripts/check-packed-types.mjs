/** Validate existing release artifacts, then inspect their exact tarball.
 * ATTW's --pack runs prepack, which rebuilds already-checked artifacts and can
 * repair a stale file before the check sees it. Packaging here is read-only;
 * the real publication prepack still performs its complete build.
 */
import { spawnSync } from 'node:child_process';
import { lstatSync, mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { constants, tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { isMain, repoRoot } from './lib/emit.mjs';

const require = createRequire(import.meta.url);
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function execute(command, args, options) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const error = new Error(`${command} failed (${result.signal ?? result.status})`);
    error.exitCode =
      result.status ?? (result.signal ? 128 + (constants.signals[result.signal] ?? 0) : 1);
    throw error;
  }
  return result.stdout ?? '';
}

export function checkPackedTypes(root = repoRoot, run = execute) {
  run(npm, ['run', 'verify:artifacts'], { cwd: root, stdio: 'inherit' });
  const scratch = realpathSync(mkdtempSync(join(tmpdir(), 'bronto-types-')));
  try {
    const packed = JSON.parse(
      run(npm, ['pack', '--ignore-scripts', '--json', '--pack-destination', scratch], {
        cwd: root,
        stdio: ['ignore', 'pipe', 'inherit'],
      }),
    );
    const name = packed[0]?.filename;
    if (
      !Array.isArray(packed) ||
      packed.length !== 1 ||
      typeof name !== 'string' ||
      basename(name) !== name ||
      !name.endsWith('.tgz')
    ) {
      throw new Error('npm pack must return exactly one local tarball');
    }
    const tarball = join(scratch, name);
    if (!lstatSync(tarball).isFile() || realpathSync(tarball) !== tarball) {
      throw new Error('Packed artifact must be a regular file in the owned scratch directory');
    }
    const cli = join(
      dirname(require.resolve('@arethetypeswrong/cli/package.json')),
      'dist/index.js',
    );
    run(
      process.execPath,
      [cli, tarball, '--ignore-rules', 'no-resolution', 'cjs-resolves-to-esm'],
      {
        cwd: root,
        stdio: 'inherit',
      },
    );
    return { filename: name, integrity: packed[0].integrity };
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

if (isMain(import.meta.url)) {
  try {
    checkPackedTypes();
  } catch (error) {
    console.error(error.message);
    process.exitCode = error.exitCode ?? 1;
  }
}
