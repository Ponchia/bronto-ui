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
    if (r.status() >= 400) badResponses.push(`${r.status()} ${r.url()}`);
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

/** Settle fonts, finite transitions, and a composited frame before axe samples pixels. */
export async function settleVisualState(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;

    const isFiniteTransition = (animation) => {
      const timing = animation.effect?.getTiming?.();
      if (!timing) return false;
      const duration = Number(timing.duration);
      const delay = Number(timing.delay);
      const endDelay = Number(timing.endDelay);
      const iterations = Number(timing.iterations ?? 1);
      const total = duration * iterations + delay + endDelay;
      return (
        animation.playState !== 'finished' &&
        animation.playState !== 'idle' &&
        Number.isFinite(duration) &&
        Number.isFinite(delay) &&
        Number.isFinite(endDelay) &&
        Number.isFinite(iterations) &&
        total > 0
      );
    };

    const animations =
      typeof document.getAnimations === 'function'
        ? document.getAnimations({ subtree: true }).filter(isFiniteTransition)
        : [];
    if (animations.length) {
      await Promise.race([
        Promise.allSettled(animations.map((animation) => animation.finished.catch(() => {}))),
        new Promise((resolve) => setTimeout(resolve, 500)),
      ]);
    }

    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
}

/** Settle feature demos before guard/axe checks. */
export async function settle(page) {
  await settleVisualState(page);
}

/**
 * Browser-native structural smoke for the demo pages.
 *
 * Axe catches the accessibility tree; console guards catch thrown errors and
 * 404s. This catches lower-level DOM/SVG defects that can still render badly:
 * broken aria ID references, duplicate IDs, broken images, empty-name visible
 * buttons/form controls, mobile page overflow, and NaN/Infinity leaking into
 * SVG/CSS geometry attributes.
 */
export async function structuralIssues(page) {
  return page.evaluate(() => {
    const issues = [];
    const visible = (el) => {
      const box = el.getBoundingClientRect();
      if (box.width <= 0 || box.height <= 0) return false;
      const style = getComputedStyle(el);
      return (
        style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0
      );
    };

    const brokenAria = [];
    for (const el of document.querySelectorAll(
      '[aria-controls], [aria-labelledby], [aria-describedby]',
    )) {
      for (const attr of ['aria-controls', 'aria-labelledby', 'aria-describedby']) {
        const value = el.getAttribute(attr);
        if (!value) continue;
        for (const id of value.trim().split(/\s+/)) {
          if (id && !document.getElementById(id)) {
            brokenAria.push(`${attr}="${id}" on <${el.tagName.toLowerCase()}>`);
          }
        }
      }
    }
    if (brokenAria.length) issues.push(`broken ARIA references: ${brokenAria.join('; ')}`);

    const ids = new Map();
    for (const el of document.querySelectorAll('[id]')) {
      ids.set(el.id, (ids.get(el.id) || 0) + 1);
    }
    const duplicateIds = [...ids].filter(([, count]) => count > 1);
    if (duplicateIds.length) {
      issues.push(
        `duplicate IDs: ${duplicateIds.map(([id, count]) => `${id}×${count}`).join(', ')}`,
      );
    }

    const badGeometry = [];
    for (const el of document.querySelectorAll(
      'svg, path, line, polyline, polygon, rect, circle, ellipse, text, [style], [transform]',
    )) {
      for (const attr of el.attributes || []) {
        if (/\b(?:NaN|Infinity|-Infinity)\b/.test(attr.value)) {
          badGeometry.push(`<${el.tagName.toLowerCase()}> ${attr.name}="${attr.value}"`);
        }
      }
    }
    if (badGeometry.length) {
      issues.push(`non-finite SVG/CSS geometry: ${badGeometry.slice(0, 8).join('; ')}`);
    }

    const brokenImages = [...document.images]
      .filter((img) => img.complete && img.naturalWidth === 0)
      .map((img) => img.currentSrc || img.src || img.getAttribute('src') || '<empty src>');
    if (brokenImages.length) issues.push(`broken images: ${brokenImages.join(', ')}`);

    const namelessButtons = [...document.querySelectorAll('button, [role="button"]')]
      .filter(visible)
      .filter((el) => !(el.getAttribute('aria-label') || el.title || el.textContent || '').trim())
      .map((el) => el.outerHTML.replace(/\s+/g, ' ').slice(0, 160));
    if (namelessButtons.length) {
      issues.push(`visible nameless buttons: ${namelessButtons.join('; ')}`);
    }

    const controlHasName = (el) => {
      if ((el.getAttribute('aria-label') || el.title || '').trim()) return true;

      const labelledBy = (el.getAttribute('aria-labelledby') || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      if (
        labelledBy.length &&
        labelledBy
          .map((id) => document.getElementById(id)?.textContent || '')
          .join(' ')
          .trim()
      ) {
        return true;
      }

      if (
        el.id &&
        [...document.querySelectorAll('label')].some(
          (label) => label.htmlFor === el.id && label.textContent.trim(),
        )
      ) {
        return true;
      }

      const parentLabel = el.closest('label');
      if (parentLabel?.textContent.trim()) return true;

      if (
        el.tagName === 'INPUT' &&
        ['button', 'submit', 'reset'].includes((el.getAttribute('type') || 'text').toLowerCase())
      ) {
        return Boolean((el.getAttribute('value') || '').trim());
      }

      return false;
    };
    const namelessControls = [...document.querySelectorAll('input, select, textarea')]
      .filter((el) => (el.getAttribute('type') || '').toLowerCase() !== 'hidden')
      .filter(visible)
      .filter((el) => !controlHasName(el))
      .map((el) => el.outerHTML.replace(/\s+/g, ' ').slice(0, 160));
    if (namelessControls.length) {
      issues.push(`visible nameless form controls: ${namelessControls.join('; ')}`);
    }

    if (window.innerWidth <= 480) {
      const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
      const overflow = Math.ceil(document.documentElement.scrollWidth - viewportWidth);
      if (overflow > 2) {
        const label = (el) => {
          const id = el.id ? `#${el.id}` : '';
          const classes = (el.getAttribute('class') || '')
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 3)
            .map((name) => `.${name}`)
            .join('');
          return `<${el.tagName.toLowerCase()}${id}${classes}>`;
        };
        const clippedByAncestor = (el) => {
          const rect = el.getBoundingClientRect();
          for (let parent = el.parentElement; parent; parent = parent.parentElement) {
            const { overflowX } = getComputedStyle(parent);
            if (!/^(auto|scroll|hidden|clip)$/.test(overflowX)) continue;
            const parentRect = parent.getBoundingClientRect();
            if (rect.left < parentRect.left - 1 || rect.right > parentRect.right + 1) {
              return true;
            }
          }
          return false;
        };
        const offenders = [...document.querySelectorAll('body, body *')]
          .filter(visible)
          .map((el) => ({ el, rect: el.getBoundingClientRect() }))
          .filter(({ el, rect }) => rect.right > viewportWidth + 2 && !clippedByAncestor(el))
          .sort((a, b) => b.rect.right - a.rect.right)
          .slice(0, 5)
          .map(({ el, rect }) => `${label(el)} right=${Math.round(rect.right)}px`);
        issues.push(
          `horizontal page overflow at ${viewportWidth}px viewport: ${overflow}px${
            offenders.length ? `; offenders: ${offenders.join(', ')}` : ''
          }`,
        );
      }
    }

    return issues;
  });
}

export const scan = (page) => new AxeBuilder({ page }).withTags(TAGS).exclude('.ui-dotfield');
