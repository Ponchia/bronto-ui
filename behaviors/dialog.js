import { hasDom, resolveHost, noop, bindOnce, byIdInHost } from './internal.js';

/**
 * Wire native <dialog> open/close glue (the one bit <dialog> can't do
 * declaratively). Click `[data-bronto-open="dialogId"]` calls
 * `showModal()` on `#dialogId`; click `[data-bronto-close]` closes the
 * nearest enclosing <dialog>. Clicking the backdrop of a dialog that has
 * `[data-bronto-dialog-light]` closes it too. On open the trigger is
 * remembered and focus is returned to it on *every* close path (Esc,
 * close button, backdrop light-dismiss, programmatic) via the native
 * `close` event, so keyboard/SR users are never dropped at `<body>`.
 * SSR-safe and idempotent; returns cleanup.
 *
 * `root` scopes delegated triggers (default `document`). Controlled targets are
 * resolved root-first, then document-wide, so scoped islands win duplicate-id
 * conflicts without breaking body/portal-mounted overlays.
 *
 * @param {import('./internal.js').DelegateOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function initDialog({ root } = {}) {
  if (!hasDom()) return noop;
  const host = resolveHost(root);
  if (!host) return noop;
  const managedDialogs = new WeakSet();
  const canManageDialog = (dlg, origin) => host.contains(origin) || managedDialogs.has(dlg);

  const openFrom = (opener) => {
    const dlg = byIdInHost(host, opener.getAttribute('data-bronto-open'));
    if (!dlg || typeof dlg.showModal !== 'function' || dlg.open) return;
    managedDialogs.add(dlg);
    dlg.addEventListener(
      'close',
      () => {
        if (opener.isConnected && typeof opener.focus === 'function') opener.focus();
      },
      { once: true },
    );
    dlg.showModal();
  };

  const closeFrom = (closer) => {
    const dlg = closer.closest('dialog');
    if (dlg && dlg.open && canManageDialog(dlg, closer)) dlg.close();
  };

  const lightDismiss = (dlg) => {
    if (
      dlg.tagName === 'DIALOG' &&
      dlg.open &&
      dlg.hasAttribute('data-bronto-dialog-light') &&
      canManageDialog(dlg, dlg)
    ) {
      dlg.close();
    }
  };

  const onClick = (e) => {
    const opener = e.target.closest('[data-bronto-open]');
    if (opener && host.contains(opener)) {
      openFrom(opener);
      return;
    }
    const closer = e.target.closest('[data-bronto-close]');
    if (closer) {
      closeFrom(closer);
      return;
    }
    // Light-dismiss: a click whose target is the <dialog> itself is the
    // backdrop (content sits in child elements).
    lightDismiss(e.target);
  };
  return bindOnce(host, 'dialog', () => {
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  });
}
