import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];
const VARIANTS = [
  'label',
  'callout',
  'elbow',
  'curve',
  'circle',
  'rect',
  'threshold',
  'badge',
  'bracket',
  'band',
  'slope',
  'compare',
  'cluster',
  'axis',
  'timeline',
  'evidence',
];

const STRUCTURAL = new Set([
  'heading-order',
  'landmark-one-main',
  'landmark-unique',
  'region',
  'scrollable-region-focusable',
  'duplicate-id',
  'tabindex',
]);

function blocking(results) {
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical' || STRUCTURAL.has(v.id))
    .map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => ({ target: n.target, msg: n.failureSummary })),
    }));
}

async function openSpecimen(page, theme = 'light') {
  await page.goto('/demo/annotations.html', { waitUntil: 'networkidle' });
  await page.evaluate(async (t) => {
    document.documentElement.dataset.theme = t;
    await document.fonts.ready;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, theme);
}

for (const theme of ['light', 'dark']) {
  test(`annotation specimen is accessible and complete (${theme})`, async ({ page }) => {
    await openSpecimen(page, theme);

    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(blocking(results), JSON.stringify(blocking(results), null, 2)).toEqual([]);

    const specimen = page.locator('[data-annotation-specimen]');
    await expect(specimen).toHaveCount(1);
    await expect(page.locator('.annotation-applied .ui-annotation')).toHaveCount(7);
    await expect(specimen.locator('.ui-annotation')).toHaveCount(VARIANTS.length);
    for (const variant of VARIANTS) {
      await expect(specimen.locator(`.ui-annotation--${variant}`)).toHaveCount(1);
    }

    await expect(specimen.locator('.ui-annotation--draw')).toHaveCount(1);
    await expect(specimen.locator('.ui-annotation--reveal')).toHaveCount(1);
    await expect(specimen.locator('.ui-annotation--pulse')).toHaveCount(1);
    await expect(specimen.locator('.ui-annotation--focus')).toHaveCount(1);
    await expect(specimen.locator('.ui-annotation__title')).toHaveCount(VARIANTS.length);
    await expect(page.locator('.ui-chart__fallback table tbody tr')).toHaveCount(VARIANTS.length);

    const geometry = await page.evaluate(() => {
      const specimen = document.querySelector('[data-annotation-specimen]');
      const notes = [...specimen.querySelectorAll('.ui-annotation__title, .ui-annotation__label')];
      const connectors = [...specimen.querySelectorAll('.ui-annotation__connector')];
      const firstConnector = connectors[0];
      const overlapCount = (root) => {
        const rects = [...root.querySelectorAll('.ui-annotation__note > rect')].map((n) => {
          const box = n.getBoundingClientRect();
          return { left: box.left, top: box.top, right: box.right, bottom: box.bottom };
        });
        const overlaps = [];
        for (let i = 0; i < rects.length; i += 1) {
          for (let j = i + 1; j < rects.length; j += 1) {
            const x = Math.max(
              0,
              Math.min(rects[i].right, rects[j].right) - Math.max(rects[i].left, rects[j].left),
            );
            const y = Math.max(
              0,
              Math.min(rects[i].bottom, rects[j].bottom) - Math.max(rects[i].top, rects[j].top),
            );
            if (x * y > 4) overlaps.push([i, j]);
          }
        }
        return overlaps.length;
      };
      const appliedRoot = document.querySelector('.annotation-demo__examples');
      const specimenBox = specimen.getBoundingClientRect();
      const scrollRegion = document.querySelector('.annotation-specimen-scroll');
      const scrollBox = scrollRegion.getBoundingClientRect();
      const firstSubject = specimen.querySelector('.ui-annotation--circle .ui-annotation__subject');
      const firstConnectorDash = getComputedStyle(
        specimen.querySelector('.ui-annotation--draw .ui-annotation__connector'),
      ).strokeDasharray;
      const subjectDash = getComputedStyle(firstSubject).strokeDasharray;
      return {
        specimenWidth: specimenBox.width,
        scrollRegionWidth: scrollBox.width,
        textBoxes: notes.map((n) => {
          const box = n.getBoundingClientRect();
          return { width: box.width, height: box.height };
        }),
        emptyConnectors: connectors.filter((n) => !n.getAttribute('d')).length,
        connectorEffect: getComputedStyle(firstConnector).vectorEffect,
        noteRectOverlaps: overlapCount(specimen),
        appliedNoteRectOverlaps: overlapCount(appliedRoot),
        subjectDash,
        firstConnectorDash,
      };
    });

    expect(geometry.specimenWidth).toBeGreaterThan(600);
    expect(geometry.scrollRegionWidth).toBeGreaterThan(600);
    expect(geometry.textBoxes.every((box) => box.width > 0 && box.height > 0)).toBe(true);
    expect(geometry.emptyConnectors).toBe(0);
    expect(geometry.connectorEffect).toBe('non-scaling-stroke');
    expect(geometry.noteRectOverlaps).toBe(0);
    expect(geometry.appliedNoteRectOverlaps).toBe(0);
    expect(geometry.subjectDash).toContain('0.01');
    expect(geometry.firstConnectorDash).not.toContain('0.01');
  });
}

test('annotation specimen scopes mobile overflow to the specimen scroller', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openSpecimen(page, 'light');
  const overflow = await page.evaluate(() => {
    const scrollRegion = document.querySelector('.annotation-specimen-scroll');
    return {
      pageOverflow: document.documentElement.scrollWidth - window.innerWidth,
      specimenOverflow: scrollRegion.scrollWidth - scrollRegion.clientWidth,
    };
  });

  expect(overflow.pageOverflow).toBe(0);
  expect(overflow.specimenOverflow).toBeGreaterThan(100);
});

test('annotation specimen renders a non-empty visual surface', async ({ page }) => {
  await openSpecimen(page, 'light');
  const shot = await page.locator('[data-annotation-specimen]').screenshot();
  expect(shot.length).toBeGreaterThan(30_000);
});
