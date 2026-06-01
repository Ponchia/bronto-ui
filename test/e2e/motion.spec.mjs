import { test, expect } from '@playwright/test';

/**
 * Proves the CSS-native enter/exit motion (ADR-0002) is actually wired —
 * not just present in the stylesheet. The rest of the suite runs under
 * `reducedMotion: 'reduce'` (so the frozen visual baselines are stable);
 * this file deliberately opts back into motion to assert the
 * `@starting-style` / `transition-behavior: allow-discrete` /
 * `interpolate-size` plumbing engages — and degrades where an engine lacks
 * the feature. No pixels — engine-agnostic, so it runs on all three.
 */
test.use({ reducedMotion: 'no-preference' });

async function open(page) {
  await page.goto('/demo/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
}

test('popover enters from @starting-style and is wired for an allow-discrete exit', async ({
  page,
}) => {
  await open(page);
  await page.locator('[data-bronto-popover="pop1"]').click();
  const pop = page.locator('#pop1');
  await expect(pop).toBeVisible();

  // `display` in the transition list is the allow-discrete exit wiring —
  // without it the panel would vanish on close instead of fading out.
  const tp = await pop.evaluate((el) => getComputedStyle(el).transitionProperty);
  expect(tp).toContain('opacity');
  expect(tp).toContain('display');
  expect(
    await pop.evaluate((el) => parseFloat(getComputedStyle(el).transitionDuration)),
  ).toBeGreaterThan(0);

  // The @starting-style entrance interpolates opacity 0 → 1; let it settle.
  await expect.poll(() => pop.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
});

test('toast plays a CSS exit (.is-leaving) before the node is removed', async ({ page }) => {
  await open(page);
  await page.locator('#toastBtn').click();
  const toastEl = page.locator('.ui-toast');
  await expect(toastEl).toBeVisible();
  expect(await toastEl.evaluate((el) => getComputedStyle(el).transitionProperty)).toContain(
    'opacity',
  );

  // The demo toast auto-dismisses (~4s). Observe in-page (the .is-leaving
  // window is brief): the behavior must flag .is-leaving to fade it out and
  // then remove the node — not yank it instantly.
  const result = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const el = document.querySelector('.ui-toast');
        if (!el) return resolve({ sawLeaving: false, removed: false });
        let sawLeaving = false;
        const classObs = new MutationObserver(() => {
          if (el.classList.contains('is-leaving')) sawLeaving = true;
        });
        classObs.observe(el, { attributes: true, attributeFilter: ['class'] });
        const done = (removed) => {
          classObs.disconnect();
          resolve({ sawLeaving, removed });
        };
        const t = setInterval(() => {
          if (!el.isConnected) {
            clearInterval(t);
            done(true);
          }
        }, 50);
        setTimeout(() => {
          clearInterval(t);
          done(!el.isConnected);
        }, 7000);
      }),
  );
  expect(result.sawLeaving).toBe(true);
  expect(result.removed).toBe(true);
});

test('accordion animates auto-height where the platform supports it (else snaps)', async ({
  page,
}) => {
  await open(page);
  // The effect needs BOTH the content box (::details-content) and keyword
  // interpolation (interpolate-size). Today that is Chromium-only; Safari
  // has the box but not interpolate-size, Firefox has neither — both snap
  // open/closed, by design (ADR-0002 progressive enhancement).
  const supported = await page.evaluate(
    () =>
      CSS.supports('selector(::details-content)') &&
      CSS.supports('interpolate-size: allow-keywords'),
  );
  test.skip(!supported, 'engine lacks ::details-content + interpolate-size — snaps, by design');

  const probe = await page.evaluate(() => {
    const acc = document.querySelector('.ui-accordion');
    const item = acc.querySelector('.ui-accordion__item');
    const content = getComputedStyle(item, '::details-content');
    return {
      interpolateSize: getComputedStyle(acc).getPropertyValue('interpolate-size').trim(),
      transitionProperty: content.transitionProperty,
      transitionDuration: content.transitionDuration,
    };
  });
  // `auto` is only interpolable with this opt-in — the linchpin of the effect.
  expect(probe.interpolateSize).toBe('allow-keywords');
  expect(probe.transitionProperty).toMatch(/block-size|height/);
  expect(parseFloat(probe.transitionDuration)).toBeGreaterThan(0);
});
