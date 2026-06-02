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

// The showcase claims every Tier-3 block is a *live, styled* specimen. Each
// opt-in app-tier leaf (0.5.0) ships as its own entrypoint that is NOT in the
// core bundle or the analytical roll-up, so it must be linked explicitly. A
// missing <link> is invisible to the clean-console gate above (no failed
// request — the stylesheet simply isn't requested), so assert the leaves are
// actually applied: their sheets are loaded AND a marker class computes a
// leaf-only value rather than the UA default.
test('quality — opt-in showcase leaves are loaded and applied', async ({ page }) => {
  await page.goto('/demo/', { waitUntil: 'networkidle' });

  const leaves = [
    'sources.css',
    'state.css',
    'generated.css',
    'workbench.css',
    'command.css',
    'report.css',
  ];
  const loaded = await page.evaluate(() =>
    [...document.styleSheets].map((s) => s.href || '').filter(Boolean),
  );
  for (const leaf of leaves) {
    expect(
      loaded.some((href) => href.endsWith(`/css/${leaf}`)),
      `expected dist/css/${leaf} to be linked from demo/index.html`,
    ).toBe(true);
  }

  // .ui-command and .ui-inspector are `display: grid` only when their leaf CSS
  // applies (UA default for the <div> is block) — direct proof the styles took
  // effect, not just that the <link> tag is present.
  await expect(page.locator('.ui-command').first()).toHaveCSS('display', 'grid');
  await expect(page.locator('.ui-inspector').first()).toHaveCSS('display', 'grid');
});
