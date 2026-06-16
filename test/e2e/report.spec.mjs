import { test, expect } from '@playwright/test';
import { applyTheme } from './_theme.mjs';
import { blocking, scan } from './_demo-guards.mjs';

async function openReport(page, theme = 'dark') {
  await page.goto('/demo/report.html', { waitUntil: 'networkidle' });
  // Shared opener: flips the theme and settles fonts + finite animations before
  // axe samples colours, the same flake-resistant path the analytical leaf
  // specs use (avoids the mid-fade color-contrast race on the theme flip).
  await applyTheme(page, theme);
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
      if (r.status() >= 400) badResponses.push(`${r.status()} ${r.url()}`);
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
    const results = await scan(page).analyze();
    expect(blocking(results), JSON.stringify(blocking(results), null, 2)).toEqual([]);

    await expect(page.locator('main.ui-report')).toHaveCount(1);
    await expect(page.locator('h1.ui-report__title')).toHaveCount(1);
    await expect(page.locator('.ui-report__decision')).toHaveCount(1);
    await expect(page.locator('.ui-report__finding--major')).toHaveCount(1);
    await expect(page.locator('.ui-evidence-item')).toHaveCount(2);
    await expect(page.locator('table caption')).toHaveCount(2);
    await expect(page.locator('figure.ui-report__figure figcaption')).toHaveCount(1);
    await expect(page.locator('.ui-legend')).toHaveCount(1);
    await expect(page.locator('.ui-provenance')).toHaveCount(1);
    await expect(page.locator('.ui-source-card')).toHaveCount(2);
    // The CSS-bar renderer is gone; the figure now carries hand-authored inline
    // SVGs. Assert the figure renders and the focus-split bar chart still draws
    // one <rect> per series (Research / Delivery / Maintenance).
    const figureSvgs = page.locator('figure.ui-report__figure svg');
    await expect(figureSvgs.first()).toBeVisible();
    const barChart = page.locator('figure.ui-report__figure svg[aria-label^="Weekly focus split"]');
    await expect(barChart).toHaveCount(1);
    await expect(barChart.locator('rect')).toHaveCount(3);
    // The figure keeps its source-data fallback table.
    await expect(page.locator('figure.ui-report__figure .ui-table-wrap table')).toHaveCount(1);
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
      sectionBreakInside: css('.ui-report__section').breakInside,
      keepInside: css('.ui-keep').breakInside,
      evidencePadding: css('.ui-report__evidence').paddingTop,
      unnumberedBefore: getComputedStyle(
        document.querySelector('.ui-report__section--unnumbered .ui-report__section-head'),
        '::before',
      ).content,
      // The bar chart is now an inline SVG: bar widths are proportional to the
      // series value, so the longest series (Research, 18 h) must render wider
      // than the shortest (Maintenance, 7 h).
      barRectWidths: (() => {
        const bars = document.querySelector('svg[aria-label^="Weekly focus split"]');
        const rects = [...bars.querySelectorAll('rect')];
        return {
          first: rects[0].getBoundingClientRect().width,
          last: rects[rects.length - 1].getBoundingClientRect().width,
        };
      })(),
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
  expect(result.sectionBreakInside).not.toBe('avoid');
  expect(result.keepInside).toBe('avoid');
  expect(result.evidencePadding).toBe('0px');
  expect(['none', 'normal', '']).toContain(result.unnumberedBefore);
  expect(result.barRectWidths.first).toBeGreaterThan(0);
  expect(result.barRectWidths.first).toBeGreaterThan(result.barRectWidths.last);
  expect(result.annotationStroke).toBe('non-scaling-stroke');
  expect(result.exact).toBe('exact');
  // Chromium/WebKit resolve attr(href) in the computed ::after content;
  // Firefox returns the unresolved `attr(href)` literal — both confirm the
  // print rule surfaces the link target (it resolves at paint time in FF too).
  expect(result.proseLinkAfter).toMatch(/https:\/\/example\.com\/report-source|attr\(href\)/);
});

test('report annotation notes stay inside the SVG viewport', async ({ page }) => {
  await openReport(page, 'light');
  const result = await page.evaluate(() => {
    const svg = document.querySelector(
      'svg[aria-labelledby="focus-annotation-title focus-annotation-desc"]',
    );
    if (!svg) return { missing: true };
    const s = svg.getBoundingClientRect();
    const overshoot = [...svg.querySelectorAll('.ui-annotation__note')].map((note) => {
      const b = note.getBoundingClientRect();
      return Math.max(0, b.right - s.right, s.left - b.left, b.bottom - s.bottom, s.top - b.top);
    });
    return { missing: false, count: overshoot.length, maxOvershoot: Math.max(0, ...overshoot) };
  });

  expect(result.missing, 'expected annotated report SVG to exist').toBe(false);
  expect(result.count).toBeGreaterThan(0);
  expect(result.maxOvershoot).toBeLessThanOrEqual(1);
});

// Note: the report fixture is intentionally NOT pixel-snapshotted. It is a
// tall, full-page composition — the most flake-prone shape for cross-OS
// rasterisation — and its rendering is already covered structurally above
// (axe + semantics) and below (print computed-style + a real PDF export),
// which is higher-signal than a whole-page image diff.

test('report fixture exports a non-empty Chromium PDF', async ({ page, browserName }) => {
  // `page.pdf()` is a Chromium-only Playwright API; the print CSS it exercises
  // is verified engine-agnostically by the print-utilities test above.
  test.skip(browserName !== 'chromium', 'page.pdf() is Chromium-only in Playwright');
  await openReport(page, 'light');
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  expect(pdf.length).toBeGreaterThan(20_000);
});
