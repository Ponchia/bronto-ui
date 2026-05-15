import { test, expect } from '@playwright/test';

/** Set the persisted theme before the demo's modules read localStorage,
 *  so the first paint is already the theme under test (no flash/race). */
async function open(page, theme) {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem('bronto-theme', t);
    } catch {
      /* sandboxed storage — demo falls back to OS, still deterministic here */
    }
  }, theme);
  await page.goto('/demo/');
  await page.evaluate(() => document.fonts.ready);
  // Doto is a bundled webfont; settle a frame so glyphs are painted.
  await page.waitForTimeout(150);
}

for (const theme of ['dark', 'light']) {
  test(`demo — ${theme}`, async ({ page }) => {
    await open(page, theme);
    await expect(page).toHaveScreenshot(`demo-${theme}.png`, { fullPage: true });
  });
}

test('demo — RTL mirrors (logical-properties sweep)', async ({ page }) => {
  await open(page, 'dark');
  await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
  await page.waitForTimeout(50);
  await expect(page).toHaveScreenshot('demo-rtl.png', { fullPage: true });
});

test('modal opens centred with a backdrop', async ({ page }) => {
  await open(page, 'dark');
  await page.getByRole('button', { name: 'Open modal' }).click();
  const dialog = page.locator('dialog.ui-modal#demoModal');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveScreenshot('modal-open.png');
});
