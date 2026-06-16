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
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const playwrightVersion = pkg.devDependencies?.['@playwright/test'];
const image = `mcr.microsoft.com/playwright:v${playwrightVersion}-jammy`;

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

const dockerInfo = spawnSync('docker', ['info'], { stdio: 'ignore' });
if (dockerInfo.status !== 0) {
  console.error(
    'Docker is not reachable. Start Docker, then rerun `npm run test:e2e:visual:container`.',
  );
  process.exit(dockerInfo.status ?? 1);
}

const status = run('docker', [
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
  ...process.argv.slice(2),
]);

process.exit(status);
