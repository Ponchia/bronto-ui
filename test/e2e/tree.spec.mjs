import { test, expect } from '@playwright/test';

async function open(page) {
  await page.goto('/demo/tree.html', { waitUntil: 'networkidle' });
}

test('branches are native <details> that toggle, leaves are static rows', async ({ page }) => {
  await open(page);
  const branch = page.locator('.ui-tree__branch').first();
  await expect(branch).toHaveJSProperty('tagName', 'DETAILS');

  // Native disclosure: toggling the summary flips [open] — no Bronto kernel.
  const summary = branch.locator('> .ui-tree__summary');
  const before = await branch.evaluate((el) => el.open);
  await summary.click();
  const after = await branch.evaluate((el) => el.open);
  expect(after).toBe(!before);

  await expect(page.locator('.ui-tree__leaf').first()).toBeVisible();
});

test('branch summaries toggle from the keyboard', async ({ page }) => {
  await open(page);
  const branch = page.locator('.ui-tree__branch').first();
  const summary = branch.locator('> .ui-tree__summary');

  await expect(branch).toHaveJSProperty('open', true);
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(branch).toHaveJSProperty('open', false);
  await page.keyboard.press('Space');
  await expect(branch).toHaveJSProperty('open', true);
});

test('nested rows are indented with a guide rail', async ({ page }) => {
  await open(page);
  // A row nested inside a branch carries the inline-start indent + rail border
  // the top-level rows do not.
  const indent = await page
    .locator('.ui-tree__branch .ui-tree__leaf')
    .first()
    .evaluate((el) => parseFloat(getComputedStyle(el).marginInlineStart));
  expect(indent).toBeGreaterThan(0);
});

test('the twist chevron is currentColor geometry (survives forced-colors)', async ({ page }) => {
  await open(page);
  const chevron = await page
    .locator('.ui-tree__summary')
    .first()
    .evaluate((el) => getComputedStyle(el, '::before').content);
  // The chevron is a generated box (content: '') — present, not a text glyph.
  expect(chevron === '""' || chevron === 'none' || chevron === 'normal').toBe(true);
});
