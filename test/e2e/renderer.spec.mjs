import { test, expect } from '@playwright/test';

/**
 * @ponchia/ui/renderer against a real engine: custom properties, color-mix(),
 * skins and the OLED surface only resolve in a browser, and the point of the
 * module is that a renderer follows them without a static snapshot.
 */
async function openPage(page, attrs = {}) {
  await page.goto('/docs/index.html', { waitUntil: 'domcontentloaded' });
  await page.setContent(`<!doctype html>
    <html ${Object.entries(attrs)
      .map(([k, v]) => `${k}="${v}"`)
      .join(' ')}>
      <head>
        <link rel="stylesheet" href="/dist/bronto.css" />
        <link rel="stylesheet" href="/dist/css/skins.css" />
        <link rel="stylesheet" href="/dist/css/dataviz.css" />
      </head>
      <body><main id="host"></main></body>
    </html>`);
  await page.waitForFunction(
    () => getComputedStyle(document.documentElement).getPropertyValue('--cat-1').trim() !== '',
  );
}

const read = (page) =>
  page.evaluate(async () => {
    const { readTokens } = await import('/renderer/index.js');
    return readTokens();
  });

test('readTokens resolves the light page to literals, including derived tints', async ({
  page,
}) => {
  await openPage(page, { 'data-theme': 'light' });
  const t = await read(page);
  expect(t.scheme).toBe('light');
  expect(t.bg).toBe('#f4f4f2');
  expect(t.panel).toBe('#ffffff');
  expect(t.categorical[0]).toBe('#2a78d6');
  for (const c of [
    ...t.categorical,
    ...t.categoricalTint,
    ...t.categoricalInk,
    t.accentText,
    t.focus,
  ])
    expect(c).toMatch(/^#[0-9a-f]{6}$/);
  expect(t.selection).toMatch(/^rgba\(\d+, \d+, \d+, 0\.27\)$/);
});

test('readTokens follows dark, the OLED surface and a skin without a snapshot', async ({
  page,
}) => {
  await openPage(page, { 'data-theme': 'dark' });
  const dark = await read(page);
  expect(dark.scheme).toBe('dark');
  expect(dark.categorical[0]).toBe('#3987e5');

  await page.evaluate(() => document.documentElement.setAttribute('data-surface', 'oled'));
  const oled = await read(page);
  expect(oled.bg).toBe('#000000');
  expect(oled.panel).toBe('#101010');
  expect(oled.categoricalTint[0]).not.toBe(dark.categoricalTint[0]);

  await page.evaluate(() => document.documentElement.setAttribute('data-bronto-skin', 'amber-crt'));
  const amber = await read(page);
  expect(amber.accent).not.toBe(dark.accent);
});

test('observeTokens calls back once per change with the new tokens', async ({ page }) => {
  await openPage(page, { 'data-theme': 'light' });
  const schemes = await page.evaluate(async () => {
    const { observeTokens } = await import('/renderer/index.js');
    const seen = [];
    const stop = observeTokens((t) => seen.push(t.scheme));
    document.documentElement.setAttribute('data-theme', 'dark');
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    stop();
    document.documentElement.setAttribute('data-theme', 'light');
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    return seen;
  });
  expect(schemes).toEqual(['dark']);
});

test('resolveColor computes var() and color-mix() through the page', async ({ page }) => {
  await openPage(page, { 'data-theme': 'light' });
  const out = await page.evaluate(async () => {
    const { resolveColor } = await import('/renderer/index.js');
    return {
      accent: resolveColor('var(--accent)'),
      mixed: resolveColor('color-mix(in oklch, var(--cat-1) 16%, var(--panel))'),
      named: resolveColor('rebeccapurple'),
      invalid: resolveColor('not-a-colour'),
    };
  });
  expect(out.accent).toBe('#d71921');
  expect(out.mixed).toMatch(/^#[0-9a-f]{6}$/);
  expect(out.named).toBe('#663399');
  expect(out.invalid).toBeNull();
});
