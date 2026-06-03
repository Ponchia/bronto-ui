import { hasDom, resolveHost, noop, bindOnce } from './internal.js';

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
 */
export function initMenu({ root } = {}) {
  if (!hasDom()) return noop;
  const host = resolveHost(root);
  if (!host) return noop;
  const openMenus = () => host.querySelectorAll?.('[data-bronto-menu][open]') ?? [];
  const shut = (menu) => {
    if (!menu || !menu.open) return;
    menu.open = false;
    menu.querySelector('summary')?.focus();
  };
  const onClick = (e) => {
    const menu = e.target.closest('[data-bronto-menu]');
    // Activate an item → close its menu (and return focus to summary).
    if (menu && e.target.closest('.ui-menu__item')) {
      shut(menu);
      return;
    }
    // Click outside any open menu → close them all (no focus move).
    for (const m of openMenus()) if (!m.contains(e.target)) m.open = false;
  };
  const onKey = (e) => {
    if (e.key !== 'Escape') return;
    const menu = e.target.closest?.('[data-bronto-menu][open]') || openMenus()[0];
    shut(menu);
  };
  return bindOnce(host, 'menu', () => {
    host.addEventListener('click', onClick);
    host.addEventListener('keydown', onKey);
    return () => {
      host.removeEventListener('click', onClick);
      host.removeEventListener('keydown', onKey);
    };
  });
}
