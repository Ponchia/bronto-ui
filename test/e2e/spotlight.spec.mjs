import { test, expect } from '@playwright/test';
import { applyTheme } from './_theme.mjs';
import { blocking, scan } from './_demo-guards.mjs';

async function open(page, theme = 'light') {
  await page.goto('/demo/spotlight.html', { waitUntil: 'networkidle' });
  await applyTheme(page, theme);
}

async function openProbe(page) {
  await page.goto('/docs/index.html', { waitUntil: 'domcontentloaded' });
  await page.setContent('<main></main>');
}

const spotW = (page) =>
  page.evaluate(() =>
    parseFloat(
      getComputedStyle(document.querySelector('[data-bronto-spotlight]')).getPropertyValue(
        '--spot-w',
      ),
    ),
  );
const spotX = (page) =>
  page.evaluate(() =>
    parseFloat(
      getComputedStyle(document.querySelector('[data-bronto-spotlight]')).getPropertyValue(
        '--spot-x',
      ),
    ),
  );

for (const theme of ['light', 'dark']) {
  test(`spotlight specimen passes axe (${theme})`, async ({ page }) => {
    await open(page, theme);
    const results = await scan(page).analyze();
    expect(blocking(results), JSON.stringify(blocking(results), null, 2)).toEqual([]);
  });
}

test('initSpotlight sizes the cutout to the target', async ({ page }) => {
  await open(page);
  expect(await spotW(page)).toBeGreaterThan(0);
});

test('cutout follows data-target when the host re-points it', async ({ page }) => {
  await open(page);
  const x0 = await spotX(page);
  await page.locator('[data-spot="share-button"]').click();
  await expect(page.locator('[data-bronto-spotlight]')).toHaveAttribute(
    'data-target',
    'share-button',
  );
  await expect.poll(() => spotX(page)).not.toBe(x0);
});

test('spotlight re-run after removing all overlays drops stale placement listeners', async ({
  page,
}) => {
  await open(page);
  await page.evaluate(async () => {
    const stage = document.createElement('div');
    stage.id = 'spotlight-lifecycle-stage';
    stage.style.cssText = [
      'position: relative',
      'inline-size: 360px',
      'block-size: 140px',
      'margin-block-start: 2rem',
    ].join(';');
    stage.innerHTML = `
      <button id="life-target" style="position: absolute; left: 40px; top: 30px; inline-size: 80px; block-size: 32px;">Target</button>
      <div id="life-spotlight" class="ui-spotlight" data-bronto-spotlight data-target="life-target" aria-hidden="true">
        <div class="ui-spotlight__hole"></div>
      </div>
    `;
    document.querySelector('main').append(stage);
    const behaviorPath = `/behaviors/${'index.js'}`;
    const { initSpotlight } = await import(behaviorPath);
    window.__lifeSpotlightStop = initSpotlight({ root: stage });
    const spot = document.getElementById('life-spotlight');
    window.__removedSpotlight = spot;
    window.__removedSpotlightX = spot.style.getPropertyValue('--spot-x');
    spot.remove();
    window.__lifeSpotlightStop = initSpotlight({ root: stage });
    document.getElementById('life-target').style.left = '180px';
    window.dispatchEvent(new Event('resize'));
  });

  const generated = await page.evaluate(() => window.__removedSpotlightX);
  expect(generated).not.toBe('');
  await expect
    .poll(() => page.evaluate(() => window.__removedSpotlight.style.getPropertyValue('--spot-x')))
    .toBe('');

  await page.evaluate(() => {
    window.__lifeSpotlightStop();
  });
});

test('spotlight cleanup restores generated cutout CSS in a real browser', async ({ page }) => {
  await openProbe(page);
  await page.evaluate(async () => {
    const stage = document.createElement('div');
    stage.id = 'spotlight-cleanup-stage';
    stage.style.cssText = [
      'position: relative',
      'inline-size: 360px',
      'block-size: 140px',
      'margin-block-start: 2rem',
    ].join(';');
    stage.innerHTML = `
      <button id="cleanup-target" style="position: absolute; left: 40px; top: 30px; inline-size: 80px; block-size: 32px;">Target</button>
      <div
        id="cleanup-spotlight"
        class="ui-spotlight"
        data-bronto-spotlight
        data-target="cleanup-target"
        style="--spot-x: 1px; --spot-y: 2px; --spot-w: 3px; --spot-h: 4px"
        aria-hidden="true"
      >
        <div class="ui-spotlight__hole"></div>
      </div>
    `;
    document.querySelector('main').append(stage);
    const behaviorPath = `/behaviors/${'index.js'}`;
    const { initSpotlight } = await import(behaviorPath);
    window.__spotlightCleanupStop = initSpotlight({ root: stage });
  });

  const spot = page.locator('#cleanup-spotlight');
  await expect
    .poll(() => spot.evaluate((el) => el.style.getPropertyValue('--spot-x')))
    .not.toBe('1px');
  await expect
    .poll(() => spot.evaluate((el) => el.style.getPropertyValue('--spot-w')))
    .not.toBe('3px');

  await page.evaluate(() => window.__spotlightCleanupStop());
  await expect.poll(() => spot.evaluate((el) => el.style.getPropertyValue('--spot-x'))).toBe('1px');
  await expect.poll(() => spot.evaluate((el) => el.style.getPropertyValue('--spot-y'))).toBe('2px');
  await expect.poll(() => spot.evaluate((el) => el.style.getPropertyValue('--spot-w'))).toBe('3px');
  await expect.poll(() => spot.evaluate((el) => el.style.getPropertyValue('--spot-h'))).toBe('4px');

  await page.evaluate(() => window.dispatchEvent(new Event('resize')));
  await expect.poll(() => spot.evaluate((el) => el.style.getPropertyValue('--spot-x'))).toBe('1px');
});
