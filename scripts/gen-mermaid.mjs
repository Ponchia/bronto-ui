/**
 * Generate the opt-in Mermaid theme map from the bronto token source:
 *
 *   tokens/mermaid.js    ← brontoMermaidTheme() helper + resolved per-theme map
 *   tokens/mermaid.json  ← resolved `base` themeVariables per theme (any consumer)
 *   tokens/mermaid.d.ts  ← MermaidThemeVariables + helper types
 *
 * Same model as gen-charts / gen-skins: the mapping (bronto token → Mermaid
 * `base` themeVariables key) lives HERE; the generated files are committed and
 * drift-checked by scripts/check-mermaid.mjs.
 *
 * WHY resolved hex (not `var(--x)`): Mermaid's theming engine derives shades
 * (khroma lighten/darken) and only understands real colours — a `var(--accent)`
 * string breaks derivation. So we project the same tokens that feed
 * tokens/resolved.json / charts.json into static per-theme colours, exactly the
 * "cross-target via tokens, not components" path (ADR-0002). This is the theme
 * map only: Mermaid stays the consumer's renderer; we hand it a config object
 * and never import or run it.
 *
 * Run: node scripts/gen-mermaid.mjs   (or: npm run mermaid:build)
 */
import { resolve } from 'node:path';
import { format, resolveConfig } from 'prettier';
import { cssVars } from '../tokens/index.js';
import { charts } from '../tokens/charts.js';
import { makeResolveRef } from './lib/resolve-ref.mjs';
import { repoRoot as root, isMain, writeGenerated, genBanner } from './lib/emit.mjs';

const resolveRef = makeResolveRef('gen-mermaid');
const JS_PATH = resolve(root, 'tokens/mermaid.js');
const prettierCfg = await resolveConfig(JS_PATH);

const SANS = cssVars.global['--sans'];
if (!SANS) throw new Error('gen-mermaid: tokens/index.js no longer exports global --sans');

/**
 * The mapping: Mermaid `base` themeVariable → a bronto token reference
 * (`var(--token)`) or a literal (the font stack). Theme-independent; resolution
 * to per-theme hex happens in resolveRef(). Monochrome surfaces + lines, the
 * rationed accent reserved for notes/emphasis — the bronto grammar applied to a
 * diagram. The categorical palette (pie/git/journey) is layered on below.
 */
export const MAP = {
  background: 'var(--bg)',
  fontFamily: SANS,

  // Seed colours Mermaid derives the rest from.
  primaryColor: 'var(--panel)',
  primaryTextColor: 'var(--text)',
  primaryBorderColor: 'var(--line-strong)',
  secondaryColor: 'var(--panel-soft)',
  secondaryTextColor: 'var(--text)',
  secondaryBorderColor: 'var(--line)',
  tertiaryColor: 'var(--bg-elevated)',
  tertiaryTextColor: 'var(--text)',
  tertiaryBorderColor: 'var(--line)',

  // Shared node / edge / cluster grammar.
  lineColor: 'var(--line-strong)',
  textColor: 'var(--text)',
  mainBkg: 'var(--panel)',
  nodeBorder: 'var(--line-strong)',
  nodeTextColor: 'var(--text)',
  titleColor: 'var(--text)',
  edgeLabelBackground: 'var(--bg)',
  clusterBkg: 'var(--bg-elevated)',
  clusterBorder: 'var(--line)',
  labelColor: 'var(--text)',

  // Notes — the one place the accent is spent.
  noteBkgColor: 'var(--panel-soft)',
  noteTextColor: 'var(--text)',
  noteBorderColor: 'var(--accent)',

  // Errors — the danger tone, used for genuine status only.
  errorBkgColor: 'var(--danger-soft)',
  errorTextColor: 'var(--danger)',

  // Sequence diagrams.
  actorBkg: 'var(--panel)',
  actorBorder: 'var(--line-strong)',
  actorTextColor: 'var(--text)',
  actorLineColor: 'var(--line)',
  signalColor: 'var(--text)',
  signalTextColor: 'var(--text)',
  labelBoxBkgColor: 'var(--panel-soft)',
  labelBoxBorderColor: 'var(--line)',
  labelTextColor: 'var(--text)',
  loopTextColor: 'var(--text)',
  activationBorderColor: 'var(--line-strong)',
  activationBkgColor: 'var(--panel-strong)',
  sequenceNumberColor: 'var(--button-text)',

  // Pie — non-palette chrome (the wedge palette is pie1..12 below).
  pieTitleTextColor: 'var(--text)',
  pieSectionTextColor: 'var(--text)',
  pieLegendTextColor: 'var(--text)',
  pieStrokeColor: 'var(--bg)',
  pieOuterStrokeColor: 'var(--line-strong)',

  // Git graph labels.
  commitLabelColor: 'var(--text)',
  commitLabelBackground: 'var(--bg-elevated)',
  tagLabelColor: 'var(--text)',
  tagLabelBackground: 'var(--panel-soft)',
  tagLabelBorder: 'var(--line)',
};

