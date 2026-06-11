import { test, expect } from '@playwright/test';
import { applyTheme } from './_theme.mjs';

async function openDemo(page, name, theme = 'light') {
  await page.goto(`/demo/${name}.html`, { waitUntil: 'networkidle' });
  await applyTheme(page, theme);
}

test('ui-figure lays out a stable stage, overlay, key, and fallback data', async ({ page }) => {
  await openDemo(page, 'figure');

  await expect(page.locator('.ui-figure')).toHaveCount(1);
  await expect(page.locator('.ui-figure__caption')).toBeVisible();
  await expect(page.locator('.ui-figure__media')).toBeVisible();
  await expect(page.locator('.ui-figure__overlay')).toBeVisible();
  await expect(page.locator('.ui-figure__key .ui-legend')).toHaveCount(1);
  await expect(page.locator('.ui-figure__data table')).toHaveCount(1);

  const geometry = await page.evaluate(() => {
    const body = document.querySelector('.ui-figure__body--key-right');
    const stage = document.querySelector('.ui-figure__stage');
    const overlay = document.querySelector('.ui-figure__overlay');
    const media = document.querySelector('.ui-figure__media');
    const stageBox = stage.getBoundingClientRect();
    const overlayBox = overlay.getBoundingClientRect();
    const mediaBox = media.getBoundingClientRect();
    return {
      bodyDisplay: getComputedStyle(body).display,
      bodyColumns: getComputedStyle(body).gridTemplateColumns,
      stagePosition: getComputedStyle(stage).position,
      overlayPosition: getComputedStyle(overlay).position,
      overlayPointerEvents: getComputedStyle(overlay).pointerEvents,
      overlayMatchesStage:
        Math.abs(overlayBox.width - stageBox.width) <= 1 &&
        Math.abs(overlayBox.height - stageBox.height) <= 1,
      mediaInsideStage: mediaBox.width <= stageBox.width + 1,
      fallbackRows: document.querySelectorAll('.ui-figure__data tbody tr').length,
    };
  });

  expect(geometry.bodyDisplay).toBe('grid');
  expect(geometry.bodyColumns).toContain(' ');
  expect(geometry.stagePosition).toBe('relative');
  expect(geometry.overlayPosition).toBe('absolute');
  expect(geometry.overlayPointerEvents).toBe('none');
  expect(geometry.overlayMatchesStage).toBe(true);
  expect(geometry.mediaInsideStage).toBe(true);
  expect(geometry.fallbackRows).toBe(3);
});

test('ui-figure collapses without horizontal page overflow on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openDemo(page, 'figure');

  const result = await page.evaluate(() => {
    const body = document.querySelector('.ui-figure__body--key-right');
    return {
      columns: getComputedStyle(body).gridTemplateColumns,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
    };
  });

  expect(result.columns.trim().split(/\s+/)).toHaveLength(1);
  expect(result.overflow, `page overflowed by ${result.overflow}px`).toBeLessThanOrEqual(0);
});

test('ui-interval paints range and point from host-normalised values', async ({ page }) => {
  await openDemo(page, 'interval');

  const intervals = page.locator('.ui-interval');
  await expect(intervals).toHaveCount(3);
  for (let i = 0; i < 3; i += 1) {
    await expect(intervals.nth(i)).toHaveAttribute('role', 'img');
    const label = await intervals.nth(i).getAttribute('aria-label');
    expect(label && label.trim().length).toBeGreaterThan(0);
  }

  const measured = await intervals.first().evaluate((el) => {
    const track = el.querySelector('.ui-interval__track').getBoundingClientRect();
    const range = el.querySelector('.ui-interval__range').getBoundingClientRect();
    const point = el.querySelector('.ui-interval__point').getBoundingClientRect();
    return {
      rangeStart: (range.left - track.left) / track.width,
      rangeWidth: range.width / track.width,
      pointStart: (point.left + point.width / 2 - track.left) / track.width,
    };
  });

  expect(measured.rangeStart).toBeGreaterThan(0.18);
  expect(measured.rangeStart).toBeLessThan(0.26);
  expect(measured.rangeWidth).toBeGreaterThan(0.42);
  expect(measured.rangeWidth).toBeLessThan(0.5);
  expect(measured.pointStart).toBeGreaterThan(0.48);
  expect(measured.pointStart).toBeLessThan(0.56);
  await expect(intervals.nth(1).locator('.ui-interval__point')).toHaveCount(0);
});

test('ui-clamp toggles closed/open and expands for print', async ({ page }) => {
  await openDemo(page, 'clamp');

  const clamp = page.locator('.ui-clamp').first();
  const body = clamp.locator('.ui-clamp__body');
  const control = clamp.locator('.ui-clamp__control');
  await expect(clamp.locator('.ui-clamp__more')).toBeVisible();
  await expect(clamp.locator('.ui-clamp__less')).toBeHidden();

  const closedHeight = await body.evaluate((el) => el.getBoundingClientRect().height);
  await control.click();
  await expect(clamp.locator('.ui-clamp__less')).toBeVisible();
  await expect(clamp.locator('.ui-clamp__more')).toBeHidden();
  const openHeight = await body.evaluate((el) => el.getBoundingClientRect().height);
  expect(openHeight).toBeGreaterThan(closedHeight + 8);

  await page.reload({ waitUntil: 'networkidle' });
  await page.emulateMedia({ media: 'print' });
  const printState = await page
    .locator('.ui-clamp')
    .first()
    .evaluate((el) => {
      const body = el.querySelector('.ui-clamp__body');
      const control = el.querySelector('.ui-clamp__control');
      return {
        controlDisplay: getComputedStyle(control).display,
        bodyDisplay: getComputedStyle(body).display,
        bodyHeight: body.getBoundingClientRect().height,
        bodyScrollHeight: body.scrollHeight,
      };
    });
  expect(printState.controlDisplay).toBe('none');
  expect(printState.bodyDisplay).toBe('block');
  expect(printState.bodyHeight).toBeGreaterThanOrEqual(printState.bodyScrollHeight - 1);
});

test('ui-highlights registers documented names when the platform supports it', async ({ page }) => {
  await openDemo(page, 'highlights');

  await expect(page.locator('.ui-highlights')).toContainText('Latency improved');
  const result = await page.evaluate(() => {
    const host = document.querySelector('.ui-highlights');
    const styles = getComputedStyle(host);
    const supported = document.documentElement.dataset.highlightSupport === 'true';
    return {
      supported,
      evidenceWash: styles.getPropertyValue('--highlight-evidence').trim(),
      searchWash: styles.getPropertyValue('--highlight-search').trim(),
      currentWash: styles.getPropertyValue('--highlight-current').trim(),
      names: supported
        ? ['bronto-evidence', 'bronto-search', 'bronto-current'].map((n) => CSS.highlights.has(n))
        : [],
    };
  });

  expect(result.evidenceWash).not.toBe('');
  expect(result.searchWash).not.toBe('');
  expect(result.currentWash).not.toBe('');
  if (result.supported) {
    expect(result.names).toEqual([true, true, true]);
  }
});

for (const report of ['report', 'report-standalone']) {
  test(`${report} fixture composes the report primitive batch`, async ({ page }) => {
    await openDemo(page, report);

    await expect(page.locator('figure.ui-report__figure.ui-figure')).toHaveCount(1);
    await expect(page.locator('.ui-figure__stage')).toHaveCount(1);
    await expect(page.locator('.ui-figure__data table')).toHaveCount(1);
    await expect(page.locator('.ui-interval')).toHaveCount(1);
    await expect(page.locator('.ui-clamp')).toHaveCount(1);
  });
}
