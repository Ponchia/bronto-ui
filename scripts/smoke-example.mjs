/**
 * Browser-smoke a built consumer example. This is intentionally much smaller
 * than the full Playwright suite: serve examples/<name>/dist, open it once in
 * Chromium, fail on runtime/asset errors, and check one expected UI marker.
 *
 * Run: node scripts/smoke-example.mjs <example-name> [dist-dir]
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, extname, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
// @playwright/test is the installed devDependency; the bare 'playwright'
// specifier only resolved through npm hoisting and broke under pnpm/yarn-pnp.
import { chromium } from '@playwright/test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const example = process.argv[2];
const distArg = process.argv[3];

if (!example) {
  console.error('Usage: node scripts/smoke-example.mjs <example-name> [dist-dir]');
  process.exit(1);
}

const defaultDistDir =
  example === 'sveltekit' ? `examples/${example}/build` : `examples/${example}/dist`;
const distDir = resolve(root, distArg ?? defaultDistDir);
if (!existsSync(distDir)) {
  console.error(`Missing built example directory: ${distDir}`);
  process.exit(1);
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

function safePath(pathname) {
  let p = pathname;
  if (p.endsWith('/')) p += 'index.html';
  const abs = normalize(resolve(distDir, `.${p}`));
  if (abs !== distDir && !abs.startsWith(distDir + sep)) return null;
  return abs;
}

function server() {
  return createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://example.test').pathname);
      const abs = safePath(pathname);
      if (!abs) {
        res.writeHead(403).end('forbidden');
        return;
      }
      const body = await readFile(abs);
      res.writeHead(200, { 'content-type': TYPES[extname(abs)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
}

async function listen(app) {
  await new Promise((resolveListen) => app.listen(0, '127.0.0.1', resolveListen));
  const addr = app.address();
  return `http://127.0.0.1:${addr.port}/`;
}

async function assertExample(page, name) {
  if (name === 'vanilla-vite') {
    await page.getByRole('heading', { name: 'Vanilla + Vite' }).waitFor();
    await page.getByRole('button', { name: 'Toast' }).click();
    await page.locator('.ui-toast').waitFor();
    return;
  }
  if (name === 'react-vite') {
    await page.getByRole('heading', { name: 'React + Vite' }).waitFor();
    await page.getByText(/chart colours/).waitFor();
    await page.getByRole('button', { name: 'Open dialog' }).click();
    await page.locator('dialog[open]').waitFor();
    return;
  }
  if (name === 'solid-vite') {
    await page.getByRole('heading', { name: 'Solid + Vite' }).waitFor();
    await page.getByText(/chart colours/).waitFor();
    await page.getByRole('button', { name: 'Toast' }).click();
    await page.locator('.ui-toast').waitFor();
    await page.getByRole('button', { name: 'Open dialog' }).click();
    await page.locator('dialog[open]').waitFor();
    return;
  }
  if (name === 'sveltekit') {
    await page.getByRole('heading', { name: 'SvelteKit' }).waitFor();
    const before = await page.locator('html').getAttribute('data-theme');
    await page.getByRole('button', { name: 'Toggle theme' }).click();
    await page.waitForFunction((prev) => document.documentElement.dataset.theme !== prev, before);
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

const app = server();
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
  console.log(`✓ ${example} browser smoke passed`);
} finally {
  if (browser) await browser.close();
  await new Promise((resolveClose) => app.close(resolveClose));
}
