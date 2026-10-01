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
    const rendererPath = `/renderer/${'index.js'}`;
    const { readTokens } = await import(rendererPath);
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

test('observeTokens calls back once per token change, not per root style write', async ({
  page,
}) => {
  await openPage(page, { 'data-theme': 'light' });
  const seen = await page.evaluate(async () => {
    const rendererPath = `/renderer/${'index.js'}`;
    const { observeTokens } = await import(rendererPath);
    const root = document.documentElement;
    const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const calls = [];
    const stop = observeTokens((t) => calls.push(`${t.scheme} ${t.accent}`));
    // A host writing its own inline property (a canvas zoom, say) moves no token.
    root.style.setProperty('--canvas-zoom', '2');
    await frames();
    root.setAttribute('data-theme', 'dark');
    await frames();
    root.style.setProperty('--accent', '#00ff00');
    await frames();
    stop();
    root.setAttribute('data-theme', 'light');
    await frames();
    return calls;
  });
  expect(seen).toEqual(['dark #ff3b41', 'dark #00ff00']);
});

test('resolveColor computes var() and color-mix() through the page', async ({ page }) => {
  await openPage(page, { 'data-theme': 'light' });
  const out = await page.evaluate(async () => {
    const rendererPath = `/renderer/${'index.js'}`;
    const { resolveColor } = await import(rendererPath);
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
