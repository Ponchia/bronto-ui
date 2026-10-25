import { test, expect } from '@playwright/test';
import { attachExampleFailure, readExampleState } from './helpers/public-example-state.mjs';

// Exercises the exact generated Pages artifact through the repository's
// zero-dependency static server. These checks join the normal cross-engine
// release gate; visual pixel baselines continue to live in visual.spec.mjs.
const publicRoot = '/_site/';

test('public site — a new developer can reach a working HTML example', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(response.status() + ' ' + response.url());
  });

  await page.goto(publicRoot);
  await page
    .getByRole('link', { name: /Get started/i })
    .first()
    .click();
  await expect(page).toHaveURL(/docs\/getting-started\/first-component\.html$/);
  await expect(page.getByRole('heading', { name: /First component/i })).toBeVisible();
  await expect(page.locator('.doc-code-example')).toHaveCount(3);
  await expect(page.locator('.doc-code-example [data-copy]')).toHaveCount(3);

  const active = page.locator('.docs-sidebar a[aria-current="page"]');
  await expect(active).toHaveCount(1);
  await expect(active.locator('xpath=ancestor::details')).toHaveAttribute('open', '');

  await page.goto(publicRoot + 'demo/first-steps.html');
  await expect(page.getByRole('heading', { name: 'One stylesheet. Ordinary HTML.' })).toBeVisible();
  await expect(page.locator('article.ui-card .ui-badge--success')).toHaveText('Healthy');
  expect(errors, errors.join('\n')).toEqual([]);
});

test('public site — small screens put the guide before its navigation tree', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(publicRoot + 'docs/getting-started/first-component.html');

  const positions = await page.evaluate(() => {
    const article = document.querySelector('.docs-article-wrap');
    const nav = document.querySelector('#docs-navigation');
    const heading = document.querySelector('.doc-prose h1');
    return {
      headingY: heading.getBoundingClientRect().top,
      articleY: article.getBoundingClientRect().top,
      navY: nav.getBoundingClientRect().top,
      overflow: document.documentElement.scrollWidth - innerWidth,
    };
  });
  expect(positions.articleY).toBeLessThan(positions.navY);
  expect(positions.headingY).toBeLessThan(300);
  expect(positions.overflow).toBeLessThanOrEqual(0);
  const browseLink = page.getByRole('link', { name: 'Browse all docs' });
  await expect(browseLink).toBeVisible();
  await browseLink.click();
  await expect(page.locator('#docs-navigation')).toBeInViewport();
});

test('public site — each example points to real source and has a mobile fallback', async ({
  page,
}, testInfo) => {
  for (const key of ['operations', 'reports', 'theming']) {
    let phase = 'mobile';
    let beforeResize;
    try {
      await test.step(`${key}: mobile screenshot fallback`, async () => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto(publicRoot + 'examples/' + key + '/');
        await expect(page.getByRole('link', { name: 'View HTML source' })).toHaveAttribute(
          'href',
          /github\.com\/Ponchia\/bronto-ui\/blob\/main\/demo\//,
        );
        await expect(page.locator('.example-mobile-preview')).toBeVisible();
        await expect(page.locator('.iframe-frame iframe')).toBeHidden();
        await expect(page.locator('.example-mobile-preview img')).toHaveJSProperty(
          'complete',
          true,
        );
        await expect(page.locator('.example-mobile-preview img')).not.toHaveJSProperty(
          'naturalWidth',
          0,
        );
        beforeResize = await page.evaluate(readExampleState);
        expect(beforeResize.overflow).toBeLessThanOrEqual(0);
      });
      phase = 'desktop';
      await test.step(`${key}: desktop iframe after resize`, async () => {
        await page.setViewportSize({ width: 1200, height: 800 });
        await expect(page.locator('.iframe-frame iframe')).toBeVisible();
        await expect(page.locator('.example-mobile-preview')).toBeHidden();
      });
    } catch (error) {
      await attachExampleFailure(page, testInfo, { key, phase, beforeResize }).catch(
        (captureError) => {
          testInfo.annotations.push({
            type: 'diagnostic-error',
            description: captureError.message,
          });
        },
      );
      throw error;
    }
  }
});

