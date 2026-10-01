/** @ponchia/ui — GENERATED from the token source by scripts/gen-vega.mjs.
 *  Do not edit by hand; run `npm run vega:build`. Drift-checked in CI.
 *
 *  An on-brand Vega-Lite / Vega `config`, resolved to static colours per
 *  theme. Vega is the consumer's renderer — this is config only, we never
 *  import it. Values are resolved hex on purpose: Vega bakes colours into
 *  the SVG/canvas scene and cannot read `var(--x)`. See docs/vega.md. */

/** Resolved Vega-Lite `config` for each bronto theme. */
export const vega = {
  light: {
    background: '#f4f4f2',
    font: "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    range: {
      category: [
        '#2a78d6',
        '#eb6834',
        '#1baf7a',
        '#eda100',
        '#e87ba4',
        '#008300',
        '#4a3aa7',
        '#e34948',
      ],
      ordinal: ['#80b0e8', '#5598e7', '#2a78d6', '#1c5cab', '#104281'],
      ramp: ['#80b0e8', '#5598e7', '#2a78d6', '#1c5cab', '#104281'],
      heatmap: ['#80b0e8', '#5598e7', '#2a78d6', '#1c5cab', '#104281'],
      diverging: ['#0c54a0', '#558ac0', '#aac8e3', '#d9dfe5', '#e0b491', '#ce7a3b', '#b95115'],
    },
    axis: {
      domainColor: '#a8a8a2',
      gridColor: '#d8d8d4',
      tickColor: '#a8a8a2',
      labelColor: '#353533',
      labelFont:
        "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      labelFontSize: 12,
      titleColor: '#0a0a0a',
      titleFont:
        "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      titleFontSize: 13,
      titleFontWeight: 600,
    },
    legend: {
      labelColor: '#353533',
      labelFont:
        "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      labelFontSize: 12,
      titleColor: '#0a0a0a',
      titleFont:
        "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      titleFontSize: 13,
      titleFontWeight: 600,
      symbolType: 'circle',
      symbolSize: 100,
    },
    header: {
      labelColor: '#353533',
      labelFont:
        "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      titleColor: '#0a0a0a',
      titleFont:
        "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    },
    title: {
      color: '#0a0a0a',
      font: "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      fontSize: 15,
      fontWeight: 600,
      subtitleColor: '#686863',
      subtitleFont:
        "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      subtitleFontSize: 13,
    },
    mark: { color: '#2a78d6' },
    view: { stroke: null },
    axisXDiscrete: { labelAngle: 0, labelOverlap: 'greedy', labelLimit: 120 },
    text: {
      color: '#0a0a0a',
      font: "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    },
    rule: { color: '#a8a8a2' },
    line: { strokeWidth: 2 },
    point: { size: 64, filled: true },
    bar: { cornerRadiusEnd: 4 },
    rect: { stroke: '#ffffff', strokeWidth: 2 },
    arc: { stroke: '#ffffff', strokeWidth: 2 },
    area: { stroke: '#ffffff', strokeWidth: 1 },
  },
  dark: {
    background: '#121212',
    font: "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    range: {
      category: [
        '#3987e5',
        '#d95926',
        '#199e70',
        '#c98500',
        '#d55181',
        '#008300',
        '#9085e9',
        '#e66767',
      ],
      ordinal: ['#1b5298', '#256abf', '#3987e5', '#6da7ec', '#9ec5f4'],
      ramp: ['#1b5298', '#256abf', '#3987e5', '#6da7ec', '#9ec5f4'],
      heatmap: ['#1b5298', '#256abf', '#3987e5', '#6da7ec', '#9ec5f4'],
      diverging: ['#5aa3ec', '#4683c5', '#3e5f8a', '#44484d', '#a56b38', '#e18e4b', '#f9a870'],
    },
    axis: {
      domainColor: '#555555',
      gridColor: '#383838',
      tickColor: '#555555',
      labelColor: '#c8c8c8',
      labelFont:
        "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      labelFontSize: 12,
      titleColor: '#e6e6e6',
      titleFont:
        "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      titleFontSize: 13,
      titleFontWeight: 600,
    },
    legend: {
      labelColor: '#c8c8c8',
      labelFont:
        "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      labelFontSize: 12,
      titleColor: '#e6e6e6',
      titleFont:
        "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      titleFontSize: 13,
      titleFontWeight: 600,
      symbolType: 'circle',
      symbolSize: 100,
    },
    header: {
      labelColor: '#c8c8c8',
      labelFont:
        "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      titleColor: '#e6e6e6',
      titleFont:
        "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    },
    title: {
      color: '#e6e6e6',
      font: "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      fontSize: 15,
      fontWeight: 600,
      subtitleColor: '#a0a0a0',
      subtitleFont:
        "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      subtitleFontSize: 13,
    },
    mark: { color: '#3987e5' },
    view: { stroke: null },
    axisXDiscrete: { labelAngle: 0, labelOverlap: 'greedy', labelLimit: 120 },
    text: {
      color: '#e6e6e6',
      font: "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    },
    rule: { color: '#555555' },
    line: { strokeWidth: 2 },
    point: { size: 64, filled: true },
    bar: { cornerRadiusEnd: 4 },
    rect: { stroke: '#1c1c1c', strokeWidth: 2 },
    arc: { stroke: '#1c1c1c', strokeWidth: 2 },
    area: { stroke: '#1c1c1c', strokeWidth: 1 },
  },
};

const ACCENT = { light: '#d71921', dark: '#ff3b41' };
const NEUTRAL = { light: '#686863', dark: '#a0a0a0' };

/** The on-brand Vega-Lite `config` for a bronto theme (default `light`).
 *  Spread into a spec — `{ ...spec, config: brontoVegaConfig(theme) }` —
 *  or hand to vega-embed as `{ config: brontoVegaConfig(theme) }`. */
export function brontoVegaConfig(theme = 'light') {
  return vega[theme === 'dark' ? 'dark' : 'light'];
}

/** The resolved accent hex for a theme. Spend it on one emphasised mark in a
 *  multi-series chart (a Vega-Lite conditional to this colour) while the
 *  others stay neutral. Regenerate after changing `--accent`; already-
 *  rendered charts do not live-reskin (use @ponchia/ui/renderer for that). */
export function brontoVegaAccent(theme = 'light') {
  return ACCENT[theme === 'dark' ? 'dark' : 'light'];
}

/** The neutral hex for a theme — the quiet ink every other mark takes in
 *  accent-spending. */
export function brontoVegaNeutral(theme = 'light') {
  return NEUTRAL[theme === 'dark' ? 'dark' : 'light'];
}

export default brontoVegaConfig;
