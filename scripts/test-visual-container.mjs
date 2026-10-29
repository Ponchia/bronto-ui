/**
 * Run the Chromium visual baseline spec in the same pinned Playwright
 * container used by CI. This is the local authoritative pixel comparison path;
 * running visual.spec.mjs directly on macOS/Windows is useful only as a weak
 * smoke because font rasterisation differs.
 *
 * Run: node scripts/test-visual-container.mjs [playwright args...]
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Read the executable image entry, rejecting mutable or mismatched identities. */
export function playwrightImageFrom(workflow, version, distro = 'jammy') {
  if (distro !== 'jammy' && distro !== 'noble') {
    throw new Error('Playwright container distro must be jammy or noble');
  }
  if (!/^\d+\.\d+\.\d+$/.test(version ?? '')) {
    throw new Error('@playwright/test must use an exact x.y.z version');
  }
  const entries = [...workflow.matchAll(/^\s*image:\s*(.+)$/gm)];
  if (entries.length !== 1) throw new Error('Expected exactly one Playwright container image');
  const image = entries[0][1]
    .replace(/\s+#.*$/, '')
    .trim()
    .replace(/^(['"])(.*)\1$/, '$2');
  const prefix = `mcr.microsoft.com/playwright:v${version}-${distro}@sha256:`;
  if (!image.startsWith(prefix) || !/^[a-f0-9]{64}$/.test(image.slice(prefix.length))) {
    throw new Error(`Playwright image must be ${prefix}<64 hex characters>, got ${image}`);
  }
  return image;
}

/** The local command consumes CI's complete image identity, including its digest. */
export function visualContainerArgs(args = []) {
  const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  const image = playwrightImageFrom(
    readFileSync(resolve(root, '.github/workflows/e2e.yml'), 'utf8'),
    pkg.devDependencies?.['@playwright/test'],
  );
  return [
    'run',
    '--rm',
    '-v',
    `${root}:/work`,
    '-w',
    '/work',
    '-e',
    'HOME=/root',
    '-e',
    'PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1',
    image,
    'bash',
    '-lc',
    'npm ci && npx playwright test test/e2e/visual.spec.mjs --project=chromium "$@"',
    'bash',
    ...args,
  ];
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? root,
    stdio: options.stdio ?? 'inherit',
    env: { ...process.env, ...(options.env ?? {}) },
  });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  return result.status ?? 1;
}

if (resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  const args = visualContainerArgs(process.argv.slice(2));
  const dockerInfo = spawnSync('docker', ['info'], { stdio: 'ignore' });
  if (dockerInfo.status !== 0) {
    console.error(
      'Docker is not reachable. Start Docker, then rerun `npm run test:e2e:visual:container`.',
    );
    process.exit(dockerInfo.status ?? 1);
  }
  process.exit(run('docker', args));
}
