import { test, expect } from '@playwright/test';

/**
 * Print/PDF gate over the promoted multi-page fixture
 * (_report-print.fixture.html). It pins down the two report-lab defects that
 * shipped latent because the old print coverage only asserted `%PDF` + size:
 *
 *  1. OVERPRINT — Chromium-class print engines restart grid tracks at the top
 *     of each page, printing the new page's rows over the running content.
 *     report.css now demotes the vertical flow wrappers to block in
 *     `@media print`; the PDF text boxes must therefore never overlap.
 *  2. SILENT MODULE DROP — figures rendered by relative ES-module imports
 *     vanish over file:// (CORS). Served over HTTP (this suite's webServer,
 *     same as render-pdf --serve), the module figure must land in the DOM AND
 *     in the exported PDF's extractable text.
 *
 * The PDF is parsed with pdfjs-dist (dev-only, pure JS) — the same
 * "dev-dependency render probe" stance as test/vega-render.test.mjs, so the
 * gate needs no poppler/system binary. page.pdf() is Chromium-only; the print
 * contract is also asserted cross-engine via emulateMedia.
 */

const FIXTURE = '/test/e2e/_report-print.fixture.html';
const SENTINEL = 'module-figure-rendered';

async function openFixture(page) {
  await page.goto(FIXTURE, { waitUntil: 'networkidle' });
  await page.waitForSelector('html[data-report-ready]');
}

test('module figure renders over HTTP and flags readiness', async ({ page }) => {
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => pageErrors.push(String(e)));

  await openFixture(page);

  await expect(page.locator('#module-figure svg')).toHaveCount(1);
  await expect(page.locator('#module-figure svg rect')).toHaveCount(3);
  await expect(page.getByText(SENTINEL)).toBeVisible();
  expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
  expect(pageErrors, pageErrors.join('\n')).toEqual([]);
});

// The print-CSS contract, cross-engine: vertical document-flow wrappers leave
// grid (so they fragment as normal block flow), while the column grids keep
// their tracks. This is the structural half of the overprint fix; the PDF
// bbox assertion below is the rendered proof.
test('print media demotes flow wrappers to block and keeps column grids', async ({ page }) => {
  await openFixture(page);
  await page.emulateMedia({ media: 'print' });

  const displays = await page.evaluate(() => {
    const read = (sel) => getComputedStyle(document.querySelector(sel)).display;
    return {
      report: read('.ui-report'),
      section: read('.ui-report__section'),
      figure: read('.ui-report__figure'),
      actions: read('.ui-report__actions'),
      ledger: read('.ui-evidence-ledger'),
      compare: read('.ui-compare'),
      decisionItem: read('.ui-report__decision-item'),
    };
  });

  expect(displays.report).toBe('block');
  expect(displays.section).toBe('block');
  expect(displays.figure).toBe('block');
  expect(displays.actions).toBe('block');
  expect(displays.ledger).toBe('block');
  // Side-by-side semantics survive print.
  expect(displays.compare).toBe('grid');
  expect(displays.decisionItem).toBe('grid');
});

test('exported PDF is multi-page, carries the module figure, and never overprints', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'page.pdf() is Chromium-only in Playwright');

  await openFixture(page);
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '14mm', bottom: '14mm', left: '14mm', right: '14mm' },
  });
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF');

  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await getDocument({ data: new Uint8Array(pdf), useSystemFonts: true }).promise;

  // Page-count: the fixture is sized to paginate. A collapse to fewer pages
  // means print CSS broke layout wholesale (or content stopped rendering).
  expect(doc.numPages).toBeGreaterThanOrEqual(4);

  let sentinelSeen = false;
  const overlaps = [];
  const pageTexts = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const content = await (await doc.getPage(p)).getTextContent();
    pageTexts.push(content.items.map((i) => i.str).join(' '));
    // Upright, non-empty text runs as [x1, y1, x2, y2, str] boxes
    // (PDF user space, bottom-left origin; transform = [a,b,c,d,e,f]).
    const boxes = content.items
      .filter((i) => i.str && i.str.trim() && !i.transform[1] && !i.transform[2])
      .map((i) => [
        i.transform[4],
        i.transform[5],
        i.transform[4] + i.width,
        i.transform[5] + i.height,
        i.str,
      ])
      .sort((a, b) => a[1] - b[1] || a[0] - b[0]);

    // ui-report__caption text-transforms to uppercase and the print engine
    // extracts rendered glyphs, so match case-insensitively.
    if (boxes.some(([, , , , s]) => s.toLowerCase().includes(SENTINEL))) sentinelSeen = true;

    for (let i = 0; i < boxes.length; i++) {
      const [x1, y1, x2, y2, s] = boxes[i];
      for (let j = i + 1; j < boxes.length; j++) {
        const [a1, b1, a2, b2, u] = boxes[j];
        if (b1 > y2) break; // sorted by y — nothing later can intersect
        const ix = Math.min(x2, a2) - Math.max(x1, a1);
        const iy = Math.min(y2, b2) - Math.max(y1, b1);
        // >2pt horizontal and >4pt vertical shared area = two text runs
        // printed on top of each other (the grid-fragmentation defect).
        if (ix > 2 && iy > 4 && s !== u) {
          overlaps.push(`page ${p}: "${s}" ⟂ "${u}" @ ${Math.round(x1)},${Math.round(y1)}`);
        }
      }
    }
  }

  expect(sentinelSeen, `"${SENTINEL}" missing from PDF text — module figure dropped`).toBe(true);

  // TRAP ARMED — the overprint geometry only exists while the trap prose
  // block straddles a page boundary ahead of the break-avoided Fig-1. The
  // fixture makes that true BY CONSTRUCTION (the block is taller than one A4
  // page — pagination differs between macOS and the pinned CI container, so
  // an offset-tuned trap disarms across environments). If content drift ever
  // shrinks the block onto one page, fail loudly instead of rotting.
  const startPage = pageTexts.findIndex((t) => t.includes('true class'));
  const tailPage = pageTexts.findIndex((t) => t.includes('tail sentinel'));
  expect(startPage, '"Row = true class" trap prose missing from PDF').toBeGreaterThanOrEqual(0);
  expect(tailPage, 'trap tail sentinel missing from PDF').toBeGreaterThanOrEqual(0);
  expect(
    tailPage,
    `overprint trap DISARMED: trap prose starts on page ${startPage + 1} and ends on page ${
      tailPage + 1
    } — it must straddle a page break (be taller than one page). Re-grow the trap block.`,
  ).toBeGreaterThan(startPage);

  expect(overlaps, `overprinted text runs:\n${overlaps.join('\n')}`).toEqual([]);
});
