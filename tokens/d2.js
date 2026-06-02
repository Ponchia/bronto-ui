/** @ponchia/ui — GENERATED from the token source by scripts/gen-d2.mjs.
 *  Do not edit by hand; run `npm run d2:build`. Drift-checked in CI.
 *
 *  On-brand D2 (d2lang.com) theme overrides, resolved to static hex per
 *  theme. D2 compiles to a frozen SVG and cannot read `var(--x)`. Apply via
 *  the D2 source vars block (brontoD2Vars) or the Go/WASM render API
 *  (brontoD2Overrides). See docs/d2.md. */

/** Resolved D2 theme colour slots for each bronto theme. */
export const d2 = {
  light: {
    N1: '#0a0a0a',
    N2: '#353533',
    N3: '#686863',
    N4: '#a8a8a2',
    N5: '#d8d8d4',
    N6: '#ececea',
    N7: '#f4f4f2',
    B1: '#a8a8a2',
    B2: '#d8d8d4',
    B3: '#d8d8d4',
    B4: '#ececea',
    B5: '#fbfbfa',
    B6: '#ffffff',
    AA2: '#a8a8a2',
    AA4: '#ffffff',
    AA5: '#ececea',
    AB4: '#ffffff',
    AB5: '#ececea',
  },
  dark: {
    N1: '#e6e6e6',
    N2: '#c8c8c8',
    N3: '#a0a0a0',
    N4: '#555555',
    N5: '#383838',
    N6: '#242424',
    N7: '#121212',
    B1: '#555555',
    B2: '#383838',
    B3: '#383838',
    B4: '#242424',
    B5: '#181818',
    B6: '#1c1c1c',
    AA2: '#555555',
    AA4: '#1c1c1c',
    AA5: '#242424',
    AB4: '#1c1c1c',
    AB5: '#242424',
  },
};

function block(map) {
  return Object.entries(map)
    .map(([slot, hex]) => `      ${slot}: "${hex}"`)
    .join('\n');
}

/** A D2 source snippet to prepend to a diagram — sets the bronto palette for
 *  both light and dark via `vars.d2-config`. */
export function brontoD2Vars() {
  return `vars: {\n  d2-config: {\n    theme-overrides: {\n${block(d2.light)}\n    }\n    dark-theme-overrides: {\n${block(d2.dark)}\n    }\n  }\n}\n`;
}

/** The slot → hex map for a theme (default `light`), for the Go/WASM render
 *  API's themeOverrides / darkThemeOverrides. */
export function brontoD2Overrides(theme = 'light') {
  return d2[theme === 'dark' ? 'dark' : 'light'];
}

export default brontoD2Vars;
