import { test, expect } from '@playwright/test';

/**
 * Locks in the accessibility/print CSS that has no other coverage:
 * forced-colors (Windows High Contrast), prefers-reduced-motion, and
 * the print stylesheet. Computed-style assertions only — no snapshots,
 * so zero baseline maintenance. Chromium-only (uses Chromium media
 * emulation), hence excluded from the cross-engine NON_PIXEL set.
 */

test('forced-colors: the keyboard focus ring is re-asserted', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/demo/', { waitUntil: 'networkidle' });

  // System-colour *resolution* under emulated forced-colors is engine
  // /palette dependent and gets backplated, so asserting an exact rgb
  // is fragile. The robust signal that our forced-colors block applied
  // is the focus outline (outline is not backplated): base.css sets
  // focus-visible → `outline: 2px solid Highlight`.
  const btn = page.getByRole('button', { name: 'Primary', exact: true });
  await btn.focus();
  const o = await btn.evaluate((el) => {
    const s = getComputedStyle(el);
    return { style: s.outlineStyle, width: s.outlineWidth };
  });
  expect(o.style).toBe('solid');
  expect(parseFloat(o.width)).toBeGreaterThanOrEqual(2);
});

test('prefers-reduced-motion: the dot spinner stops animating', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/demo/', { waitUntil: 'networkidle' });
  const spin = await page.evaluate(() => {
    const el = document.querySelector('.ui-dotspinner');
    const dot = document.querySelector('.ui-dotspinner i');
    return {
      anim: getComputedStyle(el).animationName,
      dotOpacity: getComputedStyle(dot).opacity,
    };
  });
  expect(spin.anim).toBe('none'); // dots.css reduced-motion kills the spin
  expect(Number(spin.dotOpacity)).toBeGreaterThan(0); // …but stays legible
});

test('print: chrome is hidden, content + link URLs are kept', async ({ page }) => {
  await page.emulateMedia({ media: 'print' });
  await page.goto('/demo/', { waitUntil: 'networkidle' });
  const r = await page.evaluate(() => {
    const proseLink = document.querySelector('.ui-prose a[href^="http"]');
    return {
      dotfield: getComputedStyle(document.querySelector('.ui-dotfield')).display,
      main: getComputedStyle(document.querySelector('main')).display,
      afterContent: proseLink ? getComputedStyle(proseLink, '::after').content : '"(none)"',
    };
  });
  expect(r.dotfield).toBe('none'); // decorative chrome dropped on paper
  expect(r.main).not.toBe('none'); // content kept
  expect(r.afterContent).toContain('http'); // link target surfaced
});
