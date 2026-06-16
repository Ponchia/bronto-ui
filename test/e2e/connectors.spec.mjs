import { test, expect } from '@playwright/test';
import { applyTheme } from './_theme.mjs';
import { blocking, scan } from './_demo-guards.mjs';

function expectVisibleColor(color, background) {
  expect(color).not.toBe('rgba(0, 0, 0, 0)');
  expect(color).not.toBe('transparent');
  expect(color).not.toBe(background);
}

async function open(page, theme = 'light') {
  await page.goto('/demo/connectors.html', { waitUntil: 'networkidle' });
  await applyTheme(page, theme);
}

async function openProbe(page) {
  await page.goto('/docs/index.html', { waitUntil: 'domcontentloaded' });
  await page.setContent('<main></main>');
}

async function mountScaledConnector(page, { disableScreenCtm = false } = {}) {
  await page.evaluate(() => {
    const stage = document.createElement('div');
    stage.id = 'scaled-connector-stage';
    stage.style.cssText = [
      'position: relative',
      'inline-size: 480px',
      'block-size: 280px',
      'transform: scale(0.75)',
      'transform-origin: left top',
      'margin-block-start: 2rem',
    ].join(';');
    stage.innerHTML = `
      <div id="scaled-a" style="box-sizing: border-box; inline-size: 80px; block-size: 40px; position: absolute; left: 40px; top: 30px;"></div>
      <div id="scaled-b" style="box-sizing: border-box; inline-size: 80px; block-size: 40px; position: absolute; left: 320px; top: 180px;"></div>
      <svg
        id="scaled-connector"
        class="ui-connector"
        data-bronto-connector
        data-from="scaled-a"
        data-to="scaled-b"
        data-from-side="center"
        data-to-side="center"
        data-end="none"
        aria-hidden="true"
      ></svg>
    `;
    document.querySelector('main').append(stage);
  });
  await page.addScriptTag({
    type: 'module',
    content: `
      import { initConnectors } from '/behaviors/index.js';
      const svg = document.getElementById('scaled-connector');
      if (${JSON.stringify(disableScreenCtm)}) svg.getScreenCTM = undefined;
      window.__scaledConnectorCleanup = initConnectors({
        root: document.getElementById('scaled-connector-stage'),
      });
      window.__scaledConnectorReady = true;
    `,
  });
  await page.waitForFunction(() => window.__scaledConnectorReady === true);
}

for (const theme of ['light', 'dark']) {
  test(`connectors specimen passes axe (${theme})`, async ({ page }) => {
    await open(page, theme);
    const results = await scan(page).analyze();
    expect(blocking(results), JSON.stringify(blocking(results), null, 2)).toEqual([]);
  });
}

test('initConnectors draws a non-empty path between the elements', async ({ page }) => {
  await open(page);
  const expected = await page.locator('[data-bronto-connector]').count();
  expect(expected).toBeGreaterThan(1);
  const paths = page.locator('.ui-connector__path');
  await expect(paths).toHaveCount(expected);
  const ds = await paths.evaluateAll((nodes) => nodes.map((n) => n.getAttribute('d') || ''));
  for (const d of ds) {
    expect(d).toMatch(/^M[\d.-]/);
    // an actual span (not a zero-length M0,0 degenerate path)
    expect(d.length).toBeGreaterThan(6);
  }
  const expectedEnds = await page
    .locator('[data-bronto-connector]')
    .evaluateAll((nodes) => nodes.filter((n) => n.getAttribute('data-end') !== 'none').length);
  await expect(page.locator('.ui-connector__end')).toHaveCount(expectedEnds);
});

test('connector redraws after a resize', async ({ page }) => {
  await open(page);
  const paths = page.locator('.ui-connector__path');
  const before = await paths.evaluateAll((nodes) => nodes.map((n) => n.getAttribute('d') || ''));
  await page.setViewportSize({ width: 700, height: 700 });
  await expect
    .poll(async () => paths.evaluateAll((nodes) => nodes.map((n) => n.getAttribute('d') || '')))
    .not.toEqual(before);
  const after = await paths.evaluateAll((nodes) => nodes.map((n) => n.getAttribute('d') || ''));
  for (const d of after) {
    expect(d).toMatch(/^M[\d.-]/);
    expect(d.length).toBeGreaterThan(6);
  }
});

