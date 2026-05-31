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
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GLYPH_NAMES, GLYPH_SIZE } from '../glyphs/glyphs.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const banner = (src) =>
  `/** @ponchia/ui — GENERATED from ${src} by scripts/gen-glyphs.mjs.\n` +
  ` *  Do not edit by hand; run \`npm run glyphs:build\`. Drift-checked in CI. */\n`;

const u = (names) => names.map((n) => `'${n}'`).join('\n  | ');

const glyphsDts = `${banner('glyphs/glyphs.js')}
/** Every display-glyph name @ponchia/ui ships (literal union). */
export type GlyphName =
  | ${u(GLYPH_NAMES)};

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
  /** Expose as \`role="img"\` with this label; omit for decorative (aria-hidden). */
  label?: string;
  /** CSS length for one dot (sets \`--dotmatrix-dot\`). */
  dot?: string;
  /** CSS length for the gap between dots (sets \`--dotmatrix-gap\`). */
  gap?: string;
}

/** The grid edge length (rows = cols = ${GLYPH_SIZE}). */
export declare const GLYPH_SIZE: ${GLYPH_SIZE};

/** The frozen name→bitmap registry. */
export declare const GLYPHS: Readonly<Record<GlyphName, Glyph>>;

/** Every glyph name, frozen and sorted. */
export declare const GLYPH_NAMES: readonly GlyphName[];

/** The raw bitmap rows for a glyph, or \`undefined\` if the name is unknown. */
export declare function glyph(name: GlyphName): Glyph | undefined;

/** ${GLYPH_SIZE * GLYPH_SIZE} cell descriptors (row-major), or \`[]\` if unknown. */
export declare function glyphCells(name: GlyphName): GlyphCell[];

/** A full \`.ui-dotmatrix\` HTML string for a glyph (\`''\` if unknown). */
export declare function renderGlyph(name: GlyphName, options?: RenderGlyphOptions): string;
`;

export const generated = {
  'glyphs/glyphs.d.ts': glyphsDts,
};

// Run as a script → write; imported by check-glyphs → just expose `generated`.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const [rel, content] of Object.entries(generated)) {
    writeFileSync(resolve(root, rel), content);
    console.log(`✓ wrote ${rel}`);
  }
}
