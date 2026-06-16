import { test, expect } from '@playwright/test';

function attachPageGuards(page) {
  const consoleErrors = [];
  const pageErrors = [];
  const badResponses = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('response', (r) => {
    if (r.status() >= 400) badResponses.push(`${r.status()} ${r.url()}`);
  });
  return { consoleErrors, pageErrors, badResponses };
}

async function expectCleanPage(guards) {
  expect(guards.consoleErrors, guards.consoleErrors.join('\n')).toEqual([]);
  expect(guards.pageErrors, guards.pageErrors.join('\n')).toEqual([]);
  expect(guards.badResponses, guards.badResponses.join('\n')).toEqual([]);
}

test('docs viewer deep-links to a markdown heading anchor', async ({ page }) => {
  const guards = attachPageGuards(page);
  await page.goto('/docs/index.html#architecture.md#repository-layout', {
    waitUntil: 'networkidle',
  });

  await expect(page.locator('h1')).toHaveText('Architecture & Decisions');
  await expect(page.locator('nav a[aria-current="page"]')).toHaveText('Architecture');
  await expect(page.locator('#repository-layout')).toHaveText('Repository layout');
  await expect(page).toHaveURL(/#architecture\.md#repository-layout$/);
  await expectCleanPage(guards);
});

test('docs viewer keeps same-page markdown anchors inside the current doc route', async ({
  page,
}) => {
  const guards = attachPageGuards(page);
  await page.goto('/docs/index.html#reporting.md', { waitUntil: 'networkidle' });

  const link = page.getByRole('link', { name: 'Composition rules', exact: true });
  await expect(link).toHaveCount(1);
  await link.click();

  await expect(page.locator('h1')).toHaveText('Static reports');
  await expect(page.locator('nav a[aria-current="page"]')).toHaveText('Static reports');
  await expect(page.locator('#composition-rules')).toHaveText('Composition rules');
  await expect(page).toHaveURL(/#reporting\.md#composition-rules$/);
  await expectCleanPage(guards);
});

test('docs viewer renders every markdown route cleanly', async ({ page }) => {
  const guards = attachPageGuards(page);
  await page.goto('/docs/index.html', { waitUntil: 'networkidle' });

  const routes = await page.locator('#nav a[href^="#"]').evaluateAll((links) =>
    links.map((link) => ({
      href: link.getAttribute('href'),
      label: link.textContent.trim(),
    })),
  );
  expect(routes.length, 'docs viewer route inventory should be populated').toBeGreaterThan(40);

  const failures = [];
  for (const route of routes) {
    await page.goto(`/docs/index.html${route.href}`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => {
      const content = document.getElementById('content');
      const text = content?.textContent || '';
      return Boolean(content?.querySelector('h1') || text.includes("Couldn't load this doc."));
    });

    const state = await page.evaluate(() => {
      const content = document.getElementById('content');
      const current = document.querySelector('nav a[aria-current="page"]');
      const ids = new Map();
      for (const el of document.querySelectorAll('#content [id]')) {
        ids.set(el.id, (ids.get(el.id) || 0) + 1);
      }
      return {
        currentText: current?.textContent?.trim() || '',
        duplicateIds: [...ids].filter(([, count]) => count > 1).map(([id]) => id),
        fallback: content?.textContent?.includes("Couldn't load this doc.") ?? true,
        h1: content?.querySelector('h1')?.textContent?.trim() || '',
        loading: content?.textContent?.trim() === 'Loading…',
        overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      };
    });

    const issues = [];
    if (state.currentText !== route.label) {
      issues.push(`active nav is "${state.currentText}" instead of "${route.label}"`);
    }
    if (!state.h1) issues.push('missing rendered h1');
    if (state.fallback) issues.push('rendered fallback load error');
    if (state.loading) issues.push('still loading');
    if (state.duplicateIds.length) {
      issues.push(`duplicate content IDs: ${state.duplicateIds.join(', ')}`);
    }
    if (state.overflowX) issues.push('horizontal page overflow');
    if (issues.length) failures.push(`${route.href} (${route.label}): ${issues.join('; ')}`);
  }

  expect(failures, failures.join('\n')).toEqual([]);
  await expectCleanPage(guards);
});

test('docs viewer keeps mobile navigation compact and reveals the active route', async ({
  page,
}) => {
  const guards = attachPageGuards(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/docs/index.html#command.md', { waitUntil: 'networkidle' });

  await expect(page.locator('h1')).toHaveText('Command palette');
  await expect(page.locator('#nav-current')).toHaveText('Command palette');

  const compact = await page.evaluate(() => {
    const shell = document.getElementById('nav-shell');
    const content = document.getElementById('content');
    const summary = shell.querySelector('summary');
    const contentBox = content.getBoundingClientRect();
    const summaryBox = summary.getBoundingClientRect();
    return {
      pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      shellOpen: shell.hasAttribute('open'),
      contentTop: contentBox.top,
      summaryBottom: summaryBox.bottom,
      viewportHeight: window.innerHeight,
    };
  });
  expect(compact.pageOverflow, `page overflowed by ${compact.pageOverflow}px`).toBeLessThanOrEqual(
    0,
  );
  expect(compact.shellOpen).toBe(false);
  expect(compact.contentTop).toBeGreaterThanOrEqual(compact.summaryBottom - 1);
  expect(compact.contentTop).toBeLessThan(compact.viewportHeight * 0.3);

  await page.locator('#nav-shell > summary').click();
  await expect(page.locator('#nav-shell')).toHaveAttribute('open', '');
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const nav = document.getElementById('nav');
        const current = nav.querySelector('a[aria-current="page"]');
        const navBox = nav.getBoundingClientRect();
        const currentBox = current.getBoundingClientRect();
        return currentBox.top >= navBox.top - 1 && currentBox.bottom <= navBox.bottom + 1;
      }),
    )
    .toBe(true);

  const expanded = await page.evaluate(() => {
    const nav = document.getElementById('nav');
    const current = nav.querySelector('a[aria-current="page"]');
    const navBox = nav.getBoundingClientRect();
    const currentBox = current.getBoundingClientRect();
    return {
      activeVisible: currentBox.top >= navBox.top - 1 && currentBox.bottom <= navBox.bottom + 1,
      currentText: current.textContent.trim(),
      navHeight: navBox.height,
      navOverflowY: getComputedStyle(nav).overflowY,
      navScrollTop: nav.scrollTop,
      navScrollable: nav.scrollHeight > nav.clientHeight + 1,
      viewportHeight: window.innerHeight,
    };
  });
  expect(expanded.currentText).toBe('Command palette');
  expect(expanded.activeVisible).toBe(true);
  expect(expanded.navScrollable).toBe(true);
  expect(expanded.navOverflowY).toBe('auto');
  expect(expanded.navHeight).toBeLessThanOrEqual(expanded.viewportHeight * 0.42 + 1);

  await page.getByRole('link', { name: 'Theming & colorways', exact: true }).click();
  await expect(page.locator('h1')).toHaveText('Theming & branding contract');
  await expect(page.locator('#nav-current')).toHaveText('Theming & colorways');
  await expect(page.locator('#nav-shell')).not.toHaveAttribute('open', '');
  await expect(page).toHaveURL(/#theming\.md$/);
  await expectCleanPage(guards);
});
