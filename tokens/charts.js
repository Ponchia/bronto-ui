/**
 * @ponchia/ui — Tier-4 categorical + data-viz colour module (ADR-0001 step 7,
 * amended in 0.12).
 *
 * The single source for the opt-in categorical palette (`@ponchia/ui/css/dataviz.css`
 * + `tokens/charts.json`). Two namespaces carry the same eight hues:
 *
 *   --cat-N   categorical IDENTITY — a tag, a participant, a user-chosen tint.
 *             Each slot also has a `-tint` wash (over --panel) and an `-ink`
 *             text colour that holds 4.5:1 on the panel and on its own tint.
 *   --chart-N the same hue as a data-viz SERIES, with --chart-seq-*
 *             (sequential) and --chart-div-* (diverging) ramps.
 *
 * Neither is UI chrome: `check-color-policy` forbids both in core component CSS.
 * Opt-in: a separate entrypoint, never in the default bundle.
 *
 * WHY THESE VALUES (0.12). Until 0.11 series 1 was the live accent and series
 * 2–8 were Okabe-Ito verbatim. That set failed the measurable palette checks on
 * the package's own surfaces — yellow and slate fell outside the lightness band,
 * slate read as grey under the chroma floor — and spending slot 1 on the alert
 * red made an ordinary first series look like an error. A consumer (a canvas
 * workspace that draws charts, timelines, graph colours and presence from one
 * palette) shipped validated values instead and recorded the divergence; these
 * are those values. Order is fixed: blue, orange, aqua, yellow, magenta, green,
 * violet, red — so adjacent series, the ones a legend and a stacked mark put
 * side by side, are the pairs held furthest apart.
 *
 * Authored as sRGB hex on purpose: the values are measured, and a round-trip
 * through another space would move what was measured. `scripts/check-charts.mjs`
 * gates them per theme against every surface they draw on (panel, page, OLED):
 * OKLCH lightness band, chroma floor, adjacent-pair separation under simulated
 * protanopia/deuteranopia, a normal-vision floor, and contrast (reported below
 * 3:1; relief is the pattern fill or a direct label, per WCAG 1.4.1).
 *
 * Colour is never the sole signal: `--chart-pattern-1..8` ship a matching
 * dot-matrix pattern per series. Use colour N WITH pattern N.
 *
 * Generated → drift-checked: css/dataviz.css, tokens/charts.json (resolved hex
 * for JS/canvas/SVG/charting libs), tokens/charts.d.ts.
 */

/** The hue each categorical slot carries, in slot order — a name for a swatch
 *  picker or a legend, never a semantic (slot 8 is red, not "danger"). */
export const CATEGORICAL_HUES = Object.freeze([
  'blue',
  'orange',
  'aqua',
  'yellow',
  'magenta',
  'green',
  'violet',
  'red',
]);

export const charts = {
  light: {
    categorical: [
      '#2a78d6', // 1 blue
      '#eb6834', // 2 orange
      '#1baf7a', // 3 aqua
      '#eda100', // 4 yellow
      '#e87ba4', // 5 magenta
      '#008300', // 6 green
      '#4a3aa7', // 7 violet
      '#e34948', // 8 red
    ],
    // One blue hue; step 1 sits nearest the (light) surface.
    sequential: ['#80b0e8', '#5598e7', '#2a78d6', '#1c5cab', '#104281'],
    diverging: [
      'oklch(45% 0.14 255deg)', // − strong blue
      'oklch(62% 0.1 250deg)',
      'oklch(82% 0.05 245deg)',
      'oklch(90% 0.01 250deg)', // mid neutral
      'oklch(80% 0.07 60deg)',
      'oklch(66% 0.13 55deg)',
      'oklch(56% 0.15 45deg)', // + strong orange
    ],
  },
  dark: {
    categorical: [
      '#3987e5', // 1 blue
      '#d95926', // 2 orange
      '#199e70', // 3 aqua
      '#c98500', // 4 yellow
      '#d55181', // 5 magenta
      '#008300', // 6 green
      '#9085e9', // 7 violet
      '#e66767', // 8 red
    ],
    // One blue hue; step 1 sits nearest the (dark) surface.
    sequential: ['#1b5298', '#256abf', '#3987e5', '#6da7ec', '#9ec5f4'],
    diverging: [
      'oklch(70% 0.13 250deg)', // − blue
      'oklch(60% 0.12 252deg)',
      'oklch(48% 0.08 255deg)',
      'oklch(40% 0.01 250deg)', // mid neutral
      'oklch(58% 0.1 60deg)',
      'oklch(72% 0.13 58deg)',
      'oklch(80% 0.12 55deg)', // + orange
    ],
  },
};

/** Pattern fills — dot-matrix CSS background-images, the second (non-colour)
 *  channel per series. Each uses `--chart-pattern-ink` (set it to the series
 *  colour). Index matches the categorical series. */
export const CHART_PATTERN_COUNT = 8;

/** Number of categorical series. */
export const CHART_CATEGORICAL = 8;

export default charts;
