import { test, expect } from '@playwright/test';
import { applyTheme } from './_theme.mjs';
import { blocking, scan } from './_demo-guards.mjs';

async function open(page, theme = 'light') {
  await page.goto('/demo/spotlight.html', { waitUntil: 'networkidle' });
  await applyTheme(page, theme);
}

const spotW = (page) =>
  page.evaluate(() =>
    parseFloat(
      getComputedStyle(document.querySelector('[data-bronto-spotlight]')).getPropertyValue(
        '--spot-w',
      ),
    ),
  );
const spotX = (page) =>
  page.evaluate(() =>
    parseFloat(
      getComputedStyle(document.querySelector('[data-bronto-spotlight]')).getPropertyValue(
        '--spot-x',
      ),
    ),
  );

for (const theme of ['light', 'dark']) {
  test(`spotlight specimen passes axe (${theme})`, async ({ page }) => {
    await open(page, theme);
    const results = await scan(page).analyze();
    expect(blocking(results), JSON.stringify(blocking(results), null, 2)).toEqual([]);
  });
}

test('initSpotlight sizes the cutout to the target', async ({ page }) => {
  await open(page);
  expect(await spotW(page)).toBeGreaterThan(0);
});

test('cutout follows data-target when the host re-points it', async ({ page }) => {
  await open(page);
  const x0 = await spotX(page);
  await page.locator('[data-spot="share-button"]').click();
  await expect(page.locator('[data-bronto-spotlight]')).toHaveAttribute(
    'data-target',
    'share-button',
  );
  await expect.poll(() => spotX(page)).not.toBe(x0);
});
