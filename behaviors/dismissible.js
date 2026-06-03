import { hasDom, resolveHost, noop, bindOnce, closestSafe } from './internal.js';

/**
 * Click on `[data-bronto-dismiss]` removes the nearest ancestor matching
 * `[data-bronto-dismissible]` (or the selector given as the attribute
 * value). Emits a cancelable `bronto:dismiss` event first.
 */
export function dismissible({ root } = {}) {
  if (!hasDom()) return noop;
  const host = resolveHost(root);
  if (!host) return noop;
  const onClick = (e) => {
    const btn = e.target.closest('[data-bronto-dismiss]');
    if (!btn || !host.contains(btn)) return;
    const sel = btn.getAttribute('data-bronto-dismiss');
    const target = sel ? closestSafe(btn, sel) : btn.closest('[data-bronto-dismissible]');
    if (!target) return;
    const ev = new CustomEvent('bronto:dismiss', { bubbles: true, cancelable: true });
    if (target.dispatchEvent(ev)) target.remove();
  };
  return bindOnce(host, 'dismissible', () => {
    host.addEventListener('click', onClick);
    return () => host.removeEventListener('click', onClick);
  });
}
