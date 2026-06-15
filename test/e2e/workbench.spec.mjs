import { test, expect } from '@playwright/test';

async function open(page) {
  await page.goto('/demo/workbench.html', { waitUntil: 'networkidle' });
}

test('splitter exposes separator ARIA and resizes with the keyboard', async ({ page }) => {
  await open(page);
  const splitter = page.locator('[data-bronto-splitter]').first();
  const handle = page.getByRole('separator', { name: 'Resize files pane' });

  await expect(splitter).toHaveCSS('display', 'grid');
  await expect(handle).toHaveAttribute('aria-controls', 'workbench-files');
  await expect(handle).toHaveAttribute('aria-orientation', 'vertical');
  await expect(handle).toHaveAttribute('aria-valuemin', '20');
  await expect(handle).toHaveAttribute('aria-valuemax', '72');
  await expect(handle).toHaveAttribute('aria-valuenow', '36');

  await handle.focus();
  await expect(handle).toHaveCSS('outline-style', 'solid');
  const outlineColor = await handle.evaluate((el) => getComputedStyle(el).outlineColor);
  expect(outlineColor).not.toBe('rgba(0, 0, 0, 0)');

  await handle.press('ArrowRight');
  await expect(handle).toHaveAttribute('aria-valuenow', '38');
  await expect
    .poll(() => splitter.evaluate((el) => el.style.getPropertyValue('--splitter-pos')))
    .toBe('38%');

  await handle.press('End');
  await expect(handle).toHaveAttribute('aria-valuenow', '72');
});

test('splitter pointer drag updates the pane percentage and emits resize detail', async ({
  page,
}) => {
  await open(page);
  const splitter = page.locator('[data-bronto-splitter]').first();
  const handle = page.getByRole('separator', { name: 'Resize files pane' });
  await splitter.evaluate((el) => {
    window.__splitterDetails = [];
    el.addEventListener('bronto:splitter:resize', (event) => {
      window.__splitterDetails.push(event.detail);
    });
  });

  const box = await splitter.boundingBox();
  const grip = await handle.boundingBox();
  expect(box).not.toBeNull();
  expect(grip).not.toBeNull();

  await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.6, grip.y + grip.height / 2);
  await page.mouse.up();

  const now = Number(await handle.getAttribute('aria-valuenow'));
  expect(now).toBeGreaterThan(55);
  expect(now).toBeLessThan(65);
  const details = await page.evaluate(() => window.__splitterDetails);
  expect(details.at(-1)).toMatchObject({ orientation: 'vertical' });
  expect(details.at(-1).value).toBeGreaterThan(55);
  expect(details.at(-1).value).toBeLessThan(65);
});

test('forced-colors keeps the splitter handle visible', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const handle = page.getByRole('separator', { name: 'Resize files pane' });
  const color = await handle.evaluate((el) => getComputedStyle(el, '::before').backgroundColor);
  expect(color).not.toBe('rgba(0, 0, 0, 0)');
});
