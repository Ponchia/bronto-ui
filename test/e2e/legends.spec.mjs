import { test, expect } from '@playwright/test';
import { applyTheme } from './_theme.mjs';
import { blocking, scan } from './_demo-guards.mjs';

async function open(page, theme = 'light') {
  await page.goto('/demo/legends.html', { waitUntil: 'networkidle' });
  await applyTheme(page, theme);
}

for (const theme of ['light', 'dark']) {
  test(`legend specimen passes axe and renders every key type (${theme})`, async ({ page }) => {
    await open(page, theme);
    const results = await scan(page).analyze();
    expect(blocking(results), JSON.stringify(blocking(results), null, 2)).toEqual([]);

    await expect(page.locator('.ui-legend')).toHaveCount(6);
    await expect(page.locator('.ui-legend--gradient .ui-legend__track')).toHaveCount(2);
    await expect(page.locator('.ui-legend--threshold')).toHaveCount(1);
    // Every label must be present text (the non-colour channel).
    await expect(page.locator('.ui-legend__label').first()).toBeVisible();
  });
}

test('interactive legend: click toggles state, hides the series, announces it', async ({
  page,
}) => {
  await open(page);
  const btn = page.locator('[data-bronto-legend] .ui-legend__item').first();
  const bar = page.locator('[data-series-bar="research"]');

  await expect(btn).toHaveAttribute('aria-pressed', 'true');
  await btn.click();
  await expect(btn).toHaveAttribute('aria-pressed', 'false');
  await expect(btn).toHaveClass(/is-inactive/);
  await expect(bar).toBeHidden();
  await expect(page.locator('#legend-status')).toHaveText('research hidden');

  await btn.click();
  await expect(btn).toHaveAttribute('aria-pressed', 'true');
  await expect(bar).toBeVisible();
});

test('interactive legend: keyboard (Space) toggles the focused entry', async ({ page }) => {
  await open(page);
  const second = page.locator('[data-bronto-legend] .ui-legend__item').nth(1);
  await second.focus();
  await expect(second).toBeFocused();
  await page.keyboard.press('Space');
  await expect(second).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-series-bar="delivery"]')).toBeHidden();
});

test('interactive legend cleanup restores scoped-root and detached generated state', async ({
  page,
}) => {
  await open(page);
  await page.evaluate(() => {
    const form = document.createElement('form');
    form.innerHTML = `
      <ul id="legend-cleanup" class="ui-legend ui-legend--interactive" data-bronto-legend>
        <li><button id="legend-cleanup-button" class="ui-legend__item" aria-pressed="true" data-series="a">
          <span class="ui-legend__label">A</span>
        </button></li>
        <li><span id="legend-cleanup-role" class="ui-legend__item" role="button" aria-pressed="true" data-series="b">
          <span class="ui-legend__label">B</span>
        </span></li>
      </ul>
    `;
    document.body.append(form);
  });
  await page.addScriptTag({
    type: 'module',
    content: `
    import { initLegend } from '/behaviors/index.js';
    window.__legendCleanupStop = initLegend({ root: document.getElementById('legend-cleanup') });
    window.__legendCleanupReady = true;
    `,
  });
  await page.waitForFunction(() => window.__legendCleanupReady === true);

  const button = page.locator('#legend-cleanup-button');
  const role = page.locator('#legend-cleanup-role');
  await expect(button).toHaveAttribute('type', 'button');
  await expect(role).toHaveAttribute('tabindex', '0');

  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await expect(button).toHaveClass(/is-inactive/);

  await role.focus();
  await expect(role).toBeFocused();
  await page.keyboard.press('Space');
  await expect(role).toHaveAttribute('aria-pressed', 'false');
  await expect(role).toHaveClass(/is-inactive/);

  await page.evaluate(() => {
    window.__detachedLegendButton = document.getElementById('legend-cleanup-button');
    window.__detachedLegendRole = document.getElementById('legend-cleanup-role');
    window.__detachedLegendButton.remove();
    window.__detachedLegendRole.remove();
    window.__legendCleanupStop();
  });

  await expect
    .poll(() =>
      page.evaluate(() => ({
        buttonType: window.__detachedLegendButton.getAttribute('type'),
        buttonPressed: window.__detachedLegendButton.getAttribute('aria-pressed'),
        buttonInactive: window.__detachedLegendButton.classList.contains('is-inactive'),
        roleTabindex: window.__detachedLegendRole.getAttribute('tabindex'),
        rolePressed: window.__detachedLegendRole.getAttribute('aria-pressed'),
        roleInactive: window.__detachedLegendRole.classList.contains('is-inactive'),
      })),
    )
    .toEqual({
      buttonType: null,
      buttonPressed: 'true',
      buttonInactive: false,
      roleTabindex: null,
      rolePressed: 'true',
      roleInactive: false,
    });
});

test('legend swatches survive forced-colors (keep a visible border)', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const swatch = page.locator('.ui-legend__swatch').first();
  const borderWidth = await swatch.evaluate((el) => getComputedStyle(el).borderTopWidth);
  expect(parseFloat(borderWidth)).toBeGreaterThan(0);
});
