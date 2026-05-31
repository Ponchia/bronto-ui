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

/** A full \`.ui-dotmatrix\` HTML string for a glyph (\`''\` if unknown). */
export declare function renderGlyph(name: GlyphNameInput, options?: RenderGlyphOptions): string;
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
