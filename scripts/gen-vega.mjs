/**
 * Generate the opt-in Vega-Lite / Vega theme config from the bronto token
 * source:
 *
 *   tokens/vega.js    ← brontoVegaConfig() helper + resolved per-theme config
 *   tokens/vega.json  ← resolved Vega-Lite `config` per theme (any consumer)
 *   tokens/vega.d.ts  ← VegaConfig + helper types
 *
 * Same model as gen-mermaid / gen-d2: the mapping (bronto token → Vega-Lite
 * `config` slot) lives HERE; the generated files are committed and drift-checked
 * by scripts/check-vega.mjs.
 *
 * WHY resolved hex (not `var(--x)`): Vega-Lite compiles a spec to a Vega scene
 * that is rendered to SVG **or canvas** — colours are baked into the output and
 * parsed by d3-color, which understands real hex/rgb but not `var()` (nor
 * `oklch()`). So we project the same tokens that feed tokens/resolved.json /
 * charts.json into static per-theme colours, exactly the "cross-target via
 * tokens, not components" path (ADR-0002). This is the theme config only: Vega
 * stays the consumer's renderer; we hand it a `config` object and never import
 * or run it (the headless render-probe in test/vega-render.test.mjs is dev-only).
 *
 * The artifact is the idiomatic Vega theme shape — a `config` object, the same
 * kind the `vega-themes` package ships (dark / fivethirtyeight / latimes / …).
 * Spread it into a spec's `config`, or pass `{ config }` to vega-embed.
 *
 * Run: node scripts/gen-vega.mjs   (or: npm run vega:build)
 */
import { resolve } from 'node:path';
import { format, resolveConfig } from 'prettier';
import { cssVars } from '../tokens/index.js';
import { vegaConfig } from '../renderer/index.js';
import { buildResolved } from './gen-resolved.mjs';
import { generated as chartArtifacts } from './gen-charts.mjs';
import { repoRoot as root, isMain, writeGenerated, genBanner } from './lib/emit.mjs';

const JS_PATH = resolve(root, 'tokens/vega.js');
const prettierCfg = await resolveConfig(JS_PATH);

const SANS = cssVars.global['--sans'];
const MONO = cssVars.global['--mono'];
if (!SANS) throw new Error('gen-vega: tokens/index.js no longer exports global --sans');

/**
 * The static tokens for one theme, in the shape `@ponchia/ui/renderer`'s
 * `readTokens()` returns for a live page: the same mapping produces both the
 * runtime config and this per-theme snapshot, so the two cannot drift.
 */
export function staticTokens(theme) {
  const t = theme === 'dark' ? 'dark' : 'light';
  const r = buildResolved()[t];
  const c = JSON.parse(chartArtifacts['tokens/charts.json'])[t];
  return {
    scheme: t,
    bg: r['--bg'],
    bgElevated: r['--bg-elevated'],
    panel: r['--panel'],
    panelStrong: r['--panel-strong'],
    text: r['--text'],
    textSoft: r['--text-soft'],
    textDim: r['--text-dim'],
    line: r['--line'],
    lineStrong: r['--line-strong'],
    accent: r['--accent'],
    accentText: r['--accent-text'],
    onAccent: r['--on-accent'],
    focus: r['--focus-ring'],
    selection: r['--accent'],
    success: r['--success'],
    warning: r['--warning'],
    danger: r['--danger'],
    info: r['--info'],
    sans: SANS,
    mono: MONO,
    categorical: c.categorical,
    categoricalTint: c.tint,
    categoricalInk: c.ink,
    sequential: c.sequential,
    diverging: c.diverging,
  };
}

/** The flat config paths the static snapshot commits to (docs/vega.md). The
 *  coverage gate fails a theme that drops one. */
export const REQUIRED_PATHS = [
  'background',
  'font',
  'view.stroke',
  'mark.color',
  'rule.color',
  'text.color',
  'text.font',
  'title.color',
  'title.subtitleColor',
  'title.font',
  'title.subtitleFont',
  'axis.domainColor',
  'axis.gridColor',
  'axis.tickColor',
  'axis.labelColor',
  'axis.titleColor',
  'axis.labelFont',
  'axis.titleFont',
  'legend.labelColor',
  'legend.titleColor',
  'legend.labelFont',
  'legend.titleFont',
  'header.labelColor',
  'header.titleColor',
  'header.labelFont',
  'header.titleFont',
  'range.category',
  'range.ordinal',
  'range.ramp',
  'range.heatmap',
  'range.diverging',
];

/** A leaf path is a non-colour slot iff it is a font or a typographic/size/
 *  layout number, or the deliberately unset view frame. */
export const isFontPath = (path) => /(?:^|\.)font$|Font$/.test(path);

/** Build the resolved Vega-Lite `config` object for one theme: the runtime
 *  mapping applied to the theme's static tokens, on the page background. */
export function themeConfig(theme) {
  const tokens = staticTokens(theme);
  return vegaConfig(tokens, { background: tokens.bg });
}

const themes = { light: themeConfig('light'), dark: themeConfig('dark') };