/** Keys whose value is NOT a colour (skipped by the colour gate). */
export const NON_COLOR_KEYS = new Set(['fontFamily', 'darkMode']);

/** Build the resolved `base` themeVariables for one theme. */
export function themeVars(theme) {
  const out = { darkMode: theme === 'dark' };
  for (const [k, ref] of Object.entries(MAP)) out[k] = resolveRef(ref, theme);

  // Categorical palette → the chart-like diagram series (pie / git / journey).
  // Series 1 is the resolved theme accent; the rest is the CVD-safe charts palette.
  const cat = charts[theme].categorical.map((v) => resolveRef(v, theme));
  for (let i = 1; i <= 12; i++) out[`pie${i}`] = cat[(i - 1) % cat.length];
  for (let i = 0; i <= 7; i++) out[`git${i}`] = cat[i % cat.length];
  for (let i = 0; i <= 7; i++) out[`fillType${i}`] = cat[i % cat.length];
  return out;
}

/** The full key set the map commits to providing (used by the coverage gate). */
export const REQUIRED_KEYS = Object.keys(themeVars('light'));

const themes = { light: themeVars('light'), dark: themeVars('dark') };

export function buildMermaidJson() {
  const out = {
    $comment:
      "@ponchia/ui Mermaid `base` themeVariables resolved to static colours per theme. Pass as mermaid.initialize({ theme: 'base', themeVariables }). Monochrome surfaces + one rationed accent; the categorical palette (pie/git/journey) is the CVD-safe charts set. Generated from the token source — do not edit by hand; run `npm run mermaid:build`. Drift-checked in CI.",
    light: themes.light,
    dark: themes.dark,
  };
  return JSON.stringify(out, null, 2) + '\n';
}

export async function buildMermaidJs() {
  const banner = genBanner('gen-mermaid.mjs', 'mermaid:build', [
    'An on-brand Mermaid theme, resolved to static colours per theme. Mermaid',
    "is the consumer's renderer — this is config only, we never import it.",
    "Values are resolved hex/rgba on purpose: Mermaid's theming engine derives",
    'shades and cannot read `var(--x)`. See docs/mermaid.md.',
  ]);
  const raw =
    `${banner}\n` +
    `/** Resolved Mermaid \`base\` themeVariables for each bronto theme. */\n` +
    `export const mermaid = ${JSON.stringify(themes)};\n\n` +
    `/** Ready-to-spread Mermaid config for a bronto theme (default \`light\`):\n` +
    ` *  \`mermaid.initialize(brontoMermaidTheme(document.documentElement.dataset.theme))\`. */\n` +
    `export function brontoMermaidTheme(theme = 'light') {\n` +
    `  return { theme: 'base', themeVariables: mermaid[theme === 'dark' ? 'dark' : 'light'] };\n` +
    `}\n\n` +
    `export default brontoMermaidTheme;\n`;
  // Format through Prettier so the committed file is byte-stable AND passes
  // check:format — the data object is machine-emitted, not hand-laid-out.
  return format(raw, { ...prettierCfg, filepath: JS_PATH });
}

export function buildMermaidDts() {
  const banner = genBanner('gen-mermaid.mjs', 'mermaid:build');
  return `${banner}
/** A resolved Mermaid \`base\` theme: \`darkMode\` plus colour-valued
 *  themeVariables (hex/rgba). For the per-key contract see docs/mermaid.md. */
export interface MermaidThemeVariables {
  darkMode: boolean;
  fontFamily: string;
  [key: string]: string | boolean;
}

/** Resolved Mermaid \`base\` themeVariables for each bronto theme. */
export declare const mermaid: { light: MermaidThemeVariables; dark: MermaidThemeVariables };

/** Ready-to-spread Mermaid config (\`{ theme: 'base', themeVariables }\`) for a
 *  bronto theme. Unknown/omitted falls back to light. */
export declare function brontoMermaidTheme(theme?: 'light' | 'dark'): {
  theme: 'base';
  themeVariables: MermaidThemeVariables;
};

declare const _default: typeof brontoMermaidTheme;
export default _default;
`;
}

/** The committed artifacts, freshly built (async: the .js is Prettier-formatted). */
export async function buildGenerated() {
  return {
    'tokens/mermaid.js': await buildMermaidJs(),
    'tokens/mermaid.json': buildMermaidJson(),
    'tokens/mermaid.d.ts': buildMermaidDts(),
  };
}

if (isMain(import.meta.url)) writeGenerated(root, await buildGenerated());
