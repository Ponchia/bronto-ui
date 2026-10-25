import { test, expect } from '@playwright/test';

// Prove the browser receives the test's motion policy. An accepted config key
// is not evidence that the installed runner forwards it to BrowserContext.
async function motionState(page) {
  await page.goto('/demo/');
  return page.evaluate(() => ({
    reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
    scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
  }));
}

test('the default browser context really applies reduced motion', async ({ page }, info) => {
  const state = await motionState(page);
  await info.attach('actual-default-motion', {
    body: Buffer.from(JSON.stringify(state)),
    contentType: 'application/json',
  });
  expect(state).toEqual({ reduced: true, scrollBehavior: 'auto' });
});

test.describe('explicit motion acceptance', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } });
  test('the motion-specific context retains normal motion', async ({ page }) => {
    expect(await motionState(page)).toEqual({ reduced: false, scrollBehavior: 'smooth' });
  });
});
