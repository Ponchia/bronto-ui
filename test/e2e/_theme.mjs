/**
 * Apply a theme to a standalone leaf demo and let it settle before assertions.
 *
 * The leaf demos ship a static `data-theme="light"`; flipping it post-load
 * fades the theme-driven colours via CSS transitions. axe samples *computed*
 * colours, so a mid-fade frame can read as a (false) `color-contrast`
 * violation — a race Firefox/WebKit timing intermittently expose. We wait for
 * fonts + every FINITE animation to finish (skipping infinite idle decor so we
 * never hang) so colours are final when axe — or any colour probe — runs.
 *
 * @param {import('@playwright/test').Page} page
 * @param {'light'|'dark'} theme
 */
export async function applyTheme(page, theme) {
  await page.emulateMedia({ colorScheme: theme });
  await page.evaluate(async (t) => {
    document.documentElement.setAttribute('data-theme', t);
    await document.fonts.ready;
    await Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming?.().iterations !== Infinity)
        .map((a) => a.finished.catch(() => {})),
    );
  }, theme);
}
