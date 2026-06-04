/**
 * Generate the opt-in D2 theme override map from the bronto token source:
 *
 *   tokens/d2.js    ← brontoD2Vars()/brontoD2Overrides() + resolved slot maps
 *   tokens/d2.json  ← resolved theme-overrides per theme (any consumer)
 *   tokens/d2.d.ts  ← D2ThemeOverrides + helper types
 *
 * Same model as gen-mermaid / gen-charts: the mapping (bronto token → D2 theme
 * colour slot) lives HERE; the generated files are committed and drift-checked
 * by scripts/check-d2.mjs.
 *
 * D2 (d2lang.com) compiles a diagram to a frozen SVG — there is no client CSS
 * cascade, so a `var(--x)` could never resolve; the slots take resolved hex.
 * D2's theme is a compact set of named colour slots, confirmed by rendering a
 * probe with sentinel colours:
 *   N1..N7  neutrals — N1 text · N2 muted · N3 subtle · N4 line-strong ·
 *           N5 line · N6 subtle-bg · N7 canvas/background
 *   B1..B6  "base"   — B1 borders + connections (edges) · B2/B3 muted borders ·
 *           B4→B6 container fills (outer → leaf)
 *   AA2/AA4/AA5, AB4/AB5  the two alternative-accent ramps (opt-in accents,
 *           sql_table/class shapes)
 *
 * bronto is monochrome + one rationed accent, so the B (base) ramp maps to
 * NEUTRALS — the default diagram stays monochrome, the accent is not spent on
 * every border/edge — and D2's two alt-accent ramps fold into the single bronto
 * accent, available when a node opts in.
 *
 * Run: node scripts/gen-d2.mjs   (or: npm run d2:build)
 */
import { resolve } from 'node:path';
import { format, resolveConfig } from 'prettier';
import { makeResolveRef } from './lib/resolve-ref.mjs';
import { repoRoot as root, isMain, writeGenerated, genBanner } from './lib/emit.mjs';

const resolveRef = makeResolveRef('gen-d2');
const JS_PATH = resolve(root, 'tokens/d2.js');
const prettierCfg = await resolveConfig(JS_PATH);

/**
 * D2 colour slot → bronto token reference. Theme-independent; resolved per theme
 * in resolveRef(). Order = D2's slot order (neutrals, base, alt-A, alt-B).
 */
export const MAP = {
  // Neutrals — text through canvas.
  N1: 'var(--text)',
  N2: 'var(--text-soft)',
  N3: 'var(--text-dim)',
  N4: 'var(--line-strong)',
  N5: 'var(--line)',
  N6: 'var(--panel-soft)',
  N7: 'var(--bg)',

  // Base — borders, edges, and container fills. Neutral, to stay monochrome.
  B1: 'var(--line-strong)', // shape borders + connections
  B2: 'var(--line)',
  B3: 'var(--line)',
  B4: 'var(--panel-soft)', // outer container fill
  B5: 'var(--bg-elevated)', // mid fill
  B6: 'var(--panel)', // leaf fill

  // Alternative-accent ramps. D2 spends these on special-shape fills (cylinder,
  // class/sql headers) by default, so mapping them to the accent would spray it
  // onto shapes the author never marked — against the rationed-accent rule. Keep
  // them neutral: the diagram stays monochrome until a node opts into the accent
  // via a class (see docs/d2.md).
  AA2: 'var(--line-strong)',
  AA4: 'var(--panel)',
  AA5: 'var(--panel-soft)',
  AB4: 'var(--panel)',
  AB5: 'var(--panel-soft)',
};

/** The slot set the map commits to (used by the coverage gate). */
export const REQUIRED_KEYS = Object.keys(MAP);

/** The resolved slot → hex map for one theme. */
export function themeOverrides(theme) {
  const out = {};
  for (const [slot, ref] of Object.entries(MAP)) out[slot] = resolveRef(ref, theme);
  return out;
}

const themes = { light: themeOverrides('light'), dark: themeOverrides('dark') };

export function buildD2Json() {
  const out = {
    $comment:
      "@ponchia/ui D2 theme colour slots resolved to static hex per theme. Drop into a D2 diagram's `vars: { d2-config: { theme-overrides, dark-theme-overrides } }` (see brontoD2Vars in @ponchia/ui/d2), or pass to the Go/WASM render API. Monochrome base ramp + one rationed accent. Generated from the token source — do not edit by hand; run `npm run d2:build`. Drift-checked in CI.",
    light: themes.light,
    dark: themes.dark,
  };
  return JSON.stringify(out, null, 2) + '\n';
}

export async function buildD2Js() {
  const banner = genBanner('gen-d2.mjs', 'd2:build', [
    'On-brand D2 (d2lang.com) theme overrides, resolved to static hex per',
    'theme. D2 compiles to a frozen SVG and cannot read `var(--x)`. Apply via',
    'the D2 source vars block (brontoD2Vars) or the Go/WASM render API',
    '(brontoD2Overrides). See docs/d2.md.',
  ]);
  const raw =
    `${banner}\n` +
    `/** Resolved D2 theme colour slots for each bronto theme. */\n` +
    `export const d2 = ${JSON.stringify(themes)};\n\n` +
    `function block(map) {\n` +
    `  return Object.entries(map)\n` +
    `    .map(([slot, hex]) => \`      \${slot}: "\${hex}"\`)\n` +
    `    .join('\\n');\n` +
    `}\n\n` +
    `/** A D2 source snippet to prepend to a diagram — sets the bronto palette for\n` +
    ` *  both light and dark via \`vars.d2-config\`. */\n` +
    `export function brontoD2Vars() {\n` +
    '  return `vars: {\\n  d2-config: {\\n    theme-overrides: {\\n${block(d2.light)}\\n    }\\n    dark-theme-overrides: {\\n${block(d2.dark)}\\n    }\\n  }\\n}\\n`;\n' +
    `}\n\n` +
    `/** The slot → hex map for a theme (default \`light\`), for the Go/WASM render\n` +
    ` *  API's themeOverrides / darkThemeOverrides. */\n` +
    `export function brontoD2Overrides(theme = 'light') {\n` +
    `  return d2[theme === 'dark' ? 'dark' : 'light'];\n` +
    `}\n\n` +
    `export default brontoD2Vars;\n`;
  return format(raw, { ...prettierCfg, filepath: JS_PATH });
}

export function buildD2Dts() {
  const banner = genBanner('gen-d2.mjs', 'd2:build');
  const slots = REQUIRED_KEYS.map((k) => `  ${k}: string;`).join('\n');
  return `${banner}
/** Resolved D2 theme colour slots (hex). See docs/d2.md for what each paints. */
export interface D2ThemeOverrides {
${slots}
}

/** Resolved D2 theme overrides for each bronto theme. */
export declare const d2: { light: D2ThemeOverrides; dark: D2ThemeOverrides };

/** A D2 source snippet (\`vars: { d2-config: { theme-overrides, dark-theme-overrides } }\`)
 *  to prepend to a diagram. */
export declare function brontoD2Vars(): string;

/** The slot → hex map for a theme (default \`light\`), for the render API's
 *  themeOverrides / darkThemeOverrides. */
export declare function brontoD2Overrides(theme?: 'light' | 'dark'): D2ThemeOverrides;

declare const _default: typeof brontoD2Vars;
export default _default;
`;
}

export async function buildGenerated() {
  return {
    'tokens/d2.js': await buildD2Js(),
    'tokens/d2.json': buildD2Json(),
    'tokens/d2.d.ts': buildD2Dts(),
  };
}

if (isMain(import.meta.url)) writeGenerated(root, await buildGenerated());
