import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const resolved = JSON.parse(
  readFileSync(new URL('../../tokens/resolved.json', import.meta.url), 'utf8'),
);

/**
 * Engine-agnostic behavioural assertions (no pixels) — runs on
 * chromium + firefox + webkit, since the real cross-browser risk for a
 * CSS-first framework is `:has()`, `color-mix()`, native <dialog>,
 * `:dir()` and logical properties behaving differently per engine.
 */

async function open(page, theme = 'dark') {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem('bronto-theme', t);
    } catch {
      /* sandboxed storage — falls back to OS, still deterministic here */
    }
  }, theme);
  await page.goto('/demo/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
}

test('RTL actually mirrors interactive controls (not just box model)', async ({ page }) => {
  await open(page);
  const sel = '.ui-switch input:checked + .ui-switch__track .ui-switch__thumb';
  const read = () =>
    page.evaluate((s) => {
      const m = new DOMMatrixReadOnly(getComputedStyle(document.querySelector(s)).transform);
      const bg = getComputedStyle(document.querySelector('.ui-select')).backgroundPositionX;
      return { tx: m.m41, bg };
    }, sel);

  const ltr = await read();
  expect(ltr.tx).toBeGreaterThan(0); // checked thumb moves toward inline-end

  await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
  // Wait for the mirrored end-state rather than racing the transition.
  await page.waitForFunction(
    (s) => new DOMMatrixReadOnly(getComputedStyle(document.querySelector(s)).transform).m41 < 0,
    sel,
  );
  const rtl = await read();
  expect(rtl.tx).toBeLessThan(0); // …and mirrors under RTL
  expect(rtl.bg).not.toBe(ltr.bg); // select marker flips side too
});

test('native <dialog> open/close glue works (initDialog)', async ({ page }) => {
  await open(page);
  const dialog = page.locator('dialog.ui-modal#demoModal');
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Open modal' }).click();
  await expect(dialog).toBeVisible();
  // Backdrop light-dismiss (opted in via data-bronto-dialog-light).
  await page.mouse.click(5, 5);
  await expect(dialog).toBeHidden();
});

test(':has()-driven segmented control reflects the checked radio', async ({ page }) => {
  await open(page);
  const seg = page.locator('.ui-segmented').first();
  const opts = seg.locator('.ui-segmented__option');
  const bg = (i) => opts.nth(i).evaluate((el) => getComputedStyle(el).backgroundColor);
  const before = await bg(2);
  // The radio is intentionally pointer-events:none (visually hidden);
  // the label is the control — clicking it checks the radio, and
  // `:has(input:checked)` must then paint the accent fill.
  await opts.nth(2).click();
  await expect.poll(() => bg(2)).not.toBe(before);
});

test('combobox filters and selects with keyboard in a real browser', async ({ page }) => {
  await open(page);
  const input = page.locator('#cbx');
  await input.fill('ba');
  await expect(page.getByRole('option', { name: 'Banana' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Apple' })).toBeHidden();
  await input.press('ArrowDown');
  await input.press('Enter');
  await expect(input).toHaveValue('banana');
});

test('sortable selectable table updates order and selection state', async ({ page }) => {
  await open(page);
  const table = page.locator('[data-bronto-sortable]');
  await table.getByRole('button', { name: 'Name' }).click();
  await expect(table.locator('tbody tr').first()).toContainText('Ann');
  await table.getByLabel('Select all').check();
  await expect(table.locator('tbody tr[aria-selected="true"]')).toHaveCount(3);
});

test('toast behavior creates a resident polite live region', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Push toast' }).click();
  const stack = page.locator('.ui-toast-stack:not(.ui-toast-stack--assertive)');
  await expect(stack).toHaveAttribute('aria-live', 'polite');
  await expect(stack.locator('.ui-toast')).toContainText('Order filled');
});

test('one-node glyph mask renders as a currentColor icon', async ({ page }) => {
  await open(page);
  const icon = page.locator('#glyphMask .ui-icon').first();
  await expect(icon).toBeVisible();
  const style = await icon.evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      bg: cs.backgroundColor,
      mask: cs.maskImage,
      webkitMask: cs.webkitMaskImage,
      width: el.getBoundingClientRect().width,
      height: el.getBoundingClientRect().height,
    };
  });
  expect(style.width).toBeGreaterThan(0);
  expect(style.height).toBeGreaterThan(0);
  expect(style.bg).not.toBe('rgba(0, 0, 0, 0)');
  expect(`${style.mask} ${style.webkitMask}`).toContain('data:image/svg+xml');
});

for (const theme of ['light', 'dark']) {
  test(`OKLCH accent ramp resolves to the generated ${theme} palette`, async ({ page }) => {
    await open(page, theme);
    const actual = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      const probe = document.createElement('span');
      document.body.append(probe);
      const colors = ['--accent-1', '--accent-2', '--accent-3', '--accent-4'].map((token) => {
        probe.style.color = `var(${token})`;
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = getComputedStyle(probe).color;
        ctx.fillRect(0, 0, 1, 1);
        return [token, [...ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)]];
      });
      probe.remove();
      return Object.fromEntries(colors);
    });
    for (const [token, channels] of Object.entries(actual)) {
      expect(closeChannels(channels, hexChannels(resolved[theme][token]))).toBe(true);
    }
  });
}

function closeChannels(actual, expected) {
  return actual.every((channel, i) => Math.abs(channel - expected[i]) <= 1);
}

function hexChannels(value) {
  const hex = String(value).replace(/^#/, '');
  return [0, 2, 4].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
}
