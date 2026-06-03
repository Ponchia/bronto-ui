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

/** Count `attr="value"` occurrences (value is a literal hex — no regex metachars). */
const countAttr = (svg, attr, value) =>
  (svg.match(new RegExp(`${attr}="${value}"`, 'gi')) || []).length;

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
  // range.category[0..2] — accent (series 1) + two CVD-safe series, as fills.
  assert.ok(countAttr(svg, 'fill', '#d71921') >= 1, 'series 1 = light accent on a fill');
  assert.ok(countAttr(svg, 'fill', '#e69f00') >= 1, 'series 2 from range.category');
  assert.ok(countAttr(svg, 'fill', '#56b4e9') >= 1, 'series 3 from range.category (beyond [0..1])');
  // axis/rule neutral line (--line-strong; shared by domain/tick/rule — presence is enough).
  assert.match(svg, /stroke="#a8a8a2"/i, '--line-strong on the axis/rule strokes');
  // Format guard: colours are emitted as hex attributes. If a future Vega emits
  // rgb(...)/named colours instead, every hex assertion would silently pass-or-
  // fail wrongly — fail loudly here instead.
  assert.match(svg, /fill="#[0-9a-f]{6}"/i, 'Vega still emits hex fill attributes');
});

test('light: single-series bar isolates mark.color = accent (exactly the bars)', async () => {
  // No `color` encoding → no legend, no per-series scale: every bar is the
  // default mark colour. So an exact count proves mark.color (not range.category)
  // and that nothing else accidentally took the accent.
  const svg = await renderSvg(barSpec(brontoVegaConfig('light'), false));
  assert.equal(countAttr(svg, 'fill', '#d71921'), 3, 'three accent bars, no legend swatch');
});

test('dark: accent + chrome resolve to the dark palette, no light bleed', async () => {
  const svg = await renderSvg(barSpec(brontoVegaConfig('dark'), true));
  assert.ok(countAttr(svg, 'fill', '#ff3b41') >= 1, 'series 1 = dark accent');
  assert.match(svg, /stroke="#555555"/i, 'dark --line-strong on the axis/rule strokes');
  // Cross-theme guard: the LIGHT accent must not appear in a dark render.
  assert.equal(countAttr(svg, 'fill', '#d71921'), 0, 'no light-accent bleed into the dark config');
});

test('sequential ramp (range.heatmap) lands on a quantitative rect', async () => {
  const svg = await renderSvg(heatSpec(brontoVegaConfig('light')));
  // A CONTINUOUS scale interpolates, so Vega emits the colour as `rgb(...)`, not
  // hex (discrete/categorical fills stay hex — see the format guard above). The
  // domain extremes map to the ramp endpoints: #ffe4e1 → rgb(255,228,225),
  // #79191b → rgb(121,25,27). Match either, tolerant of Vega's spacing.
  assert.match(
    svg,
    /fill="rgb\(\s*255,\s*228,\s*225\s*\)"|fill="rgb\(\s*121,\s*25,\s*27\s*\)"/i,
    'a sequential-ramp endpoint (rgb) fills a heatmap rect',
  );
});
