import { test, expect, devices } from '@playwright/test';
import { readdirSync } from 'node:fs';
import { awaitDemoReady } from './_demo.mjs';

/**
 * Mobile / responsive coverage. The shipped CSS carries real responsive
 * machinery that had ZERO e2e coverage: a page that must not scroll
 * horizontally on a phone, an admin shell that collapses (css/app.css ~239,
 * `max-width: 880px`), a site nav that folds into a `<details>` menu
 * (css/site.css ~236, `max-width: 720px`), overlays that become bottom
 * sheets / full-width drawers (css/overlay.css ~343, `max-width: 560px`) and
 * coarse-pointer touch-target enlargement (`@media (pointer: coarse)` →
 * `min-block-size: 2.9rem`). These are asserted from computed layout, never
 * screenshots, so they run cross-engine (no pixels). All projects are Desktop,
 * so viewport is set per-test with `page.setViewportSize` — the same idiom
 * annotations.spec already uses at 390x844. The coarse-pointer block is the
 * one exception (see its comment): it needs a touch-emulating context.
 */

// `page.goto` waits for index.js to wire JS-built sections (data-demo-ready),
// then for the webfont, so layout is final before any measurement.
async function openShowcase(page) {
  await page.goto('/demo/', { waitUntil: 'networkidle' });
  await awaitDemoReady(page);
  await page.evaluate(() => document.fonts.ready);
}

// The annotations.spec idiom: positive value = the page itself scrolls
// horizontally. WebKit can report a small negative value (scrollWidth excludes
// the classic scrollbar gutter innerWidth counts), so `<= 0` is the gate.
function pageOverflow() {
  return document.documentElement.scrollWidth - window.innerWidth;
}

async function applyLayoutTheme(page, theme) {
  await page.emulateMedia({ colorScheme: theme });
  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-theme', t);
  }, theme);
}

// ---------------------------------------------------------------------------
// 1. PAGE-OVERFLOW SWEEP — highest-value assertion: a component-heavy page
//    must not introduce a horizontal page scrollbar on a phone. Each leaf
//    demo below is a dense, real-component specimen verified mobile-clean at
//    320–360px, so this is a true regression gate — a future component or
//    figure that breaks small-screen layout fails CI.
//
//    Every public demo is expected to keep page overflow at zero and scope any
//    unavoidable specimen overflow to an inner scroller. This deliberately
//    includes low-density docs/demos, not only the known dense component pages:
//    a newly added public page should not escape the mobile layout invariant
//    because it was omitted from a hand-maintained shortlist.
// ---------------------------------------------------------------------------
const MOBILE_CLEAN_DEMOS = readdirSync(new URL('../../demo/', import.meta.url))
  .filter((name) => name.endsWith('.html'))
  .map((name) => name.replace(/\.html$/, ''))
  .sort();

for (const width of [360, 320]) {
  for (const theme of ['light', 'dark']) {
    test(`no horizontal page overflow at ${width}px (${theme})`, async ({ page }) => {
      test.setTimeout(60_000);
      await page.setViewportSize({ width, height: 844 });
      const worst = [];
      for (const demo of MOBILE_CLEAN_DEMOS) {
        await page.goto(`/demo/${demo}.html`, { waitUntil: 'networkidle' });
        await applyLayoutTheme(page, theme);
        const overflow = await page.evaluate(pageOverflow);
        if (overflow > 0) worst.push(`${demo}.html overflows by ${overflow}px`);
      }
      expect(worst, worst.join('\n')).toEqual([]);
    });
  }
}

