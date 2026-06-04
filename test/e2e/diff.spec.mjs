import { test, expect } from '@playwright/test';
import { applyTheme } from './_theme.mjs';
import { blocking, scan } from './_demo-guards.mjs';

async function open(page, theme = 'light') {
  await page.goto('/demo/diff.html', { waitUntil: 'networkidle' });
  await applyTheme(page, theme);
}

for (const theme of ['light', 'dark']) {
  test(`diff specimen passes axe and renders rows (${theme})`, async ({ page }) => {
    await open(page, theme);
    const results = await scan(page).analyze();
    expect(blocking(results), JSON.stringify(blocking(results), null, 2)).toEqual([]);

    await expect(page.locator('.ui-diff').first()).toBeVisible();
    await expect(page.locator('.ui-diff__row--add').first()).toBeVisible();
    await expect(page.locator('.ui-diff__row--remove').first()).toBeVisible();
    await expect(page.locator('.ui-diff--split .ui-diff__pane')).toHaveCount(2);
  });
}

test('the +/− gutter glyph is generated content, so add/remove survive forced-colors', async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const sign = await page
    .locator('.ui-diff__row--add .ui-diff__code')
    .first()
    .evaluate((el) => getComputedStyle(el, '::before').content);
  // The glyph is painted from the row modifier's --diff-sign, not the markup.
  expect(sign).toContain('+');
});

test('line numbers are excluded from a text selection (user-select: none)', async ({ page }) => {
  await open(page);
  const userSelect = await page
    .locator('.ui-diff__ln')
    .first()
    .evaluate((el) => getComputedStyle(el).userSelect);
  expect(userSelect).toBe('none');
});
