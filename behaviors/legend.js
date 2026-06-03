import { hasDom, resolveHost, noop, bindOnce } from './internal.js';

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
  const host = resolveHost(root);
  if (!host) return noop;
  const isButton = (el) => el.tagName === 'BUTTON' || el.getAttribute('role') === 'button';
  const onClick = (e) => {
    const item = e.target.closest('.ui-legend__item');
    if (!item || !host.contains(item)) return;
    const legend = item.closest('[data-bronto-legend]');
    if (!legend || !host.contains(legend)) return;
    // The contract requires a real `<button>` (keyboard-operable, focusable). A
    // non-button item is mouse-only — refuse to toggle it rather than ship a
    // pointer-only control (WCAG 2.1.1 — C11). The author is warned at bind.
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
  return bindOnce(host, 'legend', () => {
    // Warn once per non-button item present at bind: it gets cursor:pointer from
    // the CSS but is neither focusable nor keyboard-operable (C11).
    if (typeof console !== 'undefined') {
      for (const legend of host.querySelectorAll?.('[data-bronto-legend]') ?? []) {
        const stray = [...legend.querySelectorAll('.ui-legend__item')].some(
          (el) => el.closest('[data-bronto-legend]') === legend && !isButton(el),
        );
        if (stray) {
          console.warn(
            '[bronto] initLegend(): interactive legend entries must be <button> (or role="button") to be keyboard-operable — a non-button .ui-legend__item is ignored.',
          );
          break;
        }
      }
    }
    host.addEventListener('click', onClick);
    return () => host.removeEventListener('click', onClick);
  });
}
