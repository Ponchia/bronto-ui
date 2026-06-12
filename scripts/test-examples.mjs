/**
 * Build every consumer example against the packed tarball, then browser-smoke
 * the examples with runtime assertions. Work happens in a temp directory so
 * local verification does not rewrite example lockfiles or build outputs.
 *
 * Run: node scripts/test-examples.mjs [example-name ...] [--keep-temp]
 */
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BROWSER_SMOKE_EXAMPLE_NAMES, EXAMPLE_NAMES, defaultDistDirFor } from './lib/examples.mjs';
import { log } from './lib/stdio.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const keepTemp = args.includes('--keep-temp');
const selected = args.filter((arg) => arg !== '--keep-temp');
const examples = selected.length ? selected : EXAMPLE_NAMES;

const unknown = examples.filter((name) => !EXAMPLE_NAMES.includes(name));
if (unknown.length) {
  console.error(`Unknown example(s): ${unknown.join(', ')}`);
  console.error(`Known examples: ${EXAMPLE_NAMES.join(', ')}`);
  process.exit(1);
}

const tempRoot = mkdtempSync(resolve(tmpdir(), 'bronto-ui-examples-'));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
let failed = false;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? root,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit ${result.status}`);
  }
}

function copyExample(name) {
  const source = resolve(root, 'examples', name);
  const target = resolve(tempRoot, 'examples', name);
  cpSync(source, target, {
    recursive: true,
    filter(sourcePath) {
      const base = basename(sourcePath);
      return !['node_modules', 'dist', 'build', '.astro', '.svelte-kit'].includes(base);
    },
  });
  return target;
}

try {
  log(`Packing @ponchia/ui into ${tempRoot}`);
  run(npm, ['pack', '--pack-destination', tempRoot]);
  const tarballs = readdirSync(tempRoot).filter((name) => name.endsWith('.tgz'));
  if (tarballs.length !== 1) {
    throw new Error(`Expected one packed tarball in ${tempRoot}, found ${tarballs.length}`);
  }
  const tarball = resolve(tempRoot, tarballs[0]);

  for (const name of examples) {
    log('');
    log(`Testing example: ${name}`);
    const exampleDir = copyExample(name);
    run(npm, ['install', '--no-audit', '--no-fund'], { cwd: exampleDir });
    run(npm, ['install', '--no-audit', '--no-fund', '--no-save', tarball], {
      cwd: exampleDir,
    });
    run(npm, ['run', 'build'], { cwd: exampleDir });

    if (BROWSER_SMOKE_EXAMPLE_NAMES.includes(name)) {
      const distDir = resolve(tempRoot, defaultDistDirFor(name));
      run(process.execPath, [resolve(root, 'scripts/smoke-example.mjs'), name, distDir]);
    }
  }

  log('');
  log(`✓ ${examples.length} packed example build${examples.length === 1 ? '' : 's'} passed`);
} catch (error) {
  failed = true;
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  if (failed || keepTemp) {
    log(`Kept temp example workspace: ${tempRoot}`);
  } else {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}
