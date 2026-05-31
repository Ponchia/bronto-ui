/**
 * Generate the opt-in Tier-4 data-viz colour module from tokens/charts.js:
 *
 *   css/dataviz.css     ← :root --chart-* (theme-aware) + dot-matrix patterns
 *   tokens/charts.json  ← resolved hex per theme (JS/canvas/SVG/charting libs)
 *   tokens/charts.d.ts  ← ChartTheme + ChartTokenName types
 *
 * Generated, committed, drift-checked by scripts/check-charts.mjs. Same model
 * as gen-skins / gen-glyphs. Opt-in: dataviz.css is a separate entrypoint,
 * never imported by core.css, never in the default bundle.
 *
 * Run: node scripts/gen-charts.mjs   (or: npm run charts:build)
 */
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { charts, ACCENT, CHART_CATEGORICAL, CHART_PATTERN_COUNT } from '../tokens/charts.js';
import { parseOklch, rgbToHex } from './lib/oklch.mjs';
import { buildResolved } from './gen-resolved.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const resolved = buildResolved();

/** Resolve a charts.js colour string to a concrete sRGB hex for a theme.
 *  `var(--accent)` → the theme's resolved accent; `#rrggbb` → as-is; oklch() → hex. */
export function resolveColor(str, theme) {
  if (str === ACCENT) return resolved[theme]['--accent'];
  if (/^#[0-9a-f]{6}$/i.test(str)) return str.toLowerCase();
  return rgbToHex(parseOklch(str));
}

// --- Dot-matrix pattern fills (theme-independent, the 2nd channel) ----------
// Each tiles via background-size: var(--chart-pattern-size) and inks with
// var(--chart-pattern-ink). Index matches the categorical series (1 = solid).
const D = 'var(--chart-pattern-ink)';
const dot = (...stops) => stops.map((s) => `radial-gradient(${s})`).join(', ');
export const PATTERNS = [
  'none', // 1 solid
  dot(`circle at 50% 50%, ${D} 1.4px, transparent 1.6px`), // 2 centred dot
  dot(`circle at 0 0, ${D} 1.4px, transparent 1.6px`), // 3 corner dot (sparser feel)
  dot(
    `circle at 25% 25%, ${D} 1.2px, transparent 1.4px`,
    `circle at 75% 75%, ${D} 1.2px, transparent 1.4px`,
  ), // 4 checker
  dot(
    `circle at 50% 25%, ${D} 1.2px, transparent 1.4px`,
    `circle at 50% 75%, ${D} 1.2px, transparent 1.4px`,
  ), // 5 vertical pair
  dot(
    `circle at 25% 50%, ${D} 1.2px, transparent 1.4px`,
    `circle at 75% 50%, ${D} 1.2px, transparent 1.4px`,
  ), // 6 horizontal pair
  dot(
    `circle at 25% 25%, ${D} 1px, transparent 1.2px`,
    `circle at 75% 25%, ${D} 1px, transparent 1.2px`,
    `circle at 25% 75%, ${D} 1px, transparent 1.2px`,
    `circle at 75% 75%, ${D} 1px, transparent 1.2px`,
  ), // 7 dense quad
  dot(`circle at 50% 50%, transparent 1.2px, ${D} 1.4px, transparent 2.2px`), // 8 ring
];

const decl = (name, val, indent) => `${indent}${name}: ${val};`;

function chartVars(theme, indent) {
  const c = charts[theme];
  const lines = [];
  c.categorical.forEach((v, i) => lines.push(decl(`--chart-${i + 1}`, v, indent)));
  c.sequential.forEach((v, i) => lines.push(decl(`--chart-seq-${i + 1}`, v, indent)));
  c.diverging.forEach((v, i) => lines.push(decl(`--chart-div-${i + 1}`, v, indent)));
  return lines.join('\n');
}

export function buildDatavizCss() {
  const banner =
    `/* @ponchia/ui — GENERATED from tokens/charts.js by scripts/gen-charts.mjs.\n` +
    ` *  Do not edit by hand; run \`npm run charts:build\`. Drift-checked in CI.\n` +
    ` *\n` +
    ` *  Tier-4 data-viz palette (ADR-0001). OPT-IN: import \`@ponchia/ui/css/dataviz.css\`\n` +
    ` *  on demand; never in the default bundle, never UI chrome. --chart-1 is the live\n` +
    ` *  accent (series 1 = brand). Pair colour N with pattern N (a 2nd, non-colour\n` +
    ` *  channel): background: var(--chart-3); background-image: var(--chart-pattern-3);\n` +
    ` *  background-size: var(--chart-pattern-size); --chart-pattern-ink: <contrast>. */\n`;

  const patterns =
    `  /* Dot-matrix pattern fills — pair with the matching colour (WCAG 1.4.1). */\n` +
    `  --chart-pattern-size: 8px;\n` +
    `  --chart-pattern-ink: rgb(0 0 0 / 0.34);\n` +
    PATTERNS.map((p, i) => `  --chart-pattern-${i + 1}: ${p};`).join('\n');

  const darkPatternInk = `  --chart-pattern-ink: rgb(255 255 255 / 0.42);`;

  return (
    `${banner}\n` +
    `:root {\n${chartVars('light', '  ')}\n\n${patterns}\n}\n\n` +
    `@media (prefers-color-scheme: dark) {\n` +
    `  :root:not([data-theme='light']) {\n${chartVars('dark', '    ')}\n  ${darkPatternInk.trim()}\n  }\n}\n\n` +
    `:root[data-theme='dark'] {\n${chartVars('dark', '  ')}\n${darkPatternInk}\n}\n`
  );
}

export function buildChartsJson() {
  const forTheme = (theme) => ({
    categorical: charts[theme].categorical.map((v) => resolveColor(v, theme)),
    sequential: charts[theme].sequential.map((v) => resolveColor(v, theme)),
    diverging: charts[theme].diverging.map((v) => resolveColor(v, theme)),
  });
  const out = {
    $comment:
      '@ponchia/ui data-viz palette resolved to static hex per theme, for non-CSS render targets (canvas/SVG/charting libs). Series 1 = the resolved brand accent. Generated from tokens/charts.js — do not edit by hand; run `npm run charts:build`. Drift-checked in CI.',
    light: forTheme('light'),
    dark: forTheme('dark'),
  };
  return JSON.stringify(out, null, 2) + '\n';
}

export function buildChartsDts() {
  const banner =
    `/** @ponchia/ui — GENERATED from tokens/charts.js by scripts/gen-charts.mjs.\n` +
    ` *  Do not edit by hand; run \`npm run charts:build\`. Drift-checked in CI. */\n`;
  const cat = Array.from({ length: CHART_CATEGORICAL }, (_, i) => `'--chart-${i + 1}'`);
  return `${banner}
/** A theme's data-viz palette. Values are CSS colour strings (OKLCH for the
 *  authored series; \`var(--accent)\` for series 1). For resolved sRGB **hex**
 *  (canvas/SVG/charting libs), import \`@ponchia/ui/charts.json\` instead. */
export interface ChartTheme {
  /** ${CHART_CATEGORICAL} distinct series colours (index 0 = \`var(--accent)\`, the brand). */
  categorical: string[];
  /** Single-hue sequential ramp (light→dark), for heatmaps/intensity. */
  sequential: string[];
  /** Diverging ramp (− … neutral … +), for gains/losses. */
  diverging: string[];
}

/** The categorical CSS custom-property names (1-based; \`--chart-1\` = the accent). */
export type ChartTokenName =
  | ${cat.join('\n  | ')};

/** The opt-in data-viz palette source, per theme (CSS colour strings). */
export declare const charts: { light: ChartTheme; dark: ChartTheme };

/** Series 1 sentinel — the live brand accent. */
export declare const ACCENT: 'var(--accent)';

export declare const CHART_CATEGORICAL: ${CHART_CATEGORICAL};
export declare const CHART_PATTERN_COUNT: ${CHART_PATTERN_COUNT};

declare const _default: { light: ChartTheme; dark: ChartTheme };
export default _default;
`;
}

export const generated = {
  'css/dataviz.css': buildDatavizCss(),
  'tokens/charts.json': buildChartsJson(),
  'tokens/charts.d.ts': buildChartsDts(),
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const [rel, content] of Object.entries(generated)) {
    writeFileSync(resolve(root, rel), content);
    console.log(`✓ wrote ${rel}`);
  }
}
