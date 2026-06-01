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
const blocking = (r) =>
  r.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical' || STRUCTURAL.has(v.id))
    .map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target) }));

async function open(page, theme = 'light') {
  await page.goto('/demo/crosshair.html', { waitUntil: 'networkidle' });
  await page.emulateMedia({ colorScheme: theme });
  await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
}

for (const theme of ['light', 'dark']) {
  test(`crosshair specimen passes axe (${theme})`, async ({ page }) => {
    await open(page, theme);
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(blocking(results), JSON.stringify(blocking(results), null, 2)).toEqual([]);
  });
}

test('crosshair activates on pointer move and reports a fraction', async ({ page }) => {
  await open(page);
  const overlay = page.locator('.ui-crosshair');
  await expect(overlay).not.toHaveClass(/is-active/);
  const plot = page.locator('[data-bronto-crosshair]');
  await plot.hover({ position: { x: 80, y: 60 } });
  await expect(overlay).toHaveClass(/is-active/);
  await expect(page.locator('#status')).toContainText('%');
  // --crosshair-x was set to a pixel offset
  const x = await overlay.evaluate((el) => getComputedStyle(el).getPropertyValue('--crosshair-x'));
  expect(parseFloat(x)).toBeGreaterThan(0);
});
