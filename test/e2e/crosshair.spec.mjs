import { test, expect } from '@playwright/test';
import { applyTheme } from './_theme.mjs';
import { blocking, scan } from './_demo-guards.mjs';

async function open(page, theme = 'light') {
  await page.goto('/demo/crosshair.html', { waitUntil: 'networkidle' });
  await applyTheme(page, theme);
}

for (const theme of ['light', 'dark']) {
  test(`crosshair specimen passes axe (${theme})`, async ({ page }) => {
    await open(page, theme);
    const results = await scan(page).analyze();
    expect(blocking(results), JSON.stringify(blocking(results), null, 2)).toEqual([]);
  });
}

test('crosshair activates on pointer move and reports a fraction', async ({ page }) => {
  await open(page);
  const overlay = page.locator('.ui-crosshair');
  await expect(overlay).not.toHaveClass(/is-active/);
  const plot = page.locator('[data-bronto-crosshair]');
  await plot.hover({ position: { x: 80, y: 60 } });
  await expect(overlay).toHaveClass(/is-active/);
  await expect(page.locator('#status')).toContainText('%');
  // --crosshair-x was set to a pixel offset
  const x = await overlay.evaluate((el) => getComputedStyle(el).getPropertyValue('--crosshair-x'));
  expect(parseFloat(x)).toBeGreaterThan(0);
});
