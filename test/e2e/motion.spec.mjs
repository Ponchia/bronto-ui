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

test('scroll-driven primitives bind a scroll/view timeline where supported (else static)', async ({
  page,
}) => {
  await open(page);
  const supported = await page.evaluate(() => CSS.supports('animation-timeline: scroll()'));
  const probe = await page.evaluate(() => {
    const bar = document.createElement('div');
    bar.className = 'ui-scroll-progress';
    const rev = document.createElement('div');
    rev.className = 'ui-scroll-reveal';
    rev.textContent = 'x';
    document.body.append(bar, rev);
    const cb = getComputedStyle(bar);
    const cr = getComputedStyle(rev);
    const out = {
      barName: cb.animationName,
      barTimeline: cb.animationTimeline,
      barTransform: cb.transform,
      revName: cr.animationName,
      revTimeline: cr.animationTimeline,
    };
    bar.remove();
    rev.remove();
    return out;
  });
  if (supported) {
    expect(probe.barName).toContain('uiScrollGrow');
    expect(probe.barTimeline).toMatch(/scroll/);
    expect(probe.revName).toContain('uiRise');
    expect(probe.revTimeline).toMatch(/view/);
  } else {
    // Degrade to a static end state — no animation bound at all.
    expect(probe.barName).toBe('none');
    expect(probe.revName).toBe('none');
  }
});

test('.ui-vt exposes a view-transition-name driven by --ui-vt-name', async ({ page }) => {
  await open(page);
  const supported = await page.evaluate(() => CSS.supports('view-transition-name: none'));
  test.skip(!supported, 'engine lacks view-transition-name (e.g. Firefox) — inert, by design');
  const name = await page.evaluate(() => {
    const el = document.createElement('div');
    el.className = 'ui-vt';
    el.style.setProperty('--ui-vt-name', 'hero');
    document.body.appendChild(el);
    const v = getComputedStyle(el).viewTransitionName;
    el.remove();
    return v;
  });
  expect(name).toBe('hero');
});

test('a same-document view transition runs to completion where supported (else degrades)', async ({
  page,
}) => {
  await open(page);
  const result = await page.evaluate(async () => {
    if (typeof document.startViewTransition !== 'function') return 'unsupported';
    const t = document.startViewTransition(() => {
      document.body.dataset.vtRan = '1';
    });
    await t.finished;
    return document.body.dataset.vtRan;
  });
  // Chromium runs it; engines without the API degrade to a plain DOM update.
  expect(['1', 'unsupported']).toContain(result);
});
