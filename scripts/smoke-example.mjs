/**
 * Browser-smoke a built consumer example. This is intentionally much smaller
 * than the full Playwright suite: serve examples/<name>/dist, open it in one
 * or more Playwright engines, fail on runtime/asset errors, and check one
 * expected UI marker.
 *
 * Run: node scripts/smoke-example.mjs <example-name> [dist-dir]
 *      node scripts/smoke-example.mjs <example-name> [dist-dir] --browsers=chromium,firefox,webkit
 *      node scripts/smoke-example.mjs <example-name> [dist-dir] --visual
 *        (desktop + mobile screenshot/layout health)
 */
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';
// @playwright/test is the installed devDependency; the bare 'playwright'
// specifier only resolved through npm hoisting and broke under pnpm/yarn-pnp.
import { chromium, firefox, webkit } from '@playwright/test';
import { defaultDistDirFor } from './lib/examples.mjs';
import { createStaticServer } from './lib/static-server.mjs';
import { log } from './lib/stdio.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const browserTypes = Object.freeze({ chromium, firefox, webkit });
const VISUAL_VIEWPORTS = Object.freeze([
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'mobile', width: 390, height: 844 },
]);

function parseCli(argv) {
  const positionals = [];
  let browsers = 'chromium';
  let visual = false;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--visual') {
      visual = true;
      continue;
    }
    if (arg === '--browser' || arg === '--browsers') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`${arg} requires a comma-separated browser list`);
      }
      browsers = value;
      index += 1;
      continue;
    }
    if (arg.startsWith('--browser=')) {
      browsers = arg.slice('--browser='.length);
      continue;
    }
    if (arg.startsWith('--browsers=')) {
      browsers = arg.slice('--browsers='.length);
      continue;
    }
    if (arg.startsWith('--')) throw new Error(`Unknown option: ${arg}`);
    positionals.push(arg);
  }

  const browserNames = browsers
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
  if (!browserNames.length) throw new Error('At least one browser must be selected');
  for (const name of browserNames) {
    if (!Object.hasOwn(browserTypes, name)) {
      throw new Error(`Unknown browser "${name}" (expected chromium, firefox, or webkit)`);
    }
  }
  return {
    example: positionals[0],
    distArg: positionals[1],
    browserNames: [...new Set(browserNames)],
    visual,
  };
}

let parsed;
try {
  parsed = parseCli(args);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  console.error(
    'Usage: node scripts/smoke-example.mjs <example-name> [dist-dir] [--browsers=chromium,firefox,webkit] [--visual]',
  );
  process.exit(1);
}

const { example, distArg, browserNames, visual } = parsed;

