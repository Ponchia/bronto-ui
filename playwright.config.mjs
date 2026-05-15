import { defineConfig, devices } from '@playwright/test';

/**
 * Visual + a11y + cross-engine regression. Runs ONLY in the pinned
 * Playwright container (CI: mcr.microsoft.com/playwright:v1.60.0-jammy,
 * and the same image locally to author baselines) so screenshot
 * rasterisation is identical everywhere — no cross-OS font flake. The
 * committed baselines under test/e2e/__screenshots__ are Linux/Chromium.
 *
 * Pixel snapshots (visual.spec) are chromium-only — per-engine baselines
 * would be churn. The non-pixel specs (a11y / quality / behavior) also
 * run on firefox + webkit, because the real cross-browser risk for a
 * CSS-first lib is `:has()`, `color-mix()`, `<dialog>`, `:dir()` and
 * logical properties differing per engine.
 */
const NON_PIXEL = /(a11y|quality|behavior)\.spec\.mjs/;
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
