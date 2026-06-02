import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { applyTheme } from './_theme.mjs';

/**
 * Command palette (initCommand) — a new public behavior in 0.5.0 that exposes
 * the `bronto:command:select` / `bronto:command:close` event contract. jsdom
 * unit tests can't see computed `display`, so the filter/visibility behaviour
 * needs a real browser; runs cross-engine (no pixels). The leaf demo wires a
 * host `bronto:command:select` listener that echoes the pick into `#picked`.
 */
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
  await page.goto('/demo/command.html', { waitUntil: 'networkidle' });
  await applyTheme(page, theme);
}

const visibleItems = (page) => page.locator('.ui-command__item:visible');

for (const theme of ['light', 'dark']) {
  test(`command specimen passes axe (${theme})`, async ({ page }) => {
    await open(page, theme);
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(blocking(results), JSON.stringify(blocking(results), null, 2)).toEqual([]);
  });
}

test('typing filters the list, hides empty groups, and shows the empty state', async ({ page }) => {
  await open(page);
  const input = page.locator('.ui-command__input');
  await expect(visibleItems(page)).toHaveCount(5);

  await input.fill('export');
  await expect(visibleItems(page)).toHaveCount(1);
  await expect(page.locator('.ui-command__item[data-value="export"]')).toBeVisible();
  // a group with no surviving items auto-hides (Navigation drops, Actions stays)
  await expect(page.locator('.ui-command__group:visible')).toHaveCount(1);

  await input.fill('zzzznomatch');
  await expect(visibleItems(page)).toHaveCount(0);
  await expect(page.locator('.ui-command__empty')).toBeVisible();
});

test('keyboard: ArrowDown + Enter selects and emits bronto:command:select', async ({ page }) => {
  await open(page);
  const input = page.locator('.ui-command__input');
  await input.click();
  await input.fill('settings');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.locator('#picked')).toContainText('Open settings');
  await expect(page.locator('#picked')).toContainText('settings'); // the data-value
});

test('pointer: clicking an item emits the select event with its value + label', async ({
  page,
}) => {
  await open(page);
  await page.locator('.ui-command__item[data-value="invoice"]').click();
  await expect(page.locator('#picked')).toContainText('New invoice');
  await expect(page.locator('#picked')).toContainText('invoice');
});

test('Escape emits bronto:command:close', async ({ page }) => {
  await open(page);
  const closed = page.evaluate(
    () =>
      new Promise((resolve) => {
        document
          .querySelector('[data-bronto-command]')
          .addEventListener('bronto:command:close', () => resolve(true), { once: true });
        setTimeout(() => resolve(false), 2000);
      }),
  );
  await page.locator('.ui-command__input').click();
  await page.keyboard.press('Escape');
  expect(await closed).toBe(true);
});
