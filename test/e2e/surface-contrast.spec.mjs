import { test, expect } from '@playwright/test';
import { contrastRatio } from '../../scripts/lib/oklch.mjs';
import { themeFrames } from './_theme-frames.mjs';

const markup = `<article class="ui-card" id="card">
  <h2 class="ui-eyebrow">Workspace</h2><p>Project overview</p><p class="ui-muted">Ready for review</p>
</article>
<label class="ui-field"><span class="ui-label">Name</span><input id="input" class="ui-input" value="Daily report"></label>
<label class="ui-field"><span class="ui-label">Plot</span><select id="select" class="ui-select"><option>Bars</option></select></label>
<label class="ui-field"><span class="ui-label">Details</span><textarea id="textarea" class="ui-textarea">Report notes</textarea></label>`;

for (const [surface, selectors] of [
  ['card', ['p:not(.ui-muted)', '.ui-muted', '.ui-eyebrow']],
  ['input', [undefined]],
  ['select', [undefined]],
  ['textarea', [undefined]],
]) {
  for (const reducedMotion of ['no-preference', 'reduce']) {
    test(`${surface} text stays readable during theme changes (${reducedMotion})`, async ({
      page,
    }, info) => {
      await page.emulateMedia({ reducedMotion, colorScheme: 'light' });
      await page.goto('/behaviors/index.js');
      await page.setContent(`<!doctype html><html lang="en" data-theme="light"><head>
        <title>Surface contrast</title><link rel="stylesheet" href="/dist/bronto.css">
      </head><body><main class="ui-stack" style="padding:2rem"><h1>Surface contrast</h1>${markup}</main></body></html>`);
      await page.evaluate(() => document.fonts.ready);
      for (const selector of selectors) {
        for (const theme of ['dark', 'light']) {
          const result = await themeFrames(page.locator(`#${surface}`), theme, selector);
          const frames = result.frames.map((frame) => ({
            ...frame,
            contrast: contrastRatio(frame.foregroundRgba, frame.backgroundRgba),
          }));
          await info.attach(`${surface}-${selector || 'value'}-${theme}`, {
            body: Buffer.from(JSON.stringify({ ...result, frames }, null, 2)),
            contentType: 'application/json',
          });
          expect(result.fromTheme).toBe(theme === 'dark' ? 'light' : 'dark');
          expect(result.toTheme).toBe(theme);
          expect(frames[0].foregroundRgba).not.toEqual(frames.at(-1).foregroundRgba);
          expect(frames[0].backgroundRgba).not.toEqual(frames.at(-1).backgroundRgba);
          if (reducedMotion === 'no-preference')
            expect(
              result.transitions.some(
                ({ property, duration }) => property?.startsWith('border-') && duration > 0,
              ),
            ).toBe(true);
          for (const frame of frames) {
            const label = `${surface}/${selector || 'value'}/${theme}/${frame.progress}: ${frame.foreground} on ${frame.background}`;
            expect(frame.foregroundRgba[3], label).toBe(255);
            expect(frame.backgroundRgba[3], label).toBe(255);
            expect(frame.contrast, label).toBeGreaterThanOrEqual(4.5);
          }
        }
      }
    });
  }
}
