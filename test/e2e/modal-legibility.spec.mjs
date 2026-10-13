import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Modal content must stay readable while the overlay appears. Fading the
// entire dialog blends its text and button colors with the dimmed page,
// briefly driving ordinary labels under WCAG AA contrast thresholds.
// Keep motion enabled here: the rest of the suite normally reduces it.
test.use({ reducedMotion: 'no-preference' });

for (const [theme, width] of [
  ['dark', 1280],
  ['light', 320],
]) {
  test(`native modal stays opaque during its entrance (${theme}, ${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/demo/service.html');
    await expect(page.locator('html')).toHaveAttribute('data-demo-ready', '1');
    const sample = await page.evaluate(async (theme) => {
      document.documentElement.dataset.theme = theme;
      await document.fonts.ready;
      const dialog = document.querySelector('#new-job');
      dialog.showModal();
      const readings = [getComputedStyle(dialog).opacity];
      for (let i = 0; i < 4; i++) {
        await new Promise(requestAnimationFrame);
        readings.push(getComputedStyle(dialog).opacity);
      }
      return {
        readings: readings.map(Number),
        transition: getComputedStyle(dialog)
          .transitionProperty.split(',')
          .map((x) => x.trim()),
        backdropTransition: getComputedStyle(dialog, '::backdrop').transitionProperty,
      };
    }, theme);
    expect(
      sample.readings.every((opacity) => opacity >= 0.995),
      JSON.stringify(sample),
    ).toBe(true);
    expect(sample.transition).not.toContain('opacity');
    expect(sample.transition).toContain('transform');
    expect(sample.backdropTransition).toContain('opacity');

    const dialog = page.getByRole('dialog', { name: 'Create a sample job' });
    await expect(dialog).toBeVisible();
    const audit = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(audit.violations).toEqual([]);
  });
}
