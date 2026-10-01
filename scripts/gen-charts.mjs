/**
 * Generate the opt-in Tier-4 categorical + data-viz colour module from
 * tokens/charts.js:
 *
 *   css/dataviz.css     ← :root --cat-* identity (solid, tint, ink) and the
 *                         --chart-* series/ramps (theme-aware) + dot-matrix patterns
 *   tokens/charts.json  ← resolved hex per theme (JS/canvas/SVG/charting libs)
 *   tokens/charts.d.ts  ← ChartTheme + ChartTokenName types
 *
 * Generated, committed, drift-checked by scripts/check-charts.mjs. Same model
 * as gen-skins / gen-glyphs. Opt-in: dataviz.css is a separate entrypoint,
 * never imported by core.css, never in the default bundle.
 *
 * Run: node scripts/gen-charts.mjs   (or: npm run charts:build)
 */
import {
  charts,
  CATEGORICAL_HUES,
  CHART_CATEGORICAL,
  CHART_PATTERN_COUNT,
} from '../tokens/charts.js';
import {
  contrastRatio,
  hexToRgb,
  mixOklch,
  oklchToRgbClamp,
  parseOklch,
  rgbToHex,
  rgbToOklch,
} from './lib/oklch.mjs';
import { buildResolved } from './gen-resolved.mjs';

import { repoRoot as root, isMain, writeGenerated } from './lib/emit.mjs';
const resolved = buildResolved();

/** Resolve a charts.js colour string to a concrete sRGB hex: `#rrggbb` as-is,
 *  `oklch()` converted. The theme argument is kept for callers that resolve
 *  several themes through one signature. */
