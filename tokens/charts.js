/**
 * @ponchia/ui — Tier-4 data-viz colour module (ADR-0001 step 7).
 *
 * The single source for the opt-in chart palette (`@ponchia/ui/css/dataviz.css`
 * + `tokens/charts.json`). **Charts only, never UI chrome** — `check-color-policy`
 * forbids `var(--chart-*)` in core component CSS. Opt-in: a separate entrypoint,
 * never in the default bundle.
 *
 * Hybrid accent-led: **series 1 is the live `var(--accent)`** (the brand stays
 * series 1, so it re-themes/-skins for free); series 2–8 are an Okabe-Ito-derived
 * colourblind-safe set, authored in OKLCH per-theme (darker in light, brighter
 * in dark) and **gated for pairwise distinguishability under normal + simulated
 * protan/deutan/tritan vision** (scripts/check-charts.mjs). Series 8 is a neutral
 * grey (on-brand, and a useful "other"/baseline series).
 *
 * Colour is never the sole signal: `--chart-pattern-1..8` ship a matching
 * dot-matrix pattern per series (WCAG 1.4.1). Use colour N WITH pattern N.
 *
 * Generated → drift-checked: css/dataviz.css, tokens/charts.json (resolved hex
 * for JS/canvas/SVG/charting libs), tokens/charts.d.ts.
 */

/** Series 1 is the live accent (a CSS var, not a fixed hue). Resolved to the
 *  theme accent for the JSON/gate. */
export const ACCENT = 'var(--accent)';

/** Series 2–8 — the Okabe-Ito colourblind-safe set, used **verbatim** (the same
 *  hues both themes). Authored as sRGB hex on purpose: Okabe-Ito is a published,
 *  CVD-proven *set*, and round-tripping through OKLCH (or re-spacing per theme)
 *  breaks the careful lightness relationships that make it colourblind-safe —
 *  which the CVD gate caught. Series 1 (the accent, per-theme) replaces
 *  Okabe-Ito's vermillion; a dark slate-grey is the 8th (a CVD-distinct "other"
 *  / baseline, far enough in lightness from the reddish-purple to clear deutan).
 *  The sequential/diverging ramps below ARE authored in OKLCH (new work). */
const FILLS = [
  '#e69f00', // 2 orange
  '#56b4e9', // 3 sky blue
  '#009e73', // 4 bluish green
  '#f0e442', // 5 yellow
  '#0072b2', // 6 blue
  '#cc79a7', // 7 reddish purple
  '#4d5358', // 8 dark slate (CVD-distinct neutral)
];

export const charts = {
  light: {
    categorical: [ACCENT, ...FILLS],
    sequential: [
      'oklch(94% 0.03 25deg)',
      'oklch(85% 0.07 25deg)',
      'oklch(74% 0.12 25deg)',
      'oklch(62% 0.16 25deg)',
      'oklch(50% 0.16 25deg)',
      'oklch(38% 0.13 25deg)',
    ],
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
    categorical: [ACCENT, ...FILLS],
    sequential: [
      'oklch(30% 0.1 25deg)',
      'oklch(42% 0.15 25deg)',
      'oklch(55% 0.17 25deg)',
      'oklch(68% 0.15 25deg)',
      'oklch(80% 0.1 25deg)',
      'oklch(90% 0.05 25deg)',
    ],
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
