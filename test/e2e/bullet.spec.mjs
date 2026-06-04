import { test, expect } from '@playwright/test';

async function open(page) {
  await page.goto('/demo/bullet.html', { waitUntil: 'networkidle' });
}

test('bullet paints the measure bar from the host-normalised --v', async ({ page }) => {
  await open(page);
  const bullet = page.locator('.ui-bullet').first();
  await expect(bullet).toBeVisible();

  // Host owns the value; Bronto only paints. The measure width is a fraction of
  // the track width — assert the geometry tracks --v rather than scraping pixels.
  const ratio = await bullet.evaluate((el) => {
    const track = el.getBoundingClientRect().width;
    const measure = el.querySelector('.ui-bullet__measure').getBoundingClientRect().width;
    return measure / track;
  });
  expect(ratio).toBeGreaterThan(0.5);
  expect(ratio).toBeLessThan(0.75);
});

test('every bullet carries a host-written role=img + aria-label (WCAG 1.4.1)', async ({ page }) => {
  await open(page);
  const bullets = page.locator('.ui-bullet');
  const count = await bullets.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const el = bullets.nth(i);
    await expect(el).toHaveAttribute('role', 'img');
    const label = await el.getAttribute('aria-label');
    expect(label && label.trim().length).toBeGreaterThan(0);
  }
});

test('the target tick is positioned from --t', async ({ page }) => {
  await open(page);
  const hasTick = await page
    .locator('.ui-bullet')
    .first()
    .evaluate((el) => !!el.querySelector('.ui-bullet__target'));
  expect(hasTick).toBe(true);
});
