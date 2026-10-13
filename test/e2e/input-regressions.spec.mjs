import { test, expect } from '@playwright/test';
import { blocking, scan } from './_demo-guards.mjs';

async function setup(page, name) {
  await page.goto('/behaviors/index.js');
  const item = name === 'combobox' ? 'option' : 'item';
  await page.setContent(`<!doctype html><html lang="en"><head><title>Input regression</title>
    <link rel="stylesheet" href="/dist/bronto.css">
    <link rel="stylesheet" href="/dist/css/command.css">
    </head><body><main style="max-width: 30rem; padding: 2rem">
    <div class="ui-${name}" data-bronto-${name} data-bronto-combobox-live>
      <input class="ui-input ui-${name}__input" aria-label="Fruit" />
      <ul class="ui-${name}__list" aria-label="Fruit choices">
        <li class="ui-${name}__${item}" data-value="apple">Apple</li>
        <li class="ui-${name}__${item}" data-value="banana">Banana</li>
      </ul><p class="ui-${name}__empty" hidden>No matches</p>
    </div><button id="after">After widget</button></main></body></html>`);
  await page.evaluate(
    async ({ name, modulePath }) => {
      const behaviors = await import(modulePath);
      window.__inputStop = behaviors[name === 'combobox' ? 'initCombobox' : 'initCommand']();
      window.__selections = [];
      window.__closes = 0;
      document.addEventListener(
        name === 'combobox' ? 'bronto:change' : 'bronto:command:select',
        (event) => window.__selections.push(event.detail),
      );
      document.addEventListener('bronto:command:close', () => window.__closes++);
    },
    { name, modulePath: '/behaviors/index.js' },
  );
}

for (const name of ['combobox', 'command']) {
  test(`${name}: IME confirmation and native editing leave the pending choice intact`, async ({
    page,
  }) => {
    await setup(page, name);
    const input = page.getByRole('combobox');
    await input.fill('Apple');
    if (name === 'combobox') await input.press('ArrowDown');
    const before = await input.getAttribute('aria-activedescendant');
    expect(before).toBeTruthy();
    const result = await input.evaluate((el) => {
      const prevented = [];
      for (const flags of [{ isComposing: true }, { keyCode: 229 }]) {
        for (const key of ['Enter', 'Escape', 'ArrowDown', 'ArrowUp']) {
          const event = new KeyboardEvent('keydown', {
            key,
            ...flags,
            bubbles: true,
            cancelable: true,
          });
          el.dispatchEvent(event);
          prevented.push(event.defaultPrevented);
        }
      }
      return prevented;
    });
    expect(result).toEqual(Array(8).fill(false));
    await expect(input).toHaveAttribute('aria-activedescendant', before);
    await input.press('Control+ArrowUp');
    await input.press('Shift+ArrowDown');
    await expect(input).toHaveAttribute('aria-activedescendant', before);
    expect(await page.evaluate(() => [window.__selections.length, window.__closes])).toEqual([
      0, 0,
    ]);
    await input.press('Enter');
    expect(await page.evaluate(() => window.__selections)).toEqual([
      { value: 'apple', label: 'Apple' },
    ]);
  });

  test(`${name}: unavailable choices are announced but do not activate`, async ({ page }) => {
    await setup(page, name);
    const input = page.getByRole('combobox');
    const first = page.locator('[data-value="apple"]');
    await first.evaluate((el) => el.setAttribute('aria-disabled', 'true'));
    await input.fill('Apple');
    if (name === 'combobox') await input.press('ArrowDown');
    await expect(input).toHaveAttribute('aria-activedescendant', await first.getAttribute('id'));
    await input.press('Enter');
    // Dispatch deliberately: Playwright correctly refuses a trusted click on
    // an aria-disabled option. This exercises the pointer handler's own guard.
    await first.dispatchEvent('click');
    expect(await page.evaluate(() => window.__selections)).toEqual([]);
    const results = await scan(page).analyze();
    expect(blocking(results), JSON.stringify(blocking(results))).toEqual([]);
    await first.evaluate((el) => el.removeAttribute('aria-disabled'));
    await input.press('Enter');
    expect(await page.evaluate(() => window.__selections)).toHaveLength(1);
  });

  test(`${name}: a host handler can cancel activation without stopping propagation`, async ({
    page,
  }) => {
    await setup(page, name);
    const input = page.getByRole('combobox');
    await input.fill('Apple');
    if (name === 'combobox') await input.press('ArrowDown');
    await page.evaluate(() =>
      document.addEventListener('keydown', (e) => e.preventDefault(), { capture: true }),
    );
    await input.press('Enter');
    await input.press('Escape');
    expect(await page.evaluate(() => [window.__selections.length, window.__closes])).toEqual([
      0, 0,
    ]);
  });
}