export function buildVegaJson() {
  const out = {
    $comment:
      "@ponchia/ui Vega-Lite `config` resolved to static colours per theme, on the page background. Spread into a spec's `config`, or pass `{ config }` to vega-embed. Quiet chrome in the bronto inks; `range.category` is the 8-hue categorical palette (a single series takes its first hue), `range.ramp`/`heatmap`/`ordinal` the sequential ramp, `range.diverging` the −…+ ramp. A page that switches skin, contrast or surface at runtime should build its config with @ponchia/ui/renderer instead. Resolved hex on purpose: Vega bakes colours into SVG/canvas and cannot read var(). Generated from the token source — do not edit by hand; run `npm run vega:build`. Drift-checked in CI.",
    light: themes.light,
    dark: themes.dark,
  };
  return JSON.stringify(out, null, 2) + '\n';
}

export async function buildVegaJs() {
  const banner = genBanner('gen-vega.mjs', 'vega:build', [
    'An on-brand Vega-Lite / Vega `config`, resolved to static colours per',
    "theme. Vega is the consumer's renderer — this is config only, we never",
    'import it. Values are resolved hex on purpose: Vega bakes colours into',
    'the SVG/canvas scene and cannot read `var(--x)`. See docs/vega.md.',
  ]);
  const raw =
    `${banner}\n` +
    `/** Resolved Vega-Lite \`config\` for each bronto theme. */\n` +
    `export const vega = ${JSON.stringify(themes)};\n\n` +
    `const ACCENT = ${JSON.stringify({ light: staticTokens('light').accent, dark: staticTokens('dark').accent })};\n` +
    `const NEUTRAL = ${JSON.stringify({ light: staticTokens('light').textDim, dark: staticTokens('dark').textDim })};\n\n` +
    `/** The on-brand Vega-Lite \`config\` for a bronto theme (default \`light\`).\n` +
    ` *  Spread into a spec — \`{ ...spec, config: brontoVegaConfig(theme) }\` —\n` +
    ` *  or hand to vega-embed as \`{ config: brontoVegaConfig(theme) }\`. */\n` +
    `export function brontoVegaConfig(theme = 'light') {\n` +
    `  return vega[theme === 'dark' ? 'dark' : 'light'];\n` +
    `}\n\n` +
    `/** The resolved accent hex for a theme. Spend it on one emphasised mark in a\n` +
    ` *  multi-series chart (a Vega-Lite conditional to this colour) while the\n` +
    ` *  others stay neutral. Regenerate after changing \`--accent\`; already-\n` +
    ` *  rendered charts do not live-reskin (use @ponchia/ui/renderer for that). */\n` +
    `export function brontoVegaAccent(theme = 'light') {\n` +
    `  return ACCENT[theme === 'dark' ? 'dark' : 'light'];\n` +
    `}\n\n` +
    `/** The neutral hex for a theme — the quiet ink every other mark takes in\n` +
    ` *  accent-spending. */\n` +
    `export function brontoVegaNeutral(theme = 'light') {\n` +
    `  return NEUTRAL[theme === 'dark' ? 'dark' : 'light'];\n` +
    `}\n\n` +
    `export default brontoVegaConfig;\n`;
  // Format through Prettier so the committed file is byte-stable AND passes
  // check:format — the data object is machine-emitted, not hand-laid-out.
  return format(raw, { ...prettierCfg, filepath: JS_PATH });
}

export function buildVegaDts() {
  const banner = genBanner('gen-vega.mjs', 'vega:build');
  return `${banner}
/** A resolved Vega-Lite \`config\`: colour-valued chrome slots (hex), font
 *  stacks, and \`range.*\` palette arrays. Pass as a spec's \`config\` (or
 *  vega-embed's \`config\`). For the per-slot contract see docs/vega.md. */
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

/** Resolved Vega-Lite \`config\` for each bronto theme. */
export declare const vega: { light: VegaConfig; dark: VegaConfig };

/** The on-brand Vega-Lite \`config\` for a bronto theme. Unknown/omitted falls
 *  back to light. Spread into a spec's \`config\`, or pass to vega-embed. */
export declare function brontoVegaConfig(theme?: 'light' | 'dark'): VegaConfig;

/** The resolved accent hex for a theme — to spend the accent on one emphasised
 *  mark while the other marks stay neutral. */
export declare function brontoVegaAccent(theme?: 'light' | 'dark'): string;

/** The neutral ink hex for a theme (\`--text-dim\`). */
export declare function brontoVegaNeutral(theme?: 'light' | 'dark'): string;

declare const _default: typeof brontoVegaConfig;
export default _default;
`;
}

/** The committed artifacts, freshly built (async: the .js is Prettier-formatted). */
export async function buildGenerated() {
  return {
    'tokens/vega.js': await buildVegaJs(),
    'tokens/vega.json': buildVegaJson(),
    'tokens/vega.d.ts': buildVegaDts(),
  };
}

if (isMain(import.meta.url)) writeGenerated(root, await buildGenerated());
