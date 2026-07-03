import {
  hasDom,
  resolveHost,
  noop,
  bindOnce,
  byIdInHost,
  closestSafe,
  collectHosts,
} from './internal.js';

const handledDisclosureEvents = new WeakSet();
const warnedMissingTargets = new WeakSet();

const snapshotAttr = (el, name) => ({
  had: el.hasAttribute(name),
  value: el.getAttribute(name),
});

const restoreAttr = (el, name, state) => {
  if (state.had) el.setAttribute(name, state.value);
  else el.removeAttribute(name);
};

const warnMissingTarget = (trigger, id) => {
  if (warnedMissingTargets.has(trigger) || typeof console === 'undefined') return;
  warnedMissingTargets.add(trigger);
  console.warn(
    `[bronto] initDisclosure(): no panel found for aria-controls="${id || ''}" - disclosure trigger stays inert.`,
  );
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
    if (handledDisclosureEvents.has(e)) return;
    const trigger = closestSafe(e.target, '[data-bronto-disclosure]');
    if (!trigger || !host.contains(trigger)) return;
    const id = trigger.getAttribute('aria-controls');
    const panel = byIdInHost(host, id);
    if (!panel) {
      warnMissingTarget(trigger, id);
      return;
    }
    handledDisclosureEvents.add(e);
    e.preventDefault();
    const nextOpen = panel.hidden;
    const triggers = collectHosts(host, '[data-bronto-disclosure]').filter(
      (el) => el.getAttribute('aria-controls') === id,
    );
    for (const el of triggers) {
      remember(el, panel);
      el.setAttribute('aria-expanded', String(nextOpen));
    }
    panel.hidden = !nextOpen;
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
