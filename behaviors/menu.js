import { hasDom, resolveHost, noop, bindOnce, closestSafe, collectHosts } from './internal.js';

/**
 * Dropdown-menu close affordances for a native `<details data-bronto-menu>`
 * holding a `.ui-menu`. `<details>` alone won't close on Escape, on an
 * outside click, or when a `.ui-menu__item` is activated — this adds
 * exactly those, returning focus to the `<summary>` on Esc/activate.
 *
 * Deliberately NOT a full WAI-ARIA menu (no arrow-key roving): the items
 * are real buttons, Tab-reachable; this is a disclosure of actions, and
 * over-claiming `role="menu"` semantics would be worse. SSR-safe,
 * idempotent; returns a cleanup function.
 *
 * @param {import('./internal.js').DelegateOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function initMenu({ root } = {}) {
  if (!hasDom()) return noop;
  const host = resolveHost(root);
  if (!host) return noop;
  const doc = host.nodeType === 9 ? host : host.ownerDocument || document;
  const openMenus = () => collectHosts(host, '[data-bronto-menu][open]');
  const shut = (menu) => {
    if (!menu || !menu.open) return;
    menu.open = false;
    menu.querySelector('summary')?.focus();
  };
  const onClick = (e) => {
    const target = e.target;
    const menu = closestSafe(target, '[data-bronto-menu]');
    // Activate an item → close its menu (and return focus to summary).
    if (menu && host.contains(menu) && closestSafe(target, '.ui-menu__item')) {
      shut(menu);
      return;
    }
    // Click outside any open menu → close them all (no focus move).
    for (const m of openMenus()) if (!m.contains(target)) m.open = false;
  };
  const onKey = (e) => {
    if (e.key !== 'Escape') return;
    const menu = closestSafe(e.target, '[data-bronto-menu][open]') || openMenus()[0];
    if (!menu) return;
    e.preventDefault();
    e.stopPropagation();
    shut(menu);
  };
  return bindOnce(host, 'menu', () => {
    doc.addEventListener('click', onClick);
    host.addEventListener('keydown', onKey);
    return () => {
      doc.removeEventListener('click', onClick);
      host.removeEventListener('keydown', onKey);
    };
  });
}
