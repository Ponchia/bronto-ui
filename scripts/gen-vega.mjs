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
import { charts } from '../tokens/charts.js';
import { resolveColor } from './gen-charts.mjs';
import { makeResolveRef } from './lib/resolve-ref.mjs';
import { repoRoot as root, isMain, writeGenerated, genBanner } from './lib/emit.mjs';

const resolveRef = makeResolveRef('gen-vega');
const JS_PATH = resolve(root, 'tokens/vega.js');
const prettierCfg = await resolveConfig(JS_PATH);

const SANS = cssVars.global['--sans'];
if (!SANS) throw new Error('gen-vega: tokens/index.js no longer exports global --sans');

const BACKGROUND = 'var(--bg)';
const VIEW_STROKE = 'var(--line)';
const MARK_COLOR = 'var(--accent)';
const RULE_COLOR = 'var(--line-strong)';
const TEXT_COLOR = 'var(--text)';
const TITLE_COLOR = 'var(--text)';
const TITLE_SUBTITLE_COLOR = 'var(--text-dim)';
const AXIS_DOMAIN_COLOR = 'var(--line-strong)';
const AXIS_GRID_COLOR = 'var(--line)';
const AXIS_TICK_COLOR = 'var(--line-strong)';
const AXIS_LABEL_COLOR = 'var(--text-soft)';
const AXIS_TITLE_COLOR = 'var(--text)';
const LEGEND_LABEL_COLOR = 'var(--text-soft)';
const LEGEND_TITLE_COLOR = 'var(--text)';
const HEADER_LABEL_COLOR = 'var(--text-soft)';
const HEADER_TITLE_COLOR = 'var(--text)';

/**
 * The chrome mapping: a dotted Vega-Lite `config` path → a bronto token
 * reference (`var(--token)`) or a literal (the font stack). Theme-independent;
 * resolution to per-theme hex happens in resolveRef(). Monochrome surfaces +
 * lines, the rationed accent reserved for the default mark — the bronto grammar
 * applied to a chart. The categorical / sequential / diverging palette is the
 * data-viz Tier-4 set, layered on as `range.*` below.
 */
export const CHROME = {
  background: BACKGROUND,

  // The plotting frame.
  'view.stroke': VIEW_STROKE,

  // Default mark — series 1 is the resolved theme accent.
  'mark.color': MARK_COLOR,
  // Reference rules / annotations stay neutral, never the accent.
  'rule.color': RULE_COLOR,
  'text.color': TEXT_COLOR,

  // Title + subtitle.
  'title.color': TITLE_COLOR,
  'title.subtitleColor': TITLE_SUBTITLE_COLOR,

  // Axes — domain/ticks are the stronger line, the grid is the soft line.
  'axis.domainColor': AXIS_DOMAIN_COLOR,
  'axis.gridColor': AXIS_GRID_COLOR,
  'axis.tickColor': AXIS_TICK_COLOR,
  'axis.labelColor': AXIS_LABEL_COLOR,
  'axis.titleColor': AXIS_TITLE_COLOR,

  // Legend.
  'legend.labelColor': LEGEND_LABEL_COLOR,
  'legend.titleColor': LEGEND_TITLE_COLOR,

  // Facet headers.
  'header.labelColor': HEADER_LABEL_COLOR,
  'header.titleColor': HEADER_TITLE_COLOR,
};

/** Font slots — every text-bearing component gets the bronto sans stack. Keys
 *  ending `Font`/`font` are non-colour (skipped by the colour gate). */
export const FONTS = {
  'title.font': SANS,
  'title.subtitleFont': SANS,
  'axis.labelFont': SANS,
  'axis.titleFont': SANS,
  'legend.labelFont': SANS,
  'legend.titleFont': SANS,
  'header.labelFont': SANS,
  'header.titleFont': SANS,
  'text.font': SANS,
};

/** Scale `range.*` slots → which resolved charts ramp feeds each. category is
 *  the 8-series categorical set; ordinal/ramp/heatmap share the single-hue
 *  sequential ramp; diverging is the −…+ ramp. */
export const RANGES = {
  'range.category': 'categorical',
  'range.ordinal': 'sequential',
  'range.ramp': 'sequential',
  'range.heatmap': 'sequential',
  'range.diverging': 'diverging',
};

/** A leaf path is a font slot (non-colour) iff its last segment is font-ish. */
export const isFontPath = (path) => /(?:^|\.)font$|Font$/.test(path);

/** The flat path set the config commits to (used by the coverage gate). */
export const REQUIRED_PATHS = [
  ...Object.keys(CHROME),
  ...Object.keys(FONTS),
  ...Object.keys(RANGES),
];

