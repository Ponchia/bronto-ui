import { test, expect } from '@playwright/test';

/**
 * Render-geometry gate — the antidote to "validates-but-renders-nothing".
 *
 * A class can pass classes.json and still paint nothing: the dogfood review
 * found `.ui-meter__fill` shipped `display:inline`, so the documented
 * `<span class="ui-meter__fill" style="--value:…">` collapsed to a 0×0 box —
 * invisible to every structural/drift gate because docs and the registry both
 * looked correct. No existing spec launched a browser at a report primitive and
 * measured it, so the whole class was unguarded.
 *
 * This spec measures the LAID-OUT box of the report primitives that carry a
 * value through a fill child (meter, progress) plus the standalone `.ui-src`
 * pill, asserting each has a real width — `getBoundingClientRect()`, NOT
 * `getComputedStyle().inlineSize` (which returns the *set* `--value`-derived
 * string even on a 0-width inline box, the exact false-positive that fooled a
 * generator's own verification). Engine-agnostic → runs cross-browser.
 */

test('report value-fills and the trust pill paint a non-zero box', async ({ page }) => {
  await page.goto('/demo/', { waitUntil: 'networkidle' });

  // A meter fill at a known --value must have real width (the R1 regression:
  // an inline fill measures 0 here regardless of its `inline-size: …%`).
  const meterFill = page.locator('.ui-meter__fill').first();
  await expect(meterFill).toBeVisible();
  const meterBox = await meterFill.boundingBox();
  expect(meterBox, 'meter fill has a layout box').not.toBeNull();
  expect(meterBox.width, 'meter fill paints a non-zero width').toBeGreaterThan(0);
  expect(meterBox.height, 'meter fill paints a non-zero height').toBeGreaterThan(0);

  // The determinate progress bar (demo sets --value: 64) is the same fill shape.
  const progressFill = page
    .locator('.ui-progress:not(.ui-progress--indeterminate) .ui-progress__bar')
    .first();
  const progressBox = await progressFill.boundingBox();
  expect(progressBox, 'progress bar has a layout box').not.toBeNull();
  expect(progressBox.width, 'progress bar paints a non-zero width').toBeGreaterThan(0);
});

test('standalone .ui-src pill renders a non-zero box', async ({ page }) => {
  await page.goto('/demo/sources.html', { waitUntil: 'networkidle' });

  const pill = page.locator('.ui-src').first();
  await expect(pill).toBeVisible();
  const box = await pill.boundingBox();
  expect(box, 'ui-src pill has a layout box').not.toBeNull();
  expect(box.width, 'ui-src pill paints a non-zero width').toBeGreaterThan(0);
  expect(box.height, 'ui-src pill paints a non-zero height').toBeGreaterThan(0);
});
