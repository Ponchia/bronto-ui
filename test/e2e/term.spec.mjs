import { test, expect } from '@playwright/test';

async function open(page) {
  await page.goto('/demo/term.html', { waitUntil: 'networkidle' });
}

test('term is a keyboard/touch-reachable button wired to a native popover', async ({ page }) => {
  await open(page);
  const term = page.locator('.ui-term').first();

  // The abbr[title] fix: the term is a real <button> with a popovertarget.
  await expect(term).toHaveJSProperty('tagName', 'BUTTON');
  const target = await term.getAttribute('popovertarget');
  expect(target).toBeTruthy();

  // Native popover: the definition is hidden until the term is activated.
  const def = page.locator(`#${target}`);
  await expect(def).toBeHidden();
  await term.click();
  await expect(def).toBeVisible();
});

test('term popover opens from the keyboard and closes on Escape', async ({ page }) => {
  await open(page);
  const term = page.locator('.ui-term').first();
  const target = await term.getAttribute('popovertarget');
  const def = page.locator(`#${target}`);

  await term.focus();
  await page.keyboard.press('Enter');
  await expect(def).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(def).toBeHidden();
});

test('the glossary collects terms as a <dl>', async ({ page }) => {
  await open(page);
  const glossary = page.locator('.ui-glossary');
  await expect(glossary).toBeVisible();
  await expect(glossary.locator('.ui-glossary__term').first()).toBeVisible();
  await expect(glossary.locator('.ui-glossary__def').first()).toBeVisible();
});
