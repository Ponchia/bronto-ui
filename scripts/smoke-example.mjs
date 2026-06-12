/**
 * Browser-smoke a built consumer example. This is intentionally much smaller
 * than the full Playwright suite: serve examples/<name>/dist, open it once in
 * Chromium, fail on runtime/asset errors, and check one expected UI marker.
 *
 * Run: node scripts/smoke-example.mjs <example-name> [dist-dir]
 */
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
// @playwright/test is the installed devDependency; the bare 'playwright'
// specifier only resolved through npm hoisting and broke under pnpm/yarn-pnp.
import { chromium } from '@playwright/test';
import { defaultDistDirFor } from './lib/examples.mjs';
import { createStaticServer } from './lib/static-server.mjs';
import { log } from './lib/stdio.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const example = process.argv[2];
const distArg = process.argv[3];

if (!example) {
  console.error('Usage: node scripts/smoke-example.mjs <example-name> [dist-dir]');
  process.exit(1);
}

const distDir = resolve(root, distArg ?? defaultDistDirFor(example));
if (!existsSync(distDir)) {
  console.error(`Missing built example directory: ${distDir}`);
  process.exit(1);
}

async function listen(app) {
  await new Promise((resolveListen) => app.listen(0, '127.0.0.1', resolveListen));
  const addr = app.address();
  return `http://127.0.0.1:${addr.port}/`;
}

async function assertExample(page, name) {
  const assertThemeToggle = async () => {
    const before = await page.locator('html').getAttribute('data-theme');
    await page.getByRole('button', { name: 'Toggle theme' }).click();
    await page.waitForFunction((prev) => {
      const current = document.documentElement.getAttribute('data-theme');
      return Boolean(current) && current !== prev;
    }, before);
  };
  const assertToast = async () => {
    await page.getByRole('button', { name: 'Toast' }).click();
    await page.locator('.ui-toast').waitFor();
  };
  const assertDialog = async () => {
    await page.getByRole('button', { name: 'Open dialog' }).click();
    await page.locator('dialog[open]').waitFor();
  };

  if (name === 'vanilla-vite') {
    await page.getByRole('heading', { name: 'Vanilla + Vite' }).waitFor();
    await assertToast();
    return;
  }
  if (name === 'react-vite') {
    await page.getByRole('heading', { name: 'React + Vite' }).waitFor();
    await page.getByText(/chart colours/).waitFor();
    await assertDialog();
    return;
  }
  if (name === 'solid-vite') {
    await page.getByRole('heading', { name: 'Solid + Vite' }).waitFor();
    await page.getByText(/chart colours/).waitFor();
    await assertToast();
    await assertDialog();
    return;
  }
  if (name === 'sveltekit') {
    await page.getByRole('heading', { name: 'SvelteKit' }).waitFor();
    await assertThemeToggle();
    return;
  }
  if (name === 'vue-vite') {
    await page.getByRole('heading', { name: 'Vue + Vite' }).waitFor();
    await assertThemeToggle();
    await assertToast();
    await assertDialog();
    return;
  }
  if (name === 'tailwind-vite') {
    await page.getByRole('heading', { name: 'Tailwind + Vite' }).waitFor();
    await assertThemeToggle();
    await assertToast();
    const hasBridgeCss = await page
      .locator('.bg-bronto-surface, .bronto-dark\\:bg-bronto-surface-raised')
      .count();
    if (!hasBridgeCss) throw new Error('Tailwind bridge utilities were not emitted');
    return;
  }
  if (name === 'report-static') {
    await page.getByRole('heading', { name: 'Packed tarball smoke' }).waitFor();
    await page.locator('main.ui-report').waitFor();
    await page.locator('.ui-legend').waitFor();
    return;
  }
  await page.locator('body').waitFor();
}

const app = createStaticServer(distDir, { baseUrl: 'http://example.test' });
let browser;
try {
  const url = await listen(app);
  browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console error: ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`page error: ${err.message}`));
  page.on('requestfailed', (req) => {
    const requestUrl = req.url();
    if (requestUrl.endsWith('/favicon.ico')) return;
    errors.push(`request failed: ${requestUrl} (${req.failure()?.errorText ?? 'unknown'})`);
  });
  page.on('response', (res) => {
    if (res.status() >= 400 && !res.url().endsWith('/favicon.ico')) {
      errors.push(`HTTP ${res.status()}: ${res.url()}`);
    }
  });

  const response = await page.goto(url, { waitUntil: 'networkidle' });
  if (!response || !response.ok()) {
    errors.push(`initial navigation returned ${response?.status() ?? 'no response'}`);
  }
  await assertExample(page, example);

  if (errors.length) {
    console.error(`✖ ${example} browser smoke failed:`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }
  log(`✓ ${example} browser smoke passed`);
} finally {
  if (browser) await browser.close();
  await new Promise((resolveClose) => app.close(resolveClose));
}
