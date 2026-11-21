import { test, expect } from '@playwright/test';
import { attachGuards, scan, blocking, settleVisualState } from './_demo-guards.mjs';

// This is a complete downstream composition of public primitives. The fixture
// owns its data and decisions; assertions follow the reader's task and meaning.
const open = (page) =>
  page.goto('/_site/demo/workspace-evidence.html', { waitUntil: 'networkidle' });

test('evidence review retains unknown results, local decisions and deliberate focus', async ({
  page,
}) => {
  const guards = attachGuards(page);
  await open(page);
  await page.getByRole('radio', { name: /Repeat run/ }).check();
  await expect(page.locator('#result-heading')).toHaveText('Repeat run');
  await expect(page.locator('#table-selected-value')).toHaveText('Not observed');
  await expect(page.locator('#source-excerpt')).toContainText('p95_ms=unobserved');

  await page.getByRole('button', { name: 'Actions', exact: true }).click();
  await expect(page.getByRole('menuitem', { name: 'Focus captured source' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#captured-source')).toBeFocused();
  await expect(page.getByRole('menu', { name: 'Evidence actions' })).toHaveCount(0);

  const opener = page.getByRole('button', { name: 'Review decision' });
  await opener.click();
  const dialog = page.getByRole('dialog', { name: 'Choose the next step', exact: true });
  const nextStep = page.getByRole('combobox', { name: 'Next step' });
  await nextStep.fill('Repeat');
  await expect(nextStep).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(nextStep).toHaveAttribute('aria-expanded', 'false');
  await expect(dialog).toBeVisible();
  await expect(nextStep).toBeFocused();

  const scope = page.getByRole('button', { name: 'Why is this provisional?' });
  await scope.click();
  await expect(page.getByRole('dialog', { name: 'Scope of the evidence' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Scope of the evidence' })).toHaveCount(0);
  await expect(dialog).toBeVisible();
  await expect(scope).toBeFocused();

  await nextStep.fill('Wait');
  await nextStep.press('ArrowDown');
  await nextStep.press('Enter');
  await expect(nextStep).toHaveValue('Wait for an observed result');
  await page.getByRole('button', { name: 'Record review' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  await expect(page.locator('#review-receipt')).toContainText(
    'Local review recorded: Wait for an observed result',
  );
  await expect(page.locator('#result-state')).toHaveText('Unknown · awaiting result');
  await expect(page.locator('#table-selected-value')).toHaveText('Not observed');

  await page.getByRole('radio', { name: /Smaller batch/ }).check();
  await expect(page.locator('#review-receipt')).toHaveText('No decision recorded in this session.');
  await expect(page.locator('#table-selected-value')).toHaveText('96 ms');
  await page.getByRole('radio', { name: /Repeat run/ }).check();
  await expect(page.locator('#review-receipt')).toContainText('Wait for an observed result');
  expect(guards).toEqual({ consoleErrors: [], pageErrors: [], badResponses: [] });
});

test('workspace updates rendered colors and retains a printable source with the selected result', async ({
  page,
}) => {
  await open(page);
  const chart = page.locator('.evidence-chart');
  await expect(chart).toHaveAttribute('data-scheme', 'light');
  const lightInk = await page.locator('[data-chart-selected]').getAttribute('fill');
  await page.getByRole('button', { name: 'Dark theme' }).click();
  await expect(chart).toHaveAttribute('data-scheme', 'dark');
  await expect(page.locator('[data-chart-selected]')).not.toHaveAttribute('fill', lightInk);

  await page.getByRole('radio', { name: /Baseline/ }).check();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.workspace-controls')).toBeHidden();
  await expect(page.locator('#result-heading')).toHaveText('Baseline');
  await expect(page.getByRole('table', { name: 'Values behind the figure' })).toBeVisible();
  await expect(page.locator('#source-excerpt')).toContainText('p95_ms=120');
  await expect(page.locator('#source-excerpt')).toBeVisible();
  await expect(page.locator('[data-chart-selected]')).toHaveCSS('fill', 'rgb(0, 0, 0)');
});

for (const theme of ['light', 'dark']) {
  test(`workspace stays readable at 320px including its nested inspector controls (${theme})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await open(page);
    await page.locator('html').evaluate((element, value) => {
      element.dataset.theme = value;
    }, theme);
    await settleVisualState(page);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(0);
    await expect(page.locator('#source-excerpt')).toBeVisible();
    let findings = blocking(await scan(page).analyze());
    expect(findings, JSON.stringify(findings)).toEqual([]);

    await page.getByRole('button', { name: 'Review decision' }).click();
    const dialog = page.getByRole('dialog', { name: 'Choose the next step', exact: true });
    await page.getByRole('button', { name: 'Why is this provisional?' }).click();
    const popover = page.getByRole('dialog', { name: 'Scope of the evidence' });
    for (const surface of [dialog, popover]) {
      const rect = await surface.boundingBox();
      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.width).toBeLessThanOrEqual(320);
    }
    await settleVisualState(page);
    findings = blocking(await scan(page).analyze());
    expect(findings, JSON.stringify(findings)).toEqual([]);
  });
}

test('workspace keeps the measured sample and its source readable without JavaScript', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  try {
    const page = await context.newPage();
    await open(page);
    await expect(page.locator('#result-heading')).toHaveText('Smaller batch');
    await expect(page.getByRole('table', { name: 'Values behind the figure' })).toBeVisible();
    await expect(page.locator('#source-excerpt')).toContainText('p95_ms=96');
    await expect(page.getByRole('button', { name: 'Review decision' })).toHaveCount(0);
    await expect(page.getByRole('radio', { name: /Repeat run/ })).toBeDisabled();
  } finally {
    await context.close();
  }
});