test('dot readout scopes its wide matrix to the specimen scroller on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/demo/dots.html', { waitUntil: 'networkidle' });
  await page.waitForSelector('html[data-demo-ready]');

  const overflow = await page.evaluate(() => {
    const scroller = document.querySelector('.dots-demo__readout-scroll');
    const readout = scroller?.querySelector('.ui-readout');
    const s = scroller?.getBoundingClientRect();
    const r = readout?.getBoundingClientRect();
    return {
      pageOverflow: document.documentElement.scrollWidth - window.innerWidth,
      scrollerOverflow: scroller ? scroller.scrollWidth - scroller.clientWidth : 0,
      scrollerInlineSize: s?.width ?? 0,
      readoutInlineSize: r?.width ?? 0,
      scrollerOverflowX: scroller ? getComputedStyle(scroller).overflowX : '',
      scrollerTabIndex: scroller?.getAttribute('tabindex') ?? '',
      scrollerLabel: scroller?.getAttribute('aria-label') ?? '',
    };
  });

  expect(
    overflow.pageOverflow,
    `page overflowed by ${overflow.pageOverflow}px`,
  ).toBeLessThanOrEqual(0);
  expect(overflow.scrollerOverflow).toBeGreaterThan(100);
  expect(overflow.readoutInlineSize).toBeGreaterThan(overflow.scrollerInlineSize);
  expect(overflow.scrollerOverflowX).toBe('auto');
  expect(overflow.scrollerTabIndex).toBe('0');
  expect(overflow.scrollerLabel).toMatch(/\S/);
});

// ---------------------------------------------------------------------------
// 2. APP-SHELL COLLAPSE — css/app.css ~239. The public service demo mounts the
//    real cross-service shell. Wide: a 2-column grid with rail and content
//    side-by-side. Below 880px: a single column, rail goes horizontal (its own
//    row above the content).
// ---------------------------------------------------------------------------
test.describe('app-shell collapse', () => {
  const FIXTURE = '/demo/service.html';

  async function shellMetrics(page) {
    return page.evaluate(() => {
      const shell = document.querySelector('[data-app-shell]');
      const rail = document.querySelector('[data-app-rail]');
      const content = document.querySelector('[data-app-content]');
      const cols = getComputedStyle(shell).gridTemplateColumns.trim().split(/\s+/).length;
      const r = rail.getBoundingClientRect();
      const c = content.getBoundingClientRect();
      return {
        columnCount: cols,
        // side-by-side: content starts to the right of the rail and they share a row
        sideBySide: c.left >= r.right - 1 && Math.abs(c.top - r.top) < 4,
        // stacked: content sits below the (now horizontal) rail
        stacked: c.top >= r.bottom - 1,
        railFlexDirection: getComputedStyle(rail).flexDirection,
        railHeight: r.height,
        viewportHeight: window.innerHeight,
      };
    });
  }

  test('rail + content sit side-by-side on a wide viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto(FIXTURE, { waitUntil: 'networkidle' });
    const m = await shellMetrics(page);
    expect(m.columnCount).toBe(2); // two-column track
    expect(m.sideBySide).toBe(true);
    expect(m.railFlexDirection).toBe('column');
  });

  test('collapses to a single column with a horizontal rail below 880px', async ({ page }) => {
    await page.setViewportSize({ width: 760, height: 800 });
    await page.goto(FIXTURE, { waitUntil: 'networkidle' });
    const m = await shellMetrics(page);
    expect(m.columnCount).toBe(1); // single-column track
    expect(m.stacked).toBe(true); // content drops below the rail
    expect(m.railFlexDirection).toBe('row'); // rail laid out horizontally
    // C7: the horizontal rail must stay a thin strip, not balloon to ~half the
    // viewport because the grid stretched its auto track to fill min-block-size.
    expect(m.railHeight).toBeLessThan(m.viewportHeight * 0.25);
  });
});

