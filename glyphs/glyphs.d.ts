/** @ponchia/ui — GENERATED from glyphs/glyphs.js by scripts/gen-glyphs.mjs.
 *  Do not edit by hand; run `npm run glyphs:build`. Drift-checked in CI. */

/** Every display-glyph name @ponchia/ui ships (literal union). Use this as a
 *  type annotation to reject typos (`const n: GlyphName = 'arow'` is an error). */
export type GlyphName =
  | 'arrow-down'
  | 'arrow-left'
  | 'arrow-right'
  | 'arrow-up'
  | 'bar-chart'
  | 'bell'
  | 'calendar'
  | 'check'
  | 'check-circle'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-up'
  | 'circle'
  | 'clock'
  | 'close'
  | 'colon'
  | 'comma'
  | 'copy'
  | 'database'
  | 'digit-0'
  | 'digit-1'
  | 'digit-2'
  | 'digit-3'
  | 'digit-4'
  | 'digit-5'
  | 'digit-6'
  | 'digit-7'
  | 'digit-8'
  | 'digit-9'
  | 'download'
  | 'edit'
  | 'eye'
  | 'eye-off'
  | 'file'
  | 'filter'
  | 'folder'
  | 'gear'
  | 'grid'
  | 'hash'
  | 'heart'
  | 'home'
  | 'info'
  | 'link'
  | 'lock'
  | 'mail'
  | 'menu'
  | 'minus'
  | 'minus-circle'
  | 'moon'
  | 'more-horizontal'
  | 'more-vertical'
  | 'pause'
  | 'percent'
  | 'period'
  | 'play'
  | 'plus'
  | 'plus-circle'
  | 'refresh'
  | 'search'
  | 'share'
  | 'sliders'
  | 'sort'
  | 'spark'
  | 'star'
  | 'sun'
  | 'trash'
  | 'upload'
  | 'user'
  | 'warning'
  | 'x-circle';

/** A glyph name, or any string — for dynamic dispatch (a CMS/config value). The
 *  known names still autocomplete; an unknown name hits the runtime fallback
 *  (`glyph`→`undefined`, `glyphCells`→`[]`, `renderGlyph`→`''`). */
export type GlyphNameInput = GlyphName | (string & {});

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
  /** Opt into a decorative animation (disabled under `prefers-reduced-motion`;
   *  meaning stays in the static frame + `label`). `'reveal'` powers the cells
   *  on in a scan; `'pulse'` makes the glyph breathe. */
  anim?: 'reveal' | 'pulse';
  /** Expose as `role="img"` with this label; omit for decorative (aria-hidden). */
  label?: string;
  /** CSS length for one dot (sets `--dotmatrix-dot`; sanitized — a value that
   *  is not a plain length/calc expression is dropped). */
  dot?: string;
  /** CSS length for the gap between dots (sets `--dotmatrix-gap`; sanitized
   *  the same way as `dot`). */
  gap?: string;
  /** `'mask'` returns a single `.ui-icon` element masked by the glyph bitmap
   *  (one DOM node, not GLYPH_SIZE²) — the icon-at-scale path. Inherits
   *  `currentColor`; the cell-mode options above don't apply. Needs the
   *  `.ui-icon` rule from `@ponchia/ui/css`. */
  render?: 'mask';
  /** With `render: 'mask'`, the icon size (sets `--icon-size`; defaults to
   *  `1em`; sanitized to a length/calc allowlist). */
  size?: string;
}

/** The grid edge length (rows = cols = 16). */
export declare const GLYPH_SIZE: 16;

/** The frozen name→bitmap registry. */
export declare const GLYPHS: Readonly<Record<GlyphName, Glyph>>;

/** Every glyph name, frozen and sorted. */
export declare const GLYPH_NAMES: readonly GlyphName[];

/** The raw bitmap rows for a glyph, or `undefined` if the name is unknown. */
export declare function glyph(name: GlyphNameInput): Glyph | undefined;

/** 256 cell descriptors (row-major), or `[]` if unknown. */
export declare function glyphCells(name: GlyphNameInput): GlyphCell[];

/** The CSS `mask-image` `url()` for a glyph (the `--icon-mask` value on a
 *  `.ui-icon`), or `''` if unknown. Single-tone. */
export declare function glyphMask(name: GlyphNameInput): string;

/** A full `.ui-dotmatrix` HTML string for a glyph (`''` if unknown). */
export declare function renderGlyph(name: GlyphNameInput, options?: RenderGlyphOptions): string;

/** Hand-curated intent→glyph search aliases (e.g. `trash`→`delete`/`remove`).
 *  Keys are real glyph names; values are extra search terms. */
export declare const GLYPH_TAGS: Readonly<Partial<Record<GlyphName, readonly string[]>>>;

/** Glyph names whose name OR a search alias contains `query` (case-insensitive),
 *  sorted. `findGlyphs('')` returns every name. */
export declare function findGlyphs(query: string): GlyphName[];

/** Options for renderReadout. The per-glyph fields pass through to renderGlyph
 *  for each character; `gap` sets `--readout-gap` on the row. */
export interface RenderReadoutOptions {
  /** Accessible name for the whole readout (defaults to the raw text). The dot
   *  digits are decorative; this carries the real value. */
  label?: string;
  /** CSS length between characters (sets `--readout-gap`; sanitized). */
  gap?: string;
  /** Render each character as square gapless pixels (legible small). */
  solid?: boolean;
  /** Show the unlit panel dots behind each character (default true). */
  grid?: boolean;
  /** Decorative per-character animation (reduced-motion-safe). */
  anim?: 'reveal' | 'pulse';
  /** CSS length for one dot of each character (sets `--dotmatrix-dot`). */
  dot?: string;
  /** `'mask'` renders each character as a single `.ui-icon` node (lightest). */
  render?: 'mask';
  /** With `render: 'mask'`, the per-character icon size. */
  size?: string;
}

/** A row of dot-matrix glyphs for a numeric string (digits + `: , . % - +` and
 *  space) — the big Nothing-style readout. `''` for empty input. */
export declare function renderReadout(text: string, options?: RenderReadoutOptions): string;
