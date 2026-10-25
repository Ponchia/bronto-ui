import { test, expect } from '@playwright/test';

// A lazy iframe can be interactive before its load event. Hold an inert image,
// not JavaScript, to exercise the gap between usable DOM and completed load.
async function loadingPreview(page) {
  let releaseDocument;
  let releaseImage;
  const documentGate = new Promise((resolve) => {
    releaseDocument = resolve;
  });
  const imageGate = new Promise((resolve) => {
    releaseImage = resolve;
  });
  await page.route('**/demo/service.html', async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      '</body>',
      '<img src="/__preview-load.png" alt="" hidden></body>',
    );
    await documentGate;
    await route.fulfill({ response, body });
  });
  await page.route('**/__preview-load.png', async (route) => {
    await imageGate;
    await route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>',
    });
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/_site/examples/operations/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-theme-toggle]')).toBeVisible();
  releaseDocument();
  const frame = page.frameLocator('.iframe-frame iframe');
  await expect(frame.locator('html')).toHaveAttribute('data-demo-ready', '1');
  expect(await frame.locator('html').evaluate((node) => node.ownerDocument.readyState)).not.toBe(
    'complete',
  );
  return { frame, releaseImage };
}

async function expectWorkingFrame(page) {
  await expect
    .poll(async () => {
      const box = await page.locator('.iframe-frame iframe').boundingBox();
      const header = await page.locator('.site-header').boundingBox();
      return {
        belowHeader: box.y >= header.y + header.height,
        insideViewport: box.y + box.height <= 1000,
      };
    })
    .toEqual({ belowHeader: true, insideViewport: true });
}

for (const input of ['pointer', 'keyboard']) {
  test(`preview reveals a dialog opened before iframe load (${input})`, async ({ page }) => {
    const { frame, releaseImage } = await loadingPreview(page);
    try {
      const opener = frame.getByRole('button', { name: 'New job', exact: true });
      if (input === 'pointer') await opener.click();
      else {
        await opener.focus();
        await opener.press('Enter');
      }
      await expect(frame.getByRole('dialog')).toBeVisible();
      await expectWorkingFrame(page);
      await frame.getByRole('button', { name: 'Cancel', exact: true }).click();
      await expect(frame.getByRole('dialog')).toBeHidden();
      await expect(opener).toBeFocused();
    } finally {
      releaseImage();
    }
  });
}

test('preview reveals an already-open dialog when its load handler attaches', async ({ page }) => {
  const { frame, releaseImage } = await loadingPreview(page);
  try {
    await frame.locator('dialog').evaluate((node) => node.setAttribute('open', ''));
    await expect(frame.getByRole('dialog')).toBeVisible();
    releaseImage();
    await expect
      .poll(() => frame.locator('html').evaluate((node) => node.ownerDocument.readyState))
      .toBe('complete');
    await expectWorkingFrame(page);
  } finally {
    releaseImage();
  }
});

test('preview keeps observing dialogs across a persisted pagehide', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/_site/examples/operations/');
  const frame = page.frameLocator('.iframe-frame iframe');
  await expect(frame.locator('html')).toHaveAttribute('data-demo-ready', '1');
  await expect
    .poll(() => frame.locator('html').evaluate((node) => node.ownerDocument.readyState))
    .toBe('complete');
  await frame.locator('html').evaluate((node) => {
    const view = node.ownerDocument.defaultView;
    view.dispatchEvent(new view.PageTransitionEvent('pagehide', { persisted: true }));
  });
  await frame.getByRole('button', { name: 'New job', exact: true }).click();
  await expect(frame.getByRole('dialog')).toBeVisible();
  await expectWorkingFrame(page);
});
