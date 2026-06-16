import { hasDom, resolveHost, noop, bindOnce, byIdInHost, closestSafe } from './internal.js';

const snapshotAttr = (el, name) => ({
  had: el.hasAttribute(name),
  value: el.getAttribute(name),
});

const restoreAttr = (el, name, state) => {
  if (state.had) el.setAttribute(name, state.value);
  else el.removeAttribute(name);
};

/**
 * Disclosure: a `[data-bronto-disclosure]` trigger toggles the element
 * referenced by its `aria-controls` id, keeping `aria-expanded` and the
 * panel's `hidden` attribute in sync.
 *
 * @param {import('./internal.js').DelegateOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function initDisclosure({ root } = {}) {
  if (!hasDom()) return noop;
  const host = resolveHost(root);
  if (!host) return noop;
  const triggerStates = new Map();
  const panelStates = new Map();

  const remember = (trigger, panel) => {
    if (!triggerStates.has(trigger)) {
      triggerStates.set(trigger, snapshotAttr(trigger, 'aria-expanded'));
    }
    if (!panelStates.has(panel)) {
      panelStates.set(panel, snapshotAttr(panel, 'hidden'));
    }
  };

  const onClick = (e) => {
    const trigger = closestSafe(e.target, '[data-bronto-disclosure]');
    if (!trigger || !host.contains(trigger)) return;
    const id = trigger.getAttribute('aria-controls');
    const panel = byIdInHost(host, id);
    if (!panel) return;
    e.preventDefault();
    remember(trigger, panel);
    const open = trigger.getAttribute('aria-expanded') === 'true';
    trigger.setAttribute('aria-expanded', String(!open));
    panel.hidden = open;
  };
  return bindOnce(host, 'disclosure', () => {
    host.addEventListener('click', onClick);
    return () => {
      host.removeEventListener('click', onClick);
      for (const [trigger, state] of triggerStates) restoreAttr(trigger, 'aria-expanded', state);
      triggerStates.clear();
      for (const [panel, state] of panelStates) restoreAttr(panel, 'hidden', state);
      panelStates.clear();
    };
  });
}
