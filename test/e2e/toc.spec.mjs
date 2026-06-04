import { test, expect } from '@playwright/test';

async function open(page) {
  await page.goto('/demo/toc.html', { waitUntil: 'networkidle' });
}

test('the rail is sticky and the active entry keys on aria-current', async ({ page }) => {
  await open(page);
  const rail = page.locator('.ui-toc');
  await expect(rail).toBeVisible();
  const position = await rail.evaluate((el) => getComputedStyle(el).position);
  expect(position).toBe('sticky');

  // Exactly one link is the current section, marked with aria-current.
  const current = page.locator('.ui-toc__link[aria-current="true"]');
  await expect(current).toHaveCount(1);
});

test('the active link is visually distinguished from inactive ones', async ({ page }) => {
  await open(page);
  const current = page.locator('.ui-toc__link[aria-current="true"]');
  const inactive = page.locator('.ui-toc__link:not([aria-current="true"])').first();

  const activeColor = await current.evaluate((el) => getComputedStyle(el).color);
  const inactiveColor = await inactive.evaluate((el) => getComputedStyle(el).color);
  const activeBorder = await current.evaluate((el) => getComputedStyle(el).borderInlineStartColor);
  const inactiveBorder = await inactive.evaluate(
    (el) => getComputedStyle(el).borderInlineStartColor,
  );

  // The active entry differs in both channels (colour + the rail border).
  expect(activeColor).not.toBe(inactiveColor);
  expect(activeBorder).not.toBe(inactiveBorder);
});
