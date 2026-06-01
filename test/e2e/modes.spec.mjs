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

test('surface=oled: dark surfaces flip to true black; the readable text token is untouched', async ({
  page,
}) => {
  // data-surface / data-density / data-contrast are convenience presets, NOT
  // part of the stability contract (see docs/stability.md). This is a cheap
  // smoke that the OLED preset actually applies and only moves surfaces — text
  // stays the re-tuned --text, which clears WCAG AA on pure black too.
  await page.goto('/demo/', { waitUntil: 'networkidle' });
  const v = await page.evaluate(() => {
    const root = document.documentElement;
    const read = () => {
      const s = getComputedStyle(root);
      return { bg: s.getPropertyValue('--bg').trim(), text: s.getPropertyValue('--text').trim() };
    };
    root.dataset.theme = 'dark';
    delete root.dataset.surface;
    const base = read();
    root.dataset.surface = 'oled';
    const oled = read();
    return { base, oled };
  });
  expect(v.base.bg).toBe('#121212'); // elevated near-black dark base
  expect(v.oled.bg).toBe('#000000'); // OLED preset flips --bg to true black
  expect(v.oled.text).toBe('#e6e6e6'); // text untouched — stays the readable token
});
