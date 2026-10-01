import { test, expect } from '@playwright/test';
import { applyTheme } from './_theme.mjs';
import { blocking, scan } from './_demo-guards.mjs';

/**
 * Command palette (initCommand) — a new public behavior in 0.5.0 that exposes
 * the `bronto:command:select` / `bronto:command:close` event contract. jsdom
 * unit tests can't see computed `display`, so the filter/visibility behaviour
 * needs a real browser; runs cross-engine (no pixels). The leaf demo wires a
 * host `bronto:command:select` listener that echoes the pick into `#picked`.
 */
async function open(page, theme = 'light') {
  await page.goto('/demo/command.html', { waitUntil: 'networkidle' });
  await applyTheme(page, theme);
}

const visibleItems = (page) => page.locator('.ui-command__item:visible');

for (const theme of ['light', 'dark']) {
  test(`command specimen passes axe (${theme})`, async ({ page }) => {
    await open(page, theme);
    const results = await scan(page).analyze();
    expect(blocking(results), JSON.stringify(blocking(results), null, 2)).toEqual([]);
  });
}

test('typing filters the list, hides empty groups, and shows the empty state', async ({ page }) => {
  await open(page);
  const input = page.locator('.ui-command__input');
  await expect(visibleItems(page)).toHaveCount(5);

  await input.fill('export');
  await expect(visibleItems(page)).toHaveCount(1);
  await expect(page.locator('.ui-command__item[data-value="export"]')).toBeVisible();
  // a group with no surviving items auto-hides (Navigation drops, Actions stays)
  await expect(page.locator('.ui-command__group:visible')).toHaveCount(1);

  await input.fill('zzzznomatch');
  await expect(visibleItems(page)).toHaveCount(0);
  await expect(page.locator('.ui-command__empty')).toBeVisible();
});

test('cleanup restores a filtered command list in a real browser', async ({ page }) => {
  await open(page);
  await page.evaluate(async () => {
    const behaviorPath = `/behaviors/${'index.js'}`;
    const { initCommand } = await import(behaviorPath);
    window.__commandCleanupStop = initCommand();
  });

  const input = page.locator('.ui-command__input');
  const empty = page.locator('.ui-command__empty');
  await input.fill('zzzznomatch');
  await expect(visibleItems(page)).toHaveCount(0);
  await expect(page.locator('.ui-command__group:visible')).toHaveCount(0);
  await expect(empty).toBeVisible();

  await page.evaluate(() => window.__commandCleanupStop());
  await expect(visibleItems(page)).toHaveCount(5);
  await expect(page.locator('.ui-command__group:visible')).toHaveCount(2);
  await expect(empty).toBeHidden();
  await expect(page.locator('.ui-command__item.is-active')).toHaveCount(0);
  await expect(input).not.toHaveAttribute('role', /.+/);
  await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/);
  await expect(page.locator('.ui-command__list')).not.toHaveAttribute('role', /.+/);
});

test('keyboard: ArrowDown + Enter selects and emits bronto:command:select', async ({ page }) => {
  await open(page);
  const input = page.locator('.ui-command__input');
  await input.click();
  await input.fill('settings');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.locator('#picked')).toContainText('Open settings');
  await expect(page.locator('#picked')).toContainText('settings'); // the data-value
});

test('pointer: clicking an item emits the select event with its value + label', async ({
  page,
}) => {
  await open(page);
  await page.locator('.ui-command__item[data-value="invoice"]').click();
  await expect(page.locator('#picked')).toContainText('New invoice');
  await expect(page.locator('#picked')).toContainText('invoice');
});

test('Escape emits bronto:command:close', async ({ page }) => {
  await open(page);
  const closed = page.evaluate(
    () =>
      new Promise((resolve) => {
        document
          .querySelector('[data-bronto-command]')
          .addEventListener('bronto:command:close', () => resolve(true), { once: true });
        setTimeout(() => resolve(false), 2000);
      }),
  );
  await page.locator('.ui-command__input').click();
  await page.keyboard.press('Escape');
  expect(await closed).toBe(true);
});

test('forced-colors: active command item keeps selected system colors', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const input = page.locator('.ui-command__input');
  await input.click();
  await page.keyboard.press('ArrowDown');

  const active = await page.locator('.ui-command__item.is-active').evaluate((el) => {
    const host = getComputedStyle(el.closest('.ui-command'));
    const style = getComputedStyle(el);
    return {
      hostBackground: host.backgroundColor,
      background: style.backgroundColor,
      color: style.color,
    };
  });
  expect(active.background).not.toBe('rgba(0, 0, 0, 0)');
  expect(active.background).not.toBe(active.hostBackground);
  expect(active.color).not.toBe(active.background);
});

test('headless: host-rendered rows take the keyboard without a re-init', async ({ page }) => {
  await open(page);
  await page.evaluate(async () => {
    const behaviorPath = `/behaviors/${'index.js'}`;
    const { initCommand } = await import(behaviorPath);
    const scope = document.createElement('div');
    scope.innerHTML = `
      <div class="ui-command" data-bronto-command id="headless">
        <input class="ui-command__input" aria-label="Search" />
        <ul class="ui-command__list"></ul>
        <p class="ui-command__empty" hidden>Nothing found</p>
      </div>`;
    document.body.append(scope);
    const box = scope.querySelector('#headless');
    const input = box.querySelector('input');
    const list = box.querySelector('ul');
    const empty = box.querySelector('.ui-command__empty');
    const corpus = ['alpha report', 'beta board', 'alpha notes', 'gamma deck'];
    // The host owns the results: it renders them on every keystroke.
    const render = () => {
      const q = input.value.trim().toLowerCase();
      const rows = corpus.filter((entry) => entry.includes(q));
      list.replaceChildren(
        ...rows.map((entry) => {
          const li = document.createElement('li');
          li.className = 'ui-command__item';
          li.dataset.value = entry;
          li.textContent = entry;
          return li;
        }),
      );
      empty.hidden = rows.length > 0;
    };
    input.addEventListener('input', render);
    render();
    box.addEventListener('bronto:command:select', (e) => {
      box.dataset.picked = e.detail.value;
    });
    window.__headlessStop = initCommand({ root: scope, headless: true });
  });

  const box = page.locator('#headless');
  const input = box.locator('.ui-command__input');
  const active = () =>
    input.evaluate(
      (el) => document.getElementById(el.getAttribute('aria-activedescendant'))?.textContent,
    );
  await expect(box.locator('.ui-command__item')).toHaveCount(4);
  await expect(input).toHaveAttribute('role', 'combobox');

  await input.fill('alpha');
  await expect(box.locator('.ui-command__item')).toHaveCount(2);
  await expect.poll(active).toBe('alpha report');
  await input.press('ArrowDown');
  await expect.poll(active).toBe('alpha notes');
  await input.press('Enter');
  await expect(box).toHaveAttribute('data-picked', 'alpha notes');

  await input.fill('zzz');
  await expect(box.locator('.ui-command__empty')).toBeVisible();
  await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/);

  await page.evaluate(() => window.__headlessStop());
  await expect(input).not.toHaveAttribute('role', /.+/);
});
