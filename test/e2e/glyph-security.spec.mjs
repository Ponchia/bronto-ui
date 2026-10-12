import { test, expect } from '@playwright/test';

test('glyph HTML contains hostile labels and CSS options in every rendering mode', async ({
  page,
}) => {
  await page.goto('/demo/first-steps.html');
  const results = await page.evaluate(async () => {
    const glyphPath = new URL('/glyphs/glyphs.js', window.location.href).href;
    const { renderGlyph, renderReadout } = await import(glyphPath);
    const label =
      '\"><img src=x onerror="window.__glyphInjection=1"><svg onload="window.__glyphInjection=1">&quot;&#34;';
    const payloads = [
      '1px;position:fixed;inset:0" onmouseover="window.__glyphInjection=1',
      '1px&#59;position:fixed',
      'calc(1px + url(javascript:alert(1)))',
    ];
    return payloads.flatMap((value) => {
      const variants = [
        ['cell glyph', renderGlyph('check', { label, dot: value, gap: value })],
        ['mask glyph', renderGlyph('check', { label, render: 'mask', size: value })],
        ['cell readout', renderReadout('12', { label, dot: value, gap: value })],
        ['mask readout', renderReadout('12', { label, render: 'mask', size: value, gap: value })],
        ['text label', renderReadout(label, { render: 'mask', size: value, gap: value })],
      ];
      return variants.map(([name, html]) => {
        const host = document.createElement('div');
        host.innerHTML = html;
        document.body.append(host);
        const nodes = [...host.querySelectorAll('*')];
        const result = {
          name,
          value,
          oneWrapper: host.childElementCount === 1,
          literalLabel: host.firstElementChild?.getAttribute('aria-label') === label,
          spansOnly: nodes.every((node) => node.tagName === 'SPAN'),
          noHandlers: nodes.every((node) =>
            node.getAttributeNames().every((attr) => !attr.startsWith('on')),
          ),
          noPosition: nodes.every((node) => node.style.position === ''),
          noVisiblePayload: host.textContent === '',
        };
        host.remove();
        return result;
      });
    });
  });
  for (const { name, value, ...checks } of results) {
    expect(checks, `${name}: ${value}`).toEqual({
      oneWrapper: true,
      literalLabel: true,
      spansOnly: true,
      noHandlers: true,
      noPosition: true,
      noVisiblePayload: true,
    });
  }
  expect(await page.evaluate(() => window.__glyphInjection)).toBeUndefined();
});
