import { hasDom, resolveHost, noop, bindOnce, closestSafe } from './internal.js';

const DISABLED = '[aria-disabled="true"]';

/**
 * Make `aria-disabled="true"` controls keyboard-inert, not just pointer-inert.
 *
 * CSS can dim an `aria-disabled` control and set `pointer-events: none`, but it
 * cannot block keyboard activation: a focused `<a aria-disabled>` or
 * `<button aria-disabled>` still fires on Enter/Space, so a keyboard user can
 * activate a control that looks dead. (Native `disabled` is already fully inert;
 * this guard brings the ARIA path up to parity.) The element intentionally stays
 * focusable and announced — the WAI-ARIA disabled pattern keeps it in the tab
 * order — but it no longer *acts*.
 *
 * Wire once near the root, like {@link applyStoredTheme}. Capturing listeners
 * intercept activation before any component handler (tabs, pagination, menus)
 * sees it.
 *
 * @param {import('./internal.js').DelegateOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function initDisabledGuard({ root } = {}) {
  if (!hasDom()) return noop;
  const host = resolveHost(root);
  if (!host) return noop;
  const block = (e) => {
    const el = closestSafe(e.target, DISABLED);
    if (el && host.contains(el)) {
      e.preventDefault();
      e.stopImmediatePropagation?.();
      e.stopPropagation();
    }
  };
  const onKeydown = (e) => {
    // Only the activation keys; Tab/arrows must still move focus PAST the control.
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') block(e);
  };
  return bindOnce(host, 'disabled-guard', () => {
    host.addEventListener('click', block, true);
    host.addEventListener('keydown', onKeydown, true);
    return () => {
      host.removeEventListener('click', block, true);
      host.removeEventListener('keydown', onKeydown, true);
    };
  });
}
