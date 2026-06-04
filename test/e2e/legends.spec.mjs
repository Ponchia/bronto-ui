import { test, expect } from '@playwright/test';
import { applyTheme } from './_theme.mjs';
import { blocking, scan } from './_demo-guards.mjs';

async function open(page, theme = 'light') {
  await page.goto('/demo/legends.html', { waitUntil: 'networkidle' });
  await applyTheme(page, theme);
}

for (const theme of ['light', 'dark']) {
  test(`legend specimen passes axe and renders every key type (${theme})`, async ({ page }) => {
    await open(page, theme);
    const results = await scan(page).analyze();
    expect(blocking(results), JSON.stringify(blocking(results), null, 2)).toEqual([]);

    await expect(page.locator('.ui-legend')).toHaveCount(6);
    await expect(page.locator('.ui-legend--gradient .ui-legend__track')).toHaveCount(2);
    await expect(page.locator('.ui-legend--threshold')).toHaveCount(1);
    // Every label must be present text (the non-colour channel).
    await expect(page.locator('.ui-legend__label').first()).toBeVisible();
  });
}

test('interactive legend: click toggles state, hides the series, announces it', async ({
  page,
}) => {
  await open(page);
  const btn = page.locator('[data-bronto-legend] .ui-legend__item').first();
  const bar = page.locator('[data-series-bar="research"]');

  await expect(btn).toHaveAttribute('aria-pressed', 'true');
  await btn.click();
  await expect(btn).toHaveAttribute('aria-pressed', 'false');
  await expect(btn).toHaveClass(/is-inactive/);
  await expect(bar).toBeHidden();
  await expect(page.locator('#legend-status')).toHaveText('research hidden');

  await btn.click();
  await expect(btn).toHaveAttribute('aria-pressed', 'true');
  await expect(bar).toBeVisible();
});

test('interactive legend: keyboard (Space) toggles the focused entry', async ({ page }) => {
  await open(page);
  const second = page.locator('[data-bronto-legend] .ui-legend__item').nth(1);
  await second.focus();
  await expect(second).toBeFocused();
  await page.keyboard.press('Space');
  await expect(second).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-series-bar="delivery"]')).toBeHidden();
});

test('legend swatches survive forced-colors (keep a visible border)', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const swatch = page.locator('.ui-legend__swatch').first();
  const borderWidth = await swatch.evaluate((el) => getComputedStyle(el).borderTopWidth);
  expect(parseFloat(borderWidth)).toBeGreaterThan(0);
});
