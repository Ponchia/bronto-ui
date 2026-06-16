import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { settleVisualState } from './_demo-guards.mjs';
import { awaitDemoReady } from './_demo.mjs';

/**
 * Component-scoped visual regression. Each demo `<section>` carries a
 * stable `data-shot` slug and we screenshot THAT element, not the full
 * page. Adding a section adds ONE small baseline and never disturbs the
 * others, so shipped components are frozen and a release only regenerates
 * the baseline for what it actually changed. (Full-page snapshots drifted
 * on every addition — the demo just getting taller forced a container-wide
 * regen each release.)
 *
 * The shot list is discovered from demo/index.html at COLLECTION time
 * (Playwright fixes the test list before any page loads, so we parse the
 * HTML rather than the live DOM). Tag a section with `data-shot` and its
 * baseline appears automatically — no edit here. `data-shot-rtl` opts a
 * section into the curated RTL mirror sweep (directional layouts only).
 */
const demoHtml = readFileSync(
  fileURLToPath(new URL('../../demo/index.html', import.meta.url)),
  'utf8',
);
const shotNodes = [...new JSDOM(demoHtml).window.document.querySelectorAll('[data-shot]')];
const shots = shotNodes.map((node) => node.getAttribute('data-shot'));
const rtlShots = shotNodes
  .filter((node) => node.hasAttribute('data-shot-rtl'))
  .map((node) => node.getAttribute('data-shot'));

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
  // Wait for the JS-built sections (glyph gallery, …) to finish wiring and for
  // the bundled Doto webfont to load — deterministic, vs the old fixed 150ms
  // that raced the glyphs shot to "element not stable".
  await awaitDemoReady(page);
  await settleVisualState(page);
}

for (const theme of ['dark', 'light']) {
  test.describe(`components — ${theme}`, () => {
    for (const shot of shots) {
      test(shot, async ({ page }) => {
        await open(page, theme);
        await expect(page.locator(`[data-shot="${shot}"]`)).toHaveScreenshot(
          `${shot}-${theme}.png`,
        );
      });
    }
  });
}

// RTL: a curated subset (the directional layouts — steps/timeline/pagehead/
// input-icon, breadcrumb/pagination, table, key/value) instead of one giant
// full-page mirror. Catches physical-vs-logical CSS without per-add churn.
test.describe('components — RTL mirrors (logical-properties sweep)', () => {
  for (const shot of rtlShots) {
    test(shot, async ({ page }) => {
      await open(page, 'dark');
      await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
      await settleVisualState(page);
      await expect(page.locator(`[data-shot="${shot}"]`)).toHaveScreenshot(`${shot}-rtl.png`);
    });
  }
});

test('modal opens centred with a backdrop', async ({ page }) => {
  await open(page, 'dark');
  await page.getByRole('button', { name: 'Open modal' }).click();
  const dialog = page.locator('dialog.ui-modal#demoModal');
  await expect(dialog).toBeVisible();
  await settleVisualState(page);
  await expect(dialog).toHaveScreenshot('modal-open.png');
});

test('lightbox opens as a full-screen carousel dialog', async ({ page }) => {
  await open(page, 'dark');
  await page.getByRole('button', { name: 'Open gallery' }).click();
  const dialog = page.locator('dialog.ui-lightbox#lbDemo');
  await expect(dialog).toBeVisible();
  await settleVisualState(page);
  await expect(dialog).toHaveScreenshot('lightbox-open.png');
});
