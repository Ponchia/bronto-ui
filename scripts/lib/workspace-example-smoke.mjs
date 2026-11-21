/** Focused task proof for the workspace built against the packed public package. */
import { expect as playwrightExpect } from '@playwright/test';

const expect = playwrightExpect.configure({ timeout: 5_000 });

export async function assertEvidenceWorkspaceReady(page, expectedScheme = 'light') {
  await expect(
    page.getByRole('heading', { name: 'Review the evidence.', exact: true }),
  ).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', expectedScheme);
  await expect(page.locator('.evidence-chart')).toHaveAttribute('data-scheme', expectedScheme);
  await expect(page.locator('#chart-selected-bar')).toBeVisible();
  await expect(page.locator('#chart-selected-bar')).toHaveAttribute(
    'fill',
    /^(?:#[\da-f]{6}|rgba?\()/i,
  );
}

export async function assertEvidenceWorkspace(page, expectedScheme = 'light') {
  await assertEvidenceWorkspaceReady(page, expectedScheme);
  const bar = page.locator('#chart-selected-bar');
  const initialInk = await bar.getAttribute('fill');
  const nextScheme = expectedScheme === 'dark' ? 'light' : 'dark';
  const toggle = page.getByRole('button', { name: 'Dark theme', exact: true });
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', nextScheme);
  await expect(page.locator('.evidence-chart')).toHaveAttribute('data-scheme', nextScheme);
  await expect(toggle).toHaveAttribute('aria-pressed', String(nextScheme === 'dark'));
  await expect(bar).not.toHaveAttribute('fill', initialInk);

  await page.getByRole('radio', { name: /Repeat run/ }).check();
  await page.getByRole('button', { name: 'Actions', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Focus captured source', exact: true }).click();
  await expect(page.locator('#captured-source')).toBeFocused();
  await expect(page.locator('#source-excerpt')).toContainText('p95_ms=unobserved');

  await page.getByRole('button', { name: 'Review decision', exact: true }).click();
  await page.getByRole('combobox', { name: 'Next step', exact: true }).fill('Wait');
  await page.getByRole('option', { name: 'Wait for an observed result', exact: true }).click();
  await page.getByRole('button', { name: 'Record review', exact: true }).click();
  await expect(page.locator('#review-dialog')).not.toBeVisible();
  await expect(page.locator('#review-receipt')).toContainText(
    'Local review recorded: Wait for an observed result',
  );
  await expect(page.locator('#result-state')).toHaveText('Unknown · awaiting result');
  await expect(page.locator('#table-selected-value')).toHaveText('Not observed');
  await assertPrintableWorkspace(page);
}

async function assertPrintableWorkspace(page) {
  await page.emulateMedia({ media: 'print' });
  try {
    await expect(page.locator('.workspace-controls')).toBeHidden();
    await expect(page.getByRole('table', { name: 'Values behind the figure' })).toBeVisible();
    await expect(page.locator('#source-excerpt')).toBeVisible();
    await expect(page.locator('#review-receipt')).toBeVisible();
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(page.locator('[data-chart-ink]').first()).toHaveCSS('fill', 'rgb(0, 0, 0)');
  } finally {
    await page.emulateMedia({ media: 'screen' });
  }
}
