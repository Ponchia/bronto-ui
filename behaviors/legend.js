import { hasDom, resolveHost, noop, bindOnce, collectHosts, closestSafe } from './internal.js';

/**
 * @typedef {object} LegendToggleDetail
 * @property {string | number} series The entry's `data-series`, or its 0-based index when unset.
 * @property {boolean} active The new state (`true` ⇒ series shown).
 */

const handledEvents = new WeakSet();

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
  const snapshotAttrs = (el, names) => {
    const attrs = {};
    for (const name of names) {
      attrs[name] = {
        had: el.hasAttribute(name),
        value: el.getAttribute(name),
      };
    }
    return attrs;
  };
  const restoreAttrs = (el, attrs) => {
    for (const [name, state] of Object.entries(attrs)) {
      if (state.had) el.setAttribute(name, state.value);
      else el.removeAttribute(name);
    }
  };
  const directItems = (legend) =>
    [...legend.querySelectorAll('.ui-legend__item')].filter(
      (el) => el.closest('[data-bronto-legend]') === legend,
    );
  const isButton = (el) => el.tagName === 'BUTTON' || el.getAttribute('role') === 'button';
  const legendFor = (item) => {
    if (!item || !host.contains(item)) return;
    const legend = item.closest('[data-bronto-legend]');
    if (!legend || !host.contains(legend)) return;
    return legend;
  };
  const toggle = (item) => {
    const legend = legendFor(item);
    if (!legend) return false;
    // The contract requires a real `<button>` (keyboard-operable, focusable). A
    // non-button item is mouse-only unless role=button is keyboard-normalized
    // below — refuse anything else rather than ship a pointer-only control.
    if (!isButton(item)) return false;
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
    return true;
  };
  const onClick = (e) => {
    if (handledEvents.has(e)) return;
    if (toggle(closestSafe(e.target, '.ui-legend__item'))) handledEvents.add(e);
  };
  const onKey = (e) => {
    if (handledEvents.has(e)) return;
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const item = closestSafe(e.target, '.ui-legend__item');
    if (!item || item.tagName === 'BUTTON' || item.getAttribute('role') !== 'button') return;
    e.preventDefault();
    if (toggle(item)) handledEvents.add(e);
  };
  return bindOnce(host, 'legend', () => {
    // Normalize role=button entries and warn once per unsupported non-button
    // item present at bind. A real <button> remains the recommended markup.
    const legends = collectHosts(host, '[data-bronto-legend]');
    const itemStates = [];
    for (const legend of legends) {
      for (const el of directItems(legend)) {
        itemStates.push({
          el,
          attrs: snapshotAttrs(el, ['type', 'tabindex', 'aria-pressed']),
          inactive: el.classList.contains('is-inactive'),
        });
        if (el.tagName === 'BUTTON' && !el.hasAttribute('type')) el.setAttribute('type', 'button');
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
        const stray = directItems(legend).some((el) => !isButton(el));
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
      for (const state of itemStates) {
        restoreAttrs(state.el, state.attrs);
        state.el.classList.toggle('is-inactive', state.inactive);
      }
    };
  });
}