if (!example) {
  console.error(
    'Usage: node scripts/smoke-example.mjs <example-name> [dist-dir] [--browsers=chromium,firefox,webkit] [--visual]',
  );
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

function paethPredictor(left, up, upLeft) {
  const p = left + up - upLeft;
  const pa = Math.abs(p - left);
  const pb = Math.abs(p - up);
  const pc = Math.abs(p - upLeft);
  if (pa <= pb && pa <= pc) return left;
  return pb <= pc ? up : upLeft;
}

function decodePng(buffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!buffer.subarray(0, 8).equals(signature)) throw new Error('screenshot is not a PNG');

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  const idat = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const data = buffer.subarray(dataStart, dataEnd);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset = dataEnd + 4;
  }

  if (!width || !height) throw new Error('PNG screenshot has no IHDR dimensions');
  if (bitDepth !== 8) throw new Error(`unsupported PNG bit depth ${bitDepth}`);
  if (interlace !== 0) throw new Error('interlaced PNG screenshots are not supported');

  const channelsByType = new Map([
    [0, 1],
    [2, 3],
    [6, 4],
  ]);
  const channels = channelsByType.get(colorType);
  if (!channels) throw new Error(`unsupported PNG color type ${colorType}`);

  const bpp = channels;
  const rowBytes = width * channels;
  const inflated = inflateSync(Buffer.concat(idat));
  const rgba = new Uint8Array(width * height * 4);
  let inOffset = 0;
  let outOffset = 0;
  let previous = new Uint8Array(rowBytes);

  for (let y = 0; y < height; y += 1) {
    const filter = inflated[inOffset];
    inOffset += 1;
    const row = new Uint8Array(rowBytes);
    for (let x = 0; x < rowBytes; x += 1) {
      const raw = inflated[inOffset];
      inOffset += 1;
      const left = x >= bpp ? row[x - bpp] : 0;
      const up = previous[x] ?? 0;
      const upLeft = x >= bpp ? previous[x - bpp] : 0;
      let value;
      if (filter === 0) value = raw;
      else if (filter === 1) value = raw + left;
      else if (filter === 2) value = raw + up;
      else if (filter === 3) value = raw + Math.floor((left + up) / 2);
      else if (filter === 4) value = raw + paethPredictor(left, up, upLeft);
      else throw new Error(`unsupported PNG filter ${filter}`);
      row[x] = value & 255;
    }

    for (let x = 0; x < width; x += 1) {
      const source = x * channels;
      if (colorType === 0) {
        const gray = row[source];
        rgba[outOffset++] = gray;
        rgba[outOffset++] = gray;
        rgba[outOffset++] = gray;
        rgba[outOffset++] = 255;
      } else {
        rgba[outOffset++] = row[source];
        rgba[outOffset++] = row[source + 1];
        rgba[outOffset++] = row[source + 2];
        rgba[outOffset++] = colorType === 6 ? row[source + 3] : 255;
      }
    }
    previous = row;
  }

  return { width, height, rgba };
}

function analyseVisual(buffer) {
  const { width, height, rgba } = decodePng(buffer);
  const background = [rgba[0], rgba[1], rgba[2]];
  const stride = Math.max(1, Math.floor((width * height) / 250_000));
  const bins = new Set();
  let sampled = 0;
  let painted = 0;
  let minLuma = 255;
  let maxLuma = 0;

  for (let pixel = 0; pixel < width * height; pixel += stride) {
    const offset = pixel * 4;
    const alpha = rgba[offset + 3];
    if (alpha < 16) continue;
    const r = rgba[offset];
    const g = rgba[offset + 1];
    const b = rgba[offset + 2];
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    minLuma = Math.min(minLuma, luma);
    maxLuma = Math.max(maxLuma, luma);
    if (
      Math.abs(r - background[0]) + Math.abs(g - background[1]) + Math.abs(b - background[2]) >
      24
    ) {
      painted += 1;
    }
    bins.add(`${r >> 4},${g >> 4},${b >> 4}`);
    sampled += 1;
  }

  return {
    width,
    height,
    colorBins: bins.size,
    lumaRange: maxLuma - minLuma,
    paintedRatio: sampled ? painted / sampled : 0,
  };
}

async function assertVisualSmoke(page, name, browserName, viewportName) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  const buffer = await page.screenshot({ fullPage: false });
  const metrics = analyseVisual(buffer);
  const failures = [];
  if (metrics.width < 320 || metrics.height < 240) {
    failures.push(`screenshot is too small (${metrics.width}x${metrics.height})`);
  }
  if (metrics.colorBins < 8) failures.push(`only ${metrics.colorBins} quantized color bins`);
  if (metrics.lumaRange < 24) failures.push(`luma range is only ${metrics.lumaRange.toFixed(1)}`);
  if (metrics.paintedRatio < 0.005) {
    failures.push(
      `only ${(metrics.paintedRatio * 100).toFixed(2)}% differs from the corner background`,
    );
  }
  const layout = await page.evaluate(() => {
    const documentWidth = Math.max(
      document.documentElement.scrollWidth,
      document.body?.scrollWidth ?? 0,
    );
    return {
      documentWidth,
      viewportWidth: window.innerWidth,
    };
  });
  if (layout.documentWidth > layout.viewportWidth + 2) {
    failures.push(
      `page overflows horizontally (${layout.documentWidth}px document in ${layout.viewportWidth}px viewport)`,
    );
  }
  if (failures.length) {
    throw new Error(
      `${name} ${browserName}/${viewportName} visual smoke failed: ${failures.join('; ')}`,
    );
  }
}