test('connector re-run after removing all connectors drops stale redraw listeners', async ({
  page,
}) => {
  await open(page);
  await page.evaluate(async () => {
    const stage = document.createElement('div');
    stage.id = 'connector-lifecycle-stage';
    stage.style.cssText = [
      'position: relative',
      'inline-size: 420px',
      'block-size: 160px',
      'margin-block-start: 2rem',
    ].join(';');
    stage.innerHTML = `
      <div id="life-a" style="box-sizing: border-box; inline-size: 40px; block-size: 40px; position: absolute; left: 40px; top: 40px;"></div>
      <div id="life-b" style="box-sizing: border-box; inline-size: 40px; block-size: 40px; position: absolute; left: 240px; top: 40px;"></div>
      <svg
        id="life-connector"
        class="ui-connector"
        data-bronto-connector
        data-from="life-a"
        data-to="life-b"
        data-end="none"
        aria-hidden="true"
      ></svg>
    `;
    document.querySelector('main').append(stage);
    const behaviorPath = `/behaviors/${'index.js'}`;
    const { initConnectors } = await import(behaviorPath);
    window.__lifeConnectorStop = initConnectors({ root: stage });
    const svg = document.getElementById('life-connector');
    const path = svg.querySelector('.ui-connector__path');
    window.__removedConnectorPath = path;
    window.__removedConnectorD = path.getAttribute('d');
    svg.remove();
    window.__lifeConnectorStop = initConnectors({ root: stage });
    document.getElementById('life-b').style.left = '300px';
    window.dispatchEvent(new Event('resize'));
  });

  const before = await page.evaluate(() => window.__removedConnectorD);
  await expect
    .poll(() => page.evaluate(() => window.__removedConnectorPath.getAttribute('d')))
    .toBe(before);

  await page.evaluate(() => {
    window.__lifeConnectorStop();
  });
});

test('connector cleanup restores generated SVG in a real browser', async ({ page }) => {
  await openProbe(page);
  await page.evaluate(async () => {
    const stage = document.createElement('div');
    stage.id = 'connector-cleanup-stage';
    stage.style.cssText = [
      'position: relative',
      'inline-size: 420px',
      'block-size: 160px',
      'margin-block-start: 2rem',
    ].join(';');
    stage.innerHTML = `
      <div id="cleanup-a" style="box-sizing: border-box; inline-size: 40px; block-size: 40px; position: absolute; left: 40px; top: 40px;"></div>
      <div id="cleanup-b" style="box-sizing: border-box; inline-size: 40px; block-size: 40px; position: absolute; left: 240px; top: 40px;"></div>
      <svg
        id="cleanup-connector"
        class="ui-connector"
        data-bronto-connector
        data-from="cleanup-a"
        data-to="cleanup-b"
        aria-hidden="true"
      ></svg>
    `;
    document.querySelector('main').append(stage);
    const behaviorPath = `/behaviors/${'index.js'}`;
    const { initConnectors } = await import(behaviorPath);
    window.__connectorCleanupStop = initConnectors({ root: stage });
  });

  const connector = page.locator('#cleanup-connector');
  await expect(connector.locator('.ui-connector__path')).toHaveCount(1);
  await expect(connector.locator('.ui-connector__end')).toHaveCount(1);

  await page.evaluate(() => window.__connectorCleanupStop());
  await expect(connector.locator('.ui-connector__path')).toHaveCount(0);
  await expect(connector.locator('.ui-connector__end')).toHaveCount(0);

  await page.evaluate(() => window.dispatchEvent(new Event('resize')));
  await expect(connector.locator('.ui-connector__path')).toHaveCount(0);
  await expect(connector.locator('.ui-connector__end')).toHaveCount(0);
});

test('connector geometry stays in SVG-local coordinates inside a transformed stage', async ({
  page,
}) => {
  await open(page);
  await mountScaledConnector(page);

  await expect
    .poll(() =>
      page.locator('#scaled-connector .ui-connector__path').getAttribute('d', {
        timeout: 1000,
      }),
    )
    .toBe('M80,50L360,200');
});

test('connector fallback preserves transformed SVG-local coordinates without getScreenCTM', async ({
  page,
}) => {
  await open(page);
  await mountScaledConnector(page, { disableScreenCtm: true });

  await expect
    .poll(() =>
      page.locator('#scaled-connector .ui-connector__path').getAttribute('d', {
        timeout: 1000,
      }),
    )
    .toBe('M80,50L360,200');
});

test('connector draw animation only runs when motion is welcome', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  await page
    .locator('.ui-connector')
    .first()
    .evaluate((el) => el.classList.add('ui-connector--draw'));
  const reduced = await page
    .locator('.ui-connector__path')
    .first()
    .evaluate((el) => getComputedStyle(el).animationName);
  expect(reduced).toBe('none');

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.reload({ waitUntil: 'networkidle' });
  await page
    .locator('.ui-connector')
    .first()
    .evaluate((el) => el.classList.add('ui-connector--draw'));
  const animated = await page
    .locator('.ui-connector__path')
    .first()
    .evaluate((el) => getComputedStyle(el).animationName);
  expect(animated).toContain('ui-connector-draw');
});

test('connector strokes and markers remain visible in forced-colors', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const colors = await page.evaluate(() => {
    const path = document.querySelector('.ui-connector__path');
    const end = document.querySelector('.ui-connector__end');
    const canvasBackground = getComputedStyle(document.body).backgroundColor;
    return {
      canvasBackground,
      stroke: getComputedStyle(path).stroke,
      fill: getComputedStyle(end).fill,
    };
  });
  expectVisibleColor(colors.stroke, colors.canvasBackground);
  expectVisibleColor(colors.fill, colors.canvasBackground);
});