test('live combobox: prepending and reusing rows keeps ARIA IDs unique and cleanup intact', async ({
  page,
}) => {
  await setup(page, 'combobox');
  const input = page.getByRole('combobox');
  await input.fill('Apple');
  const firstId = await page.locator('[data-value="apple"]').getAttribute('id');
  await page.evaluate(() => {
    const li = document.createElement('li');
    li.className = 'ui-combobox__option';
    li.textContent = 'Apricot';
    document.querySelector('ul').prepend(li);
  });
  const newRow = page.locator('li').first();
  await expect(newRow).toHaveAttribute('id', /bronto-cb-opt-/);
  expect(await newRow.getAttribute('id')).not.toBe(firstId);
  await expect(page.locator('[data-value="apple"]')).toHaveAttribute('id', firstId);
  await page.evaluate(() => {
    window.__removed = document.querySelector('[data-value="banana"]');
    window.__removed.remove();
  });
  await expect
    .poll(() => page.evaluate(() => ({ id: window.__removed.id, hidden: window.__removed.hidden })))
    .toEqual({ id: '', hidden: false });
  await page.evaluate(() => document.querySelector('ul').append(window.__removed));
  await expect(page.locator('[data-value="banana"]')).toHaveAttribute('id', /bronto-cb-opt-/);
  expect(
    await page.locator('li').evaluateAll((rows) => new Set(rows.map((row) => row.id)).size),
  ).toBe(3);
  await input.fill('missing');
  await expect(page.getByRole('status')).toBeVisible();
  await input.press('Tab');
  await expect(page.getByRole('button', { name: 'After widget' })).toBeFocused();
  await expect(page.locator('.ui-combobox__empty')).toBeHidden();
  await page.evaluate(() => window.__inputStop());
  await expect(page.locator('li[id]')).toHaveCount(0);
  await expect(page.locator('li[hidden]')).toHaveCount(0);
});

test('native dialog: padding stays open; the backdrop closes and returns focus', async ({
  page,
}) => {
  await page.goto('/behaviors/index.js');
  await page.setContent(`<!doctype html><button data-bronto-open="editor">Edit</button>
    <dialog id="editor" aria-label="Editor" data-bronto-dialog-light
      style="padding:40px;width:260px;height:140px"><p>Keep this work</p><button data-bronto-close>Done</button></dialog>`);
  await page.evaluate(async (path) => (await import(path)).initDialog(), '/behaviors/index.js');
  const opener = page.getByRole('button', { name: 'Edit', exact: true });
  const dialog = page.getByRole('dialog');
  await opener.click();
  const box = await dialog.boundingBox();
  await page.mouse.click(box.x + 10, box.y + 10);
  await expect(dialog).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

for (const name of ['combobox', 'command']) {
  test(`${name}: disabled options retain a distinct focus cue in both themes and forced colors`, async ({
    page,
  }) => {
    await setup(page, name);
    const input = page.getByRole('combobox');
    const first = page.locator('[data-value="apple"]');
    await first.evaluate((el) => el.setAttribute('aria-disabled', 'true'));
    for (const theme of ['light', 'dark']) {
      await page.evaluate((value) => (document.documentElement.dataset.theme = value), theme);
      await input.fill('Apple');
      if (name === 'combobox') await input.press('ArrowDown');
      await expect(first).toHaveClass(/is-active/);
      await expect(first).toHaveCSS('cursor', 'not-allowed');
      const results = await scan(page).analyze();
      expect(blocking(results), JSON.stringify(blocking(results))).toEqual([]);
    }
    await page.emulateMedia({ forcedColors: 'active' });
    const colors = await first.evaluate((el) => {
      const style = getComputedStyle(el);
      return { foreground: style.color, background: style.backgroundColor };
    });
    expect(colors.foreground).not.toBe(colors.background);
    await input.press('Enter');
    expect(await page.evaluate(() => window.__selections)).toEqual([]);
  });
}
