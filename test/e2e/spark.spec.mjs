import { test, expect } from '@playwright/test';

async function open(page) {
  await page.goto('/demo/spark.html', { waitUntil: 'networkidle' });
}

test('bar height tracks the host-set --v', async ({ page }) => {
  await open(page);
  const bars = page.locator('.ui-spark').first().locator('.ui-spark__bar');
  const low = await bars.first().boundingBox(); // --v: 0.2
  const high = await bars.last().boundingBox(); // --v: 1
  expect(high.height).toBeGreaterThan(low.height);
});

test('every spark carries an aria-label (a bare spark is opaque)', async ({ page }) => {
  await open(page);
  const sparks = page.locator('.ui-spark');
  const count = await sparks.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    await expect(sparks.nth(i)).toHaveAttribute('role', 'img');
    const label = await sparks.nth(i).getAttribute('aria-label');
    expect(label && label.trim().length).toBeTruthy();
  }
});

test('forced-colors: bars repaint in the system text colour so the shape survives', async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const bg = await page
    .locator('.ui-spark__bar')
    .first()
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).not.toBe('rgba(0, 0, 0, 0)');
});
