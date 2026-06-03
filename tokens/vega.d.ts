/** @ponchia/ui — GENERATED from the token source by scripts/gen-vega.mjs.
 *  Do not edit by hand; run `npm run vega:build`. Drift-checked in CI. */

/** A resolved Vega-Lite `config`: colour-valued chrome slots (hex), font
 *  stacks, and `range.*` palette arrays. Pass as a spec's `config` (or
 *  vega-embed's `config`). For the per-slot contract see docs/vega.md. */
export interface VegaConfig {
  background: string;
  range: {
    category: string[];
    ordinal: string[];
    ramp: string[];
    heatmap: string[];
    diverging: string[];
  };
  [key: string]: unknown;
}

/** Resolved Vega-Lite `config` for each bronto theme. */
export declare const vega: { light: VegaConfig; dark: VegaConfig };

/** The on-brand Vega-Lite `config` for a bronto theme. Unknown/omitted falls
 *  back to light. Spread into a spec's `config`, or pass to vega-embed. */
export declare function brontoVegaConfig(theme?: 'light' | 'dark'): VegaConfig;

declare const _default: typeof brontoVegaConfig;
export default _default;
