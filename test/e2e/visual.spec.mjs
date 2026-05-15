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

test('RTL actually mirrors interactive controls (not just box model)', async ({ page }) => {
  await open(page, 'dark');
  const sel = '.ui-switch input:checked + .ui-switch__track .ui-switch__thumb';
  const read = () =>
    page.evaluate((s) => {
      const m = new DOMMatrixReadOnly(getComputedStyle(document.querySelector(s)).transform);
      const bg = getComputedStyle(document.querySelector('.ui-select')).backgroundPositionX;
      return { tx: m.m41, bg };
    }, sel);

  const ltr = await read();
  expect(ltr.tx).toBeGreaterThan(0); // checked thumb moves toward inline-end

  await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
  // The thumb has a `transform` transition — wait for the mirrored end
  // state rather than racing a fixed sleep (this is about final CSS, not
  // the animation). A genuinely unmirrored build times out here = fail.
  await page.waitForFunction(
    (s) => new DOMMatrixReadOnly(getComputedStyle(document.querySelector(s)).transform).m41 < 0,
    sel
  );
  const rtl = await read();
  expect(rtl.tx).toBeLessThan(0); // …and mirrors under RTL
  expect(rtl.bg).not.toBe(ltr.bg); // select marker flips side too
});

test('modal opens centred with a backdrop', async ({ page }) => {
  await open(page, 'dark');
  await page.getByRole('button', { name: 'Open modal' }).click();
  const dialog = page.locator('dialog.ui-modal#demoModal');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveScreenshot('modal-open.png');
});
