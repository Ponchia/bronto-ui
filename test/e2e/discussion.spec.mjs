import { expect, test } from '@playwright/test';

test('discussion rows wrap in a narrow parent and local replies reopen the thread', async ({
  page,
}) => {
  await page.goto('/demo/discussion.html');
  const narrow = page.locator('.discussion-narrow');
  expect(await narrow.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.getByRole('button', { name: 'Resolve', exact: true }).click();
  await expect(page.locator('[data-thread-state]')).toHaveText('Resolved · passage attached');
  await page
    .getByRole('textbox', { name: 'Reply', exact: true })
    .fill('Include a rollback example.');
  await page.getByRole('button', { name: 'Post reply', exact: true }).click();
  await expect(page.locator('[data-messages]')).toContainText('Include a rollback example.');
  await expect(page.locator('[data-thread-state]')).toHaveText('Open · passage attached');
  await expect(page.getByRole('textbox', { name: 'Reply', exact: true })).toBeFocused();
});
