import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];

const STRUCTURAL = new Set([
  'heading-order',
  'landmark-one-main',
  'landmark-unique',
  'region',
  'scrollable-region-focusable',
  'duplicate-id',
  'tabindex',
]);

function blocking(results) {
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical' || STRUCTURAL.has(v.id))
    .map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target) }));
}

async function open(page, theme = 'light') {
  await page.goto('/demo/marks.html', { waitUntil: 'networkidle' });
  await page.emulateMedia({ colorScheme: theme });
  await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
}

for (const theme of ['light', 'dark']) {
  test(`marks specimen passes axe and renders marks (${theme})`, async ({ page }) => {
    await open(page, theme);
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
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
