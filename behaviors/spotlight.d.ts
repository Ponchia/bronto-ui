/**
 * Position a spotlight cutout over a target element. Each
 * `[data-bronto-spotlight]` is a `.ui-spotlight` overlay; `data-target` is the
 * id of the element to highlight. The behavior measures the target and sets
 * `--spot-x/y/w/h` (viewport coordinates) on the overlay, re-placing on
 * resize/scroll and whenever `data-target` changes.
 *
 * Bronto owns only positioning + the visual language. It is NOT a tour engine:
 * the host decides which target is current, when to advance, and whether to
 * show/hide the overlay — just update `data-target` (or toggle `hidden`) and
 * the cutout follows. SSR-safe, idempotent per host; returns a cleanup.
 *
 * @param {import('./internal.js').DelegateOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function initSpotlight({ root }?: import("./internal.js").DelegateOpts): import("./internal.js").Cleanup;
//# sourceMappingURL=spotlight.d.ts.map