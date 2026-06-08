import { test, expect } from '@playwright/test';
import { applyTheme } from './_theme.mjs';
import { blocking, ignored, scan } from './_demo-guards.mjs';

/**
 * The canonical no-build, no-JS static report (demo/report-standalone.html).
 * It links only the built CSS by relative path and ships ZERO behavior JS, so
 * the highest-signal proof is that it renders the full report vocabulary — and
 * two brand-new pure-CSS primitives — with nothing throwing and nothing 404ing.
 *
 * New primitives exercised here:
 *   - ui-delta   — a trend indicator whose arrow glyph is injected via a CSS
 *                  `::before` (up ▲ / down ▼ / flat —), with `--invert` swapping
 *                  ONLY the tone. We assert the glyph is present (content not
 *                  none/normal) and that up vs down differ.
 *   - ui-compare — a fluid side-by-side grid (`ui-compare--2up`) that must be a
 *                  real CSS grid and must not force the page to scroll
 *                  horizontally on a phone.
 *
 * Modelled on report.spec.mjs (same console/pageerror/response capture, same
 * applyTheme settle-before-axe path, same blocking() axe filter). retries:0 is
 * the repo default; every assertion below is computed-style/structural, not a
 * pixel diff, so this runs cross-engine like the rest of the report coverage.
 */

async function openReport(page, theme = 'dark') {
  await page.goto('/demo/report-standalone.html', { waitUntil: 'networkidle' });
  // Same opener report.spec uses: flip the theme and settle fonts + finite
  // animations before any colour probe / axe sample (avoids the mid-fade
  // color-contrast race the analytical leaves hit cross-engine).
  await applyTheme(page, theme);
}

// The responsive.spec idiom: positive value = the page itself scrolls
// horizontally. WebKit can report a small negative value, so `<= 0` is the gate.
function pageOverflow() {
  return document.documentElement.scrollWidth - window.innerWidth;
}

// ---------------------------------------------------------------------------
// Zero-JS proof: nothing throws, no console error, no 404 asset. A static page
// that needed a behavior init (or whose relative CSS links missed) would trip
// one of these. Both themes, mirroring report.spec.
// ---------------------------------------------------------------------------
for (const theme of ['dark', 'light']) {
  test(`standalone report runs clean — zero JS (${theme})`, async ({ page }) => {
    const consoleErrors = [];
    const pageErrors = [];
    const badResponses = [];

    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text());
    });
    page.on('pageerror', (e) => pageErrors.push(String(e)));
    page.on('response', (r) => {
      if (r.status() >= 400 && !ignored(r.url())) badResponses.push(`${r.status()} ${r.url()}`);
    });

    await openReport(page, theme);

    expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
    expect(pageErrors, pageErrors.join('\n')).toEqual([]);
    expect(badResponses, badResponses.join('\n')).toEqual([]);
  });
}

// ---------------------------------------------------------------------------
// axe in BOTH themes (contrast is theme-dependent) + the report shape the
// standalone fixture is meant to demonstrate is actually present.
// ---------------------------------------------------------------------------
for (const theme of ['dark', 'light']) {
  test(`standalone report passes axe and carries report semantics (${theme})`, async ({ page }) => {
    await openReport(page, theme);
    const results = await scan(page).analyze();
    expect(blocking(results), JSON.stringify(blocking(results), null, 2)).toEqual([]);

    await expect(page.locator('main.ui-report')).toHaveCount(1);
    await expect(page.locator('h1.ui-report__title')).toHaveCount(1);
    await expect(page.locator('.ui-delta')).toHaveCount(4);
    await expect(page.locator('.ui-compare')).toHaveCount(1);
    await expect(page.locator('.ui-compare__col')).toHaveCount(2);
    await expect(page.locator('.ui-compare__head')).toHaveCount(2);
    // The CSS-bar renderer is gone; the request-mix figure is now an inline
    // SVG (one <rect> per series) with its data table kept as the fallback.
    const figure = page.locator('figure.ui-report__figure');
    const barChart = figure.locator('svg[aria-label^="Weekly request mix"]');
    await expect(barChart).toBeVisible();
    await expect(barChart.locator('rect')).toHaveCount(2);
    await expect(figure.locator('.ui-table-wrap table')).toHaveCount(1);
    await expect(page.locator('.ui-legend')).toHaveCount(1);
  });
}

