import { defineConfig, devices } from '@playwright/test';

/**
 * Visual + a11y regression. Runs ONLY in the pinned Playwright container
 * (CI: mcr.microsoft.com/playwright:v1.60.0-jammy, and the same image
 * locally to author baselines) so screenshot rasterisation is identical
 * everywhere — no cross-OS font flake. The committed baselines under
 * test/e2e/__screenshots__ are Linux/Chromium from that image.
 */
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
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node scripts/serve.mjs 8123',
    url: 'http://127.0.0.1:8123/demo/',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
  },
});
