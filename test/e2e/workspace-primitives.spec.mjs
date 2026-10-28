import { test, expect } from '@playwright/test';

const open = (page) => page.goto('/demo/workspace-primitives.html', { waitUntil: 'networkidle' });

test('toolbar keyboard contract keeps editing keys native and supports direction changes', async ({
  page,
}) => {
  await open(page);
  const toolbar = page.getByRole('toolbar', { name: 'Editing tools' });
  await toolbar.focus();
  await expect(page.getByRole('button', { name: 'Select', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('button', { name: 'Move', exact: true })).toBeFocused();
  await toolbar.evaluate((element) => element.setAttribute('dir', 'rtl'));
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('button', { name: 'Select', exact: true })).toBeFocused();
  await page.keyboard.press('End');
  await expect(page.getByRole('textbox', { name: 'Filter items' })).toBeFocused();
  await page.keyboard.type('word');
  await page.keyboard.press('Home');
  await expect(page.getByRole('textbox', { name: 'Filter items' })).toBeFocused();
});

test('action menu preserves focus handoff and discoverable disabled actions', async ({ page }) => {
  await open(page);
  await expect(page.getByRole('menu')).toHaveCount(0);
  await page.getByRole('button', { name: 'Open actions' }).click();
  await expect(page.getByRole('menuitem', { name: 'Inspect document' })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Unavailable action' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menu')).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menu')).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: 'Editor', exact: true })).toBeFocused();
});

test('action menu Tab uses native order and Escape restores its actual button', async ({
  page,
}) => {
  await open(page);
  const trigger = page.getByRole('button', { name: 'Open actions' });
  await trigger.click();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('textbox', { name: 'Editor', exact: true })).toBeFocused();
  await expect(page.getByRole('menu')).toHaveCount(0);
  await trigger.click();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});

test('splitter tracks remain stable when the handle is absent from layout', async ({ page }) => {
  await open(page);
  await page.locator('[data-bronto-splitter]').evaluate((root) => {
    root.style.setProperty('--splitter-pos', '0px');
    root.style.setProperty('--splitter-handle', '0px');
    root.querySelector('.ui-splitter__handle').style.display = 'none';
    root.querySelector('.ui-splitter__pane').style.visibility = 'hidden';
  });
  const root = await page.locator('[data-bronto-splitter]').boundingBox();
  const content = await page.locator('#document').boundingBox();
  expect(content.width).toBeGreaterThan(root.width - 4);
  expect(Math.abs(content.x - root.x)).toBeLessThan(2);
});

test('scroll-region is keyboard reachable with a visible focus ring', async ({ page }) => {
  await open(page);
  const body = page.getByRole('region', { name: 'History', exact: true });
  await body.focus();
  await expect(body).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('PageDown');
  await expect.poll(() => body.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await page.emulateMedia({ forcedColors: 'active' });
  await expect(body).toHaveCSS('outline-style', 'solid');
});

for (const theme of ['light', 'dark']) {
  test(`command sheet fits a narrow viewport and a host-provided keyboard inset (${theme})`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await open(page);
    await page.locator('html').evaluate((element, value) => (element.dataset.theme = value), theme);
    await page.getByRole('button', { name: 'Open commands' }).click();
    const dialog = page.getByRole('dialog', { name: 'Commands', exact: true });
    await dialog.evaluate((element) =>
      element.style.setProperty('--command-viewport-inset', '240px'),
    );
    const box = await dialog.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width).toBeLessThanOrEqual(321);
    expect(box.height).toBeLessThanOrEqual(384);
    const item = dialog.getByRole('option').first();
    const itemBox = await item.boundingBox();
    expect(itemBox.height).toBeGreaterThanOrEqual(48);
    await page.screenshot({ path: info.outputPath(`command-sheet-${theme}.png`) });
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });
}

test('command sheet keeps desktop framing and adapts at intermediate phone widths', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1000, height: 800 });
  await open(page);
  await page.getByRole('button', { name: 'Open commands' }).click();
  const dialog = page.getByRole('dialog', { name: 'Commands', exact: true });
  let box = await dialog.boundingBox();
  expect(box.width).toBeGreaterThan(500);
  expect(box.width).toBeLessThan(600);
  await page.setViewportSize({ width: 700, height: 800 });
  box = await dialog.boundingBox();
  expect(box.width).toBeGreaterThan(690);
  expect(box.x).toBeLessThanOrEqual(1);
});

test('composites retain keyboard ownership inside an editable surface', async ({ page }) => {
  await open(page);
  const toolbar = page.getByRole('toolbar', { name: 'Editing tools' });
  await toolbar.evaluate((root) => {
    root.parentElement.setAttribute('contenteditable', 'true');
    root.setAttribute('contenteditable', 'false');
  });
  await toolbar.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('button', { name: 'Move', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Open actions' }).click();
  const menu = page.getByRole('menu', { name: 'Document actions' });
  await menu.evaluate((root) => {
    root.parentElement.setAttribute('contenteditable', 'true');
    root.setAttribute('contenteditable', 'false');
  });
  await page.keyboard.press('ArrowDown');
  await expect(menu.getByRole('menuitem', { name: 'Unavailable action' })).toBeFocused();
});
