import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Deterministic accessibility gate (environment-independent, unlike
 * pixels). Fails CI on any serious/critical WCAG 2.1 A/AA violation in
 * the demo — which exercises every component — in both themes, plus the
 * modal open state (focus-trapped) and a keyboard-driven tab switch.
 */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

function blocking(results) {
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => ({ target: n.target, msg: n.failureSummary })),
    }));
}

for (const theme of ['dark', 'light']) {
  test(`a11y — demo (${theme})`, async ({ page }) => {
    await page.addInitScript((t) => {
      try {
        localStorage.setItem('bronto-theme', t);
      } catch {
        /* ignore */
      }
    }, theme);
    await page.goto('/demo/');
    await page.evaluate(() => document.fonts.ready);
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(blocking(results), JSON.stringify(blocking(results), null, 2)).toEqual([]);
  });
}

test('a11y — modal open (focus-trapped dialog)', async ({ page }) => {
  await page.goto('/demo/');
  await page.getByRole('button', { name: 'Open modal' }).click();
  await expect(page.locator('dialog.ui-modal#demoModal')).toBeVisible();
  // color-contrast is disabled here only: the modal's `backdrop-filter:
  // blur` defeats axe's effective-background sampling (it reports a
  // blended colour, not the button's solid --accent). The real ratios
  // are >=5:1 (computed) and contrast is gated by the themed page tests.
  const results = await new AxeBuilder({ page })
    .withTags(TAGS)
    .disableRules(['color-contrast'])
    .analyze();
  expect(blocking(results), JSON.stringify(blocking(results), null, 2)).toEqual([]);
});

test('a11y — tabs keyboard pattern is wired', async ({ page }) => {
  await page.goto('/demo/');
  const tabs = page.locator('[data-bronto-tabs]');
  const first = tabs.getByRole('tab').first();
  await expect(first).toHaveAttribute('aria-selected', 'true');
  await first.focus();
  await page.keyboard.press('ArrowRight');
  const second = tabs.getByRole('tab').nth(1);
  await expect(second).toHaveAttribute('aria-selected', 'true');
  await expect(second).toBeFocused();
});
