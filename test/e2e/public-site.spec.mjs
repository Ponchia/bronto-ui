import { test, expect } from '@playwright/test';

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
}) => {
  for (const key of ['operations', 'reports', 'theming']) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(publicRoot + 'examples/' + key + '/');
    await expect(page.getByRole('link', { name: 'View HTML source' })).toHaveAttribute(
      'href',
      /github\.com\/Ponchia\/bronto-ui\/blob\/main\/demo\//,
    );
    await expect(page.locator('.example-mobile-preview')).toBeVisible();
    await expect(page.locator('.iframe-frame iframe')).toBeHidden();
    await expect(page.locator('.example-mobile-preview img')).toHaveJSProperty('complete', true);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);

    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('.iframe-frame iframe')).toBeVisible();
    await expect(page.locator('.example-mobile-preview')).toBeHidden();
  }
});

test('public site — docs search links to the authored first component guide', async ({ page }) => {
  await page.goto(publicRoot + 'docs/');
  const field = page.getByRole('searchbox', { name: 'Search documentation' });
  await field.fill('first component');
  const result = page.locator('.doc-search-result').filter({ hasText: 'First component' }).first();
  await expect(result).toBeVisible();
  await result.click();
  await expect(page).toHaveURL(/docs\/getting-started\/first-component\.html$/);
  await expect(page.locator('.docs-sidebar a[aria-current="page"]')).toBeVisible();
});

test('public site — component search and categorization are functional', async ({ page }) => {
  await page.goto(publicRoot + 'components/');
  await expect(page.locator('[data-component-card]')).toHaveCount(20);

  await page.locator('[data-component-query]').fill('measured');
  await expect(page.locator('[data-component-card]:visible')).toHaveCount(1);
  await expect(page.locator('[data-component-card]:visible')).toContainText('Measured values');

  await page.locator('[data-component-query]').clear();
  await page.locator('[data-component-chip="Data"]').click();
  await expect(page.locator('[data-component-card]:visible')).toHaveCount(4);
  await expect(page.locator('.component-preview nav[aria-label="Breadcrumb"]')).toHaveCount(1);
  await expect(page.locator('.component-preview table caption')).toContainText('Recent job status');
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

test('public site — documentation code blocks copy their actual source', async ({ page }) => {
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
  await buttons.nth(1).click();
  await expect(buttons.nth(1)).toHaveText('Copied');
  expect(await page.evaluate(() => window.__lastCopiedGuideCode)).toContain(
    "import '@ponchia/ui';",
  );
});
