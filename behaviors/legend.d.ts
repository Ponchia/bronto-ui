/**
 * @typedef {object} LegendToggleDetail
 * @property {string | number} series The entry's `data-series`, or its 0-based index when unset.
 * @property {boolean} active The new state (`true` ⇒ series shown).
 */
/**
 * Wire `[data-bronto-legend]` interactive legends. Each entry is a
 * `.ui-legend__item` authored as a `<button aria-pressed>`; clicking it (or
 * Enter/Space, native to `<button>`) flips `aria-pressed`, toggles the
 * `.is-inactive` class, and dispatches `bronto:legend:toggle` on the legend
 * with `{ detail: { series, active } }` (`series` is the entry's
 * `data-series`, or its 0-based index if unset).
 *
 * Bronto owns only the control and its pressed/inactive *state*. It does not
 * know the chart's series, hide anything, or announce the change: the host
 * listens for the event, hides its own series, and owns any `aria-live`
 * announcement. The convention is `aria-pressed="true"` ⇒ the series is shown
 * (the default); the entry's label never changes on toggle (WAI-ARIA). SSR-safe
 * and idempotent per host; returns a cleanup function.
 *
 * @param {import('./internal.js').DelegateOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function initLegend({ root }?: import("./internal.js").DelegateOpts): import("./internal.js").Cleanup;
export type LegendToggleDetail = {
    /**
     * The entry's `data-series`, or its 0-based index when unset.
     */
    series: string | number;
    /**
     * The new state (`true` ⇒ series shown).
     */
    active: boolean;
};
//# sourceMappingURL=legend.d.ts.map