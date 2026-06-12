/**
 * Run the full Playwright browser suite except pixel snapshots.
 *
 * This is the local-safe cross-engine gate: it exercises chromium, firefox,
 * and webkit behavior/a11y/print/motion specs while skipping visual.spec.mjs,
 * whose screenshots are authored only in the pinned Linux Playwright container.
 *
 * Run: node scripts/test-e2e-nonpixel.mjs [playwright args...]
 */
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const e2eDir = resolve(root, 'test/e2e');
const specs = readdirSync(e2eDir)
  .filter((name) => name.endsWith('.spec.mjs') && name !== 'visual.spec.mjs')
  .sort((a, b) => a.localeCompare(b))
  .map((name) => join('test/e2e', name));

if (!specs.length) {
  console.error('No non-pixel Playwright specs found in test/e2e.');
  process.exit(1);
}

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(
  npx,
  ['--no-install', 'playwright', 'test', ...specs, ...process.argv.slice(2)],
  {
    cwd: root,
    stdio: 'inherit',
  },
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
