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

test('forced-colors: selected and candidate items keep nonzero outline cues', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const cues = await page.evaluate(() => {
    const read = (selector) => {
      const style = getComputedStyle(document.querySelector(selector));
      return {
        style: style.outlineStyle,
        width: parseFloat(style.outlineWidth),
        color: style.outlineColor,
      };
    };
    return {
      selected: read('.ui-sel--on'),
      candidate: read('.ui-sel--maybe'),
      canvasText: getComputedStyle(document.body).color,
    };
  });
  expect(cues.selected.style).toBe('solid');
  expect(cues.selected.width).toBeGreaterThanOrEqual(2);
  expect(cues.selected.color).not.toBe('rgba(0, 0, 0, 0)');
  expect(cues.candidate.style).toBe('dashed');
  expect(cues.candidate.width).toBeGreaterThanOrEqual(1);
  expect(cues.candidate.color).not.toBe('rgba(0, 0, 0, 0)');
});
