/**
 * Wait for the main showcase (`/demo/`) to finish its synchronous wiring.
 *
 * `demo/index.js` is an external module that builds content (glyph gallery,
 * command list, …) on load and then sets `data-demo-ready="1"` on <html>.
 * Waiting on that flag is deterministic, unlike `networkidle` + a fixed
 * `waitForTimeout`, which raced the JS-built sections (the glyphs screenshot
 * went "not stable", the sortable-table behaviour wasn't wired yet). Pair with
 * `document.fonts.ready` where pixel stability also depends on the webfont.
 *
 * @param {import('@playwright/test').Page} page
 */
export async function awaitDemoReady(page) {
  await page.waitForFunction(() => document.documentElement.dataset.demoReady === '1', null, {
    timeout: 15_000,
  });
}
