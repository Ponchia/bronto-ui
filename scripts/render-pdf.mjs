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
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * Split argv into the `--out <dir>` value and the list of input HTML files.
 * Pure + exported so the arg handling is unit-testable without launching a
 * browser. The subtlety: the arg right after `--out` is its value, not an
 * input, but that index must only be skipped when `--out` is actually present —
 * otherwise `indexOf` returns -1, `outIdx + 1` is 0, and the first input file
 * (the common `report:pdf -- report.html` case) is silently dropped.
 */
export function parseArgs(argv) {
  const outIdx = argv.indexOf('--out');
  const outDir = outIdx !== -1 ? (argv[outIdx + 1] ?? null) : null;
  const outValueIdx = outIdx === -1 ? -1 : outIdx + 1;
  const inputs = argv.filter((a, i) => !a.startsWith('--') && i !== outValueIdx);
  return { outDir, inputs };
}

// Prefer the lightweight headless-shell binary; fall back to full chromium if
// only that is installed.
async function launch() {
  try {
    return await chromium.launch({ channel: 'chromium-headless-shell' });
  } catch {
    return await chromium.launch();
  }
}

async function main(argv) {
  const { outDir, inputs } = parseArgs(argv);

  if (!inputs.length) {
    console.error('usage: node scripts/render-pdf.mjs <report.html> [more.html ...] [--out <dir>]');
    process.exit(1);
  }
  if (outDir && !existsSync(outDir)) mkdirSync(outDir, { recursive: true });

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
}

// Only render when run as a script — importing this module (e.g. from a test of
// parseArgs) must not launch a browser.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2));
}
