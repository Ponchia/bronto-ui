import { test, expect } from '@playwright/test';
import { applyTheme } from './_theme.mjs';
import { blocking, scan } from './_demo-guards.mjs';

async function open(page, theme = 'light') {
  await page.goto('/demo/crosshair.html', { waitUntil: 'networkidle' });
  await applyTheme(page, theme);
}

for (const theme of ['light', 'dark']) {
  test(`crosshair specimen passes axe (${theme})`, async ({ page }) => {
    await open(page, theme);
    const results = await scan(page).analyze();
    expect(blocking(results), JSON.stringify(blocking(results), null, 2)).toEqual([]);
  });
}

test('crosshair activates on pointer move and reports a fraction', async ({ page }) => {
  await open(page);
  const overlay = page.locator('.ui-crosshair');
  await expect(overlay).not.toHaveClass(/is-active/);
  const plot = page.locator('[data-bronto-crosshair]');
  await plot.hover({ position: { x: 80, y: 60 } });
  await expect(overlay).toHaveClass(/is-active/);
  await expect(page.locator('#status')).toContainText('%');
  // --crosshair-x was set to a pixel offset
  const x = await overlay.evaluate((el) => getComputedStyle(el).getPropertyValue('--crosshair-x'));
  expect(parseFloat(x)).toBeGreaterThan(0);
});

test('crosshair vertical rule tracks the pointer in RTL (not mirrored away)', async ({ page }) => {
  // Regression: the rule used a logical inset-inline-start anchor + a physical
  // translateX, so in RTL it anchored at the right edge and then moved further
  // right — landing off-plot, away from the pointer.
  await open(page);
  const plot = page.locator('[data-bronto-crosshair]');
  await plot.evaluate((el) => (el.dir = 'rtl'));
  await plot.hover({ position: { x: 80, y: 60 } });

  const r = await page.evaluate(() => {
    const plotEl = document.querySelector('[data-bronto-crosshair]');
    const lineEl = document.querySelector('.ui-crosshair__line--x');
    const p = plotEl.getBoundingClientRect();
    const l = lineEl.getBoundingClientRect();
    return { pointerX: p.left + 80, lineX: l.left };
  });
  // The 1px rule sits at the pointer's physical x, within a couple of px.
  expect(Math.abs(r.lineX - r.pointerX)).toBeLessThan(4);
});
