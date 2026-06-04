/**
 * Generate the literal-typed declaration file for the display-glyph set, so
 * the `./glyphs` contract is exact (a `GlyphName` autocompletes, a typo is a
 * type error) and cannot silently rot away from the runtime data:
 *
 *   glyphs/glyphs.d.ts ← glyphs/glyphs.js  (GlyphName union + helper signatures)
 *
 * Same model as classes/index.d.ts and tokens/index.d.ts: generated,
 * committed, and drift-checked by scripts/check-glyphs.mjs (wired into
 * `npm run check`).
 *
 * Run: node scripts/gen-glyphs.mjs
 */
import { GLYPH_NAMES, GLYPH_SIZE } from '../glyphs/glyphs.js';

import { repoRoot as root, isMain, writeGenerated } from './lib/emit.mjs';

const banner = (src) =>
  `/** @ponchia/ui — GENERATED from ${src} by scripts/gen-glyphs.mjs.\n` +
  ` *  Do not edit by hand; run \`npm run glyphs:build\`. Drift-checked in CI. */\n`;

const u = (names) => names.map((n) => `'${n}'`).join('\n  | ');

const glyphsDts = `${banner('glyphs/glyphs.js')}
/** Every display-glyph name @ponchia/ui ships (literal union). Use this as a
 *  type annotation to reject typos (\`const n: GlyphName = 'arow'\` is an error). */
export type GlyphName =
  | ${u(GLYPH_NAMES)};

/** A glyph name, or any string — for dynamic dispatch (a CMS/config value). The
 *  known names still autocomplete; an unknown name hits the runtime fallback
 *  (\`glyph\`→\`undefined\`, \`glyphCells\`→\`[]\`, \`renderGlyph\`→\`''\`). */
export type GlyphNameInput = GlyphName | (string & {});

/** A glyph is ${GLYPH_SIZE} rows of ${GLYPH_SIZE} chars: \`.\` off, \`#\` lit, \`*\` accent. */
export type Glyph = readonly string[];

/** One rendered dot. \`on:false\` is an unlit panel dot; tone picks the lit color. */
export interface GlyphCell {
  on: boolean;
  tone?: 'hot' | 'accent';
}

export interface RenderGlyphOptions {
  /** Show the unlit panel dots (default true). \`false\` → glyph-only look. */
  grid?: boolean;
  /** Render lit cells as square, gapless pixels (a filled silhouette) instead
   *  of separated dots — the legible mode at small/inline sizes (~16–24px).
   *  Implies glyph-only. Default false (the dot-matrix display look). */
  solid?: boolean;
  /** Opt into a decorative animation (disabled under \`prefers-reduced-motion\`;
   *  meaning stays in the static frame + \`label\`). \`'reveal'\` powers the cells
   *  on in a scan; \`'pulse'\` makes the glyph breathe. */
  anim?: 'reveal' | 'pulse';
  /** Expose as \`role="img"\` with this label; omit for decorative (aria-hidden). */
  label?: string;
  /** CSS length for one dot (sets \`--dotmatrix-dot\`; sanitized — a value that
   *  is not a plain length/calc expression is dropped). */
  dot?: string;
  /** CSS length for the gap between dots (sets \`--dotmatrix-gap\`; sanitized
   *  the same way as \`dot\`). */
  gap?: string;
  /** \`'mask'\` returns a single \`.ui-icon\` element masked by the glyph bitmap
   *  (one DOM node, not GLYPH_SIZE²) — the icon-at-scale path. Inherits
   *  \`currentColor\`; the cell-mode options above don't apply. Needs the
   *  \`.ui-icon\` rule from \`@ponchia/ui/css\`. */
  render?: 'mask';
  /** With \`render: 'mask'\`, the icon size (sets \`--icon-size\`; defaults to
   *  \`1em\`; sanitized to a length/calc allowlist). */
  size?: string;
}

/** The grid edge length (rows = cols = ${GLYPH_SIZE}). */
export declare const GLYPH_SIZE: ${GLYPH_SIZE};

/** The frozen name→bitmap registry. */
export declare const GLYPHS: Readonly<Record<GlyphName, Glyph>>;

/** Every glyph name, frozen and sorted. */
export declare const GLYPH_NAMES: readonly GlyphName[];

/** The raw bitmap rows for a glyph, or \`undefined\` if the name is unknown. */
export declare function glyph(name: GlyphNameInput): Glyph | undefined;

/** ${GLYPH_SIZE * GLYPH_SIZE} cell descriptors (row-major), or \`[]\` if unknown. */
export declare function glyphCells(name: GlyphNameInput): GlyphCell[];

/** The CSS \`mask-image\` \`url()\` for a glyph (the \`--icon-mask\` value on a
 *  \`.ui-icon\`), or \`''\` if unknown. Single-tone. */
export declare function glyphMask(name: GlyphNameInput): string;

/** A full \`.ui-dotmatrix\` HTML string for a glyph (\`''\` if unknown). */
export declare function renderGlyph(name: GlyphNameInput, options?: RenderGlyphOptions): string;

/** Hand-curated intent→glyph search aliases (e.g. \`trash\`→\`delete\`/\`remove\`).
 *  Keys are real glyph names; values are extra search terms. */
export declare const GLYPH_TAGS: Readonly<Partial<Record<GlyphName, readonly string[]>>>;

/** Glyph names whose name OR a search alias contains \`query\` (case-insensitive),
 *  sorted. \`findGlyphs('')\` returns every name. */
export declare function findGlyphs(query: string): GlyphName[];

/** Options for renderReadout. The per-glyph fields pass through to renderGlyph
 *  for each character; \`gap\` sets \`--readout-gap\` on the row. */
export interface RenderReadoutOptions {
  /** Accessible name for the whole readout (defaults to the raw text). The dot
   *  digits are decorative; this carries the real value. */
  label?: string;
  /** CSS length between characters (sets \`--readout-gap\`; sanitized). */
  gap?: string;
  /** Render each character as square gapless pixels (legible small). */
  solid?: boolean;
  /** Show the unlit panel dots behind each character (default true). */
  grid?: boolean;
  /** Decorative per-character animation (reduced-motion-safe). */
  anim?: 'reveal' | 'pulse';
  /** CSS length for one dot of each character (sets \`--dotmatrix-dot\`). */
  dot?: string;
  /** \`'mask'\` renders each character as a single \`.ui-icon\` node (lightest). */
  render?: 'mask';
  /** With \`render: 'mask'\`, the per-character icon size. */
  size?: string;
}

/** A row of dot-matrix glyphs for a numeric string (digits + \`: , . % - +\` and
 *  space) — the big Nothing-style readout. \`''\` for empty input. */
export declare function renderReadout(text: string, options?: RenderReadoutOptions): string;
`;

export const generated = {
  'glyphs/glyphs.d.ts': glyphsDts,
};

// Run as a script → write; imported by check-glyphs → just expose `generated`.
if (isMain(import.meta.url)) writeGenerated(root, generated);
