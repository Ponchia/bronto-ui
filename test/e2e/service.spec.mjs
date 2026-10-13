import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function openService(page, width = 1280) {
  await page.setViewportSize({ width, height: 800 });
  await page.goto('/demo/service.html');
  await expect(page.locator('html')).toHaveAttribute('data-demo-ready', '1');
}

test('service navigation changes the current destination, title and visible content', async ({
  page,
}) => {
  await openService(page);
  for (const [id, title] of [
    ['jobs', 'Jobs'],
    ['integrations', 'Integrations'],
    ['settings', 'Settings'],
    ['overview', 'Service overview'],
  ]) {
    await page.getByRole('navigation', { name: 'Primary' }).locator(`[href="#${id}"]`).click();
    await expect(page.locator('h1')).toHaveText(title);
    await expect(page.locator('.ui-app-nav [aria-current="page"]')).toHaveAttribute(
      'href',
      `#${id}`,
    );
    await expect(page.locator('.ui-app-nav [aria-current="page"]')).toHaveCount(1);
    await expect(page.locator('#settings')).toBeVisible({ visible: id === 'settings' });
    await expect(page.locator('#integrations')).toBeVisible({ visible: id === 'integrations' });
  }
});

test('service toolbar aligns labeled controls and keeps account identity on one line', async ({
  page,
}) => {
  await openService(page);
  const fields = await page
    .locator('#environment, input[type="search"], #scenario')
    .evaluateAll((elements) =>
      elements.map((el) => {
        const box = el.getBoundingClientRect();
        return { bottom: box.bottom, height: box.height };
      }),
    );
  expect(
    Math.max(...fields.map((f) => f.bottom)) - Math.min(...fields.map((f) => f.bottom)),
  ).toBeLessThanOrEqual(2);
  const account = await page.locator('.ui-app-rail__account .ui-muted').evaluate((el) => ({
    height: el.getBoundingClientRect().height,
    line: parseFloat(getComputedStyle(el).lineHeight),
  }));
  expect(account.height).toBeLessThanOrEqual(account.line + 1);
});