// ---------------------------------------------------------------------------
// 3. OVERLAY AT SMALL VIEWPORT — css/overlay.css ~343 (`max-width: 560px`).
//    Open the showcase modal + drawer on a phone and assert they never spill
//    past the viewport; the drawer additionally spans full width and sits at
//    the bottom as a sheet. Opened via the same data-bronto-open buttons
//    behavior.spec/quality.spec drive.
// ---------------------------------------------------------------------------
test.describe('overlays at small viewport', () => {
  test('modal does not exceed a 520px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 520, height: 800 });
    await openShowcase(page);

    const modal = page.locator('dialog.ui-modal#demoModal');
    await expect(modal).toBeHidden();
    await page.getByRole('button', { name: 'Open modal' }).click();
    await expect(modal).toBeVisible();

    const box = await modal.boundingBox();
    const innerWidth = await page.evaluate(() => window.innerWidth);
    expect(box.x).toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width).toBeLessThanOrEqual(innerWidth + 1);
  });

  test('drawer becomes a full-width bottom sheet at a 520px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 520, height: 800 });
    await openShowcase(page);

    const drawer = page.locator('dialog.ui-modal.ui-modal--drawer#demoDrawer');
    await expect(drawer).toBeHidden();
    await page.getByRole('button', { name: 'Open drawer' }).click();
    await expect(drawer).toBeVisible();
    // Let the open transition settle: the drawer enters with a transform, so a
    // mid-animation getBoundingClientRect reads a transient (scaled) width. Wait
    // for every finite animation to finish before measuring the laid-out box.
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((a) => a.effect?.getTiming?.().iterations !== Infinity)
          .map((a) => a.finished.catch(() => {})),
      ),
    );

    const { box, layoutWidth, innerWidth, clientWidth, clientHeight } = await page.evaluate(() => {
      const el = document.querySelector('dialog.ui-modal--drawer#demoDrawer');
      const b = el.getBoundingClientRect();
      return {
        box: { x: b.x, y: b.y, width: b.width, bottom: b.bottom },
        // The laid-out inline-size (100vw) — transform-independent, unlike the
        // bounding rect which an enter transform can momentarily scale.
        layoutWidth: parseFloat(getComputedStyle(el).inlineSize),
        innerWidth: window.innerWidth,
        // clientWidth/Height exclude the scrollbar gutter — the same box `100vw`
        // fills in Chromium — so the full-width/bottom checks aren't thrown off
        // by a few scrollbar pixels innerWidth would count.
        clientWidth: document.documentElement.clientWidth,
        clientHeight: document.documentElement.clientHeight,
      };
    });

    // Confined to the viewport…
    expect(box.x).toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width).toBeLessThanOrEqual(innerWidth + 1);
    // …spans the full content width (100vw)…
    expect(layoutWidth).toBeGreaterThanOrEqual(clientWidth - 1);
    // …and is anchored to the bottom as a sheet (margin: auto 0 0).
    expect(box.bottom).toBeGreaterThanOrEqual(clientHeight - 1);
  });
});

// ---------------------------------------------------------------------------
// 4. SITE NAV FOLD — css/site.css ~236 (`max-width: 720px`). The inline
//    `.ui-siteheader > .ui-sitenav` hides and the `<details>` `.ui-sitemenu`
//    appears below the breakpoint. Real markup lives in demo/index.html's
//    "Site shell" section.
// ---------------------------------------------------------------------------
test.describe('site nav folds into the details menu', () => {
  async function navState(page) {
    return page.evaluate(() => {
      const inlineNav = document.querySelector('.ui-siteheader > .ui-sitenav');
      const menu = document.querySelector('.ui-siteheader .ui-sitemenu');
      return {
        inlineNavDisplay: getComputedStyle(inlineNav).display,
        menuDisplay: getComputedStyle(menu).display,
      };
    });
  }

  test('inline nav is shown and the menu hidden on a wide viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 800 });
    await openShowcase(page);
    const s = await navState(page);
    expect(s.inlineNavDisplay).not.toBe('none'); // inline nav visible
    expect(s.menuDisplay).toBe('none'); // details menu hidden
  });

  test('inline nav hides and the menu appears below 720px', async ({ page }) => {
    await page.setViewportSize({ width: 680, height: 800 });
    await openShowcase(page);
    const s = await navState(page);
    expect(s.inlineNavDisplay).toBe('none'); // inline nav collapsed
    expect(s.menuDisplay).not.toBe('none'); // details menu now displayed
  });
});

