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

test('forced-colors: the active app-nav link keeps a non-colour current-page cue', async ({
  page,
}) => {
  // Regression: under HCM var(--accent) (border + bg + text) flattens to one
  // system colour, so the .is-active link collapsed into its siblings. The fix
  // adds a NON-colour channel — font-weight 700 — that the OS palette can't strip.
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/test/e2e/_app-shell.fixture.html', { waitUntil: 'networkidle' });
  const weights = await page.evaluate(() => {
    const links = [...document.querySelectorAll('.ui-app-nav a')];
    const active = links.find((a) => a.classList.contains('is-active'));
    const inactive = links.find((a) => !a.classList.contains('is-active'));
    return {
      active: getComputedStyle(active).fontWeight,
      inactive: getComputedStyle(inactive).fontWeight,
    };
  });
  expect(Number(weights.active)).toBeGreaterThan(Number(weights.inactive));
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
  // link target surfaced on paper. Chromium/WebKit resolve attr(href) to the
  // URL in computed ::after content; Firefox returns the literal `attr(href)`.
  expect(r.afterContent).toMatch(/http|attr\(href\)/);
});

test('print under the dark theme: the panel/card surface flips to white paper, not near-black', async ({
  page,
}) => {
  // Regression for the print `:root` specificity loss: a bare `:root` print
  // remap (0,1,0) lost the cascade to `:root[data-theme='dark']` (0,2,0) and
  // the OLED surface (0,3,0), so a dark-mode user printed a near-black .ui-card
  // on white paper. The fix raises the print selector to `:root:root:root`.
  await page.goto('/demo/', { waitUntil: 'networkidle' });
  await page.emulateMedia({ media: 'print' });
  const read = () =>
    page.evaluate(() => {
      const s = getComputedStyle(document.documentElement);
      return {
        panel: s.getPropertyValue('--panel').trim(),
        panelStrong: s.getPropertyValue('--panel-strong').trim(),
        text: s.getPropertyValue('--text').trim(),
      };
    });

  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'dark';
  });
  const dark = await read();
  expect(dark.panel).toBe('#fff'); // dark theme → white paper under print
  expect(dark.text).toBe('#111'); // ink text, not the dark token

  await page.evaluate(() => {
    document.documentElement.dataset.surface = 'oled';
  });
  const oled = await read();
  expect(oled.panel).toBe('#fff'); // OLED's (0,3,0) panel must not win either
  expect(oled.panelStrong).toBe('#fff'); // and its dark --panel-strong is neutralised
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
