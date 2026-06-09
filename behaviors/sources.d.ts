/**
 * Source/citation affordances for the `sources.css` trust layer. The behavior
 * is deliberately small: within each `[data-bronto-sources]` island it resolves
 * `.ui-citation[href^="#"]` and `[data-bronto-source-ref]` controls to source
 * cards, adds non-visual preview metadata (`title` + `aria-describedby`), and
 * on activation moves focus to the source card with a temporary
 * `.is-source-active` highlight. The host still owns fetching, numbering,
 * trust decisions, and any rich preview UI.
 *
 * @param {import('./internal.js').DelegateOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function initSources({ root }?: import("./internal.js").DelegateOpts): import("./internal.js").Cleanup;
export type SourceFocusDetail = {
    /**
     * The focused source-card id.
     */
    id: string;
    /**
     * The citation/control that requested the source.
     */
    citation: Element;
    /**
     * The target source card or source element.
     */
    source: Element;
};
//# sourceMappingURL=sources.d.ts.map