/** @ponchia/ui — GENERATED from the token source by scripts/gen-d2.mjs.
 *  Do not edit by hand; run `npm run d2:build`. Drift-checked in CI. */

/** Resolved D2 theme colour slots (hex). See docs/d2.md for what each paints. */
export interface D2ThemeOverrides {
  N1: string;
  N2: string;
  N3: string;
  N4: string;
  N5: string;
  N6: string;
  N7: string;
  B1: string;
  B2: string;
  B3: string;
  B4: string;
  B5: string;
  B6: string;
  AA2: string;
  AA4: string;
  AA5: string;
  AB4: string;
  AB5: string;
}

/** Resolved D2 theme overrides for each bronto theme. */
export declare const d2: { light: D2ThemeOverrides; dark: D2ThemeOverrides };

/** A D2 source snippet (`vars: { d2-config: { theme-overrides, dark-theme-overrides } }`)
 *  to prepend to a diagram. */
export declare function brontoD2Vars(): string;

/** The slot → hex map for a theme (default `light`), for the render API's
 *  themeOverrides / darkThemeOverrides. */
export declare function brontoD2Overrides(theme?: 'light' | 'dark'): D2ThemeOverrides;

declare const _default: typeof brontoD2Vars;
export default _default;
