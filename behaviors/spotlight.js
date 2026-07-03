import { hasDom, resolveHost, noop, bindOnce, byIdInHost, collectHosts } from './internal.js';

const SPOT_PROPS = ['--spot-x', '--spot-y', '--spot-w', '--spot-h'];

const snapshotSpotProps = (spot) =>
  Object.fromEntries(
    SPOT_PROPS.map((name) => [
      name,
      {
        value: spot.style.getPropertyValue(name),
        priority: spot.style.getPropertyPriority(name),
      },
    ]),
  );

const restoreSpotProps = (spot, props) => {
  for (const [name, prop] of Object.entries(props)) {
    if (prop.value) spot.style.setProperty(name, prop.value, prop.priority);
    else spot.style.removeProperty(name);
  }
};

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
export function initSpotlight({ root } = {}) {
  if (!hasDom()) return noop;
  const host = resolveHost(root);
  if (!host) return noop;

  const place = () => {
    const spots = collectHosts(host, '[data-bronto-spotlight]');
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
    const spots = collectHosts(host, '[data-bronto-spotlight]');
    if (!spots.length) return noop;
    const states = spots.map((spot) => ({
      spot,
      props: snapshotSpotProps(spot),
    }));
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
      for (const state of states) restoreSpotProps(state.spot, state.props);
    };
  });
}
