/**
 * Wire focusable ARIA splitters. Each `[data-bronto-splitter]` host contains
 * two `.ui-splitter__pane` elements separated by one `.ui-splitter__handle`
 * (`role="separator"`). The behavior keeps `--splitter-pos` and
 * `aria-valuenow` in sync for keyboard and pointer resizing, then dispatches
 * `bronto:splitter:resize` with `{ value, orientation }`.
 * Buttons inside the splitter may set `data-bronto-splitter-adjust="-10"` or
 * `"10"` to provide the required single-pointer, non-drag resize path.
 *
 * Set `data-bronto-splitter-unit="px"` for pixel values and optionally
 * `data-bronto-splitter-step` / `data-bronto-splitter-large-step` for key steps.
 * ARIA bounds and current values are read live so a controlled host can resize
 * its containing viewport or select another pane without stale limits.
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
     * The first pane size in percentage points, or CSS pixels for a pixel host.
     */
    value: number;
    /**
     * Splitter orientation.
     */
    orientation: "vertical" | "horizontal";
    /**
     * Present for pixel-valued hosts; absent for legacy percentages.
     */
    unit?: "px" | undefined;
};
//# sourceMappingURL=splitter.d.ts.map