import { test, expect } from '@playwright/test';

/**
 * Engine-agnostic behavioural assertions (no pixels) — runs on
 * chromium + firefox + webkit, since the real cross-browser risk for a
 * CSS-first framework is `:has()`, `color-mix()`, native <dialog>,
 * `:dir()` and logical properties behaving differently per engine.
 */

async function open(page, theme = 'dark') {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem('bronto-theme', t);
    } catch {
      /* sandboxed storage — falls back to OS, still deterministic here */
    }
  }, theme);
  await page.goto('/demo/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
}

test('RTL actually mirrors interactive controls (not just box model)', async ({ page }) => {
  await open(page);
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
  // Wait for the mirrored end-state rather than racing the transition.
  await page.waitForFunction(
    (s) => new DOMMatrixReadOnly(getComputedStyle(document.querySelector(s)).transform).m41 < 0,
    sel
  );
  const rtl = await read();
  expect(rtl.tx).toBeLessThan(0); // …and mirrors under RTL
  expect(rtl.bg).not.toBe(ltr.bg); // select marker flips side too
});

test('native <dialog> open/close glue works (initDialog)', async ({ page }) => {
  await open(page);
  const dialog = page.locator('dialog.ui-modal#demoModal');
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Open modal' }).click();
  await expect(dialog).toBeVisible();
  // Backdrop light-dismiss (opted in via data-bronto-dialog-light).
  await page.mouse.click(5, 5);
  await expect(dialog).toBeHidden();
});

test(':has()-driven segmented control reflects the checked radio', async ({ page }) => {
  await open(page);
  const seg = page.locator('.ui-segmented').first();
  const opts = seg.locator('.ui-segmented__option');
  const bg = (i) => opts.nth(i).evaluate((el) => getComputedStyle(el).backgroundColor);
  const before = await bg(2);
  // The radio is intentionally pointer-events:none (visually hidden);
  // the label is the control — clicking it checks the radio, and
  // `:has(input:checked)` must then paint the accent fill.
  await opts.nth(2).click();
  await expect.poll(() => bg(2)).not.toBe(before);
});