// ---------------------------------------------------------------------------
// 5. TOUCH TARGETS (coarse pointer) — `@media (pointer: coarse)` enlarges
//    .ui-button / .ui-input plus the dismiss/close affordances, which share one
//    declaration block: `.ui-alert__close, .ui-toast__close { min-block-size:
//    2.9rem; ... }`. We measure the three controls statically present on the
//    showcase (button, input, alert close); the alert-dismiss measurement
//    exercises that shared block, so .ui-toast__close is covered transitively
//    (the demo's default toast auto-dismisses without a close button, so there
//    is none to measure live).
//    Making the browser actually REPORT a coarse pointer needs touch emulation:
//    the `isMobile` flag that flips the pointer media is supported by Chromium
//    and WebKit but NOT Firefox, which THROWS on `isMobile` at context creation
//    (so a per-test skip is too late). So we skip only Firefox and build the
//    touch context by hand from whichever engine is under test (not via
//    `test.use(devices[...])`, whose worker-level options would blow up the
//    Firefox worker before the skip could run). The `matchMedia` guard below
//    fails loudly if an engine ever stops flipping the media, instead of passing
//    vacuously.
// ---------------------------------------------------------------------------
test.describe('coarse-pointer touch targets', () => {
  test('controls reach the 2.9rem touch target under a coarse pointer', async ({
    browserName,
    baseURL,
  }) => {
    test.skip(
      browserName === 'firefox',
      'Firefox rejects isMobile/touch context options at creation',
    );

    // Build a touch-emulating context by hand from the Pixel 7 descriptor (a
    // phone viewport + hasTouch + isMobile in one), on whichever engine is under
    // test, so the worker isn't forced into mobile options Firefox rejects.
    const { defaultBrowserType, ...pixel7 } = devices['Pixel 7'];
    const playwright = await import('@playwright/test');
    const browser = await playwright[browserName].launch();
    const context = await browser.newContext(pixel7);
    try {
      const page = await context.newPage();
      await page.goto(new URL('/demo/', baseURL).href, { waitUntil: 'networkidle' });
      await awaitDemoReady(page);
      await page.evaluate(() => document.fonts.ready);

      // Sanity-check the emulation actually took: the media query must match.
      const coarse = await page.evaluate(() => matchMedia('(pointer: coarse)').matches);
      expect(coarse, 'expected the emulated context to report a coarse pointer').toBe(true);

      const sizes = await page.evaluate(() => {
        const measure = (sel) => {
          const el = document.querySelector(sel);
          return el ? el.getBoundingClientRect().height : 0;
        };
        return {
          button: measure('.ui-button'),
          input: measure('.ui-input'),
          alertClose: measure('.ui-alert__close'),
          // The coarse rule sets `min-block-size: 2.9rem`. Mobile emulation can
          // pick a non-16px root font (Pixel 7 reports 15px here), so derive the
          // target from the PAGE's own rem base — 2.9rem, whatever a rem is —
          // instead of hard-coding 46px against a 16px assumption.
          target: 2.9 * parseFloat(getComputedStyle(document.documentElement).fontSize),
        };
      });
      // ~1px slack for sub-pixel rounding; the contract is "control reaches 2.9rem".
      expect(sizes.button, 'button').toBeGreaterThanOrEqual(sizes.target - 1);
      expect(sizes.input, 'input').toBeGreaterThanOrEqual(sizes.target - 1);
      expect(sizes.alertClose, 'alert close').toBeGreaterThanOrEqual(sizes.target - 1);
    } finally {
      await context.close();
      await browser.close();
    }
  });
});
