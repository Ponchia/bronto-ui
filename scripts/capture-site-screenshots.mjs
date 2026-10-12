/** Capture marketing previews from actual demo routes; not pixel-test baselines. */
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { createDemoServer, root } from './serve.mjs';
import { examples } from '../site/examples.mjs';

const output = resolve(process.argv[2] || resolve(root, 'site/assets'));
await mkdir(output, { recursive: true });
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
      await page.goto(`${base}/demo/${example.demo}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: resolve(output, example.image),
        type: 'jpeg',
        quality: 86,
        animations: 'disabled',
      });
      console.log(`${example.image} ← demo/${example.demo} (1200 × 720)`);
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
