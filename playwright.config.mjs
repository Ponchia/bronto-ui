import { defineConfig, devices } from '@playwright/test';

/**
 * Visual + a11y + cross-engine regression. Runs ONLY in the pinned
 * Playwright container (CI: mcr.microsoft.com/playwright:v1.60.0-jammy,
 * and the same image locally to author baselines) so screenshot
 * rasterisation is identical everywhere — no cross-OS font flake. The
 * committed baselines under test/e2e/__screenshots__ are Linux/Chromium.
 *
 * Pixel snapshots (visual.spec) are chromium-only — per-engine baselines
 * would be churn. EVERY other spec (a11y, quality, behavior, motion, and
 * the data-viz/frontier primitives — marks, legends, connectors, crosshair,
 * spotlight, selection, annotations, modes, report …) runs on firefox +
 * webkit too, because the real cross-browser risk for a CSS-first lib is
 * `:has()`, `color-mix()`, `<dialog>`, `:dir()`, logical properties,
 * `@starting-style`/`allow-discrete` and scroll-driven/view transitions
 * differing per engine. This is a denylist (everything but visual.spec), so
 * a new behavior spec gets cross-engine coverage automatically — no edit
 * here. Genuinely Chromium-only assertions (e.g. `page.pdf()`) guard
 * themselves with `test.skip(browserName !== 'chromium', …)`.
 */
const NON_PIXEL = /[/\\](?!visual\.spec\.mjs)[^/\\]+\.spec\.mjs$/;
export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  expect: {
    // Flat monochrome UI: tiny tolerance absorbs sub-pixel AA only.
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled' },
  },
  use: {
    baseURL: 'http://127.0.0.1:8123',
    reducedMotion: 'reduce',
    colorScheme: 'no-preference',
  },
  projects: [
    // chromium runs everything, including the pixel snapshots + baselines.
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // firefox/webkit run only the engine-agnostic specs.
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, testMatch: NON_PIXEL },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, testMatch: NON_PIXEL },
  ],
  webServer: {
    command: 'node scripts/serve.mjs 8123',
    url: 'http://127.0.0.1:8123/demo/',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
  },
});
