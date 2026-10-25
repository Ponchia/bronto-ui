import { test, expect } from '@playwright/test';
import { contrastRatio } from '../../scripts/lib/oklch.mjs';
import { blocking, scan } from './_demo-guards.mjs';
import { themeFrames } from './_theme-frames.mjs';

for (const reducedMotion of ['no-preference', 'reduce']) {
  test(`buttons keep readable theme-transition colours (${reducedMotion})`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion, colorScheme: 'light' });
    await page.goto('/behaviors/index.js');
    await page.setContent(`<!doctype html><html lang="en" data-theme="light">
      <head><title>Button contrast</title>
        <link rel="stylesheet" href="/dist/bronto.css">
        <style>
          html[data-test-accent="custom"][data-theme="light"] { --accent: #a8431a; }
          html[data-test-accent="custom"][data-theme="dark"] { --accent: #e8a06a; }
        </style>
      </head><body><main style="padding: 2rem">
        <h1>Button contrast</h1><button class="ui-button" type="button">Continue</button>
      </main></body></html>`);
    await page.evaluate(() => document.fonts.ready);
    const button = page.getByRole('button', { name: 'Continue' });

    for (const accent of ['default', 'custom']) {
      await page.evaluate((value) => {
        document.documentElement.dataset.testAccent = value;
      }, accent);
      for (const state of ['normal', 'hovered']) {
        if (state === 'hovered') await button.hover();
        else await page.mouse.move(0, 0);
        for (const theme of ['dark', 'light']) {
          const result = await themeFrames(button, theme);
          const frames = result.frames.map((frame) => ({
            ...frame,
            contrast: contrastRatio(frame.foregroundRgba, frame.backgroundRgba),
          }));
          await testInfo.attach(`${accent}-${state}-${theme}-transition`, {
            body: Buffer.from(JSON.stringify({ ...result, frames }, null, 2)),
            contentType: 'application/json',
          });
          expect(result.fromTheme).toBe(theme === 'dark' ? 'light' : 'dark');
          expect(result.toTheme).toBe(theme);
          if (accent === 'custom') {
            expect(result.accent).toBe(theme === 'dark' ? '#e8a06a' : '#a8431a');
          }
          expect(frames.map((frame) => frame.progress)).toEqual([
            'before',
            'start',
            0,
            0.125,
            0.25,
            0.375,
            0.5,
            0.625,
            0.75,
            0.875,
            1,
          ]);
          expect(frames[0].foregroundRgba).not.toEqual(frames.at(-1).foregroundRgba);
          expect(frames[0].backgroundRgba).not.toEqual(frames.at(-1).backgroundRgba);
          if (reducedMotion === 'no-preference') {
            // The retained border animation witnesses real clock sampling.
            // A missing stylesheet, skipped transition or endpoint-only sample
            // must not silently turn this regression test green. Reduced motion
            // may legitimately elide its sub-frame transition altogether.
            expect(
              result.transitions.some(
                ({ property, duration }) => property?.startsWith('border-') && duration > 0,
              ),
            ).toBe(true);
            const firstBorder = JSON.stringify(frames[0].borderRgba);
            const lastBorder = JSON.stringify(frames.at(-1).borderRgba);
            expect(
              frames.some(
                (frame) =>
                  typeof frame.progress === 'number' &&
                  frame.progress > 0 &&
                  frame.progress < 1 &&
                  JSON.stringify(frame.borderRgba) !== firstBorder &&
                  JSON.stringify(frame.borderRgba) !== lastBorder,
              ),
            ).toBe(true);
          }
          for (const frame of frames) {
            const context = `${accent}/${state}/${theme} at ${frame.progress}: ${frame.foreground} on ${frame.background}`;
            expect(frame.opacity, context).toBe('1');
            expect(frame.foregroundRgba[3], context).toBe(255);
            expect(frame.backgroundRgba[3], context).toBe(255);
            expect(frame.contrast, context).toBeGreaterThanOrEqual(4.5);
          }
          const results = await scan(page).analyze();
          expect(blocking(results), JSON.stringify(blocking(results))).toEqual([]);
        }
      }
    }
  });
}
