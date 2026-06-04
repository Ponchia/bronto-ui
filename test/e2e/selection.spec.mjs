import { test, expect } from '@playwright/test';
import { applyTheme } from './_theme.mjs';
import { blocking, scan } from './_demo-guards.mjs';

async function open(page, theme = 'light') {
  await page.goto('/demo/selection.html', { waitUntil: 'networkidle' });
  await applyTheme(page, theme);
}

for (const theme of ['light', 'dark']) {
  test(`selection specimen passes axe and renders the three states (${theme})`, async ({
    page,
  }) => {
    await open(page, theme);
    const results = await scan(page).analyze();
    expect(blocking(results), JSON.stringify(blocking(results), null, 2)).toEqual([]);
    await expect(page.locator('.ui-sel--on')).toHaveCount(1);
    await expect(page.locator('.ui-sel--maybe')).toHaveCount(1);
    await expect(page.locator('.ui-sel--off')).toHaveCount(3);
  });
}

test('an excluded item is dimmed via opacity', async ({ page }) => {
  await open(page);
  const off = page.locator('.ui-sel--off').first();
  const opacity = await off.evaluate((el) => parseFloat(getComputedStyle(el).opacity));
  expect(opacity).toBeLessThan(1);
});
