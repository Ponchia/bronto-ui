import { test, expect } from '@playwright/test';
import { attachGuards, blocking, scan, settle } from './_demo-guards.mjs';

/**
 * Coverage for the per-feature demo pages. The main `/demo/` kitchen sink is
 * gated by quality.spec + a11y.spec; the feature specs (annotations, legends,
 * marks, connectors, spotlight, crosshair, selection, report) assert geometry
 * but never listened for console errors, uncaught exceptions, failed network
 * requests, or ran axe — so a throw on load or a 404 asset on these SVG-heavy
 * pages would not fail CI. This sweeps them with the shared guards in both
 * themes. Engine-agnostic (no pixels), so it also runs cross-browser.
 */

// Pages that are component/figure showcases — full console + axe sweep.
const SHOWCASE = [
  'annotations',
  'legends',
  'marks',
  'connectors',
  'spotlight',
  'crosshair',
  'selection',
  'sources',
  'state',
  'generated',
  'workbench',
  'command',
  'report',
  'version-history-report',
];

// The theme playground is a dev instrument whose colour swatches paint white
// labels with `mix-blend-mode: difference` — a contrast channel axe cannot
// evaluate (it would read white-on-swatch and false-fail). Guard it for
// errors/404s, but don't axe-scan it.
const GUARD_ONLY = ['theme-playground'];

for (const theme of ['dark', 'light']) {
  for (const demo of SHOWCASE) {
    test(`demo ${demo} — clean + axe (${theme})`, async ({ page }) => {
      const guards = attachGuards(page);
      await page.addInitScript((t) => {
        try {
          localStorage.setItem('bronto-theme', t);
        } catch {
          /* ignore */
        }
      }, theme);
      await page.goto(`/demo/${demo}.html`, { waitUntil: 'networkidle' });
      // The standalone demo pages hard-code data-theme="light" and do not
      // restore from localStorage, so the seed above is a no-op for them —
      // force the attribute to genuinely exercise both themes (otherwise the
      // "dark" pass silently re-scans light mode).
      await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await settle(page);

      const { consoleErrors, pageErrors, badResponses } = guards;
      expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
      expect(pageErrors, pageErrors.join('\n')).toEqual([]);
      expect(badResponses, badResponses.join('\n')).toEqual([]);

      const results = await scan(page).analyze();
      expect(blocking(results), JSON.stringify(blocking(results), null, 2)).toEqual([]);
    });
  }

  for (const demo of GUARD_ONLY) {
    test(`demo ${demo} — clean (${theme})`, async ({ page }) => {
      const guards = attachGuards(page);
      await page.addInitScript((t) => {
        try {
          localStorage.setItem('bronto-theme', t);
        } catch {
          /* ignore */
        }
      }, theme);
      await page.goto(`/demo/${demo}.html`, { waitUntil: 'networkidle' });
      await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);

      const { consoleErrors, pageErrors, badResponses } = guards;
      expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
      expect(pageErrors, pageErrors.join('\n')).toEqual([]);
      expect(badResponses, badResponses.join('\n')).toEqual([]);
    });
  }
}
