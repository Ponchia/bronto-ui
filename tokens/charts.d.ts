/** @ponchia/ui — GENERATED from tokens/charts.js by scripts/gen-charts.mjs.
 *  Do not edit by hand; run `npm run charts:build`. Drift-checked in CI. */

/** A theme's categorical + data-viz palette, as authored. Values are CSS
 *  colour strings (sRGB hex for the measured categorical and sequential sets,
 *  OKLCH for the diverging ramp). For resolved sRGB **hex** of every set,
 *  including the derived tints and inks, import `@ponchia/ui/charts.json`;
 *  for values that follow a live page (skins, OLED, contrast) use
 *  `@ponchia/ui/renderer`. */
export interface ChartTheme {
  /** 8 categorical hues in fixed order: blue, orange, aqua, yellow, magenta, green, violet, red. */
  categorical: string[];
  /** Single-hue sequential ramp; step 1 sits nearest the theme surface. */
  sequential: string[];
  /** Diverging ramp (− … neutral … +), for gains/losses. */
  diverging: string[];
}

/** The categorical series custom-property names (1-based). */
export type ChartTokenName =
  | '--chart-1'
  | '--chart-2'
  | '--chart-3'
  | '--chart-4'
  | '--chart-5'
  | '--chart-6'
  | '--chart-7'
  | '--chart-8';

/** A categorical slot's hue name. */
export type CategoricalHue = 'blue' | 'orange' | 'aqua' | 'yellow' | 'magenta' | 'green' | 'violet' | 'red';

/** The hue each categorical slot carries, in slot order. */
export declare const CATEGORICAL_HUES: readonly ['blue', 'orange', 'aqua', 'yellow', 'magenta', 'green', 'violet', 'red'];

/** The opt-in categorical + data-viz palette source, per theme. */
export declare const charts: { light: ChartTheme; dark: ChartTheme };

export declare const CHART_CATEGORICAL: 8;
export declare const CHART_PATTERN_COUNT: 8;

declare const _default: { light: ChartTheme; dark: ChartTheme };
export default _default;
