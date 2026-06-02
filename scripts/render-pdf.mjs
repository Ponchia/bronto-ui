/**
 * Render a static bronto report (HTML) to PDF with chrome-headless-shell — the
 * lightweight headless-Chromium binary, not a full browser. bronto reports are
 * zero-JS, so this is just load → print; no automation, no chart engine.
 *
 * This is a dev/example helper, NOT part of the published API — bronto does not
 * own rendering (the same stance it takes on Mermaid/D2). Copy it into your own
 * pipeline, or swap Playwright for Puppeteer / raw CDP; the only thing that
 * matters is a Chromium-class engine with `printBackground: true`.
 *
 * Usage:
 *   node scripts/render-pdf.mjs <report.html> [more.html ...] [--out <dir>]
 *
 * Each input `foo.html` is written next to itself as `foo.pdf` unless `--out`
 * gives a directory. Requires the Playwright browsers (`npx playwright install
 * chromium-headless-shell`); they are already present if you run the e2e suite.
 */
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const argv = process.argv.slice(2);
const outIdx = argv.indexOf('--out');
const outDir = outIdx !== -1 ? argv[outIdx + 1] : null;
const inputs = argv.filter((a, i) => a !== '--out' && i !== outIdx + 1 && !a.startsWith('--'));

if (!inputs.length) {
  console.error('usage: node scripts/render-pdf.mjs <report.html> [more.html ...] [--out <dir>]');
  process.exit(1);
}
if (outDir && !existsSync(outDir)) mkdirSync(outDir, { recursive: true });

// Prefer the lightweight headless-shell binary; fall back to full chromium if
// only that is installed.
async function launch() {
  try {
    return await chromium.launch({ channel: 'chromium-headless-shell' });
  } catch {
    return await chromium.launch();
  }
}

const browser = await launch();
const page = await browser.newPage();

for (const input of inputs) {
  const abs = resolve(input);
  if (!existsSync(abs)) {
    console.error(`✗ not found: ${input}`);
    continue;
  }
  const out = outDir
    ? resolve(outDir, basename(abs).replace(/\.html?$/i, '.pdf'))
    : abs.replace(/\.html?$/i, '.pdf');
  await page.goto(pathToFileURL(abs).href, { waitUntil: 'networkidle' });
  await page.pdf({
    path: out,
    format: 'A4',
    printBackground: true, // required, or chart fills/swatches drop out
    margin: { top: '14mm', bottom: '14mm', left: '14mm', right: '14mm' },
  });
  console.log(`✓ ${out}`);
}

await browser.close();
