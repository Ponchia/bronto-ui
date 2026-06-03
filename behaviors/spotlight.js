import { hasDom, resolveHost, noop, bindOnce, byIdInHost } from './internal.js';

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
 */
export function initSpotlight({ root } = {}) {
  if (!hasDom()) return noop;
  const host = resolveHost(root);
  if (!host) return noop;
  const spots = [];
  if (host !== document && host.matches?.('[data-bronto-spotlight]')) spots.push(host);
  spots.push(...host.querySelectorAll('[data-bronto-spotlight]'));
  if (!spots.length) return noop;

  const place = () => {
    for (const spot of spots) {
      const target = byIdInHost(host, spot.dataset.target);
      if (!target) continue;
      const r = target.getBoundingClientRect();
      spot.style.setProperty('--spot-x', `${r.left}px`);
      spot.style.setProperty('--spot-y', `${r.top}px`);
      spot.style.setProperty('--spot-w', `${r.width}px`);
      spot.style.setProperty('--spot-h', `${r.height}px`);
    }
  };

  return bindOnce(host, 'spotlight', () => {
    place();
    const view = host.defaultView || host.ownerDocument?.defaultView || null;
    const MO = view?.MutationObserver;
    const mo = MO ? new MO(place) : null;
    if (mo) {
      for (const spot of spots) {
        mo.observe(spot, { attributes: true, attributeFilter: ['data-target'] });
      }
    }
    view?.addEventListener('resize', place);
    view?.addEventListener('scroll', place, true);
    return () => {
      mo?.disconnect();
      view?.removeEventListener('resize', place);
      view?.removeEventListener('scroll', place, true);
    };
  });
}
