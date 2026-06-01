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
  await page.goto('/demo/spotlight.html', { waitUntil: 'networkidle' });
  await page.emulateMedia({ colorScheme: theme });
  await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
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
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
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
