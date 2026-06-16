/**
 * Build every consumer example against the packed tarball, then browser-smoke
 * the examples with runtime assertions. Work happens in a temp directory so
 * local verification does not rewrite example lockfiles or build outputs.
 *
 * Run: node scripts/test-examples.mjs [example-name ...] [--keep-temp]
 *      node scripts/test-examples.mjs --browsers=chromium,firefox,webkit [example-name ...]
 *      node scripts/test-examples.mjs --visual [example-name ...]
 *        (desktop + mobile screenshot/layout health)
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
let browserNames;
let visual = false;
const selected = [];

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === '--keep-temp') continue;
  if (arg === '--visual') {
    visual = true;
    continue;
  }
  if (arg === '--browser' || arg === '--browsers') {
    browserNames = args[index + 1];
    if (!browserNames || browserNames.startsWith('--')) {
      console.error(`${arg} requires a comma-separated browser list`);
      process.exit(1);
    }
    index += 1;
    continue;
  }
  if (arg.startsWith('--browser=')) {
    browserNames = arg.slice('--browser='.length);
    continue;
  }
  if (arg.startsWith('--browsers=')) {
    browserNames = arg.slice('--browsers='.length);
    continue;
  }
  if (arg.startsWith('--')) {
    console.error(`Unknown option: ${arg}`);
    process.exit(1);
  }
  selected.push(arg);
}
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
      const smokeArgs = [resolve(root, 'scripts/smoke-example.mjs'), name, distDir];
      if (browserNames) smokeArgs.push(`--browsers=${browserNames}`);
      if (visual) smokeArgs.push('--visual');
      run(process.execPath, smokeArgs);
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
