import { test, expect } from '@playwright/test';

async function open(page) {
  await page.goto('/demo/sidenote.html', { waitUntil: 'networkidle' });
}

test('sidenotes are numbered by a CSS counter and stay in reading order', async ({ page }) => {
  await open(page);
  const refs = page.locator('.ui-sidenote__ref');
  await expect(refs).toHaveCount(2);

  // Each ref increments + prints the counter via ::after. getComputedStyle
  // returns the unresolved `counter(...)` token, so assert the numbering
  // mechanism is wired rather than scraping the rendered digit.
  const incr = await refs.first().evaluate((el) => getComputedStyle(el).counterIncrement);
  expect(incr).toContain('ui-sidenote');
  const after = await refs.first().evaluate((el) => getComputedStyle(el, '::after').content);
  expect(after).toContain('counter');

  // The notes themselves are real, visible DOM (no hidden-content trap).
  await expect(page.locator('.ui-sidenote').first()).toBeVisible();
  await expect(page.locator('.ui-marginnote').first()).toBeVisible();
});

test('narrow viewport keeps the note inline (not floated off-screen)', async ({ page }) => {
  await page.setViewportSize({ width: 480, height: 900 });
  await open(page);
  const float = await page
    .locator('.ui-sidenote')
    .first()
    .evaluate((el) => getComputedStyle(el).cssFloat);
  expect(float).toBe('none');
});

// The documented host contract must actually work: the container reserves the
// gutter with `padding-inline-end: calc(var(--sidenote-width) +
// var(--sidenote-gap))` (the demo uses that calc verbatim). The knobs are
// ROOT-scoped for exactly this — when they were declared only on the notes,
// the container calc was invalid, resolved to NO gutter, and the floated
// notes spilled past the page edge (caught in a real report's visual QA).
test('wide viewport: the documented gutter calc reserves room and the float stays on-page', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);

  const gutter = await page
    .locator('.sidenote-demo')
    .evaluate((el) => parseFloat(getComputedStyle(el).paddingInlineEnd));
  // 12rem + 2rem at 16px root = 224px; anything ~0 means the calc went invalid.
  expect(gutter).toBeGreaterThan(200);

  const note = page.locator('.ui-sidenote').first();
  const float = await note.evaluate((el) => getComputedStyle(el).cssFloat);
  expect(float).not.toBe('none');

  const fits = await note.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return rect.right <= document.documentElement.clientWidth + 1;
  });
  expect(fits, 'floated note must not spill past the page edge').toBe(true);

  // No page-level horizontal scroll either.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
