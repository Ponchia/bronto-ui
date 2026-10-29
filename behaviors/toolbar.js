import { hasDom, resolveHost, noop, bindOnce, collectHosts, ignoreListboxKey } from './internal.js';
import {
  compositeVisible,
  tabStops,
  compositeIndex,
  editingControl,
  nestedComposite,
} from './composite.js';

/**
 * @typedef {object} ToolbarOpts
 * @property {Document | Element | null} [root] Scope; null never widens to the document.
 * @property {(event: KeyboardEvent, toolbar: HTMLElement) => boolean} [ownsKey]
 *   Additional host widgets whose keys the toolbar must leave untouched.
 * @property {(element: HTMLElement, toolbar: HTMLElement) => boolean} [exclude]
 *   Host-owned controls excluded from the toolbar, for example portal menu content.
 */

const ITEMS =
  'button, a[href], input, select, textarea, summary, [role="tab"], [data-bronto-toolbar-item]';

function wireToolbar(root, { ownsKey, exclude }) {
  return bindOnce(root, 'toolbar', () => {
    const doc = root.ownerDocument;
    const view = doc.defaultView;
    const role = root.getAttribute('role');
    root.setAttribute('role', 'toolbar');
    const stops = tabStops(root);
    let active = null;
    const candidates = () =>
      [...root.querySelectorAll(ITEMS)].filter(
        (item) => !nestedComposite(item, root) && !exclude?.(item, root),
      );
    const controls = () => candidates().filter(compositeVisible);
    const update = () => {
      const items = candidates();
      if (!root.contains(doc.activeElement)) {
        stops.sync(items, null);
        stops.set(root, items.some((item) => !item.matches(':disabled')) ? 0 : -1);
        return;
      }
      const visible = controls();
      if (!visible.includes(active)) active = visible[0] ?? null;
      stops.sync(items, active);
      stops.set(root, active ? -1 : 0);
    };
    const onFocus = (event) => {
      const items = controls();
      if (event.target === root) {
        (items.includes(active) ? active : items[0])?.focus();
        return;
      }
      if (!items.includes(event.target)) return;
      active = event.target;
      stops.sync(candidates(), active);
      stops.set(root, -1);
    };
    const fieldTab = (event, target, items) => {
      const index = items.indexOf(target);
      if (index < 0) return;
      const next = items[index + (event.shiftKey ? -1 : 1)];
      if (next && target.getAttribute('aria-expanded') !== 'true') {
        event.preventDefault();
        next.focus();
      }
    };
    const onKey = (event) => {
      if (ignoreListboxKey(event) || ownsKey?.(event, root)) return;
      const target = event.target;
      if (!target?.matches || nestedComposite(target, root)) return;
      const items = controls();
      if (event.key === 'Tab' && target.matches('input, select')) {
        fieldTab(event, target, items);
        return;
      }
      if (editingControl(target, root)) return;
      const index = items.indexOf(target);
      if (index < 0) return;
      const vertical = root.getAttribute('aria-orientation') === 'vertical';
      const rtl = view?.getComputedStyle(root).direction === 'rtl';
      const next = compositeIndex(event.key, index, items.length, vertical, rtl);
      if (next === null) return;
      event.preventDefault();
      items[next]?.focus();
    };
    root.addEventListener('focusin', onFocus);
    root.addEventListener('keydown', onKey);
    update();
    const observer = view?.MutationObserver ? new view.MutationObserver(update) : null;
    observer?.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['disabled', 'hidden', 'inert', 'aria-hidden', 'aria-disabled', 'open'],
    });
    return () => {
      observer?.disconnect();
      root.removeEventListener('focusin', onFocus);
      root.removeEventListener('keydown', onKey);
      stops.restore();
      if (role === null) root.removeAttribute('role');
      else root.setAttribute('role', role);
    };
  });
}

/**
 * One Tab entry and roving arrows for `[data-bronto-toolbar]`. Orientation and
 * direction come from the DOM. Native fields and nested widgets retain their
 * keys; the host provides the label and commands. Dynamic items use their own
 * document's observer. No geometry/style reads for idle toolbar discovery.
 * SSR-safe, idempotent; cleanup restores authored roles and tab stops.
 * @param {ToolbarOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function initToolbar({ root, ownsKey, exclude } = {}) {
  if (!hasDom()) return noop;
  const host = resolveHost(root);
  if (!host) return noop;
  const cleanups = collectHosts(host, '[data-bronto-toolbar]').map((toolbar) =>
    wireToolbar(toolbar, { ownsKey, exclude }),
  );
  return () => cleanups.forEach((stop) => stop());
}
