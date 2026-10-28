import {
  hasDom,
  resolveHost,
  noop,
  bindOnce,
  collectHosts,
  ignoreListboxKey,
  isUnavailable,
} from './internal.js';
import { compositeVisible, tabStops, compositeIndex, editingControl } from './composite.js';

/** @typedef {'escape' | 'tab' | 'outside' | 'select'} ActionMenuCloseReason */
/** @typedef {{ reason: ActionMenuCloseReason, backwards: boolean }} ActionMenuCloseDetail */
/**
 * @typedef {object} ActionMenuOpts
 * @property {Document | Element | null} [root] Scope for open `[data-bronto-action-menu]` elements.
 * @property {HTMLElement | null} [invoker] Explicit origin; recommended for pointer-opened menus.
 * @property {(detail: ActionMenuCloseDetail) => void} [onClose] The host closes/unmounts the menu.
 * @property {(backwards: boolean) => HTMLElement | null} [tabTarget]
 *   Optional host tab-order resolver (for portals). Otherwise native Tab continues from the invoker.
 * @property {boolean} [closeOnSelect] Request close after an uncancelled item click. Default true.
 */
const ITEMS = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';

function restoreOrigin(menu, invoker) {
  const active = menu.ownerDocument.activeElement;
  if (!invoker?.isConnected) return;
  if (active === menu.ownerDocument.body || menu.contains(active)) invoker.focus();
}

function menuOrigin(menu, explicit) {
  if (explicit !== undefined) return explicit;
  const active = menu.ownerDocument.activeElement;
  return active === menu.ownerDocument.body ? null : active;
}

function wireActionMenu(menu, options) {
  if (!menu.ownerDocument.defaultView) return noop;
  return bindOnce(menu, 'action-menu', () => {
    const doc = menu.ownerDocument;
    const view = doc.defaultView;
    const invoker = menuOrigin(menu, options.invoker);
    const role = menu.getAttribute('role');
    menu.setAttribute('role', 'menu');
    const stops = tabStops(menu);
    let active = null;
    let closed = false;
    let closeReason = null;
    let disposed = false;
    const candidates = () =>
      [...menu.querySelectorAll(ITEMS)].filter((item) => item.closest('[role="menu"]') === menu);
    const items = () => candidates().filter(compositeVisible);
    const sync = () => {
      if (closed || disposed) return;
      const visible = items();
      const previous = active;
      if (!visible.includes(active)) active = visible[0] ?? null;
      stops.sync(candidates(), active);
      stops.set(menu, active ? -1 : 0);
      if (previous && previous !== active) (active ?? menu).focus();
      else if (doc.activeElement === menu && active) active.focus();
    };
    const requestClose = (reason, backwards = false) => {
      if (closed || disposed) return false;
      const detail = { reason, backwards };
      const event = new view.CustomEvent('bronto:action-menu:close', {
        bubbles: true,
        cancelable: true,
        detail,
      });
      if (!menu.dispatchEvent(event)) return false;
      closed = true;
      closeReason = reason;
      if (!disposed) {
        stops.sync(candidates(), null);
        stops.set(menu, -1);
      }
      options.onClose?.(detail);
      if (reason === 'escape' || reason === 'select') restoreOrigin(menu, invoker);
      return true;
    };
    const onTab = (event) => {
      const target = options.tabTarget?.(event.shiftKey);
      if (!requestClose('tab', event.shiftKey)) return;
      if (target?.isConnected) {
        event.preventDefault();
        target.focus();
      } else if (invoker?.isConnected) {
        // Leave the actual tab order to the browser, including positive tabindex.
        invoker.focus();
      }
    };
    const onKey = (event) => {
      if (ignoreListboxKey(event) || closed) return;
      if (event.target.closest?.('[role="menu"]') !== menu) return;
      if (editingControl(event.target)) return;
      if (event.key === 'Tab') {
        onTab(event);
        return;
      }
      if (event.key === 'Escape') {
        if (requestClose('escape')) {
          event.preventDefault();
          event.stopPropagation();
        }
        return;
      }
      const visible = items();
      const next = compositeIndex(
        event.key,
        visible.indexOf(doc.activeElement),
        visible.length,
        true,
      );
      if (next === null) return;
      event.preventDefault();
      visible[next]?.focus();
    };
    const onFocus = (event) => {
      if (!items().includes(event.target)) return;
      active = event.target;
      stops.sync(candidates(), active);
      stops.set(menu, -1);
    };
    const targetItem = (event) => {
      const item = event.target.closest?.(ITEMS);
      return item?.closest('[role="menu"]') === menu ? item : null;
    };
    const guard = (event) => {
      if (event.type === 'keydown' && ignoreListboxKey(event)) return;
      const item = targetItem(event);
      if (!item || !isUnavailable(item)) return;
      if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    const onClick = (event) => {
      if (!targetItem(event) || options.closeOnSelect === false) return;
      // Framework delegated handlers run after this DOM listener and may cancel
      // the action or deliberately focus another surface before cleanup.
      queueMicrotask(() => {
        if (!event.defaultPrevented) requestClose('select');
      });
    };
    const outside = (event) => {
      if (event.defaultPrevented || menu.contains(event.target)) return;
      if (invoker?.contains(event.target)) return;
      if (requestClose('outside') && !event.target.isConnected) restoreOrigin(menu, invoker);
    };
    menu.addEventListener('keydown', guard, true);
    menu.addEventListener('click', guard, true);
    menu.addEventListener('keydown', onKey);
    menu.addEventListener('focusin', onFocus);
    menu.addEventListener('click', onClick);
    doc.addEventListener('pointerdown', outside, true);
    sync();
    // The host supplies an already-open surface. Enter focus synchronously so
    // a quick Escape or arrow cannot fall into the opening animation frame.
    (active ?? menu).focus();
    const observer = new view.MutationObserver(sync);
    observer.observe(menu, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['disabled', 'hidden', 'inert', 'aria-hidden', 'aria-disabled', 'role'],
    });
    return () => {
      disposed = true;
      observer.disconnect();
      menu.removeEventListener('keydown', guard, true);
      menu.removeEventListener('click', guard, true);
      menu.removeEventListener('keydown', onKey);
      menu.removeEventListener('focusin', onFocus);
      menu.removeEventListener('click', onClick);
      doc.removeEventListener('pointerdown', outside, true);
      if (!closed || closeReason === 'outside') restoreOrigin(menu, invoker);
      stops.restore();
      if (role === null) menu.removeAttribute('role');
      else menu.setAttribute('role', role);
    };
  });
}

/**
 * Flat action menus, separate from `initMenu`'s native disclosure. The host
 * supplies labelled, open markup and controls visibility in `onClose` or the
 * cancelable `bronto:action-menu:close` event. Arrow/Home/End navigation,
 * Escape, Tab exit, outside press, and deliberate-focus-safe cleanup are shared.
 * Use aria-disabled for discoverable unavailable actions; native disabled
 * buttons remain skipped. Submenus and checkbox/radio state stay host-owned.
 * SSR-safe and idempotent. Call once per opening; retain the cleanup.
 * @param {ActionMenuOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function initActionMenu({ root, ...options } = {}) {
  if (!hasDom()) return noop;
  const host = resolveHost(root);
  if (!host) return noop;
  const cleanups = collectHosts(host, '[data-bronto-action-menu]')
    .filter(compositeVisible)
    .map((menu) => wireActionMenu(menu, options));
  return () => cleanups.forEach((stop) => stop());
}
