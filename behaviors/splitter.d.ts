/**
 * Wire focusable ARIA splitters. Each `[data-bronto-splitter]` host contains
 * two `.ui-splitter__pane` elements separated by one `.ui-splitter__handle`
 * (`role="separator"`). The behavior keeps `--splitter-pos` and
 * `aria-valuenow` in sync for keyboard and pointer resizing, then dispatches
 * `bronto:splitter:resize` with `{ value, orientation }`.
 *
 * Bronto owns the control affordance only. The host owns pane content,
 * persistence, min/max policy, collapse behavior, and any saved layout state.
 * SSR-safe and idempotent per splitter; returns a cleanup function.
 *
 * @param {import('./internal.js').DelegateOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function initSplitter({ root }?: import("./internal.js").DelegateOpts): import("./internal.js").Cleanup;
export type SplitterResizeDetail = {
    /**
     * The first pane size as a 0..100 percentage.
     */
    value: number;
    /**
     * Splitter orientation.
     */
    orientation: "vertical" | "horizontal";
};
//# sourceMappingURL=splitter.d.ts.map