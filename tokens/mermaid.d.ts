/** @ponchia/ui — GENERATED from the token source by scripts/gen-mermaid.mjs.
 *  Do not edit by hand; run `npm run mermaid:build`. Drift-checked in CI. */

/** A resolved Mermaid `base` theme: `darkMode` plus colour-valued
 *  themeVariables (hex/rgba). For the per-key contract see docs/mermaid.md. */
export interface MermaidThemeVariables {
  darkMode: boolean;
  fontFamily: string;
  [key: string]: string | boolean;
}

/** Resolved Mermaid `base` themeVariables for each bronto theme. */
export declare const mermaid: { light: MermaidThemeVariables; dark: MermaidThemeVariables };

/** Ready-to-spread Mermaid config (`{ theme: 'base', themeVariables }`) for a
 *  bronto theme. Unknown/omitted falls back to light. */
export declare function brontoMermaidTheme(theme?: 'light' | 'dark'): {
  theme: 'base';
  themeVariables: MermaidThemeVariables;
};

declare const _default: typeof brontoMermaidTheme;
export default _default;
