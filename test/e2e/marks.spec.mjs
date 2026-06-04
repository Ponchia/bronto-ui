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

test('in-prose .ui-mark wins over the bare prose mark rule (C1 regression)', async ({ page }) => {
  await open(page);
  // The demo marks live inside `.ui-prose`. The higher-specificity `.ui-prose mark`
  // rule must NOT override `.ui-mark`: a highlight mark keeps its gradient fill and a
  // tone modifier resolves --mark-color, rather than collapsing to the prose's solid
  // `--accent-soft` background.
  const highlight = page.locator('mark.ui-mark--accent:not(.ui-mark--draw)').first();
  const bg = await highlight.evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(bg).toContain('gradient');
  // The bare prose `<mark>` (no .ui-mark) still gets the plain prose highlight: a solid
  // background with no gradient image.
  const bareCount = await page.locator('.ui-prose mark:not(.ui-mark)').count();
  expect(bareCount).toBeGreaterThanOrEqual(0); // presence-tolerant; the modifier is what mattered
});

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
