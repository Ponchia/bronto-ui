import { test, expect } from '@playwright/test';

for (const theme of ['light', 'dark']) {
  test(`evidence remains readable in narrow parents on a wide page (${theme})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/demo/figure.html');
    await page.evaluate((value) => {
      document.documentElement.dataset.theme = value;
    }, theme);
    for (const width of [280, 320, 480, 1000]) {
      const figure = page.locator('.ui-figure');
      await figure.evaluate((el, width) => {
        el.style.width = `${width}px`;
      }, width);
      const sizes = await figure.evaluate((el) => {
        const stage = el.querySelector('.ui-figure__stage').getBoundingClientRect();
        const key = el.querySelector('.ui-figure__key').getBoundingClientRect();
        return {
          stage: stage.width,
          stacked: key.top >= stage.bottom - 1,
          annotationsFit: [...el.querySelectorAll('.ui-figure__overlay text')].every((text) => {
            const box = text.getBoundingClientRect();
            return box.left >= stage.left - 1 && box.right <= stage.right + 1;
          }),
        };
      });
      expect(sizes.stage).toBeGreaterThanOrEqual(Math.min(width, 280) - 1);
      expect(sizes.stacked).toBe(width <= 480);
      expect(sizes.annotationsFit).toBe(true);
    }
    await page.goto('/demo/report-standalone.html');
    await page.evaluate((value) => {
      document.documentElement.dataset.theme = value;
    }, theme);
    for (const width of [280, 320, 480]) {
      // Constrain the decision itself, not the viewport or entire report.
      await page.locator('.ui-report__decision').evaluate((el, width) => {
        el.style.width = `${width}px`;
      }, width);
      const values = await page.locator('.ui-report__decision-item').evaluateAll((els) =>
        els.map((el) => {
          const [label, value] = [...el.children].map((child) => child.getBoundingClientRect());
          return { width: value.width, below: value.top >= label.bottom - 1 };
        }),
      );
      for (const value of values) {
        expect(value.width).toBeGreaterThan(200);
        expect(value.below).toBe(true);
      }
    }
    await page.locator('.ui-report__actions').evaluate((el) => {
      el.style.width = '280px';
      el.querySelector('.ui-report__action-status').textContent =
        'Waiting for platform owner acknowledgement and review';
    });
    const action = await page
      .locator('.ui-report__action')
      .first()
      .evaluate((el) => {
        const box = el.getBoundingClientRect();
        return {
          width: box.width,
          scroll: el.scrollWidth,
          title: el.querySelector('.ui-report__action-title').getBoundingClientRect().width,
        };
      });
    expect(action.scroll).toBeLessThanOrEqual(action.width + 1);
    expect(action.title).toBeGreaterThan(200);
  });
}

test('two-up comparison wraps in its own parent, even outside a report', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/demo/report-standalone.html');
  const comparison = page.locator('.ui-compare--2up');
  await comparison.evaluate((el) => {
    document.body.append(el);
    el.append(el.children[0].cloneNode(true));
  });
  for (const width of [280, 480, 800, 1200]) {
    await comparison.evaluate((el, width) => {
      el.style.width = `${width}px`;
    }, width);
    const boxes = await comparison.locator('.ui-compare__col').evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, top: r.top, bottom: r.bottom, width: r.width };
      }),
    );
    expect(boxes[0].width).toBeGreaterThanOrEqual(250);
    if (width < 528) expect(boxes[1].top).toBeGreaterThanOrEqual(boxes[0].bottom - 1);
    else expect(boxes[1].top).toBeCloseTo(boxes[0].top, 0);
    expect(boxes[2].top).toBeGreaterThanOrEqual(boxes[0].bottom - 1);
  }
});

test('supporting text and citation markers stay readable', async ({ page }) => {
  await page.goto('/demo/report-standalone.html');
  const sizes = await page
    .locator('.ui-citation')
    .evaluateAll((els) => els.map((el) => parseFloat(getComputedStyle(el).fontSize)));
  expect(sizes.length).toBeGreaterThan(0);
  for (const size of sizes) expect(size).toBeGreaterThanOrEqual(12);
  await page.goto('/demo/figure.html');
  const caption = await page.locator('.ui-figure__caption').evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      size: parseFloat(style.fontSize),
      transform: style.textTransform,
      font: style.fontFamily,
    };
  });
  expect(caption.size).toBeGreaterThanOrEqual(14);
  expect(caption.transform).toBe('none');
  expect(caption.font).not.toContain('monospace');
});

test('service specimen filters, recovers and creates without misrepresenting unavailable health', async ({
  page,
}) => {
  await page.goto('/demo/service.html');
  await page.waitForFunction(() => document.documentElement.dataset.demoReady === '1');
  const scenario = page.getByLabel('Demo scenario');
  for (const value of ['loading', 'empty', 'error']) {
    await scenario.selectOption(value);
    await expect(page.locator('#health')).toBeHidden();
    await expect(page.locator('#job-results')).toBeHidden();
    await expect(page.locator('#jobs-message')).toBeVisible();
    await expect(page.locator('#jobs')).toHaveAttribute('aria-busy', String(value === 'loading'));
  }
  await page.getByRole('button', { name: 'Sync', exact: true }).click();
  await expect(page.locator('#job-results')).toBeVisible();
  await scenario.selectOption('stale');
  await expect(page.locator('#health-state')).toHaveText('Last known: operational');
  await expect(page.locator('#job-results')).toBeVisible();
  await scenario.selectOption('ready');
  await page.getByRole('searchbox', { name: 'Search jobs' }).fill('no such job');
  await expect(page.locator('#jobs-message')).toContainText('No matching jobs');
  const trigger = page.getByRole('button', { name: 'New job', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await page.getByRole('textbox', { name: 'Job name' }).fill('review-011');
  await page.getByRole('button', { name: 'Create job', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.getByRole('cell', { name: 'review-011', exact: true })).toBeVisible();
  for (const target of ['integrations', 'settings']) {
    await page.locator(`.ui-app-nav a[href="#${target}"]`).click();
    await expect(page.locator(`#${target}`)).toBeInViewport();
  }
});

test('service navigation keeps long names reachable without page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 844 });
  await page.goto('/demo/service.html');
  await page.evaluate(() => {
    document.querySelector('.ui-app-nav a[href="#integrations"]').textContent =
      'Integration configuration and connection recovery';
    document.querySelector('.ui-app-rail__account .ui-muted').textContent =
      'a-long-account-identifier@example-with-a-long-domain.test';
  });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(1);
  for (const link of await page.locator('.ui-app-nav a').all()) {
    const rect = await link.boundingBox();
    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.x + rect.width).toBeLessThanOrEqual(361);
  }
});
