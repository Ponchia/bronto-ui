/**
 * @typedef {object} CrosshairMoveDetail
 * @property {number} x Pointer x within the plot, in pixels.
 * @property {number} y Pointer y within the plot, in pixels.
 * @property {number} fx Pointer x as a 0..1 fraction of the plot width.
 * @property {number} fy Pointer y as a 0..1 fraction of the plot height.
 */
/**
 * Track the pointer over a plot and drive a crosshair. Each
 * `[data-bronto-crosshair]` is the plot; it contains a `.ui-crosshair` overlay.
 * On pointer move the behavior sets `--crosshair-x/y` (pixels within the plot)
 * on the overlay, marks it `.is-active`, and dispatches
 * `bronto:crosshair:move` with `{ x, y, fx, fy }` (px + 0..1 fractions);
 * `bronto:crosshair:leave` on exit.
 *
 * Bronto reports WHERE the pointer is — it does not find the nearest datum or
 * map pixels to data values (that needs the host's scales). SSR-safe,
 * idempotent per plot; returns a cleanup function.
 *
 * @param {import('./internal.js').DelegateOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function initCrosshair({ root }?: import("./internal.js").DelegateOpts): import("./internal.js").Cleanup;
export type CrosshairMoveDetail = {
    /**
     * Pointer x within the plot, in pixels.
     */
    x: number;
    /**
     * Pointer y within the plot, in pixels.
     */
    y: number;
    /**
     * Pointer x as a 0..1 fraction of the plot width.
     */
    fx: number;
    /**
     * Pointer y as a 0..1 fraction of the plot height.
     */
    fy: number;
};
//# sourceMappingURL=crosshair.d.ts.map