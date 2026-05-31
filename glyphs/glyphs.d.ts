/** @ponchia/ui — GENERATED from glyphs/glyphs.js by scripts/gen-glyphs.mjs.
 *  Do not edit by hand; run `npm run glyphs:build`. Drift-checked in CI. */

/** Every display-glyph name @ponchia/ui ships (literal union). */
export type GlyphName =
  | 'arrow-down'
  | 'arrow-left'
  | 'arrow-right'
  | 'arrow-up'
  | 'bell'
  | 'check'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-up'
  | 'clock'
  | 'close'
  | 'download'
  | 'edit'
  | 'eye'
  | 'eye-off'
  | 'file'
  | 'folder'
  | 'gear'
  | 'grid'
  | 'heart'
  | 'home'
  | 'info'
  | 'link'
  | 'lock'
  | 'mail'
  | 'menu'
  | 'minus'
  | 'moon'
  | 'more-horizontal'
  | 'more-vertical'
  | 'pause'
  | 'play'
  | 'plus'
  | 'refresh'
  | 'search'
  | 'spark'
  | 'star'
  | 'sun'
  | 'trash'
  | 'upload'
  | 'user'
  | 'warning';

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
  /** Render lit cells as square, gapless pixels (a filled silhouette) instead
   *  of separated dots — the legible mode at small/inline sizes (~16–24px).
   *  Implies glyph-only. Default false (the dot-matrix display look). */
  solid?: boolean;
  /** Expose as `role="img"` with this label; omit for decorative (aria-hidden). */
  label?: string;
  /** CSS length for one dot (sets `--dotmatrix-dot`; sanitized — a value that
   *  is not a plain length/calc expression is dropped). */
  dot?: string;
  /** CSS length for the gap between dots (sets `--dotmatrix-gap`; sanitized
   *  the same way as `dot`). */
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
