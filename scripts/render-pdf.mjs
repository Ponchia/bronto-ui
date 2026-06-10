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
 *   node scripts/render-pdf.mjs <report.html> [more.html ...] [--out <dir>] [--serve]
 *
 * Each input `foo.html` is written next to itself as `foo.pdf` unless `--out`
 * gives a directory. Requires the Playwright browsers (`npx playwright install
 * chromium-headless-shell`); they are already present if you run the e2e suite.
 *
 * `--serve` loads inputs over a loopback HTTP server (the demo server, rooted
 * at the package) instead of `file://`. Reports that import relative ES
 * modules (`<script type="module">` pulling behaviors/tokens/annotations)
 * NEED this: browsers block module imports from `file://` (CORS, opaque
 * `null` origin), so their figures silently render empty in the PDF.
 */
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
import { basename, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createDemoServer, root } from './serve.mjs';

// How long to wait for a report's own `data-report-ready` readiness signal
// (set by module-script reports when their figures finish rendering).
const READY_TIMEOUT_MS = 15_000;

/**
 * Split argv into the `--out <dir>` value, the `--serve` flag, and the list of
 * input HTML files. Pure + exported so the arg handling is unit-testable
 * without launching a browser. The subtlety: the arg right after `--out` is
 * its value, not an input, but that index must only be skipped when `--out` is
 * actually present — otherwise `indexOf` returns -1, `outIdx + 1` is 0, and
 * the first input file (the common `report:pdf -- report.html` case) is
 * silently dropped.
 */
export function parseArgs(argv) {
  const outIdx = argv.indexOf('--out');
  const outDir = outIdx !== -1 ? (argv[outIdx + 1] ?? null) : null;
  const outValueIdx = outIdx === -1 ? -1 : outIdx + 1;
  const serve = argv.includes('--serve');
  const inputs = argv.filter((a, i) => !a.startsWith('--') && i !== outValueIdx);
  return { outDir, inputs, serve };
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

/** Map an absolute input path to a loopback URL under the demo server root. */
function serveUrl(abs, port) {
  const rel = relative(root, abs);
  if (rel.startsWith('..') || rel.includes(`..${sep}`)) {
    return null; // outside the served root — file:// is the only option
  }
  return `http://127.0.0.1:${port}/${rel.split(sep).join('/')}`;
}

async function main(argv) {
  const { outDir, inputs, serve } = parseArgs(argv);

  if (!inputs.length) {
    console.error(
      'usage: node scripts/render-pdf.mjs <report.html> [more.html ...] [--out <dir>] [--serve]',
    );
    process.exit(1);
  }
  if (outDir && !existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  let server = null;
  let port = 0;
  if (serve) {
    server = createDemoServer();
    await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
    port = server.address().port;
  }

  const browser = await launch();
  // try/finally so a throwing goto/pdf can't leak the Chromium process.
  try {
    const page = await browser.newPage();
    // Surface what used to fail silently: module-import CORS errors, missing
    // assets, and page exceptions all land on stderr instead of vanishing.
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.error(`  [page] ${msg.text()}`);
    });
    page.on('pageerror', (err) => console.error(`  [page] ${err.message}`));
    page.on('requestfailed', (req) =>
      console.error(`  [page] request failed: ${req.url()} (${req.failure()?.errorText})`),
    );

    for (const input of inputs) {
      const abs = resolve(input);
      if (!existsSync(abs)) {
        console.error(`✗ not found: ${input}`);
        continue;
      }
      const out = outDir
        ? resolve(outDir, basename(abs).replace(/\.html?$/i, '.pdf'))
        : abs.replace(/\.html?$/i, '.pdf');

      let url = pathToFileURL(abs).href;
      if (serve) {
        const viaHttp = serveUrl(abs, port);
        if (!viaHttp) {
          console.error(`✗ ${input} is outside ${root} — --serve cannot reach it`);
          continue;
        }
        url = viaHttp;
      }

      await page.goto(url, { waitUntil: 'networkidle' });

      const html = await page.content();
      const hasModules = html.includes('type="module"');
      if (hasModules && !serve) {
        console.error(
          `  [warn] ${input} uses <script type="module"> over file:// — module imports are ` +
            'blocked (CORS), so its figures will be missing. Re-run with --serve.',
        );
      }
      // Reports that render figures from JS flag completion on the root
      // element; wait for it so the PDF is not snapshotted mid-render.
      if (hasModules && html.includes('data-report-ready')) {
        await page
          .waitForSelector('html[data-report-ready]', { timeout: READY_TIMEOUT_MS })
          .catch(() =>
            console.error(`  [warn] ${input}: data-report-ready never fired; rendering anyway`),
          );
      }

      await page.pdf({
        path: out,
        format: 'A4',
        printBackground: true, // required, or chart fills/swatches drop out
        margin: { top: '14mm', bottom: '14mm', left: '14mm', right: '14mm' },
      });
      console.log(`✓ ${out}`);
    }
  } finally {
    await browser.close();
    if (server) server.close();
  }
}

// Only render when run as a script — importing this module (e.g. from a test of
// parseArgs) must not launch a browser.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2));
}
