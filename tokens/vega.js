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
    view: { stroke: '#d8d8d4' },
    mark: { color: '#d71921' },
    rule: { color: '#a8a8a2' },
    text: {
      color: '#0a0a0a',
      font: "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    },
    title: {
      color: '#0a0a0a',
      subtitleColor: '#686863',
      font: "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      subtitleFont:
        "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    },
    axis: {
      domainColor: '#a8a8a2',
      gridColor: '#d8d8d4',
      tickColor: '#a8a8a2',
      labelColor: '#353533',
      titleColor: '#0a0a0a',
      labelFont:
        "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      titleFont:
        "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    },
    legend: {
      labelColor: '#353533',
      titleColor: '#0a0a0a',
      labelFont:
        "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      titleFont:
        "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    },
    header: {
      labelColor: '#353533',
      titleColor: '#0a0a0a',
      labelFont:
        "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      titleFont:
        "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    },
    range: {
      category: [
        '#d71921',
        '#e69f00',
        '#56b4e9',
        '#009e73',
        '#f0e442',
        '#0072b2',
        '#cc79a7',
        '#4d5358',
      ],
      ordinal: ['#ffe4e1', '#f9bdb7', '#ed8c84', '#d55753', '#ac3031', '#79191b'],
      ramp: ['#ffe4e1', '#f9bdb7', '#ed8c84', '#d55753', '#ac3031', '#79191b'],
      heatmap: ['#ffe4e1', '#f9bdb7', '#ed8c84', '#d55753', '#ac3031', '#79191b'],
      diverging: ['#0c54a0', '#558ac0', '#aac8e3', '#d9dfe5', '#e0b491', '#ce7a3b', '#b95115'],
    },
  },
  dark: {
    background: '#121212',
    view: { stroke: '#383838' },
    mark: { color: '#ff3b41' },
    rule: { color: '#555555' },
    text: {
      color: '#e6e6e6',
      font: "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    },
    title: {
      color: '#e6e6e6',
      subtitleColor: '#a0a0a0',
      font: "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      subtitleFont:
        "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    },
    axis: {
      domainColor: '#555555',
      gridColor: '#383838',
      tickColor: '#555555',
      labelColor: '#c8c8c8',
      titleColor: '#e6e6e6',
      labelFont:
        "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      titleFont:
        "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    },
    legend: {
      labelColor: '#c8c8c8',
      titleColor: '#e6e6e6',
      labelFont:
        "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      titleFont:
        "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    },
    header: {
      labelColor: '#c8c8c8',
      titleColor: '#e6e6e6',
      labelFont:
        "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      titleFont:
        "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    },
    range: {
      category: [
        '#ff3b41',
        '#e69f00',
        '#56b4e9',
        '#009e73',
        '#f0e442',
        '#0072b2',
        '#cc79a7',
        '#4d5358',
      ],
      ordinal: ['#551112', '#8d1a1e', '#c13c3b', '#e66e68', '#f8a49d', '#fed2cd'],
      ramp: ['#551112', '#8d1a1e', '#c13c3b', '#e66e68', '#f8a49d', '#fed2cd'],
      heatmap: ['#551112', '#8d1a1e', '#c13c3b', '#e66e68', '#f8a49d', '#fed2cd'],
      diverging: ['#5aa3ec', '#4683c5', '#3e5f8a', '#44484d', '#a56b38', '#e18e4b', '#f9a870'],
    },
  },
};

/** The on-brand Vega-Lite `config` for a bronto theme (default `light`).
 *  Spread into a spec — `{ ...spec, config: brontoVegaConfig(theme) }` —
 *  or hand to vega-embed as `{ config: brontoVegaConfig(theme) }`. */
export function brontoVegaConfig(theme = 'light') {
  return vega[theme === 'dark' ? 'dark' : 'light'];
}

/** The resolved accent hex for a theme — series 1 of `range.category`, the one
 *  chromatic mark. Use it to spend the accent on a single emphasised mark in
 *  a multi-series chart (a Vega-Lite conditional to this colour) without
 *  reverse-engineering the palette array index. Regenerate after changing
 *  `--accent`; already-rendered charts do not live-reskin. */
export function brontoVegaAccent(theme = 'light') {
  return vega[theme === 'dark' ? 'dark' : 'light'].range.category[0];
}

/** The neutral series hex for a theme — the last of `range.category` — for the
 *  "every other mark stays quiet" half of accent-spending. */
export function brontoVegaNeutral(theme = 'light') {
  const cat = vega[theme === 'dark' ? 'dark' : 'light'].range.category;
  return cat[cat.length - 1];
}

export default brontoVegaConfig;