export function resolveColor(str, _theme) {
  if (/^#[0-9a-f]{6}$/i.test(str)) return str.toLowerCase();
  return rgbToHex(parseOklch(str));
}

/** How much of the hue a `--cat-N-tint` wash carries over `--panel`. */
export const TINT_SHARE = 0.16;
/** The contrast an `--cat-N-ink` holds on every surface it labels. */
export const INK_CONTRAST = 4.5;

/** The panels and pages a categorical label sits on, per theme — the OLED
 *  preset's surfaces included for dark, since the ink is not re-derived there. */
export function inkSurfaces(theme) {
  const r = resolved[theme];
  const base = [r['--panel'], r['--bg'], r['--panel-strong']];
  return [...new Set(theme === 'dark' ? [...base, '#101010', '#000000'] : base)];
}

/** The tint a slot paints, resolved over the theme panel exactly as the CSS
 *  `color-mix(in oklch, var(--cat-N) 16%, var(--panel))` does. */
export function tintHex(hex, theme) {
  return rgbToHex(
    mixOklch(hexToRgb(hex), hexToRgb(resolved[theme]['--panel']), TINT_SHARE, 1 - TINT_SHARE),
  );
}

/** The text colour for slot N: the solid's hue, moved in OKLCH lightness only
 *  as far as it takes to hold INK_CONTRAST on every surface and on its own
 *  tint (chroma eases off as it nears black/white so the hue stays in gamut). */
export function inkHex(hex, theme) {
  const { L, C, H } = rgbToOklch(hexToRgb(hex));
  const grounds = [...inkSurfaces(theme), tintHex(hex, theme)].map(hexToRgb);
  const step = theme === 'dark' ? 0.005 : -0.005;
  for (let l = L; l > 0.05 && l < 0.98; l += step) {
    const chroma = Math.min(C, 0.25 * Math.min(l, 1 - l) * 2);
    const rgb = oklchToRgbClamp(l, chroma, H);
    if (grounds.every((g) => contrastRatio(rgb, g) >= INK_CONTRAST)) return rgbToHex(rgb);
  }
  throw new Error(`gen-charts: no ${theme} ink for ${hex} holds ${INK_CONTRAST}:1`);
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

/** The per-theme values: identity solids + inks, and the series ramps. */
function themeVars(theme, indent) {
  const c = charts[theme];
  const lines = [];
  c.categorical.forEach((v, i) => lines.push(decl(`--cat-${i + 1}`, v, indent)));
  c.categorical.forEach((v, i) => lines.push(decl(`--cat-${i + 1}-ink`, inkHex(v, theme), indent)));
  c.sequential.forEach((v, i) => lines.push(decl(`--chart-seq-${i + 1}`, v, indent)));
  c.diverging.forEach((v, i) => lines.push(decl(`--chart-div-${i + 1}`, v, indent)));
  return lines.join('\n');
}

/** Theme-independent: each series and tint follows its slot in whichever theme
 *  block applies, and the tint follows whichever --panel the page (or skin) set. */
function derivedVars(indent) {
  const lines = [];
  for (let i = 1; i <= CHART_CATEGORICAL; i++)
    lines.push(
      decl(
        `--cat-${i}-tint`,
        `color-mix(in oklch, var(--cat-${i}) ${Math.round(TINT_SHARE * 100)}%, var(--panel))`,
        indent,
      ),
    );
  for (let i = 1; i <= CHART_CATEGORICAL; i++)
    lines.push(decl(`--chart-${i}`, `var(--cat-${i})`, indent));
  return lines.join('\n');
}

export function buildDatavizCss() {
  const banner =
    `/* @ponchia/ui — GENERATED from tokens/charts.js by scripts/gen-charts.mjs.\n` +
    ` *  Do not edit by hand; run \`npm run charts:build\`. Drift-checked in CI.\n` +
    ` *\n` +
    ` *  Tier-4 categorical + data-viz palette (ADR-0001). OPT-IN: import\n` +
    ` *  \`@ponchia/ui/css/dataviz.css\` on demand; never in the default bundle, never\n` +
    ` *  UI chrome. Eight fixed hues (blue, orange, aqua, yellow, magenta, green,\n` +
    ` *  violet, red) in two namespaces:\n` +
    ` *    --cat-N / --cat-N-tint / --cat-N-ink  categorical identity (a tag, a\n` +
    ` *      participant, a user-chosen tint): ink holds 4.5:1 on the panel and tint.\n` +
    ` *    --chart-N, --chart-seq-*, --chart-div-*  data-viz series and ramps.\n` +
    ` *  Pair colour N with pattern N (a 2nd, non-colour channel):\n` +
    ` *  background: var(--chart-3); background-image: var(--chart-pattern-3);\n` +
    ` *  background-size: var(--chart-pattern-size); --chart-pattern-ink: <contrast>. */\n`;

  const patterns =
    `  /* Dot-matrix pattern fills — pair with the matching colour (WCAG 1.4.1).\n` +
    `     Series 1 is intentionally \`none\`: absence-of-pattern IS its redundant\n` +
    `     channel. Adjacent series are separated under simulated colour-vision\n` +
    `     deficiency (gated by check:charts), so a colour+pattern chart stays\n` +
    `     distinguishable; a pattern-ONLY chart must still give series 1 a fill or\n` +
    `     a labelled legend. */\n` +
    `  --chart-pattern-size: 8px;\n` +
    `  --chart-pattern-ink: rgb(0 0 0 / 0.34);\n` +
    PATTERNS.map((p, i) => `  --chart-pattern-${i + 1}: ${p};`).join('\n');

  const darkPatternInk = `  --chart-pattern-ink: rgb(255 255 255 / 0.42);`;

  return (
    `${banner}\n` +
    `:root {\n${themeVars('light', '  ')}\n\n` +
    `  /* Theme-independent: each series and tint follows its slot, and the tint\n` +
    `     follows whichever --panel the page, a skin or the OLED preset set. */\n` +
    `${derivedVars('  ')}\n\n${patterns}\n}\n\n` +
    `@media (prefers-color-scheme: dark) {\n` +
    `  :root:not([data-theme='light']) {\n${themeVars('dark', '    ')}\n  ${darkPatternInk.trim()}\n  }\n}\n\n` +
    `:root[data-theme='dark'] {\n${themeVars('dark', '  ')}\n${darkPatternInk}\n}\n\n` +
    // Print always uses the light, ink-on-white palette — dark ramps, inks and
    // pattern ink are unreadable on white paper (PDF export).
    `@media print {\n` +
    `  :root:not([data-theme='light']) {\n${themeVars('light', '    ')}\n    --chart-pattern-ink: rgb(0 0 0 / 0.34);\n  }\n}\n`
  );
}

export function buildChartsJson() {
  const forTheme = (theme) => {
    const categorical = charts[theme].categorical.map((v) => resolveColor(v, theme));
    return {
      categorical,
      tint: categorical.map((v) => tintHex(v, theme)),
      ink: categorical.map((v) => inkHex(v, theme)),
      sequential: charts[theme].sequential.map((v) => resolveColor(v, theme)),
      diverging: charts[theme].diverging.map((v) => resolveColor(v, theme)),
    };
  };
  const out = {
    $comment:
      '@ponchia/ui categorical + data-viz palette resolved to static hex per theme, for non-CSS render targets (canvas/SVG/charting libs). `tint` is resolved over the theme --panel; a page that re-points --panel (a skin, OLED) should read the live --cat-N-tint instead, or use @ponchia/ui/renderer. Generated from tokens/charts.js — do not edit by hand; run `npm run charts:build`. Drift-checked in CI.',
    hues: [...CATEGORICAL_HUES],
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
  const hues = CATEGORICAL_HUES.map((h) => `'${h}'`).join(', ');
  return `${banner}
/** A theme's categorical + data-viz palette, as authored. Values are CSS
 *  colour strings (sRGB hex for the measured categorical and sequential sets,
 *  OKLCH for the diverging ramp). For resolved sRGB **hex** of every set,
 *  including the derived tints and inks, import \`@ponchia/ui/charts.json\`;
 *  for values that follow a live page (skins, OLED, contrast) use
 *  \`@ponchia/ui/renderer\`. */
export interface ChartTheme {
  /** ${CHART_CATEGORICAL} categorical hues in fixed order: ${CATEGORICAL_HUES.join(', ')}. */
  categorical: string[];
  /** Single-hue sequential ramp; step 1 sits nearest the theme surface. */
  sequential: string[];
  /** Diverging ramp (− … neutral … +), for gains/losses. */
  diverging: string[];
}

/** The categorical series custom-property names (1-based). */
export type ChartTokenName =
  | ${cat.join('\n  | ')};

/** A categorical slot's hue name. */
export type CategoricalHue = ${CATEGORICAL_HUES.map((h) => `'${h}'`).join(' | ')};

/** The hue each categorical slot carries, in slot order. */
export declare const CATEGORICAL_HUES: readonly [${hues}];

/** The opt-in categorical + data-viz palette source, per theme. */
export declare const charts: { light: ChartTheme; dark: ChartTheme };

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

if (isMain(import.meta.url)) writeGenerated(root, generated);
