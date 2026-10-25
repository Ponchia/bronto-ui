import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { applyTheme } from './_theme.mjs';
import { settleVisualState } from './_demo-guards.mjs';

const catalog = '/_site/components/';

test('catalog — evidence search keeps a claim and its source together', async ({ page }) => {
  await page.goto(catalog);
  await page.getByRole('searchbox', { name: 'Search components' }).fill('claims');
  const card = page.locator('[data-component-card]:visible');
  await expect(card).toHaveCount(1);
  await expect(card).toContainText('Evidence state: partial');
  await expect(card).toContainText("@import '@ponchia/ui/css/report.css';");
  await expect(card).toContainText("@import '@ponchia/ui/css/sources.css';");
  await card.getByRole('link', { name: 'Source: staging run' }).click();
  const source = page.locator('#catalog-claim-source');
  await expect(source).toBeInViewport();
  // Wait for smooth fragment scrolling to reach its final (possibly clamped)
  // position; mere viewport intersection can hide the heading under the header.
  await expect
    .poll(() =>
      source.evaluate((node) => {
        const top = node.getBoundingClientRect().top;
        const margin = Number.parseFloat(getComputedStyle(node).scrollMarginTop);
        const header = document.querySelector('.site-header');
        const destination = Math.max(
          0,
          Math.min(top + scrollY - margin, document.documentElement.scrollHeight - innerHeight),
        );
        return {
          settled: Math.abs(scrollY - destination) <= 2,
          clearsHeader: top >= header.getBoundingClientRect().bottom,
        };
      }),
    )
    .toEqual({ settled: true, clearsHeader: true });
});

test('catalog — inspector has keyboard and non-drag resize paths', async ({ page }) => {
  await page.goto(catalog);
  await page.getByRole('searchbox', { name: 'Search components' }).fill('inspector and');
  const handle = page.getByRole('separator', { name: 'Resize inspector' });
  await page.getByRole('button', { name: 'Narrow', exact: true }).click();
  await expect(handle).toHaveAttribute('aria-valuenow', '45');
  await handle.focus();
  await page.keyboard.press('ArrowRight');
  await expect(handle).toHaveAttribute('aria-valuenow', '47');
  await page.keyboard.press('End');
  await expect(handle).toHaveAttribute('aria-valuenow', '70');
  await page.getByRole('button', { name: 'Widen', exact: true }).click();
  await expect(handle).toHaveAttribute('aria-valuenow', '70');
  await handle.focus();
  await page.keyboard.press('Home');
  await expect(handle).toHaveAttribute('aria-valuenow', '35');
});

test('catalog — command selection, empty results, Escape and focus restoration work', async ({
  page,
}) => {
  await page.goto(catalog);
  await page.getByRole('searchbox', { name: 'Search components' }).fill('command palette');
  const trigger = page.getByRole('button', { name: 'Open sample commands' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Sample commands' });
  const query = dialog.getByRole('combobox', { name: 'Find a sample command' });
  await expect(query).toBeFocused();
  await query.fill('missing-command');
  await expect(dialog.getByText('No matching commands')).toBeVisible();
  await query.fill('evidence');
  await query.press('ArrowDown');
  await query.press('Enter');
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('#catalog-command-result')).toHaveText(
    'Selected: Open evidence report',
  );
  await expect(trigger).toBeFocused();
  await trigger.click();
  await query.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test('catalog — optional patterns stay readable on narrow screens and in print', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(catalog);
  for (const query of ['claims', 'provenance', 'inspector and', 'finding and']) {
    await page.getByRole('searchbox', { name: 'Search components' }).fill(query);
    await expect(page.locator('[data-component-card]:visible')).toHaveCount(1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(0);
  }
  await page.emulateMedia({ media: 'print' });
  await expect(page.getByRole('table', { name: 'Sample latency values' })).toBeVisible();
  await expect(page.getByRole('cell', { name: '120', exact: true })).toBeVisible();
  await expect(
    page.getByText('These synthetic values explain the pattern only.', { exact: true }),
  ).toBeVisible();
});

test('catalog — both themes expose labelled controls and readable evidence', async ({ page }) => {
  await page.goto(catalog);
  for (const theme of ['light', 'dark']) {
    // Audit the settled theme, not a frame mixing new text with the old surface.
    await applyTheme(page, theme);
    await settleVisualState(page);
    const result = await new AxeBuilder({ page })
      .include('[data-component-catalog]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(result.violations).toEqual([]);
  }
  await page.emulateMedia({ forcedColors: 'active' });
  await expect(
    page.getByText('Evidence state: partial · sample data', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Refresh required', { exact: true })).toBeVisible();
});

test('catalog — copy actions preserve the explicit CSS and behavior recipes', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (value) => {
          window.__copiedRecipe = value;
        },
      },
    });
  });
  await page.goto(catalog);
  await page.getByRole('searchbox', { name: 'Search components' }).fill('command palette');
  const card = page.locator('[data-component-card]:visible');
  for (const label of ['Copy imports', 'Copy markup', 'Copy setup']) {
    const button = card.getByRole('button', { name: label, exact: true });
    const source = await card
      .locator('.component-code')
      .filter({ has: page.getByRole('button', { name: label, exact: true }) })
      .locator('pre code')
      .textContent();
    await button.click();
    await expect.poll(() => page.evaluate(() => window.__copiedRecipe)).toBe(source);
  }
  await expect(card).toContainText("@import '@ponchia/ui/css/command.css';");
  await expect(card).toContainText(
    "import { initCommand, initDialog } from '@ponchia/ui/behaviors';",
  );
});

test('catalog — the open command palette is accessible in both themes', async ({ page }) => {
  await page.goto(catalog);
  await page.getByRole('searchbox', { name: 'Search components' }).fill('command palette');
  const trigger = page.getByRole('button', { name: 'Open sample commands' });
  for (const theme of ['light', 'dark']) {
    // Audit the settled theme, not a frame mixing new text with the old surface.
    await applyTheme(page, theme);
    await settleVisualState(page);
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Sample commands' });
    await expect(dialog.getByRole('combobox', { name: 'Find a sample command' })).toBeFocused();
    const result = await new AxeBuilder({ page })
      .include('#catalog-commands')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(result.violations).toEqual([]);
    await dialog.getByRole('button', { name: 'Close commands', exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  }
});
