/**
 * Generate the literal-typed declaration files from the JS sources, so
 * the public contract is exact (autocomplete + typo errors) and cannot
 * silently rot away from the runtime:
 *
 *   classes/index.d.ts ← classes/index.js  (cls keys + literal values)
 *   tokens/index.d.ts  ← tokens/index.js   (token-name unions)
 *
 * Same model as tokens/index.json and dist/: generated, committed, and
 * drift-checked by scripts/check-dts.mjs (wired into `npm run check`).
 *
 * Run: node scripts/gen-dts.mjs
 */
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cls } from '../classes/index.js';
import { cssVars } from '../tokens/index.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const banner = (src) =>
  `/** @ponchia/ui — GENERATED from ${src} by scripts/gen-dts.mjs.\n` +
  ` *  Do not edit by hand; run \`npm run dts:build\`. Drift-checked in CI. */\n`;

const u = (names) => names.map((n) => `'${n}'`).join(' | ');

// --- classes/index.d.ts ---------------------------------------------------
// The recipe option interfaces are curated (they encode option shapes that
// aren't derivable from `cls`); only the `cls` literal map is generated.
const clsType =
  '{\n' +
  Object.entries(cls)
    .map(([k, v]) => `  readonly ${k}: '${v}';`)
    .join('\n') +
  '\n}';

const classesDts = `${banner('classes/index.js')}
export type ClassValue = string | false | null | undefined | ClassValue[];

/** The flat registry of every class @ponchia/ui defines (literal). */
export declare const cls: ${clsType};

/** classnames-style joiner: skips falsy, flattens arrays. */
export declare function cx(...parts: ClassValue[]): string;

export interface ButtonOpts {
  variant?: 'ghost' | 'subtle' | 'danger';
  icon?: boolean;
}
export interface CardOpts {
  accent?: boolean;
  interactive?: boolean;
}
export interface BadgeOpts {
  tone?: 'accent' | 'success' | 'warning' | 'danger';
}
export interface ChipOpts {
  accent?: boolean;
}
export interface LinkOpts {
  arrow?: boolean;
}
export interface DotOpts {
  tone?: 'accent' | 'success' | 'warning' | 'danger';
  live?: boolean;
}
export interface DotgridOpts {
  accent?: boolean;
  dense?: boolean;
}
export interface TableOpts {
  density?: 'dense' | 'comfortable';
  lined?: boolean;
}
export interface EyebrowOpts {
  muted?: boolean;
}
export interface HintOpts {
  error?: boolean;
}
export interface ClusterOpts {
  between?: boolean;
}
export interface StaggerOpts {
  auto?: boolean;
}
export type Tone = 'accent' | 'success' | 'warning' | 'danger';
export interface AlertOpts {
  tone?: Tone;
}
export interface ToastOpts {
  tone?: Tone;
}
export interface ProgressOpts {
  indeterminate?: boolean;
}
export interface DotspinnerOpts {
  size?: 'sm' | 'lg';
}
export interface DotbarOpts {
  indeterminate?: boolean;
}
export interface ModalOpts {
  drawer?: boolean;
}
export interface TabOpts {
  active?: boolean;
}
export interface AvatarOpts {
  size?: 'sm' | 'lg';
}
export interface ProseOpts {
  compact?: boolean;
}
export interface ContainerOpts {
  narrow?: boolean;
}
export interface TagOpts {
  accent?: boolean;
}

export interface Ui {
  button(opts?: ButtonOpts): string;
  card(opts?: CardOpts): string;
  badge(opts?: BadgeOpts): string;
  chip(opts?: ChipOpts): string;
  link(opts?: LinkOpts): string;
  dot(opts?: DotOpts): string;
  dotgrid(opts?: DotgridOpts): string;
  table(opts?: TableOpts): string;
  eyebrow(opts?: EyebrowOpts): string;
  hint(opts?: HintOpts): string;
  cluster(opts?: ClusterOpts): string;
  stagger(opts?: StaggerOpts): string;
  alert(opts?: AlertOpts): string;
  toast(opts?: ToastOpts): string;
  progress(opts?: ProgressOpts): string;
  dotspinner(opts?: DotspinnerOpts): string;
  dotbar(opts?: DotbarOpts): string;
  modal(opts?: ModalOpts): string;
  tab(opts?: TabOpts): string;
  avatar(opts?: AvatarOpts): string;
  prose(opts?: ProseOpts): string;
  container(opts?: ContainerOpts): string;
  tag(opts?: TagOpts): string;
}

export declare const ui: Ui;
export default ui;
`;

// --- tokens/index.d.ts ----------------------------------------------------
const strip = (names) => names.map((n) => n.replace(/^--/, ''));
const globalNames = Object.keys(cssVars.global);
const lightNames = Object.keys(cssVars.light);
const darkNames = Object.keys(cssVars.dark);

const tokensDts = `${banner('tokens/index.js')}
export type ThemeName = 'light' | 'dark';

export type GlobalTokenName = ${u(globalNames)};
export type LightTokenName = ${u(lightNames)};
export type DarkTokenName = ${u(darkNames)};

/** Exact mirror of the :root blocks in css/tokens.css (literal keys). */
export declare const cssVars: {
  global: Record<GlobalTokenName, string>;
  light: Record<LightTokenName, string>;
  dark: Record<DarkTokenName, string>;
};

export type ScaleKey = ${u(strip(globalNames))};
export type ColorKey = ${u(strip(lightNames))};

/** Ergonomic view derived from {@link cssVars} (\`--\` prefix stripped). */
export declare const tokens: {
  scale: Record<ScaleKey, string>;
  color: { light: Record<ColorKey, string>; dark: Record<ColorKey, string> };
};

/** Resolve the palette for a theme. Unknown/omitted falls back to light. */
export declare function themeColor(theme?: ThemeName): Record<ColorKey, string>;

export default tokens;
`;

export const generated = {
  'classes/index.d.ts': classesDts,
  'tokens/index.d.ts': tokensDts,
};

// Run as a script → write; imported by check-dts → just expose `generated`.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const [rel, content] of Object.entries(generated)) {
    writeFileSync(resolve(root, rel), content);
    console.log(`✓ wrote ${rel}`);
  }
}
