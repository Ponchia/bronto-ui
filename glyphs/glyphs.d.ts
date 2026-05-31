/** @ponchia/ui — GENERATED from glyphs/glyphs.js by scripts/gen-glyphs.mjs.
 *  Do not edit by hand; run `npm run glyphs:build`. Drift-checked in CI. */

/** Every display-glyph name @ponchia/ui ships (literal union). */
export type GlyphName =
  | 'arrow-right'
  | 'check'
  | 'cross'
  | 'heart'
  | 'spark';

/** A glyph is 16 rows of 16 chars: `.` off, `#` lit, `*` accent. */
export type Glyph = readonly string[];

/** One rendered dot. `on:false` is an unlit panel dot; tone picks the lit color. */
export interface GlyphCell {
  on: boolean;
  tone?: 'hot' | 'accent';
}

export interface RenderGlyphOptions {
  /** Show the unlit panel dots (default true). `false` → glyph-only look. */
  grid?: boolean;
  /** Expose as `role="img"` with this label; omit for decorative (aria-hidden). */
  label?: string;
  /** CSS length for one dot (sets `--dotmatrix-dot`). */
  dot?: string;
  /** CSS length for the gap between dots (sets `--dotmatrix-gap`). */
  gap?: string;
}

/** The grid edge length (rows = cols = 16). */
export declare const GLYPH_SIZE: 16;

/** The frozen name→bitmap registry. */
export declare const GLYPHS: Readonly<Record<GlyphName, Glyph>>;

/** Every glyph name, frozen and sorted. */
export declare const GLYPH_NAMES: readonly GlyphName[];

/** The raw bitmap rows for a glyph, or `undefined` if the name is unknown. */
export declare function glyph(name: GlyphName): Glyph | undefined;

/** 256 cell descriptors (row-major), or `[]` if unknown. */
export declare function glyphCells(name: GlyphName): GlyphCell[];

/** A full `.ui-dotmatrix` HTML string for a glyph (`''` if unknown). */
export declare function renderGlyph(name: GlyphName, options?: RenderGlyphOptions): string;
