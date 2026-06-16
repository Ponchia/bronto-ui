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

  const determinateDotbar = page.locator('.ui-dotbar:not(.ui-dotbar--indeterminate)').first();
  await expect(determinateDotbar).toHaveAttribute('role', 'progressbar');
  await expect(determinateDotbar).toHaveAttribute('aria-valuenow', '4');
  await expect(determinateDotbar).toHaveAttribute('aria-valuemin', '0');
  await expect(determinateDotbar).toHaveAttribute('aria-valuemax', '8');
  expect(await determinateDotbar.locator('i').count(), 'dotbar has eight segments').toBe(8);
  expect(await determinateDotbar.locator('i.is-on').count(), 'dotbar lights its value').toBe(4);

  for (const [label, locator] of [
    ['indeterminate progress', page.locator('.ui-progress.ui-progress--indeterminate').first()],
    ['indeterminate dotbar', page.locator('.ui-dotbar.ui-dotbar--indeterminate').first()],
  ]) {
    await expect(locator, `${label} is busy`).toHaveAttribute('aria-busy', 'true');
    expect(await locator.getAttribute('aria-valuenow'), `${label} omits aria-valuenow`).toBeNull();
    expect(await locator.getAttribute('aria-valuemin'), `${label} omits aria-valuemin`).toBeNull();
    expect(await locator.getAttribute('aria-valuemax'), `${label} omits aria-valuemax`).toBeNull();
  }
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

// The dot-matrix data surfaces are pure CSS with no behavior layer, so this
// is their ONLY executable gate: each must lay out a real box with lit cells
// (the validates-but-renders-nothing trap — a waffle whose <i> cells paint
// 0×0 passes every structural gate and shows nothing).
test('dot data surfaces paint non-zero boxes with lit cells', async ({ page }) => {
  await page.goto('/demo/dots.html', { waitUntil: 'networkidle' });
  await page.waitForSelector('html[data-demo-ready]');

  for (const [selector, minCells] of [
    ['.ui-waffle', 50],
    ['.ui-activity', 50],
    ['.ui-level', 5],
  ]) {
    const host = page.locator(selector).first();
    await expect(host).toBeVisible();
    const box = await host.boundingBox();
    expect(box, `${selector} has a layout box`).not.toBeNull();
    expect(box.width, `${selector} paints a non-zero width`).toBeGreaterThan(0);
    expect(box.height, `${selector} paints a non-zero height`).toBeGreaterThan(0);

    const cells = await host.locator('i').count();
    expect(cells, `${selector} carries its data cells`).toBeGreaterThanOrEqual(minCells);
    const cellBox = await host.locator('i').first().boundingBox();
    expect(cellBox, `${selector} cell has a layout box`).not.toBeNull();
    expect(cellBox.width, `${selector} cell paints`).toBeGreaterThan(0);
  }

  // The radial gauge is a single element painted from --v.
  const gauge = page.locator('.ui-dotgauge').first();
  const gaugeBox = await gauge.boundingBox();
  expect(gaugeBox, 'dotgauge has a layout box').not.toBeNull();
  expect(gaugeBox.width, 'dotgauge paints a non-zero width').toBeGreaterThan(0);
  expect(gaugeBox.height, 'dotgauge paints a non-zero height').toBeGreaterThan(0);

  // renderReadout output must produce visible glyph nodes, not empty markup.
  const readout = page.locator('.ui-readout').first();
  await expect(readout).toBeVisible();
  const readoutBox = await readout.boundingBox();
  expect(readoutBox, 'readout has a layout box').not.toBeNull();
  expect(readoutBox.width, 'readout paints a non-zero width').toBeGreaterThan(0);
});

test('multiple CSS tooltips stay positioned on their own trigger', async ({ page }) => {
  await page.goto('/demo/', { waitUntil: 'domcontentloaded' });
  await page.setContent(`
    <main style="padding: 40px; display: flex; justify-content: space-between; inline-size: 560px">
      <span id="left" class="ui-tooltip">
        <button type="button">Left</button>
        <span class="ui-tooltip__bubble" role="tooltip">Left tip</span>
      </span>
      <span id="right" class="ui-tooltip">
        <button type="button">Right</button>
        <span class="ui-tooltip__bubble" role="tooltip">Right tip</span>
      </span>
    </main>`);
  await page.addStyleTag({ url: '/dist/bronto.css' });

  const geometry = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.ui-tooltip')).map((host) => {
      const bubble = host.querySelector('.ui-tooltip__bubble');
      const h = host.getBoundingClientRect();
      const b = bubble.getBoundingClientRect();
      return {
        id: host.id,
        delta: Math.abs((b.left + b.right) / 2 - (h.left + h.right) / 2),
        bubbleWidth: b.width,
      };
    }),
  );

  expect(geometry).toHaveLength(2);
  for (const item of geometry) {
    expect(item.bubbleWidth, `${item.id} tooltip has a layout box`).toBeGreaterThan(0);
    expect(item.delta, `${item.id} tooltip should be centered on its own trigger`).toBeLessThan(2);
  }
});

test('report-kit does not turn standalone dot readouts into crosshair chips', async ({ page }) => {
  await page.goto('/demo/', { waitUntil: 'domcontentloaded' });
  await page.setContent(`
    <link rel="stylesheet" href="/dist/bronto.css" />
    <link rel="stylesheet" href="/dist/css/report-kit.css" />
    <span id="standalone" class="ui-readout" role="img" aria-label="12">
      <span class="ui-dotmatrix" aria-hidden="true"><span class="ui-dotmatrix__cell"></span></span>
    </span>
    <figure data-bronto-crosshair style="position: relative; width: 200px; height: 100px">
      <div class="ui-crosshair is-active" style="--crosshair-x: 40px; --crosshair-y: 30px">
        <div id="pinned" class="ui-readout">40%</div>
      </div>
    </figure>`);

  await expect
    .poll(() => page.locator('#standalone').evaluate((el) => getComputedStyle(el).position))
    .toBe('static');
  await expect
    .poll(() => page.locator('#pinned').evaluate((el) => getComputedStyle(el).position))
    .toBe('absolute');
});
