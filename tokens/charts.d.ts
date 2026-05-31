/** @ponchia/ui — GENERATED from tokens/charts.js by scripts/gen-charts.mjs.
 *  Do not edit by hand; run `npm run charts:build`. Drift-checked in CI. */

/** A theme's data-viz palette. Values are CSS colour strings (OKLCH for the
 *  authored series; `var(--accent)` for series 1). For resolved sRGB **hex**
 *  (canvas/SVG/charting libs), import `@ponchia/ui/charts.json` instead. */
export interface ChartTheme {
  /** 8 distinct series colours (index 0 = `var(--accent)`, the brand). */
  categorical: string[];
  /** Single-hue sequential ramp (light→dark), for heatmaps/intensity. */
  sequential: string[];
  /** Diverging ramp (− … neutral … +), for gains/losses. */
  diverging: string[];
}

/** The categorical CSS custom-property names (1-based; `--chart-1` = the accent). */
export type ChartTokenName =
  | '--chart-1'
  | '--chart-2'
  | '--chart-3'
  | '--chart-4'
  | '--chart-5'
  | '--chart-6'
  | '--chart-7'
  | '--chart-8';

/** The opt-in data-viz palette source, per theme (CSS colour strings). */
export declare const charts: { light: ChartTheme; dark: ChartTheme };

/** Series 1 sentinel — the live brand accent. */
export declare const ACCENT: 'var(--accent)';

export declare const CHART_CATEGORICAL: 8;
export declare const CHART_PATTERN_COUNT: 8;

declare const _default: { light: ChartTheme; dark: ChartTheme };
export default _default;