// ---------------------------------------------------------------------------
// ui-delta — the arrow glyph is injected purely by CSS `::before` (no JS, no
// inline char). Probe the computed pseudo-element content: present (not
// none/normal/empty) for up/down/flat, and up ≠ down so the modifier actually
// drives the glyph. `--invert` swaps only the tone, so its glyph still matches
// its direction (up stays ▲) — asserted via the up+invert specimen.
// ---------------------------------------------------------------------------
test('ui-delta injects its arrow glyph via ::before (no JS)', async ({ page }) => {
  await openReport(page, 'light');

  const content = await page.evaluate(() => {
    const read = (sel) =>
      getComputedStyle(document.querySelector(sel), '::before').getPropertyValue('content');
    return {
      up: read('.ui-delta--up:not(.ui-delta--invert)'),
      down: read('.ui-delta--down'),
      flat: read('.ui-delta--flat'),
      invertUp: read('.ui-delta--invert.ui-delta--up'),
    };
  });

  const empty = (c) => ['none', 'normal', '', 'auto'].includes(c);
  // A glyph is present for each direction…
  expect(empty(content.up), `up content was ${content.up}`).toBe(false);
  expect(empty(content.down), `down content was ${content.down}`).toBe(false);
  expect(empty(content.flat), `flat content was ${content.flat}`).toBe(false);
  // …and up vs down resolve to different glyphs (the modifier drives it).
  expect(content.up).not.toBe(content.down);
  // --invert keeps the directional glyph (it only swaps tone), so up+invert
  // carries the same ▲ as a plain up.
  expect(content.invertUp).toBe(content.up);
});

// `--invert` swaps ONLY the tone: an inverted "up" reads as the danger colour
// (what a plain "down" would use), not the success colour a plain "up" uses.
// This is a robust same-page colour comparison (no hard-coded hex), so it holds
// across themes/token edits.
test('ui-delta--invert swaps only the tone', async ({ page }) => {
  await openReport(page, 'light');
  const tones = await page.evaluate(() => {
    const colour = (sel) => getComputedStyle(document.querySelector(sel)).color;
    return {
      up: colour('.ui-delta--up:not(.ui-delta--invert)'),
      down: colour('.ui-delta--down'),
      invertUp: colour('.ui-delta--invert.ui-delta--up'),
    };
  });
  // Inverted-up takes the danger tone (≠ plain up's success tone)…
  expect(tones.invertUp).not.toBe(tones.up);
  // …which is the same tone a plain down uses.
  expect(tones.invertUp).toBe(tones.down);
});

// ---------------------------------------------------------------------------
// ui-compare — a real CSS grid, and the report stays page-overflow-clean at a
// narrow phone viewport (where ui-compare--2up collapses to a single column).
// ---------------------------------------------------------------------------
test('ui-compare is a CSS grid', async ({ page }) => {
  await openReport(page, 'light');
  const display = await page.evaluate(
    () => getComputedStyle(document.querySelector('.ui-compare')).display,
  );
  expect(display).toBe('grid');
});

test('report tables preserve words unless break-anywhere is explicit', async ({ page }) => {
  await openReport(page, 'light');
  const wrapping = await page.evaluate(() => {
    const tableCell = document.querySelector('.ui-table td');
    const fixture = document.createElement('table');
    fixture.className = 'ui-table ui-table--break-anywhere';
    fixture.innerHTML = '<tbody><tr><td>machine_token_without_spaces</td></tr></tbody>';
    document.body.append(fixture);
    const explicitCell = fixture.querySelector('td');
    return {
      defaultCell: getComputedStyle(tableCell).overflowWrap,
      explicitCell: getComputedStyle(explicitCell).overflowWrap,
    };
  });

  expect(wrapping.defaultCell).not.toBe('anywhere');
  expect(wrapping.explicitCell).toBe('anywhere');
});

test('standalone report does not overflow horizontally at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 844 });
  await openReport(page, 'light');
  const overflow = await page.evaluate(pageOverflow);
  expect(overflow, `page overflowed by ${overflow}px`).toBeLessThanOrEqual(0);
});

// ---------------------------------------------------------------------------
// Print path — the standalone fixture is a Chromium-PDF target. Mirror
// report.spec's Chromium-only PDF export (cheap, an existing pattern): a
// no-JS page must still produce a non-empty PDF, proving the print CSS the
// fixture links resolves at paint time.
// ---------------------------------------------------------------------------
test('standalone report exports a non-empty Chromium PDF', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'page.pdf() is Chromium-only in Playwright');
  await openReport(page, 'light');
  const css = await page.evaluate(async () => {
    const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    const texts = await Promise.all(
      stylesheets.map(async (link) => {
        const res = await fetch(link.href);
        return res.text();
      }),
    );
    return texts.join('\n');
  });
  expect(css).toMatch(/@page\{margin:\s*18mm\}/);
  expect(css).not.toMatch(/@page\{margin:\s*var\(--report-page-margin\)\}/);

  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  expect(pdf.length).toBeGreaterThan(20_000);
});
