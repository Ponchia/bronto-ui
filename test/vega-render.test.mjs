/**
 * Render-probe for the Vega theme config (tokens/vega.js).
 *
 * The structural gate (scripts/check-vega.mjs) proves the config is well-formed
 * and fully resolved, but NOT that the slots map to the elements we think they
 * do. This probe closes that gap the only honest way: compile a real Vega-Lite
 * spec with `brontoVegaConfig()`, render it headless to SVG through the actual
 * Vega runtime (dev-only deps), and assert the resolved bronto colours land on
 * the rendered marks + chrome. It is the data-viz analogue of rendering a
 * Mermaid/D2 sentinel to verify a foreign theme-slot → element mapping.
 *
 * Assertions are ATTRIBUTE-scoped (`fill="#hex"` / `stroke="#hex"`), not bare
 * substring matches: Vega emits colours as attributes on the mark/axis elements
 * (no <style> block), so this proves the colour is on an element, not merely
 * present somewhere. A format guard fails loudly if a future Vega switches to
 * `rgb(...)` output (which would silently dodge a hex match), and a cross-theme
 * absence check catches a light↔dark swap.
 *
 * vega/vega-lite are devDependencies (SVG rendering needs no native canvas).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as vega from 'vega';
import * as vegaLite from 'vega-lite';
import { brontoVegaConfig } from '../tokens/vega.js';

/** Compile a Vega-Lite spec + render it to an SVG string through Vega, headless. */
async function renderSvg(spec) {
  const vgSpec = vegaLite.compile(spec).spec;
  const view = new vega.View(vega.parse(vgSpec), { renderer: 'none' });
  await view.runAsync();
  const svg = await view.toSVG();
  view.finalize();
  return svg;
}

/** Count `attr="value"` occurrences without a regex; inputs are fixed test literals. */
function countAttr(svg, attr, value) {
  const haystack = svg.toLowerCase();
  const needle = `${attr}="${value}"`.toLowerCase();
  let count = 0;
  for (
    let i = haystack.indexOf(needle);
    i !== -1;
    i = haystack.indexOf(needle, i + needle.length)
  ) {
    count++;
  }
  return count;
}

const barSpec = (config, color) => ({
  $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
  width: 200,
  height: 120,
  data: {
    values: [
      { c: 'a', v: 3 },
      { c: 'b', v: 5 },
      { c: 'd', v: 2 },
    ],
  },
  mark: 'bar',
  encoding: {
    x: { field: 'c', type: 'nominal' },
    y: { field: 'v', type: 'quantitative' },
    ...(color ? { color: { field: 'c', type: 'nominal' } } : {}),
  },
  config,
});

const heatSpec = (config) => ({
  $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
  width: 120,
  height: 60,
  data: {
    values: [
      { x: 'a', y: 'p', v: 0 },
      { x: 'b', y: 'p', v: 100 },
    ],
  },
  mark: 'rect',
  encoding: {
    x: { field: 'x', type: 'nominal' },
    y: { field: 'y', type: 'nominal' },
    color: { field: 'v', type: 'quantitative' }, // quantitative → range.heatmap (sequential)
  },
  config,
});

test('light: categorical range lands on marks; chrome + format are right', async () => {
  const svg = await renderSvg(barSpec(brontoVegaConfig('light'), true));
  // range.category[0..2] — blue, orange, aqua, as fills.
  assert.ok(countAttr(svg, 'fill', '#2a78d6') >= 1, 'series 1 from range.category');
  assert.ok(countAttr(svg, 'fill', '#eb6834') >= 1, 'series 2 from range.category');
  assert.ok(countAttr(svg, 'fill', '#1baf7a') >= 1, 'series 3 from range.category (beyond [0..1])');
  // axis/rule neutral line (--line-strong; shared by domain/tick — presence is enough).
  assert.match(svg, /stroke="#a8a8a2"/i, '--line-strong on the axis strokes');
  // Format guard: colours are emitted as hex attributes. If a future Vega emits
  // rgb(...)/named colours instead, every hex assertion would silently pass-or-
  // fail wrongly — fail loudly here instead.
  assert.match(svg, /fill="#[0-9a-f]{6}"/i, 'Vega still emits hex fill attributes');
});

test('light: single-series bar isolates mark.color = the first hue (exactly the bars)', async () => {
  // No `color` encoding → no legend, no per-series scale: every bar is the
  // default mark colour. So an exact count proves mark.color (not range.category)
  // and that nothing else accidentally took that hue.
  const svg = await renderSvg(barSpec(brontoVegaConfig('light'), false));
  assert.equal(countAttr(svg, 'fill', '#2a78d6'), 3, 'three first-hue bars, no legend swatch');
  assert.equal(countAttr(svg, 'fill', '#d71921'), 0, 'the alert accent stays off ordinary marks');
});

test('dark: series + chrome resolve to the dark palette, no light bleed', async () => {
  const svg = await renderSvg(barSpec(brontoVegaConfig('dark'), true));
  assert.ok(countAttr(svg, 'fill', '#3987e5') >= 1, 'series 1 = dark blue');
  assert.match(svg, /stroke="#555555"/i, 'dark --line-strong on the axis strokes');
  // Cross-theme guard: the LIGHT series 1 must not appear in a dark render.
  assert.equal(countAttr(svg, 'fill', '#2a78d6'), 0, 'no light-palette bleed into the dark config');
});

test('sequential ramp (range.heatmap) lands on a quantitative rect', async () => {
  const svg = await renderSvg(heatSpec(brontoVegaConfig('light')));
  // A CONTINUOUS scale interpolates, so Vega emits the colour as `rgb(...)`, not
  // hex (discrete/categorical fills stay hex — see the format guard above). The
  // domain extremes map to the ramp endpoints: #80b0e8 → rgb(128,176,232),
  // #104281 → rgb(16,66,129). Match either, tolerant of Vega's spacing.
  assert.match(
    svg,
    /fill="rgb\(\s*128,\s*176,\s*232\s*\)"|fill="rgb\(\s*16,\s*66,\s*129\s*\)"/i,
    'a sequential-ramp endpoint (rgb) fills a heatmap rect',
  );
});
