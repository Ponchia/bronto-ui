import { hasDom, resolveHost, noop, bindOnce } from './internal.js';

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
export function initLegend({ root } = {}) {
  if (!hasDom()) return noop;
  const host = resolveHost(root);
  if (!host) return noop;
  const isButton = (el) => el.tagName === 'BUTTON' || el.getAttribute('role') === 'button';
  const legendFor = (item) => {
    if (!item || !host.contains(item)) return;
    const legend = item.closest('[data-bronto-legend]');
    if (!legend || !host.contains(legend)) return;
    return legend;
  };
  const toggle = (item) => {
    const legend = legendFor(item);
    if (!legend) return;
    // The contract requires a real `<button>` (keyboard-operable, focusable). A
    // non-button item is mouse-only unless role=button is keyboard-normalized
    // below — refuse anything else rather than ship a pointer-only control.
    if (!isButton(item)) return;
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
  const onClick = (e) => {
    toggle(e.target.closest('.ui-legend__item'));
  };
  const onKey = (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const item = e.target.closest('.ui-legend__item');
    if (!item || item.tagName === 'BUTTON' || item.getAttribute('role') !== 'button') return;
    e.preventDefault();
    toggle(item);
  };
  return bindOnce(host, 'legend', () => {
    // Normalize role=button entries and warn once per unsupported non-button
    // item present at bind. A real <button> remains the recommended markup.
    const legends = [...(host.querySelectorAll?.('[data-bronto-legend]') ?? [])];
    for (const legend of legends) {
      for (const el of legend.querySelectorAll('.ui-legend__item')) {
        if (el.closest('[data-bronto-legend]') !== legend) continue;
        if (el.tagName === 'BUTTON' && !el.hasAttribute('type')) el.type = 'button';
        if (
          el.tagName !== 'BUTTON' &&
          el.getAttribute('role') === 'button' &&
          !el.hasAttribute('tabindex')
        ) {
          el.tabIndex = 0;
        }
      }
    }
    if (typeof console !== 'undefined') {
      for (const legend of legends) {
        const stray = [...legend.querySelectorAll('.ui-legend__item')].some(
          (el) => el.closest('[data-bronto-legend]') === legend && !isButton(el),
        );
        if (stray) {
          console.warn(
            '[bronto] initLegend(): interactive legend entries must be <button> or role="button" — unsupported .ui-legend__item controls are ignored.',
          );
          break;
        }
      }
    }
    host.addEventListener('click', onClick);
    host.addEventListener('keydown', onKey);
    return () => {
      host.removeEventListener('click', onClick);
      host.removeEventListener('keydown', onKey);
    };
  });
}
