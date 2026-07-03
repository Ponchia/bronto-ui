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

const clearSpotProps = (spot) => {
  for (const name of SPOT_PROPS) spot.style.removeProperty(name);
};

const placeSpot = (spot, target) => {
  const r = target.getBoundingClientRect();
  spot.style.setProperty('--spot-x', `${r.left}px`);
  spot.style.setProperty('--spot-y', `${r.top}px`);
  spot.style.setProperty('--spot-w', `${r.width}px`);
  spot.style.setProperty('--spot-h', `${r.height}px`);
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

  return bindOnce(host, 'spotlight', () => {
    const spots = collectHosts(host, '[data-bronto-spotlight]');
    if (!spots.length) return noop;
    const states = new Map();
    const remember = (spot) => {
      if (!states.has(spot)) states.set(spot, snapshotSpotProps(spot));
    };
    const place = () => {
      for (const spot of collectHosts(host, '[data-bronto-spotlight]')) {
        remember(spot);
        const target = byIdInHost(host, spot.dataset.target);
        if (!target) {
          clearSpotProps(spot);
          continue;
        }
        placeSpot(spot, target);
      }
    };
    place();
    const view = host.defaultView || host.ownerDocument?.defaultView || null;
    const MO = view?.MutationObserver;
    let scheduledFrame = null;
    let scheduledTimer = null;
    const cancelScheduledPlace = () => {
      if (scheduledFrame !== null) view?.cancelAnimationFrame?.(scheduledFrame);
      if (scheduledTimer !== null) clearTimeout(scheduledTimer);
      scheduledFrame = null;
      scheduledTimer = null;
    };
    const schedulePlace = () => {
      if (scheduledFrame !== null || scheduledTimer !== null) return;
      if (typeof view?.requestAnimationFrame === 'function') {
        scheduledFrame = view.requestAnimationFrame(() => {
          scheduledFrame = null;
          place();
        });
        return;
      }
      scheduledTimer = setTimeout(() => {
        scheduledTimer = null;
        place();
      }, 0);
      scheduledTimer?.unref?.();
    };
    const onMutation = () => {
      place();
      schedulePlace();
    };
    const mo = MO ? new MO(onMutation) : null;
    if (mo) {
      for (const spot of spots) {
        mo.observe(spot, { attributes: true, attributeFilter: ['data-target'] });
      }
      const doc = host.nodeType === 9 ? host : host.ownerDocument;
      if (doc) mo.observe(doc, { childList: true, subtree: true });
    }
    view?.addEventListener('resize', place);
    view?.addEventListener('scroll', place, true);
    return () => {
      cancelScheduledPlace();
      mo?.disconnect();
      view?.removeEventListener('resize', place);
      view?.removeEventListener('scroll', place, true);
      for (const [spot, props] of states) restoreSpotProps(spot, props);
    };
  });
}
