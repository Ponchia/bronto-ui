/** @bronto/ui — design token data types. */

export type ThemeName = 'light' | 'dark';

/** Exact mirror of the :root blocks in css/tokens.css. */
export declare const cssVars: {
  global: Record<`--${string}`, string>;
  light: Record<`--${string}`, string>;
  dark: Record<`--${string}`, string>;
};

/** Ergonomic view derived from {@link cssVars} (custom-property `--` prefix stripped). */
export declare const tokens: {
  scale: Record<string, string>;
  color: { light: Record<string, string>; dark: Record<string, string> };
};

/** Resolve the palette for a theme. Unknown values fall back to light. */
export declare function themeColor(theme?: string): Record<string, string>;

export default tokens;
