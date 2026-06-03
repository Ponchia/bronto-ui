/**
 * Draw + keep leader lines in sync. Each `[data-bronto-connector]` is an
 * `.ui-connector` SVG overlaying a positioned container; `data-from`/`data-to`
 * are the ids of the elements to connect. Optional `data-shape`
 * (`straight`|`elbow`|`curve`), `data-from-side`/`data-to-side`
 * (`top`|`right`|`bottom`|`left`|`center`), and `data-end` (`arrow`|`dot`|`none`).
 *
 * Bronto computes the geometry (the pure `@ponchia/ui/connectors` helpers) and
 * sets the path; it owns no layout. Redraws on resize/scroll via a
 * ResizeObserver + listeners. SSR-safe, idempotent per host; returns a cleanup
 * that disconnects everything. Re-run after adding/removing connectors.
 *
 * @param {import('./internal.js').DelegateOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function initConnectors({ root }?: import("./internal.js").DelegateOpts): import("./internal.js").Cleanup;
//# sourceMappingURL=connectors.d.ts.map