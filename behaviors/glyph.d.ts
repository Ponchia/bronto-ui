/**
 * Expand `[data-bronto-glyph="name"]` placeholders into a `.ui-dotmatrix`
 * grid of GLYPH_SIZE² cells — the DOM counterpart to renderGlyph() from
 * `@ponchia/ui/glyphs`, for when you'd rather drop a placeholder than inline
 * the markup. Decorative by default (`aria-hidden`); add
 * `data-bronto-glyph-label` to expose it as `role="img"`. An unknown glyph
 * name is left untouched. Idempotent (skips an already-expanded host); the
 * returned cleanup removes the cells and restores the original attributes.
 *
 * @param {import('./internal.js').DelegateOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function initDotGlyph({ root }?: import("./internal.js").DelegateOpts): import("./internal.js").Cleanup;
//# sourceMappingURL=glyph.d.ts.map