test('public site — docs search links to the authored first component guide', async ({ page }) => {
  await page.goto(publicRoot + 'docs/');
  const field = page.getByRole('searchbox', { name: 'Search documentation' });
  await field.fill('first component brontonotfoundtoken');
  await expect(page.locator('[data-doc-results]')).toHaveText('No matches. Try a different term.');
  await field.clear();
  await expect(page.locator('[data-doc-groups]')).toBeVisible();
  await field.fill('first component');
  const result = page.locator('.doc-search-result').filter({ hasText: 'First component' }).first();
  await expect(result).toBeVisible();
  await result.click();
  await expect(page).toHaveURL(/docs\/getting-started\/first-component\.html$/);
  await expect(page.locator('.docs-sidebar a[aria-current="page"]')).toBeVisible();
});

test('public site — component search and categorization are functional', async ({ page }) => {
  await page.goto(publicRoot + 'components/');
  await expect(page.locator('[data-component-card]')).toHaveCount(25);

  await page.locator('[data-component-query]').fill('measured');
  await expect(page.locator('[data-component-card]:visible')).toHaveCount(1);
  await expect(page.locator('[data-component-card]:visible')).toContainText('Measured values');

  await page.locator('[data-component-query]').clear();
  await page.locator('[data-component-chip="Data"]').click();
  await expect(page.locator('[data-component-card]:visible')).toHaveCount(4);
  await expect(page.locator('.component-preview nav[aria-label="Breadcrumb"]')).toHaveCount(1);
  await expect(page.getByRole('table', { name: 'Recent job status' })).toBeVisible();
});

test('public site — first-component instructions use the actual Vite vanilla entry', async ({
  page,
}) => {
  await page.goto(publicRoot + 'docs/getting-started/first-component.html');
  const snippets = await page.locator('.doc-prose pre code').allTextContents();
  expect(snippets.some((code) => code.trim() === "import '@ponchia/ui';")).toBe(true);
  expect(snippets.some((code) => code.includes('src="/src/main.js"'))).toBe(true);
  expect(snippets.some((code) => code.includes('src="/main.js"'))).toBe(false);
  await expect(page.locator('.doc-prose')).toContainText('Replace the contents of src/main.js');
});

test('public site — documentation copy feedback resets after repeated clicks', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-13T00:00:00Z') });
  await page.addInitScript(() => {
    // Deterministic clipboard contract in the browser matrix; permissions
    // for the real system clipboard vary by engine and runner.
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (value) => {
          window.__lastCopiedGuideCode = value;
        },
      },
    });
  });

  await page.goto(publicRoot + 'docs/getting-started/first-component.html');
  const buttons = page.locator('.doc-code-example .copy-button');
  await expect(buttons).toHaveCount(3);
  await page.clock.pauseAt(new Date('2026-10-13T00:01:00Z'));
  await buttons.nth(1).click();
  await expect(buttons.nth(1)).toHaveText('Copied');
  expect(await page.evaluate(() => window.__lastCopiedGuideCode)).toContain(
    "import '@ponchia/ui';",
  );
  await page.clock.fastForward(700);
  await buttons.nth(1).click();
  await page.clock.fastForward(700);
  await expect(buttons.nth(1)).toHaveText('Copied');
  await page.clock.fastForward(700);
  await expect(buttons.nth(1)).toHaveText('Copy code');
});

test('public site — section URLs land on visible documentation headings', async ({ page }) => {
  await page.goto(publicRoot + 'docs/usage.html#badge-vs-chip-vs-status-dot');
  const heading = page.getByRole('heading', { name: 'Badge vs chip vs status dot', exact: true });
  await expect(heading).toHaveAttribute('id', 'badge-vs-chip-vs-status-dot');
  await expect(heading).toBeInViewport();
  const top = await heading.evaluate((node) => node.getBoundingClientRect().top);
  const headerBottom = await page
    .locator('.site-header')
    .evaluate((node) => node.getBoundingClientRect().bottom);
  expect(top).toBeGreaterThanOrEqual(headerBottom);
});

