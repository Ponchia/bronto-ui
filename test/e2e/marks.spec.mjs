import { test, expect } from '@playwright/test';
import { applyTheme } from './_theme.mjs';
import { blocking, scan } from './_demo-guards.mjs';

async function open(page, theme = 'light') {
  await page.goto('/demo/marks.html', { waitUntil: 'networkidle' });
  await applyTheme(page, theme);
}

for (const theme of ['light', 'dark']) {
  test(`marks specimen passes axe and renders marks (${theme})`, async ({ page }) => {
    await open(page, theme);
    const results = await scan(page).analyze();
    expect(blocking(results), JSON.stringify(blocking(results), null, 2)).toEqual([]);

    await expect(page.locator('mark.ui-mark').first()).toBeVisible();
    await expect(page.locator('.ui-bracket-note')).toHaveCount(2);
    await expect(page.locator('.ui-bracket-note__label').first()).toBeVisible();
  });
}

test('forced-colors: a highlight mark keeps an underline so it survives', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const mark = page.locator('mark.ui-mark').first();
  const decoration = await mark.evaluate((el) => getComputedStyle(el).textDecorationLine);
  expect(decoration).toContain('underline');
});

test('forced-colors: a --strike mark keeps line-through (not overwritten by the underline fallback)', async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const strike = page.locator('mark.ui-mark--strike').first();
  const decoration = await strike.evaluate((el) => getComputedStyle(el).textDecorationLine);
  expect(decoration).toContain('line-through');
  expect(decoration).not.toContain('underline');
});
