/** @ponchia/ui — GENERATED from tokens/index.js by scripts/gen-dts.mjs.
 *  Do not edit by hand; run `npm run dts:build`. Drift-checked in CI. */

export type ThemeName = 'light' | 'dark';

export type GlobalTokenName = '--radius-xl' | '--radius-lg' | '--radius-md' | '--radius-sm' | '--radius-pill' | '--space-2xs' | '--space-xs' | '--space-sm' | '--space-md' | '--space-lg' | '--space-xl' | '--space-2xl' | '--mono' | '--sans' | '--dot-font' | '--display' | '--text-2xs' | '--text-xs' | '--text-sm' | '--text-base' | '--text-lg' | '--text-xl' | '--tracking-wide' | '--tracking-wider' | '--ease-standard' | '--ease-spring' | '--ease-out' | '--duration-fast' | '--duration-base' | '--duration-slow' | '--dot-size' | '--dot-gap' | '--z-base' | '--z-raised' | '--z-sticky' | '--z-overlay' | '--z-popover' | '--z-toast' | '--accent-1' | '--accent-2' | '--accent-3' | '--accent-4' | '--accent-5' | '--accent-6' | '--surface-1' | '--surface-2' | '--surface-3' | '--surface-4' | '--surface-5' | '--surface-6' | '--bronto-color-bg' | '--bronto-color-surface' | '--bronto-color-surface-raised' | '--bronto-color-border' | '--bronto-color-border-strong' | '--bronto-color-text' | '--bronto-color-text-muted' | '--bronto-color-action' | '--bronto-color-on-action' | '--bronto-color-focus' | '--bronto-color-success' | '--bronto-color-warning' | '--bronto-color-danger' | '--bronto-color-info' | '--surface' | '--surface-raised' | '--surface-muted' | '--border' | '--border-strong';
export type LightTokenName = '--bg' | '--bg-elevated' | '--bg-accent' | '--panel' | '--panel-strong' | '--panel-soft' | '--line' | '--line-strong' | '--text' | '--text-soft' | '--text-dim' | '--accent' | '--accent-ramp-end' | '--accent-strong' | '--accent-text' | '--accent-soft' | '--success' | '--success-soft' | '--warning' | '--warning-soft' | '--danger' | '--danger-soft' | '--info' | '--info-soft' | '--code-bg' | '--button-text' | '--field-dot' | '--field-dot-hot' | '--field-dot-accent' | '--focus-ring' | '--shadow' | '--shadow-raised';
export type DarkTokenName = '--bg' | '--bg-elevated' | '--bg-accent' | '--panel' | '--panel-strong' | '--panel-soft' | '--line' | '--line-strong' | '--text' | '--text-soft' | '--text-dim' | '--accent' | '--accent-ramp-end' | '--accent-strong' | '--accent-text' | '--accent-soft' | '--success' | '--success-soft' | '--warning' | '--warning-soft' | '--danger' | '--danger-soft' | '--info' | '--info-soft' | '--code-bg' | '--button-text' | '--field-dot' | '--field-dot-hot' | '--field-dot-accent' | '--focus-ring' | '--shadow' | '--shadow-raised';

/** Exact mirror of the :root blocks in css/tokens.css (literal keys). */
export declare const cssVars: {
  global: Record<GlobalTokenName, string>;
  light: Record<LightTokenName, string>;
  dark: Record<DarkTokenName, string>;
};

export type ScaleKey = 'radius-xl' | 'radius-lg' | 'radius-md' | 'radius-sm' | 'radius-pill' | 'space-2xs' | 'space-xs' | 'space-sm' | 'space-md' | 'space-lg' | 'space-xl' | 'space-2xl' | 'mono' | 'sans' | 'dot-font' | 'display' | 'text-2xs' | 'text-xs' | 'text-sm' | 'text-base' | 'text-lg' | 'text-xl' | 'tracking-wide' | 'tracking-wider' | 'ease-standard' | 'ease-spring' | 'ease-out' | 'duration-fast' | 'duration-base' | 'duration-slow' | 'dot-size' | 'dot-gap' | 'z-base' | 'z-raised' | 'z-sticky' | 'z-overlay' | 'z-popover' | 'z-toast' | 'accent-1' | 'accent-2' | 'accent-3' | 'accent-4' | 'accent-5' | 'accent-6' | 'surface-1' | 'surface-2' | 'surface-3' | 'surface-4' | 'surface-5' | 'surface-6' | 'bronto-color-bg' | 'bronto-color-surface' | 'bronto-color-surface-raised' | 'bronto-color-border' | 'bronto-color-border-strong' | 'bronto-color-text' | 'bronto-color-text-muted' | 'bronto-color-action' | 'bronto-color-on-action' | 'bronto-color-focus' | 'bronto-color-success' | 'bronto-color-warning' | 'bronto-color-danger' | 'bronto-color-info' | 'surface' | 'surface-raised' | 'surface-muted' | 'border' | 'border-strong';
export type ColorKey = 'bg' | 'bg-elevated' | 'bg-accent' | 'panel' | 'panel-strong' | 'panel-soft' | 'line' | 'line-strong' | 'text' | 'text-soft' | 'text-dim' | 'accent' | 'accent-ramp-end' | 'accent-strong' | 'accent-text' | 'accent-soft' | 'success' | 'success-soft' | 'warning' | 'warning-soft' | 'danger' | 'danger-soft' | 'info' | 'info-soft' | 'code-bg' | 'button-text' | 'field-dot' | 'field-dot-hot' | 'field-dot-accent' | 'focus-ring' | 'shadow' | 'shadow-raised';

/** Ergonomic view derived from {@link cssVars} (`--` prefix stripped). */
export declare const tokens: {
  scale: Record<ScaleKey, string>;
  color: { light: Record<ColorKey, string>; dark: Record<ColorKey, string> };
};

/** Resolve the palette for a theme. Unknown/omitted falls back to light. */
export declare function themeColor(theme?: ThemeName): Record<ColorKey, string>;

export default tokens;
