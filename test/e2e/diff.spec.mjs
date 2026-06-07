import { test, expect } from '@playwright/test';
import { applyTheme } from './_theme.mjs';
import { blocking, scan } from './_demo-guards.mjs';

async function open(page, theme = 'light') {
  await page.goto('/demo/diff.html', { waitUntil: 'networkidle' });
  await applyTheme(page, theme);
}

for (const theme of ['light', 'dark']) {
  test(`diff specimen passes axe and renders rows (${theme})`, async ({ page }) => {
    await open(page, theme);
    const results = await scan(page).analyze();
    expect(blocking(results), JSON.stringify(blocking(results), null, 2)).toEqual([]);

    await expect(page.locator('.ui-diff').first()).toBeVisible();
    await expect(page.locator('.ui-diff__row--add').first()).toBeVisible();
    await expect(page.locator('.ui-diff__row--remove').first()).toBeVisible();
    await expect(page.locator('.ui-diff--split .ui-diff__pane')).toHaveCount(2);
  });
}

test('the +/− gutter glyph is generated content, so add/remove survive forced-colors', async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const sign = await page
    .locator('.ui-diff__row--add .ui-diff__code')
    .first()
    .evaluate((el) => getComputedStyle(el, '::before').content);
  // The glyph is painted from the row modifier's --diff-sign, not the markup.
  expect(sign).toContain('+');
});

test('line numbers are excluded from a text selection (user-select: none)', async ({ page }) => {
  await open(page);
  // Cross-engine `user-select` introspection via the CSSOM `getPropertyValue`
  // API. Unlike `print-color-adjust` (report.spec.mjs:105) or `mask-image`
  // (behavior.spec.mjs:148) — where the standard JS name is the reliable
  // cross-engine value and WebKit returns the prefixed name as a fallback —
  // for `user-select` the relationship is inverted: WebKit still treats the
  // standard `user-select` rule as the legacy `-webkit-user-select` slot, so
  // `getPropertyValue('user-select')` on WebKit reports the cascade default
  // ("text") even when the standard rule is applied, and
  // `getPropertyValue('-webkit-user-select')` is where the computed value
  // actually lives. chromium + firefox return "none" for the standard name
  // and "none" for the prefixed name. Reading the prefixed name first and
  // falling back to the standard is the only reading order that works on
  // all three engines; an OR in the standard-first order would short-circuit
  // on WebKit's truthy "text" default and never see the correct "none"
  // (which is why an earlier `a || b` on the JS keys failed at line 42).
  const userSelect = await page.locator('.ui-diff__ln').first().evaluate((el) => {
    const cs = getComputedStyle(el);
    return (
      cs.getPropertyValue('-webkit-user-select').trim() ||
      cs.getPropertyValue('user-select').trim()
    );
  });
  expect(userSelect).toBe('none');
});
