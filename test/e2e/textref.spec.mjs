import { test, expect } from '@playwright/test';

async function open(page) {
  await page.goto('/demo/textref.html', { waitUntil: 'networkidle' });
}

test('textref link carries a #:~:text= fragment and the quote-jump affordance', async ({
  page,
}) => {
  await open(page);
  const link = page.locator('.ui-textref').first();
  await expect(link).toBeVisible();

  // The href is a real URL Text Fragment — the whole mechanism. The browser's
  // scroll-and-highlight (and the ::target-text paint) is native behaviour we
  // don't re-test; the contract this leaf owns is the fragment href + the
  // affordance cue.
  const href = await link.getAttribute('href');
  expect(href).toContain(':~:text=');

  // The leading quote-jump marker (::before) signals "this jumps to the quote".
  // It rides on the leaf's own pseudo-element, which running-prose link styles
  // don't override.
  const cue = await link.evaluate((el) => getComputedStyle(el, '::before').content);
  expect(cue).not.toBe('none');
  expect(cue.length).toBeGreaterThan(0);
});
