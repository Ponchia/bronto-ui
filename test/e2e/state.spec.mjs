import { test, expect } from '@playwright/test';

async function open(page) {
  await page.goto('/demo/state.html', { waitUntil: 'networkidle' });
}

test('job progress bar tracks the host-set --job-progress percentage', async ({ page }) => {
  await open(page);
  const job = page.locator('.ui-job--running');
  await expect(job).toBeVisible();

  const ratio = await job.evaluate((el) => {
    const track = el.querySelector('.ui-job__progress').getBoundingClientRect().width;
    const bar = el.querySelector('.ui-job__bar').getBoundingClientRect().width;
    return bar / track;
  });

  expect(ratio).toBeGreaterThan(0.58);
  expect(ratio).toBeLessThan(0.7);
});

test('determinate jobs expose progressbar aria instead of relying on colour', async ({ page }) => {
  await open(page);
  const progress = page.locator('.ui-job--running .ui-job__progress');
  await expect(progress).toHaveAttribute('role', 'progressbar');
  await expect(progress).toHaveAttribute('aria-valuenow', '64');
  await expect(page.locator('.ui-job--running .ui-state__label')).toHaveText('Running');
});

test('forced-colors keeps the job bar visible with a system colour', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const bg = await page
    .locator('.ui-job--running .ui-job__bar')
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).not.toBe('rgba(0, 0, 0, 0)');
});