test('service job dialog uses the framework title, body and separated action footer', async ({
  page,
}) => {
  await openService(page);
  await page.getByRole('button', { name: 'New job', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Create a sample job' });
  await expect(dialog).toBeVisible();
  const input = dialog.getByRole('textbox', { name: 'Job name' });
  const create = dialog.getByRole('button', { name: 'Create job', exact: true });
  const titleSize = await dialog
    .locator('h2')
    .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(titleSize).toBeLessThanOrEqual(24);
  const field = await input.boundingBox();
  const action = await create.boundingBox();
  expect(action.y - (field.y + field.height)).toBeGreaterThanOrEqual(20);
  await expect(dialog.locator('.ui-modal__head')).toBeVisible();
  await expect(dialog.locator('.ui-modal__foot')).toBeVisible();
});

test('service destinations support direct links, history and keyboard focus', async ({ page }) => {
  await openService(page);
  await page.goto('/demo/service.html#settings');
  await expect(page.locator('h1')).toHaveText('Settings');
  const jobs = page.locator('.ui-app-nav a[href="#jobs"]');
  await jobs.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('h1')).toHaveText('Jobs');
  await expect(page.locator('h1')).toBeFocused();
  await expect(page.locator('#health')).toBeHidden();
  await expect(page.locator('#job-results')).toBeVisible();
  await page.goBack();
  await expect(page.locator('h1')).toHaveText('Settings');
  await page.goForward();
  await expect(page.locator('h1')).toHaveText('Jobs');
});

test('service filters change the actual rows and counts; created jobs use the same composition', async ({
  page,
}) => {
  await openService(page);
  await expect(page.locator('#jobs tbody tr:visible')).toHaveCount(4);
  await expect(page.locator('#active-count')).toHaveText('3');
  await page.getByRole('link', { name: 'View all jobs' }).click();
  await expect(page.locator('h1')).toHaveText('Jobs');
  await expect(page.locator('#jobs tbody tr:visible')).toHaveCount(6);
  await page.getByLabel('Environment', { exact: true }).selectOption('staging');
  await expect(page.locator('#jobs tbody tr:visible')).toHaveCount(3);
  await expect(page.locator('#active-count')).toHaveText('1');
  const search = page.getByRole('searchbox', { name: 'Search jobs', exact: true });
  await search.fill('Platform');
  await expect(page.locator('#jobs tbody tr:visible')).toHaveCount(1);
  await expect(page.locator('#jobs-description')).toHaveText('1 of 3 jobs · Staging');
  await search.fill('not-in-this-environment');
  await expect(page.locator('#job-results')).toBeHidden();
  await page.getByRole('button', { name: 'Clear search', exact: true }).click();
  await expect(search).toBeFocused();
  await expect(page.locator('#jobs tbody tr:visible')).toHaveCount(3);
  const opener = page.getByRole('button', { name: 'New job', exact: true });
  await opener.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('textbox', { name: 'Job name' })).toBeFocused();
  await expect(dialog).toContainText('Staging');
  await dialog.getByRole('textbox', { name: 'Job name' }).fill('weekly <report>');
  await dialog.getByRole('button', { name: 'Create job', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  const row = page.getByRole('row').filter({ hasText: 'weekly <report>' });
  await expect(row.locator('td').first()).toHaveClass('is-key');
  await expect(row.locator('.service-job-status')).toHaveText('Queued');
  await expect(row.locator('.ui-dot--warning')).toBeVisible();
  await expect(row.locator('td').last()).toHaveClass('is-num');
  await expect(page.locator('#active-count')).toHaveText('2');
  await expect(page.locator('#service-notice')).toContainText('added to Staging');
  await page.getByLabel('Environment', { exact: true }).selectOption('production');
  await expect(row).toBeHidden();
});

test('service dialog rejects blank and duplicate names and resets after cancel or Escape', async ({
  page,
}) => {
  await openService(page);
  const opener = page.getByRole('button', { name: 'New job', exact: true });
  const dialog = page.getByRole('dialog');
  const input = page.getByRole('textbox', { name: 'Job name' });
  await opener.click();
  await input.fill('   ');
  await dialog.getByRole('button', { name: 'Create job', exact: true }).click();
  await expect(dialog).toBeVisible();
  await expect(input).toHaveJSProperty('validationMessage', 'Enter a job name, not only spaces.');
  await input.fill('SYNC-DAILY');
  await dialog.getByRole('button', { name: 'Create job', exact: true }).click();
  await expect(input).toHaveJSProperty(
    'validationMessage',
    'This name already exists in the selected environment.',
  );
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(opener).toBeFocused();
  await opener.click();
  await expect(input).toHaveValue('');
  await input.fill('discard-me');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  await expect(page.locator('#jobs tbody tr:visible')).toHaveCount(4);
});

test('service appearance preferences apply, survive navigation, and reset', async ({ page }) => {
  await openService(page);
  await page.locator('.ui-app-nav a[href="#settings"]').click();
  await page.getByLabel('Theme', { exact: true }).selectOption('light');
  await page.getByLabel('Density', { exact: true }).selectOption('roomy');
  await page.getByRole('button', { name: 'Save preferences', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('html')).toHaveAttribute('data-density', 'roomy');
  await expect(page.locator('#preferences-notice')).toContainText('Saved for this tab');
  await page.locator('.ui-app-nav a[href="#overview"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.locator('.ui-app-nav a[href="#settings"]').click();
  await expect(page.getByLabel('Density', { exact: true })).toHaveValue('roomy');
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-density', 'default');
});

// The narrowest supported view must not turn health trends into a stack of
// isolated syllables while retaining the exact values and their labels.
for (const theme of ['light', 'dark']) {
  test(`service health metrics remain readable at 320px (${theme})`, async ({ page }) => {
    await openService(page, 320);
    await page.evaluate((theme) => (document.documentElement.dataset.theme = theme), theme);
    const metrics = await page.locator('#health .ui-stat').evaluateAll((nodes) =>
      nodes.map((node) => {
        const rect = (el) => {
          const { left, right, width, height } = el.getBoundingClientRect();
          return { left, right, width, height };
        };
        const label = rect(node.querySelector('.ui-stat__label'));
        const value = rect(node.querySelector('.ui-stat__value'));
        const note = rect(node.lastElementChild);
        return { top: node.getBoundingClientRect().top, label, value, note };
      }),
    );
    expect(metrics).toHaveLength(3);
    for (let i = 0; i < metrics.length; i++) {
      const { label, value, note } = metrics[i];
      expect(label.width).toBeGreaterThan(145);
      expect(note.width).toBeGreaterThan(145);
      expect(note.height).toBeLessThanOrEqual(25);
      expect(value.left).toBeGreaterThanOrEqual(label.right + 8);
      expect(value.right).toBeLessThanOrEqual(320);
      if (i > 0) expect(metrics[i].top).toBeGreaterThan(metrics[i - 1].top + 20);
    }
    const axe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(axe.violations).toEqual([]);
  });
}

for (const width of [320, 390, 760]) {
  test(`service controls and job dialog remain usable at ${width}px`, async ({ page }) => {
    await openService(page, width);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
    for (const control of await page
      .locator(
        '.ui-app-nav a, .service-toolbar input, .service-toolbar select, .service-actions button',
      )
      .all()) {
      const rect = await control.boundingBox();
      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.width).toBeLessThanOrEqual(width + 1);
    }
    await page.getByRole('button', { name: 'New job', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const modal = await dialog.boundingBox();
    // On phones the documented modal is a bottom sheet, not a centered box.
    expect(modal.width).toBeLessThanOrEqual(width + 1);
    expect(modal.x).toBeGreaterThanOrEqual(-1);
    for (const button of await dialog.getByRole('button').all()) {
      const box = await button.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(modal.x);
      expect(box.x + box.width).toBeLessThanOrEqual(modal.x + modal.width + 1);
      expect(box.y + box.height).toBeLessThanOrEqual(modal.y + modal.height + 1);
    }
  });
}

for (const motion of ['no-preference', 'reduce']) {
  test(`service works inside the public preview without navigating the outer page (${motion})`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: motion });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/_site/examples/operations/');
    const frame = page.frameLocator('.iframe-frame iframe');
    await expect(frame.locator('html')).toHaveAttribute('data-demo-ready', '1');
    await frame.locator('.ui-app-nav a[href="#settings"]').click();
    await expect(frame.locator('h1')).toHaveText('Settings');
    await expect(page).toHaveURL(/\/examples\/operations\/$/);
    await frame.locator('.ui-app-nav a[href="#jobs"]').click();
    await frame.getByRole('button', { name: 'New job', exact: true }).click();
    await expect(frame.getByRole('dialog')).toBeVisible();
    const workingFrame = await page.locator('.iframe-frame iframe').boundingBox();
    const header = await page.locator('.site-header').boundingBox();
    expect(workingFrame.y).toBeGreaterThanOrEqual(header.y + header.height);
    expect(workingFrame.y + workingFrame.height).toBeLessThanOrEqual(1000);

    await frame.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(frame.getByRole('dialog')).toBeHidden();
  });
}

test('service empty-state creation returns focus to a visible control', async ({ page }) => {
  await openService(page);
  await page.getByLabel('Demo scenario', { exact: true }).selectOption('error');
  await page.getByRole('button', { name: 'Retry sample load', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sync', exact: true })).toBeFocused();
  await page.getByLabel('Demo scenario', { exact: true }).selectOption('empty');
  await page.getByRole('button', { name: 'Create a sample job', exact: true }).click();
  await page.getByRole('textbox', { name: 'Job name', exact: true }).fill('empty-state-job');
  await page.getByRole('button', { name: 'Create job', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('button', { name: 'New job', exact: true })).toBeFocused();
  await expect(page.locator('#jobs tbody .service-job-name').first()).toHaveText('empty-state-job');
});

for (const [theme, width] of [
  ['light', 320],
  ['dark', 1280],
]) {
  test(`service views and job dialog have accessible composition (${theme}, ${width}px)`, async ({
    page,
  }) => {
    await openService(page, width);
    await page.evaluate((value) => {
      document.documentElement.dataset.theme = value;
    }, theme);
    const accessible = async () => {
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(result.violations).toEqual([]);
    };
    await accessible();
    if (width === 320) {
      for (const row of await page.locator('#jobs tbody tr:visible').all()) {
        await expect(row.locator('.service-job-owner')).toBeVisible();
        const name = await row.locator('.service-job-name').evaluate((el) => ({
          width: el.getBoundingClientRect().width,
          height: el.getBoundingClientRect().height,
          line: parseFloat(getComputedStyle(el).lineHeight),
        }));
        expect(name.width).toBeGreaterThanOrEqual(100);
        expect(name.height).toBeLessThanOrEqual(name.line * 2 + 1);
      }
      expect(
        await page.locator('#job-results').evaluate((el) => el.scrollWidth - el.clientWidth),
      ).toBeLessThanOrEqual(1);
    }
    await page.getByRole('button', { name: 'New job', exact: true }).click();
    await accessible();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    for (const view of ['integrations', 'settings']) {
      await page.locator(`.ui-app-nav a[href="#${view}"]`).click();
      await accessible();
    }
  });
}
