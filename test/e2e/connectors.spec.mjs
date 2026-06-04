import { test, expect } from '@playwright/test';
import { applyTheme } from './_theme.mjs';
import { blocking, scan } from './_demo-guards.mjs';

async function open(page, theme = 'light') {
  await page.goto('/demo/connectors.html', { waitUntil: 'networkidle' });
  await applyTheme(page, theme);
}

for (const theme of ['light', 'dark']) {
  test(`connectors specimen passes axe (${theme})`, async ({ page }) => {
    await open(page, theme);
    const results = await scan(page).analyze();
    expect(blocking(results), JSON.stringify(blocking(results), null, 2)).toEqual([]);
  });
}

test('initConnectors draws a non-empty path between the elements', async ({ page }) => {
  await open(page);
  const path = page.locator('.ui-connector__path').first();
  await expect(path).toHaveCount(1);
  const d = await path.getAttribute('d');
  expect(d).toMatch(/^M[\d.-]/);
  // an actual span (not a zero-length M0,0 degenerate path)
  expect(d.length).toBeGreaterThan(6);
  await expect(page.locator('.ui-connector__end').first()).toHaveCount(1);
});

test('connector redraws after a resize', async ({ page }) => {
  await open(page);
  const path = page.locator('.ui-connector__path').first();
  const before = await path.getAttribute('d');
  await page.setViewportSize({ width: 700, height: 700 });
  await expect.poll(async () => path.getAttribute('d')).not.toBe(before);
});
