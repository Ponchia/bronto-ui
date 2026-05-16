import { test, expect } from '@playwright/test';

/**
 * Static-quality gate: the demo (which exercises every component) must
 * load and be driven with ZERO console errors, ZERO uncaught exceptions
 * and ZERO failed network requests — in both themes — plus a few
 * document-quality invariants. Engine-agnostic (no pixels), so it also
 * runs cross-browser. Covers the console / SEO / structure surface
 * Lighthouse checks, without the dependency.
 */

// The browser implicitly requests /favicon.ico; the demo intentionally
// ships none. That 404 is not a framework defect.
const ignored = (url) => url.endsWith('/favicon.ico');

for (const theme of ['dark', 'light']) {
  test(`quality — demo runs clean (${theme})`, async ({ page }) => {
    const consoleErrors = [];
    const pageErrors = [];
    const badResponses = [];

    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text());
    });
    page.on('pageerror', (e) => pageErrors.push(String(e)));
    page.on('response', (r) => {
      if (r.status() >= 400 && !ignored(r.url())) {
        badResponses.push(`${r.status()} ${r.url()}`);
      }
    });

    await page.addInitScript((t) => {
      try {
        localStorage.setItem('bronto-theme', t);
      } catch {
        /* ignore */
      }
    }, theme);
    await page.goto('/demo/', { waitUntil: 'networkidle' });

    // Exercise the behaviours that pull in the shipped modules.
    await page.getByRole('button', { name: 'Open modal' }).click();
    await page.locator('dialog.ui-modal#demoModal [data-bronto-close]').first().click();
    await page.getByRole('button', { name: 'Push toast' }).click();
    await page.locator('[data-bronto-tabs] .ui-tab').nth(1).click();
    await page.waitForTimeout(100);

    expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
    expect(pageErrors, pageErrors.join('\n')).toEqual([]);
    expect(badResponses, badResponses.join('\n')).toEqual([]);
  });
}

test('quality — document structure (SEO / a11y landmarks)', async ({ page }) => {
  await page.goto('/demo/', { waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveAttribute('lang', /\w/);
  await expect(page).toHaveTitle(/\S/);
  await expect(page.locator('head meta[name="description"]')).toHaveAttribute('content', /\S/);
  await expect(page.locator('head meta[name="viewport"]')).toHaveCount(1);
  await expect(page.locator('main')).toHaveCount(1);
});
