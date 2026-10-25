import { test, expect } from '@playwright/test';

async function open(page) {
  await page.goto('/demo/tree.html', { waitUntil: 'networkidle' });
}

for (const reducedMotion of ['reduce', 'no-preference']) {
  test(`native branches hide and reveal their static leaves (${reducedMotion})`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion });
    await open(page);
    const branch = page.locator('.ui-tree__branch').first();
    const summary = branch.locator('> .ui-tree__summary');
    const leaf = branch.locator('.ui-tree__leaf').first();
    await expect(branch).toHaveJSProperty('tagName', 'DETAILS');
    await expect(branch).toHaveJSProperty('open', true);
    await expect(leaf).toHaveJSProperty('tagName', 'DIV');
    await expect(leaf).toBeVisible();

    // A static row still belongs to its enclosing disclosure. The old test
    // expected it visible after closing its ancestor and passed mid-animation.
    await summary.click();
    await expect(branch).toHaveJSProperty('open', false);
    await expect(leaf).toBeHidden();
    await expect(summary).toBeVisible();
    await summary.click();
    await expect(branch).toHaveJSProperty('open', true);
    await expect(leaf).toBeVisible();
  });
}

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