/** Build the resolved Vega-Lite `config` object for one theme. */
export function themeConfig(theme) {
  const themeName = theme === 'dark' ? 'dark' : 'light';
  const chartTheme = charts[themeName];
  const resolveThemeRef = (ref) => resolveRef(ref, themeName);
  const resolveRange = (values) => values.map((v) => resolveColor(v, themeName));

  return {
    background: resolveThemeRef(BACKGROUND),
    view: {
      stroke: resolveThemeRef(VIEW_STROKE),
    },
    mark: {
      color: resolveThemeRef(MARK_COLOR),
    },
    rule: {
      color: resolveThemeRef(RULE_COLOR),
    },
    text: {
      color: resolveThemeRef(TEXT_COLOR),
      font: FONTS['text.font'],
    },
    title: {
      color: resolveThemeRef(TITLE_COLOR),
      subtitleColor: resolveThemeRef(TITLE_SUBTITLE_COLOR),
      font: FONTS['title.font'],
      subtitleFont: FONTS['title.subtitleFont'],
    },
    axis: {
      domainColor: resolveThemeRef(AXIS_DOMAIN_COLOR),
      gridColor: resolveThemeRef(AXIS_GRID_COLOR),
      tickColor: resolveThemeRef(AXIS_TICK_COLOR),
      labelColor: resolveThemeRef(AXIS_LABEL_COLOR),
      titleColor: resolveThemeRef(AXIS_TITLE_COLOR),
      labelFont: FONTS['axis.labelFont'],
      titleFont: FONTS['axis.titleFont'],
    },
    legend: {
      labelColor: resolveThemeRef(LEGEND_LABEL_COLOR),
      titleColor: resolveThemeRef(LEGEND_TITLE_COLOR),
      labelFont: FONTS['legend.labelFont'],
      titleFont: FONTS['legend.titleFont'],
    },
    header: {
      labelColor: resolveThemeRef(HEADER_LABEL_COLOR),
      titleColor: resolveThemeRef(HEADER_TITLE_COLOR),
      labelFont: FONTS['header.labelFont'],
      titleFont: FONTS['header.titleFont'],
    },
    range: {
      category: resolveRange(chartTheme.categorical),
      ordinal: resolveRange(chartTheme.sequential),
      ramp: resolveRange(chartTheme.sequential),
      heatmap: resolveRange(chartTheme.sequential),
      diverging: resolveRange(chartTheme.diverging),
    },
  };
}

const themes = { light: themeConfig('light'), dark: themeConfig('dark') };

export function buildVegaJson() {
  const out = {
    $comment:
      "@ponchia/ui Vega-Lite `config` resolved to static colours per theme. Spread into a spec's `config`, or pass `{ config }` to vega-embed. Monochrome chrome + one rationed accent (the default mark / series 1); `range.category` is the CVD-safe 8-series palette, `range.ramp`/`heatmap`/`ordinal` the sequential ramp, `range.diverging` the −…+ ramp. Resolved hex on purpose: Vega bakes colours into SVG/canvas and cannot read var(). Generated from the token source — do not edit by hand; run `npm run vega:build`. Drift-checked in CI.",
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
    `/** The on-brand Vega-Lite \`config\` for a bronto theme (default \`light\`).\n` +
    ` *  Spread into a spec — \`{ ...spec, config: brontoVegaConfig(theme) }\` —\n` +
    ` *  or hand to vega-embed as \`{ config: brontoVegaConfig(theme) }\`. */\n` +
    `export function brontoVegaConfig(theme = 'light') {\n` +
    `  return vega[theme === 'dark' ? 'dark' : 'light'];\n` +
    `}\n\n` +
    `/** The resolved accent hex for a theme — series 1 of \`range.category\`, the one\n` +
    ` *  chromatic mark. Use it to spend the accent on a single emphasised mark in\n` +
    ` *  a multi-series chart (a Vega-Lite conditional to this colour) without\n` +
    ` *  reverse-engineering the palette array index. Regenerate after changing\n` +
    ` *  \`--accent\`; already-rendered charts do not live-reskin. */\n` +
    `export function brontoVegaAccent(theme = 'light') {\n` +
    `  return vega[theme === 'dark' ? 'dark' : 'light'].range.category[0];\n` +
    `}\n\n` +
    `/** The neutral series hex for a theme — the last of \`range.category\` — for the\n` +
    ` *  "every other mark stays quiet" half of accent-spending. */\n` +
    `export function brontoVegaNeutral(theme = 'light') {\n` +
    `  const cat = vega[theme === 'dark' ? 'dark' : 'light'].range.category;\n` +
    `  return cat[cat.length - 1];\n` +
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

/** The resolved accent hex (series 1 of \`range.category\`) for a theme — to spend the
 *  accent on one emphasised mark without hard-coding the palette index. */
export declare function brontoVegaAccent(theme?: 'light' | 'dark'): string;

/** The neutral series hex (last of \`range.category\`) for a theme. */
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
