import AxeBuilder from '@axe-core/playwright';

/**
 * Shared quality/a11y guards for the per-feature demo pages.
 *
 * The main `/demo/` kitchen sink is gated by quality.spec + a11y.spec; the
 * smaller feature demos (the analytical primitives, the report, the theme
 * playground) had no console/pageerror/bad-response listener or axe scan, so a
 * script that threw on load or a 404 asset on those SVG-heavy pages would not
 * fail CI. These helpers factor the listener + scan so demos.spec can sweep
 * them with the same rigor.
 */

// The browser implicitly requests /favicon.ico; the demos intentionally ship
// none. That 404 is not a defect.
export const ignored = (url) => url.endsWith('/favicon.ico');

/** Attach console-error / uncaught-exception / failed-response collectors. */
export function attachGuards(page) {
  const consoleErrors = [];
  const pageErrors = [];
  const badResponses = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('response', (r) => {
    if (r.status() >= 400 && !ignored(r.url())) badResponses.push(`${r.status()} ${r.url()}`);
  });
  return { consoleErrors, pageErrors, badResponses };
}

// Canonical axe config for every demo/specimen scan (a11y.spec + the per-feature
// leaf specs all route through `scan`/`blocking` so the rule set can't drift).
// `best-practice` is included so the structural issues Lighthouse flags (these are
// axe rules too) are gated per theme with zero extra deps. Best-practice rules are
// often `moderate` impact, so they'd slip past the serious/critical filter — the
// curated STRUCTURAL set is therefore always blocking regardless of impact.
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];
const STRUCTURAL = new Set([
  'heading-order',
  'landmark-one-main',
  'landmark-unique',
  'landmark-no-duplicate-banner',
  'landmark-no-duplicate-contentinfo',
  'region',
  'scrollable-region-focusable',
  'duplicate-id',
  'tabindex',
]);

/** Canonical blocking filter: serious/critical + the curated STRUCTURAL set. */
export function blocking(results) {
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical' || STRUCTURAL.has(v.id))
    .map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => ({ target: n.target, msg: n.failureSummary })),
    }));
}

/** Settle fonts + a composited frame before axe samples pixels. */
export async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
}

export const scan = (page) => new AxeBuilder({ page }).withTags(TAGS).exclude('.ui-dotfield');
