import { hasDom, resolveHost, noop, bindOnce, byIdInHost } from './internal.js';

/**
 * Disclosure: a `[data-bronto-disclosure]` trigger toggles the element
 * referenced by its `aria-controls` id, keeping `aria-expanded` and the
 * panel's `hidden` attribute in sync.
 */
export function initDisclosure({ root } = {}) {
  if (!hasDom()) return noop;
  const host = resolveHost(root);
  if (!host) return noop;
  const onClick = (e) => {
    const trigger = e.target.closest('[data-bronto-disclosure]');
    if (!trigger || !host.contains(trigger)) return;
    const id = trigger.getAttribute('aria-controls');
    const panel = byIdInHost(host, id);
    if (!panel) return;
    const open = trigger.getAttribute('aria-expanded') === 'true';
    trigger.setAttribute('aria-expanded', String(!open));
    panel.hidden = open;
  };
  return bindOnce(host, 'disclosure', () => {
    host.addEventListener('click', onClick);
    return () => host.removeEventListener('click', onClick);
  });
}
