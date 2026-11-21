/** Capture marketing previews from actual demo routes; not pixel-test baselines. */
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { chromium } from '@playwright/test';
import { createDemoServer, root } from './serve.mjs';
import { examples, localDemoPath } from '../site/examples.mjs';

const output = resolve(process.argv[2] || resolve(root, 'site/assets'));
await mkdir(output, { recursive: true });
// Starter-owned examples are emitted by the same builder used for Pages.
const build = spawnSync(process.execPath, ['scripts/build-public-site.mjs'], {
  cwd: root,
  stdio: 'inherit',
});
if (build.status !== 0) throw new Error('Build the public site before capturing examples');
const server = createDemoServer();
await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});
let browser;
try {
  browser = await chromium.launch();
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const example of examples) {
    const page = await browser.newPage({
      viewport: { width: 1200, height: 720 },
      reducedMotion: 'reduce',
      colorScheme: 'light',
    });
    try {
      await page.goto(`${base}${localDemoPath(example)}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: resolve(output, example.image),
        type: 'jpeg',
        quality: 86,
        animations: 'disabled',
      });
      console.log(`${example.image} ← ${localDemoPath(example)} (1200 × 720)`);
    } finally {
      await page.close();
    }
  }
} finally {
  await browser?.close();
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}
