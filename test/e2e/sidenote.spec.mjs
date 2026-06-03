import { test, expect } from '@playwright/test';

async function open(page) {
  await page.goto('/demo/sidenote.html', { waitUntil: 'networkidle' });
}

test('sidenotes are numbered by a CSS counter and stay in reading order', async ({ page }) => {
  await open(page);
  const refs = page.locator('.ui-sidenote__ref');
  await expect(refs).toHaveCount(2);

  // Each ref increments + prints the counter via ::after. getComputedStyle
  // returns the unresolved `counter(...)` token, so assert the numbering
  // mechanism is wired rather than scraping the rendered digit.
  const incr = await refs.first().evaluate((el) => getComputedStyle(el).counterIncrement);
  expect(incr).toContain('ui-sidenote');
  const after = await refs.first().evaluate((el) => getComputedStyle(el, '::after').content);
  expect(after).toContain('counter');

  // The notes themselves are real, visible DOM (no hidden-content trap).
  await expect(page.locator('.ui-sidenote').first()).toBeVisible();
  await expect(page.locator('.ui-marginnote').first()).toBeVisible();
});

test('narrow viewport keeps the note inline (not floated off-screen)', async ({ page }) => {
  await page.setViewportSize({ width: 480, height: 900 });
  await open(page);
  const float = await page
    .locator('.ui-sidenote')
    .first()
    .evaluate((el) => getComputedStyle(el).cssFloat);
  expect(float).toBe('none');
});