async function assertExample(page, name) {
  const assertThemeToggle = async () => {
    const toggle = page.getByRole('button', { name: 'Toggle theme' });
    await toggle.waitFor();
    const before = await page.locator('html').getAttribute('data-theme');
    await page.evaluate(() => {
      window.__brontoThemeEvents = [];
      document.documentElement.addEventListener('bronto:themechange', (event) => {
        window.__brontoThemeEvents.push(event.detail?.theme);
      });
    });
    await toggle.click();
    await page.waitForFunction((prev) => {
      const current = document.documentElement.getAttribute('data-theme');
      return Boolean(current) && current !== prev;
    }, before);
    const after = await page.locator('html').getAttribute('data-theme');
    const ariaPressed = await toggle.getAttribute('aria-pressed');
    const stored = await page.evaluate(() => localStorage.getItem('bronto-theme'));
    const events = await page.evaluate(() => window.__brontoThemeEvents ?? []);
    if (ariaPressed !== String(after === 'dark')) {
      throw new Error(
        `theme toggle aria-pressed=${ariaPressed ?? '<unset>'} does not reflect ${after}`,
      );
    }
    if (stored !== after) {
      throw new Error(`theme toggle persisted ${stored ?? '<unset>'}, expected ${after}`);
    }
    if (!events.includes(after)) {
      throw new Error(`theme toggle did not emit bronto:themechange for ${after}`);
    }
  };
  const assertScopedThemeToggle = async () => {
    const outside = page.locator('[data-smoke-outside-scope]');
    await outside.waitFor({ state: 'attached' });
    const before = await page.locator('html').getAttribute('data-theme');
    await outside.evaluate((el) => {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
    const after = await page.locator('html').getAttribute('data-theme');
    if (after !== before) {
      throw new Error(
        `outside-scope theme toggle changed data-theme from ${before ?? '<unset>'} to ${
          after ?? '<unset>'
        }`,
      );
    }
  };
  const assertToast = async () => {
    await page.getByRole('button', { name: 'Toast' }).click();
    await page.locator('.ui-toast').waitFor();
  };
  const assertDialog = async () => {
    await page.getByRole('button', { name: 'Open dialog' }).click();
    await page.locator('dialog[open]').waitFor();
    await page.locator('dialog[open]').getByRole('button', { name: 'Close' }).click();
    await page.locator('dialog[open]').waitFor({ state: 'detached' });
  };
  const assertTabsAndGlyphs = async () => {
    await page.getByRole('tab', { name: 'Two' }).click();
    await page.locator('.ui-icon').waitFor();
    await page.getByRole('tab', { name: 'One' }).click();
    await page.locator('.ui-dotmatrix__cell').first().waitFor();
  };
  const assertBindingCleanup = async () => {
    const state = page.locator('[data-bindings-state]');
    const disable = page.locator('[data-bindings-disable]');
    await state.waitFor({ state: 'attached' });
    await disable.waitFor({ state: 'attached' });
    await disable.evaluate((el) => {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
    await page.waitForFunction(
      () => document.querySelector('[data-bindings-state]')?.textContent?.trim() === 'disabled',
    );
    const before = await page.locator('html').getAttribute('data-theme');
    await page.getByRole('button', { name: 'Toggle theme' }).click();
    const after = await page.locator('html').getAttribute('data-theme');
    if (after !== before) {
      throw new Error(
        `disabled framework binding still handled theme toggle (${before ?? '<unset>'} -> ${
          after ?? '<unset>'
        })`,
      );
    }
  };

  if (name === 'vanilla-vite') {
    await page.getByRole('heading', { name: 'Vanilla + Vite' }).waitFor();
    await assertThemeToggle();
    await assertToast();
    return;
  }
  if (name === 'astro') {
    await page.getByRole('heading', { name: 'Astro' }).waitFor();
    await assertThemeToggle();
    return;
  }
  if (name === 'react-vite') {
    await page.getByRole('heading', { name: 'React + Vite' }).waitFor();
    await page.getByText(/chart colours/).waitFor();
    await assertThemeToggle();
    await assertScopedThemeToggle();
    await assertToast();
    await assertDialog();
    await assertTabsAndGlyphs();
    await assertBindingCleanup();
    return;
  }
  if (name === 'solid-vite') {
    await page.getByRole('heading', { name: 'Solid + Vite' }).waitFor();
    await page.getByText(/chart colours/).waitFor();
    await assertThemeToggle();
    await assertScopedThemeToggle();
    await assertToast();
    await assertDialog();
    await assertTabsAndGlyphs();
    await assertBindingCleanup();
    return;
  }
  if (name === 'sveltekit') {
    await page.getByRole('heading', { name: 'SvelteKit' }).waitFor();
    await assertThemeToggle();
    await assertScopedThemeToggle();
    await assertToast();
    await assertDialog();
    await assertTabsAndGlyphs();
    await assertBindingCleanup();
    return;
  }
  if (name === 'qwik-vite') {
    await page.getByRole('heading', { name: 'Qwik + Vite' }).waitFor();
    await assertThemeToggle();
    await assertScopedThemeToggle();
    await assertToast();
    await assertDialog();
    await assertTabsAndGlyphs();
    await assertBindingCleanup();
    return;
  }
  if (name === 'vue-vite') {
    await page.getByRole('heading', { name: 'Vue + Vite' }).waitFor();
    await assertThemeToggle();
    await assertScopedThemeToggle();
    await assertToast();
    await assertDialog();
    await assertTabsAndGlyphs();
    await assertBindingCleanup();
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

function observePage(page, errors) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console error: ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`page error: ${err.message}`));
  page.on('requestfailed', (req) => {
    errors.push(`request failed: ${req.url()} (${req.failure()?.errorText ?? 'unknown'})`);
  });
  page.on('response', (res) => {
    if (res.status() >= 400) errors.push(`HTTP ${res.status()}: ${res.url()}`);
  });
}

async function openExample(page, url, errors, label) {
  const response = await page.goto(url, { waitUntil: 'networkidle' });
  if (!response || !response.ok()) {
    errors.push(`${label} navigation returned ${response?.status() ?? 'no response'}`);
  }
}

async function smokeBrowser(url, browserName) {
  const browser = await browserTypes[browserName].launch();
  try {
    const errors = [];

    if (visual) {
      for (const viewport of VISUAL_VIEWPORTS) {
        const page = await browser.newPage({
          viewport: { width: viewport.width, height: viewport.height },
        });
        observePage(page, errors);
        await openExample(page, url, errors, `${browserName}/${viewport.name}`);
        await assertVisualSmoke(page, example, browserName, viewport.name);
        await page.close();
      }
    }

    const page = await browser.newPage();
    observePage(page, errors);
    await openExample(page, url, errors, browserName);
    await assertExample(page, example);

    if (errors.length) {
      console.error(`✖ ${example} ${browserName} browser smoke failed:`);
      for (const error of errors) console.error(`  - ${error}`);
      process.exitCode = 1;
      return false;
    }
    log(
      `✓ ${example} ${browserName}${visual ? ' desktop+mobile visual +' : ''} browser smoke passed`,
    );
    return true;
  } finally {
    await browser.close();
  }
}

const app = createStaticServer(distDir, { baseUrl: 'http://example.test' });
try {
  const url = await listen(app);
  let passed = true;
  for (const browserName of browserNames) {
    passed = (await smokeBrowser(url, browserName)) && passed;
  }
  if (!passed) process.exit(1);
  log(`✓ ${example} browser smoke passed in ${browserNames.join(', ')}`);
} finally {
  await new Promise((resolveClose) => app.close(resolveClose));
}
