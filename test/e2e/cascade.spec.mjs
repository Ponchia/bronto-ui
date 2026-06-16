import { test, expect } from '@playwright/test';

function buttonStyles(page, selector) {
  return page.locator(selector).evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      background: s.backgroundColor,
      border: s.borderTopColor,
      color: s.color,
      display: s.display,
      radius: s.borderTopLeftRadius,
    };
  });
}

test('cascade layer: unlayered consumer CSS wins over the bundle and direct leaves even when written first', async ({
  page,
}) => {
  await page.goto('/test/e2e/_cascade-layer.fixture.html', { waitUntil: 'networkidle' });

  await expect(page.locator('#bundle-probe')).toBeVisible();
  await expect(buttonStyles(page, '#bundle-probe')).resolves.toEqual({
    background: 'rgb(1, 2, 3)',
    border: 'rgb(4, 5, 6)',
    color: 'rgb(250, 251, 252)',
    display: 'block',
    radius: '19px',
  });

  await expect(page.locator('#leaf-probe')).toBeVisible();
  await expect(buttonStyles(page, '#leaf-probe')).resolves.toEqual({
    background: 'rgb(11, 12, 13)',
    border: 'rgb(14, 15, 16)',
    color: 'rgb(240, 241, 242)',
    display: 'block',
    radius: '23px',
  });
});

test('cascade layer: css/unlayered leaves stay raw and order-sensitive', async ({ page }) => {
  await page.goto('/test/e2e/_cascade-unlayered.fixture.html', { waitUntil: 'networkidle' });

  await expect(page.locator('#raw-probe')).toBeVisible();
  await expect(buttonStyles(page, '#raw-probe')).resolves.toMatchObject({
    display: 'inline-flex',
  });
});
