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

const barSpec = (config, color) => ({
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
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

test('light config: categorical range + axis chrome land on the rendered SVG', async () => {
  const svg = await renderSvg(barSpec(brontoVegaConfig('light'), true));
  // range.category[0..1] — the accent (series 1) and the next CVD-safe series.
  assert.match(svg, /#d71921/i, 'series 1 = resolved light accent on a bar');
  assert.match(svg, /#e69f00/i, 'series 2 from range.category on a bar');
  // axis.domainColor — the stronger neutral line.
  assert.match(svg, /#a8a8a2/i, 'axis domain stroke = --line-strong');
});

test('light config: single-series bar uses the accent mark colour', async () => {
  const svg = await renderSvg(barSpec(brontoVegaConfig('light'), false));
  assert.match(svg, /#d71921/i, 'mark.color = resolved light accent');
});

test('dark config: accent + chrome resolve to the dark palette', async () => {
  const svg = await renderSvg(barSpec(brontoVegaConfig('dark'), true));
  assert.match(svg, /#ff3b41/i, 'series 1 = resolved dark accent');
  assert.match(svg, /#555555/i, 'axis domain stroke = dark --line-strong');
});
