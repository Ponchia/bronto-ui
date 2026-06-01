import { hasDom, noop, bindOnce } from './internal.js';

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
 */
export function initLegend({ root } = {}) {
  if (!hasDom()) return noop;
  const host = root || document;
  const onClick = (e) => {
    const item = e.target.closest('.ui-legend__item');
    if (!item || !host.contains(item)) return;
    const legend = item.closest('[data-bronto-legend]');
    if (!legend || !host.contains(legend)) return;
    const active = item.getAttribute('aria-pressed') !== 'false';
    const next = !active;
    item.setAttribute('aria-pressed', String(next));
    item.classList.toggle('is-inactive', !next);
    // This legend's own items only — an item inside a nested [data-bronto-legend]
    // belongs to that inner legend, so it must not shift this one's indices.
    const items = [...legend.querySelectorAll('.ui-legend__item')].filter(
      (el) => el.closest('[data-bronto-legend]') === legend,
    );
    legend.dispatchEvent(
      new CustomEvent('bronto:legend:toggle', {
        bubbles: true,
        detail: { series: item.dataset.series ?? items.indexOf(item), active: next },
      }),
    );
  };
  return bindOnce(host, 'legend', () => {
    host.addEventListener('click', onClick);
    return () => host.removeEventListener('click', onClick);
  });
}
