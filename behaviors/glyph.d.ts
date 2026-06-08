/**
 * Expand `[data-bronto-glyph="name"]` placeholders into a `.ui-dotmatrix`
 * grid of GLYPH_SIZE² cells — the DOM counterpart to renderGlyph() from
 * `@ponchia/ui/glyphs`, for when you'd rather drop a placeholder than inline
 * the markup. Decorative by default (`aria-hidden`); add
 * `data-bronto-glyph-label` to expose it as `role="img"`. An unknown glyph
 * name is left untouched. Idempotent (skips an already-expanded host); the
 * returned cleanup removes the cells and restores the original attributes.
 *
 * `data-bronto-glyph-render="mask"` takes the cheap one-node path instead:
 * the host becomes a single `.ui-icon` masked by the glyph (no GLYPH_SIZE²
 * cells), inheriting `currentColor` and scaling with the text — the DOM
 * counterpart to renderGlyph's `render: 'mask'`, for an icon in every table
 * row where 256 cells per glyph is too heavy. `data-bronto-glyph-size` sets
 * `--icon-size`. The cell-mode attributes (solid/anim) don't apply.
 *
 * @param {import('./internal.js').DelegateOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function initDotGlyph({ root }?: import("./internal.js").DelegateOpts): import("./internal.js").Cleanup;
//# sourceMappingURL=glyph.d.ts.map