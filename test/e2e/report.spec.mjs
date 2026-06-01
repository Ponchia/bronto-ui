import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ignored = (url) => url.endsWith('/favicon.ico');
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];
const STRUCTURAL = new Set([
  'heading-order',
  'landmark-one-main',
  'landmark-unique',
  'region',
  'scrollable-region-focusable',
  'duplicate-id',
  'tabindex',
]);

function blocking(results) {
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical' || STRUCTURAL.has(v.id))
    .map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => ({ target: n.target, msg: n.failureSummary })),
    }));
}

async function openReport(page, theme = 'dark') {
  await page.goto('/demo/report.html', { waitUntil: 'networkidle' });
  await page.evaluate(async (t) => {
    document.documentElement.dataset.theme = t;
    await document.fonts.ready;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, theme);
}

for (const theme of ['dark', 'light']) {
  test(`report fixture runs clean (${theme})`, async ({ page }) => {
    const consoleErrors = [];
    const pageErrors = [];
    const badResponses = [];

    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text());
    });
    page.on('pageerror', (e) => pageErrors.push(String(e)));
    page.on('response', (r) => {
      if (r.status() >= 400 && !ignored(r.url())) badResponses.push(`${r.status()} ${r.url()}`);
    });

    await openReport(page, theme);

    expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
    expect(pageErrors, pageErrors.join('\n')).toEqual([]);
    expect(badResponses, badResponses.join('\n')).toEqual([]);
  });
}

// Scan BOTH themes: contrast is theme-dependent and the report's worst-case
// pairing (--text-dim on --panel-soft) sits closest to the WCAG floor, so a
// dark-only scan could let a light-theme contrast regression through.
for (const theme of ['dark', 'light']) {
  test(`report fixture passes axe and carries report semantics (${theme})`, async ({ page }) => {
    await openReport(page, theme);
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(blocking(results), JSON.stringify(blocking(results), null, 2)).toEqual([]);

    await expect(page.locator('main.ui-report')).toHaveCount(1);
    await expect(page.locator('h1.ui-report__title')).toHaveCount(1);
    await expect(page.locator('table caption')).toHaveCount(2);
    await expect(page.locator('figure.ui-report__figure figcaption')).toHaveCount(1);
    await expect(page.locator('.ui-legend')).toHaveCount(1);
    await expect(page.locator('.ui-chart__plot')).toHaveCount(1);
    await expect(page.locator('.ui-chart__bar')).toHaveCount(3);
    await expect(page.locator('.ui-chart__fallback table')).toHaveCount(1);
    await expect(page.locator('.ui-annotation')).toHaveCount(9);
    await expect(page.locator('.ui-annotation--label')).toHaveCount(1);
    await expect(page.locator('.ui-annotation--threshold')).toHaveCount(1);
    await expect(page.locator('.ui-annotation--circle')).toHaveCount(1);
    await expect(page.locator('.ui-annotation--elbow')).toHaveCount(1);
    await expect(page.locator('.ui-annotation--curve')).toHaveCount(1);
    await expect(page.locator('.ui-annotation--rect')).toHaveCount(1);
    await expect(page.locator('.ui-annotation--badge')).toHaveCount(2);
    await expect(page.locator('.ui-annotation--callout')).toHaveCount(1);
    await expect(page.getByText('18 h research')).toHaveCount(1);
    await expect(
      page.locator('.ui-annotation--threshold .ui-annotation__connector'),
    ).toHaveAttribute('d', /L/);
  });
}

test('report print utilities and overflow rules apply', async ({ page }) => {
  await openReport(page, 'light');
  await page.emulateMedia({ media: 'print' });
  const result = await page.evaluate(() => {
    const css = (sel) => getComputedStyle(document.querySelector(sel));
    return {
      printOnlyDisplay: css('.ui-print-only').display,
      screenOnlyDisplay: css('.ui-screen-only').display,
      tableOverflow: css('.ui-table-wrap').overflow,
      breakBefore: css('.ui-break-before').breakBefore,
      breakAfter: css('.ui-break-after').breakAfter,
      keepInside: css('.ui-keep').breakInside,
      evidencePadding: css('.ui-report__evidence').paddingTop,
      unnumberedBefore: getComputedStyle(
        document.querySelector('.ui-report__section--unnumbered .ui-report__section-head'),
        '::before',
      ).content,
      firstFillWidth: document.querySelector('.ui-chart__fill').getBoundingClientRect().width,
      firstTrackWidth: document.querySelector('.ui-chart__track').getBoundingClientRect().width,
      annotationStroke: css('.ui-annotation__connector').vectorEffect,
      exact:
        css('.ui-print-exact').webkitPrintColorAdjust || css('.ui-print-exact').printColorAdjust,
      proseLinkAfter: getComputedStyle(
        document.querySelector('.ui-prose a[href^="http"]'),
        '::after',
      ).content,
    };
  });

  expect(result.printOnlyDisplay).not.toBe('none');
  expect(result.screenOnlyDisplay).toBe('none');
  expect(result.tableOverflow).toBe('visible');
  expect(result.breakBefore).toBe('page');
  expect(result.breakAfter).toBe('page');
  expect(result.keepInside).toBe('avoid');
  expect(result.evidencePadding).toBe('0px');
  expect(['none', 'normal', '']).toContain(result.unnumberedBefore);
  expect(result.firstFillWidth).toBeGreaterThan(0);
  expect(result.firstFillWidth).toBeLessThan(result.firstTrackWidth);
  expect(result.annotationStroke).toBe('non-scaling-stroke');
  expect(result.exact).toBe('exact');
  expect(result.proseLinkAfter).toContain('https://example.com/report-source');
});

// Note: the report fixture is intentionally NOT pixel-snapshotted. It is a
// tall, full-page composition — the most flake-prone shape for cross-OS
// rasterisation — and its rendering is already covered structurally above
// (axe + semantics) and below (print computed-style + a real PDF export),
// which is higher-signal than a whole-page image diff.

test('report fixture exports a non-empty Chromium PDF', async ({ page }) => {
  await openReport(page, 'light');
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  expect(pdf.length).toBeGreaterThan(20_000);
});
