import { test, expect } from '@playwright/test';

async function open(page) {
  await page.goto('/demo/workbench.html', { waitUntil: 'networkidle' });
}

test('toolstrip supports floating viewport controls and button modes', async ({ page }) => {
  await open(page);
  const toolstrip = page.locator('.ui-toolstrip').first();
  const activeMode = page.locator('.ui-segmented-buttons__button[aria-pressed="true"]').first();

  await expect(toolstrip).toHaveCSS('display', 'flex');
  await expect(toolstrip).toHaveCSS('flex-wrap', 'wrap');
  await expect(toolstrip).toHaveClass(/ui-toolstrip--floating/);
  await expect(toolstrip.locator('.ui-toolstrip__brand strong')).toHaveText('Workspace');
  await expect(toolstrip.locator('.ui-toolstrip__context')).toHaveText('review queue');
  await expect(toolstrip.locator('.ui-toolstrip__search input')).toBeVisible();
  await expect(toolstrip.locator('.ui-toolstrip__actions')).toBeVisible();
  await expect(activeMode).toHaveText('Map');

  const boxShadow = await toolstrip.evaluate((el) => getComputedStyle(el).boxShadow);
  expect(boxShadow).not.toBe('none');
  const activeBackground = await activeMode.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(activeBackground).not.toBe('rgba(0, 0, 0, 0)');
});

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

test('splitter cleanup restores generated ARIA and CSS state in a real browser', async ({
  page,
}) => {
  await open(page);
  await page.evaluate(async () => {
    const wrap = document.createElement('section');
    wrap.innerHTML = `
      <div id="splitter-cleanup" class="ui-splitter" data-bronto-splitter style="--splitter-pos: 40%">
        <section class="ui-splitter__pane">Left</section>
        <div class="ui-splitter__handle" aria-label="Resize cleanup pane"></div>
        <section class="ui-splitter__pane">Right</section>
      </div>`;
    document.body.append(wrap);
    const behaviorPath = `/behaviors/${'index.js'}`;
    const { initSplitter } = await import(behaviorPath);
    window.__splitterCleanupStop = initSplitter({
      root: document.getElementById('splitter-cleanup'),
    });
  });

  const splitter = page.locator('#splitter-cleanup');
  const handle = splitter.locator('.ui-splitter__handle');

  await expect(handle).toHaveAttribute('role', 'separator');
  await expect(handle).toHaveAttribute('tabindex', '0');
  await expect(handle).toHaveAttribute('aria-orientation', 'vertical');
  await expect(handle).toHaveAttribute('aria-valuemin', '20');
  await expect(handle).toHaveAttribute('aria-valuemax', '80');
  await expect(handle).toHaveAttribute('aria-valuenow', '40');

  await handle.focus();
  await page.keyboard.press('ArrowRight');
  await expect(handle).toHaveAttribute('aria-valuenow', '42');
  await expect
    .poll(() => splitter.evaluate((el) => el.style.getPropertyValue('--splitter-pos')))
    .toBe('42%');

  await page.evaluate(() => window.__splitterCleanupStop());
  await expect(handle).not.toHaveAttribute('role', /.+/);
  await expect(handle).not.toHaveAttribute('tabindex', /.+/);
  await expect(handle).not.toHaveAttribute('aria-orientation', /.+/);
  await expect(handle).not.toHaveAttribute('aria-valuemin', /.+/);
  await expect(handle).not.toHaveAttribute('aria-valuemax', /.+/);
  await expect(handle).not.toHaveAttribute('aria-valuenow', /.+/);
  await expect
    .poll(() => splitter.evaluate((el) => el.style.getPropertyValue('--splitter-pos')))
    .toBe('40%');

  await handle.evaluate((el) =>
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })),
  );
  await expect(handle).not.toHaveAttribute('aria-valuenow', /.+/);
  await expect
    .poll(() => splitter.evaluate((el) => el.style.getPropertyValue('--splitter-pos')))
    .toBe('40%');
});

test('forced-colors keeps the splitter handle visible', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const handle = page.getByRole('separator', { name: 'Resize files pane' });
  const color = await handle.evaluate((el) => getComputedStyle(el, '::before').backgroundColor);
  expect(color).not.toBe('rgba(0, 0, 0, 0)');
});
