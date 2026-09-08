import { test, expect, devices } from '@playwright/test';

for (const theme of ['light', 'dark']) {
  test(`productive service composition preserves navigation and meaning (${theme})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 844 });
    await page.goto('/demo/service.html');
    await page.evaluate((value) => (document.documentElement.dataset.theme = value), theme);
    const state = await page.evaluate(() => {
      const style = (selector) => getComputedStyle(document.querySelector(selector));
      return {
        root: style('html').fontSize,
        title: style('h1').fontFamily,
        label: style('.ui-label').fontSize,
        nav: [...document.querySelectorAll('.ui-app-nav a')].map((el) => {
          const rect = el.getBoundingClientRect();
          return rect.left >= 0 && rect.right <= innerWidth + 1;
        }),
        delta: style('.ui-delta--down').color,
        favorable: style('.ui-delta--up').color,
        overflow: document.documentElement.scrollWidth - innerWidth,
      };
    });
    expect(state.root).toBe('16px');
    expect(state.title).not.toContain('Doto');
    expect(parseFloat(state.label)).toBeGreaterThanOrEqual(12);
    expect(state.nav.every(Boolean)).toBe(true);
    expect(state.delta).toBe(state.favorable);
    expect(state.overflow).toBeLessThanOrEqual(1);
  });
}

test('workbench stacks at narrow container width and inspector adapts inside a wide page', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/demo/workbench.html');
  const separator = page.getByRole('separator');
  await expect(separator).toBeVisible();
  await page.locator('.wb-demo').evaluate((el) => (el.style.width = '360px'));
  await expect(separator).toBeHidden();
  const file = page.getByRole('button', { name: 'sync-run.json Draft' });
  await file.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#selected-file')).toHaveText('Selected file: sync-run.json');
  await expect(file).toHaveAttribute('aria-current', 'true');
  const panes = await page.locator('.ui-splitter__pane').evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return { width: r.width, top: r.top, bottom: r.bottom };
    }),
  );
  expect(panes[0].width).toBeGreaterThan(280);
  expect(panes[1].width).toBeGreaterThan(280);
  // Firefox exposes adjacent layout edges with tiny float differences.
  expect(panes[1].top + 0.01).toBeGreaterThanOrEqual(panes[0].bottom);
  await page.locator('.ui-inspector').evaluate((el) => (el.style.width = '280px'));
  const property = await page
    .locator('.ui-property')
    .first()
    .evaluate((el) => {
      const [label, value] = [...el.children].map((child) => child.getBoundingClientRect());
      return { labelBottom: label.bottom, valueTop: value.top };
    });
  expect(property.valueTop + 0.01).toBeGreaterThanOrEqual(property.labelBottom);
});

test('editorial report leads with its decision, preserves reading measure, and opens contents', async ({
  page,
}) => {
  await page.goto('/demo/report-standalone.html');
  const toc = page.locator('details.ui-report__toc');
  await expect(toc).not.toHaveAttribute('open');
  const flow = await page.evaluate(() => {
    const decision = document.querySelector('.ui-report__decision');
    const toc = document.querySelector('details.ui-report__toc');
    return {
      decisionBeforeContents: Boolean(
        decision.compareDocumentPosition(toc) & Node.DOCUMENT_POSITION_FOLLOWING,
      ),
      readingSize: getComputedStyle(document.querySelector('.ui-report')).fontSize,
      bodyWidth: document.querySelector('.ui-report__decision-body').getBoundingClientRect().width,
      reportWidth: document.querySelector('.ui-report').getBoundingClientRect().width,
    };
  });
  expect(flow.decisionBeforeContents).toBe(true);
  expect(flow.readingSize).toBe('18px');
  expect(flow.bodyWidth).toBeLessThan(flow.reportWidth);
  await toc.locator('summary').click();
  await expect(toc).toHaveAttribute('open', '');
  await expect(toc.getByRole('link', { name: 'Evidence', exact: true })).toBeVisible();
  await page.emulateMedia({ media: 'print' });
  await expect(toc).toBeHidden();
  expect(
    await page.locator('.ui-report').evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
  ).toBeCloseTo(14.6667, 2);
});

test('dense chip keeps a touch target when used as a control', async ({
  browser,
  browserName,
  baseURL,
}) => {
  const context = await browser.newContext({
    ...devices['iPhone 13'],
    isMobile: browserName !== 'firefox',
    baseURL,
  });
  const page = await context.newPage();
  try {
    await page.goto('/demo/service.html');
    await page.evaluate(() => {
      const button = document.createElement('button');
      button.className = 'ui-chip ui-chip--dense';
      button.textContent = 'Filter';
      document.body.append(button);
    });
    const rect = await page.getByRole('button', { name: 'Filter', exact: true }).boundingBox();
    expect(rect.height).toBeGreaterThanOrEqual(44);
    expect(rect.width).toBeGreaterThanOrEqual(44);
  } finally {
    await context.close();
  }
});