test('public site — mobile navigation supports focus, Escape and outside dismissal', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(publicRoot);
  const toggle = page.locator('[data-menu-toggle]');
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await toggle.click();
  await expect(nav).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Overview', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(nav).toBeHidden();
  await expect(toggle).toHaveAttribute('aria-label', 'Open navigation');
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.locator('.hero-meta').click();
  await expect(nav).toBeHidden();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('public site — documentation search retries after a failed index request', async ({
  page,
}) => {
  let attempts = 0;
  await page.route('**/docs/search-index.json', async (route) => {
    attempts += 1;
    if (attempts === 1) await route.fulfill({ status: 503, body: 'Temporarily unavailable' });
    else await route.continue();
  });
  await page.goto(publicRoot + 'docs/');
  const field = page.getByRole('searchbox', { name: 'Search documentation' });
  await field.fill('tokens');
  await expect(page.locator('[data-doc-results]')).toContainText('Search is unavailable');
  await field.fill('first component');
  await expect(
    page.locator('.doc-search-result').filter({ hasText: 'First component' }).first(),
  ).toBeVisible();
  expect(attempts).toBe(2);
});

test.describe('public site without JavaScript', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  test('mobile navigation and documentation remain usable', async ({ page }) => {
    await page.goto(publicRoot);
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav).toBeVisible();
    await expect(page.locator('[data-menu-toggle]')).toBeHidden();
    await nav.getByRole('link', { name: 'Docs', exact: true }).click();
    await expect(page).toHaveURL(/\/_site\/docs\/$/);
    await expect(
      page.getByRole('heading', { name: 'Documentation without the detour.' }),
    ).toBeVisible();
    await page.goto(publicRoot + 'docs/usage.html#badge-vs-chip-vs-status-dot');
    await expect(
      page.getByRole('heading', { name: 'Badge vs chip vs status dot', exact: true }),
    ).toBeInViewport();
  });
});

test('public site — rejected clipboard copies select source and recover', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-13T00:00:00Z') });
  await page.addInitScript(() => {
    window.__rejectCopy = true;
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (value) => {
          if (window.__rejectCopy) throw new Error('Clipboard permission denied');
          window.__lastCopiedGuideCode = value;
        },
      },
    });
  });
  await page.goto(publicRoot + 'docs/getting-started/first-component.html');
  const example = page.locator('.doc-code-example').nth(1);
  const copy = example.locator('.copy-button');
  await page.clock.pauseAt(new Date('2026-10-13T00:01:00Z'));
  await copy.click();
  await expect(copy).toHaveText('Select to copy');
  await expect(example.locator('pre')).toBeFocused();
  expect(await page.evaluate(() => getSelection().getRangeAt(0).toString())).toBe(
    await example.locator('code').textContent(),
  );
  await page.clock.fastForward(1400);
  await expect(copy).toHaveText('Copy code');
  await page.evaluate(() => {
    window.__rejectCopy = false;
  });
  await copy.click();
  await expect(copy).toHaveText('Copied');
  expect(await page.evaluate(() => window.__lastCopiedGuideCode)).toContain(
    "import '@ponchia/ui';",
  );
  await page.clock.fastForward(1400);
  await expect(copy).toHaveText('Copy code');
});

test('public site — superseded clipboard requests cannot replace newer feedback', async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.__copies = [];
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: () =>
          new Promise((resolve, reject) => {
            window.__copies.push({ resolve, reject });
          }),
      },
    });
  });
  await page.goto(publicRoot + 'docs/getting-started/first-component.html');
  const copy = page.locator('.doc-code-example .copy-button').nth(1);
  await copy.click();
  await copy.click();
  await page.evaluate(() => window.__copies[1].resolve());
  await expect(copy).toHaveText('Copied');
  await page.evaluate(() => window.__copies[0].reject(new Error('Older copy failed')));
  await expect(copy).toHaveText('Copied');
});

test('public site — persisted theme loads without the deferred controller', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('bronto-ui-site-theme', 'dark'));
  await page.route('**/site/site.js', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: '',
    }),
  );
  await page.goto(publicRoot);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('[data-theme-toggle]')).toBeHidden();
  await expect(page.locator('[data-menu-toggle]')).toBeHidden();
});

test('public site — blocked theme storage preserves working controls', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('Storage is blocked');
      },
    });
  });
  await page.goto(publicRoot);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.locator('[data-theme-toggle]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('[data-theme-toggle]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-theme-toggle]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(errors).toEqual([]);
});
