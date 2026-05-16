import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Deterministic accessibility gate (environment-independent, unlike
 * pixels). Fails CI on any serious/critical WCAG 2.1 A/AA violation in
 * the demo — which exercises every component — in both themes, plus the
 * modal open state (focus-trapped) and a keyboard-driven tab switch.
 *
 * `best-practice` is included so the structural issues Lighthouse flags
 * (these are axe rules too) are gated here per theme with zero extra
 * deps. Best-practice rules are often `moderate` impact, so they would
 * slip past the serious/critical filter — a curated STRUCTURAL set is
 * always blocking regardless of impact.
 */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];
const STRUCTURAL = new Set([
  'heading-order',
  'landmark-one-main',
  'landmark-unique',
  'landmark-no-duplicate-banner',
  'landmark-no-duplicate-contentinfo',
  'region',
  'scrollable-region-focusable',
  'duplicate-id',
  'tabindex',
]);

function blocking(results) {
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical' || STRUCTURAL.has(v.id))
    .map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => ({ target: n.target, msg: n.failureSummary })),
    }));
}

/**
 * Settle to a stable, fully-composited frame before axe samples pixels.
 * Without this, axe's effective-background computation races the paint
 * of the decorative fixed `.ui-dotfield` (a masked full-bleed overlay),
 * intermittently flipping borderline small-text contrast. fonts + a
 * networkidle nav + a double rAF make every run see the same frame; the
 * dotfield is `aria-hidden` ornamentation so it's excluded from the scan
 * region too. color-contrast itself stays fully enforced on real content.
 */
async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
}
const scan = (page) => new AxeBuilder({ page }).withTags(TAGS).exclude('.ui-dotfield');

for (const theme of ['dark', 'light']) {
  test(`a11y — demo (${theme})`, async ({ page }) => {
    await page.addInitScript((t) => {
      try {
        localStorage.setItem('bronto-theme', t);
      } catch {
        /* ignore */
      }
    }, theme);
    await page.goto('/demo/', { waitUntil: 'networkidle' });
    await settle(page);
    const results = await scan(page).analyze();
    expect(blocking(results), JSON.stringify(blocking(results), null, 2)).toEqual([]);
  });
}

test('a11y — modal open (focus-trapped dialog)', async ({ page }) => {
  await page.goto('/demo/', { waitUntil: 'networkidle' });
  await settle(page);
  await page.getByRole('button', { name: 'Open modal' }).click();
  await expect(page.locator('dialog.ui-modal#demoModal')).toBeVisible();
  // color-contrast is disabled here only: the modal's `backdrop-filter:
  // blur` defeats axe's effective-background sampling (it reports a
  // blended colour, not the button's solid --accent). The real ratios
  // are >=5:1 (computed) and contrast is gated by the themed page tests.
  const results = await scan(page).disableRules(['color-contrast']).analyze();
  expect(blocking(results), JSON.stringify(blocking(results), null, 2)).toEqual([]);
});

test('a11y — tabs keyboard pattern is wired', async ({ page }) => {
  await page.goto('/demo/', { waitUntil: 'networkidle' });
  const tabs = page.locator('[data-bronto-tabs]');
  const first = tabs.getByRole('tab').first();
  await expect(first).toHaveAttribute('aria-selected', 'true');
  await first.focus();
  await page.keyboard.press('ArrowRight');
  const second = tabs.getByRole('tab').nth(1);
  await expect(second).toHaveAttribute('aria-selected', 'true');
  await expect(second).toBeFocused();
});

test('a11y — demo passes axe in RTL', async ({ page }) => {
  await page.addInitScript(() => document.documentElement.setAttribute('dir', 'rtl'));
  await page.goto('/demo/', { waitUntil: 'networkidle' });
  await settle(page);
  const results = await scan(page).analyze();
  expect(blocking(results), JSON.stringify(blocking(results), null, 2)).toEqual([]);
});

test('a11y — dialog returns focus to its trigger on Escape', async ({ page }) => {
  await page.goto('/demo/', { waitUntil: 'networkidle' });
  const opener = page.getByRole('button', { name: 'Open modal' });
  await opener.click();
  await expect(page.locator('dialog.ui-modal#demoModal')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog.ui-modal#demoModal')).toBeHidden();
  await expect(opener).toBeFocused(); // review C1: focus must not land on <body>
});

test('a11y — toast pushes into a persistent polite live region', async ({ page }) => {
  await page.goto('/demo/', { waitUntil: 'networkidle' });
  const stack = page.locator('.ui-toast-stack');
  await expect(stack).toHaveCount(0);
  await page.locator('#toastBtn').click();
  await expect(stack).toHaveAttribute('aria-live', 'polite');
  await expect(stack.locator('.ui-toast')).toHaveText(/Order filled/);
  // The region must persist (not be torn down) — drain then re-toast.
  await page.waitForTimeout(4500);
  await expect(stack).toBeAttached();
  await expect(stack.locator('.ui-toast')).toHaveCount(0);
  await page.locator('#toastBtn').click();
  await expect(page.locator('.ui-toast-stack')).toHaveCount(1); // reused, not duplicated
});

test('a11y — disclosure toggles aria-expanded + panel hidden', async ({ page }) => {
  await page.goto('/demo/', { waitUntil: 'networkidle' });
  const btn = page.locator('[data-bronto-disclosure]');
  const panel = page.locator('#discPanel');
  await expect(btn).toHaveAttribute('aria-expanded', 'false');
  await expect(panel).toBeHidden();
  await btn.click();
  await expect(btn).toHaveAttribute('aria-expanded', 'true');
  await expect(panel).toBeVisible();
  await btn.click();
  await expect(btn).toHaveAttribute('aria-expanded', 'false');
  await expect(panel).toBeHidden();
});

test('a11y — modal Confirm button clears 4.5:1 (computed, not just asserted)', async ({ page }) => {
  await page.goto('/demo/', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Open modal' }).click();
  // The backdrop-filter blur defeats axe's contrast sampling (hence
  // color-contrast is disabled in the modal scan above); verify the
  // solid button's real ratio here instead of only asserting it in prose.
  // The solid primary button (the ghost "Cancel" shares .ui-button, so
  // scope to the non-ghost one — the contrast-critical surface).
  const confirm = page.locator(
    'dialog#demoModal .ui-modal__foot .ui-button:not(.ui-button--ghost)',
  );
  const ratio = await confirm.evaluate((el) => {
    const cs = getComputedStyle(el);
    const rgb = (s) =>
      s
        .match(/[\d.]+/g)
        .slice(0, 3)
        .map(Number);
    const lum = (c) =>
      c
        .map((v) => v / 255)
        .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
        .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
    const L1 = lum(rgb(cs.color)) + 0.05;
    const L2 = lum(rgb(cs.backgroundColor)) + 0.05;
    return Math.max(L1, L2) / Math.min(L1, L2);
  });
  expect(ratio).toBeGreaterThanOrEqual(4.5);
});
