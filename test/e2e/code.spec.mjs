import { test, expect } from '@playwright/test';

async function open(page) {
  await page.goto('/demo/code.html', { waitUntil: 'networkidle' });
}

test('numbered code renders a line-number gutter and tinted line states', async ({ page }) => {
  await open(page);
  await expect(page.locator('.ui-code--numbered').first()).toBeVisible();

  // The gutter is a ::before counter on each line. getComputedStyle returns the
  // unresolved `counter(...)` token (not the rendered digit), so assert the
  // generated content is present rather than scraping the number.
  const gutter = await page
    .locator('.ui-code--numbered .ui-code__line')
    .first()
    .evaluate((el) => getComputedStyle(el, '::before').content);
  expect(gutter).toContain('counter');

  // The add line carries a real tint (not transparent).
  const bg = await page
    .locator('.ui-code__line--add')
    .first()
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).not.toBe('rgba(0, 0, 0, 0)');
});

test('forced-colors: a changed line keeps an inline-start border', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const width = await page
    .locator('.ui-code__line--del')
    .first()
    .evaluate((el) => getComputedStyle(el).borderInlineStartWidth);
  expect(parseFloat(width)).toBeGreaterThan(0);
});
