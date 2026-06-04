import { hasDom, resolveHost, noop, bindOnce, collectHosts, focusInto } from './internal.js';

/**
 * @typedef {object} ModalCloseDetail
 * @property {'escape'} reason What asked the modal to close (currently only Escape).
 */

/**
 * Focus management for the **controlled, non-`<dialog>` modal** — the
 * `.ui-modal.is-open` path a portal/React overlay uses when it genuinely can't
 * be a native `<dialog>`. The native `<dialog>` path gets a focus trap, Escape,
 * and the top layer for free (use `initDialog`); this supplies the equivalent
 * for the `.is-open` path, which otherwise leaves focus management to the
 * consumer.
 *
 * Mark the overlay `[data-bronto-modal]` (opt-in). The behavior watches its
 * `class` for `is-open`: on open it remembers the focused element, moves focus
 * into the modal (first focusable, else the panel itself), and **traps focus by
 * marking every sibling at each ancestor level `inert`** so the rest of the page
 * is non-focusable and non-interactive — the modern, robust trap. On close it
 * un-inerts exactly what it inerted and returns focus to the opener. Bronto owns
 * focus only: the **consumer still owns open/close state** (the `is-open`
 * class). Escape dispatches a cancelable `bronto:modal:close`
 * ({@link ModalCloseDetail}) on the modal so the consumer can drop `is-open` in
 * response; the behavior never changes visibility itself.
 *
 * Best suited to a body-/portal-level overlay (the documented `.is-open` use
 * case); a deeply-nested modal still gets focus-into, focus-return, and the
 * Escape signal. SSR-safe, idempotent per modal; returns a cleanup function.
 *
 * @param {import('./internal.js').DelegateOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function initModal({ root } = {}) {
  if (!hasDom()) return noop;
  const host = resolveHost(root);
  if (!host) return noop;
  const modals = collectHosts(host, '[data-bronto-modal]');
  const cleanups = [];

  for (const modal of modals) {
    let opener = null;
    let inerted = [];

    // Inert every sibling at each ancestor level up to <body>: the rest of the
    // page becomes non-focusable/non-interactive while the modal subtree stays
    // live. Skip already-inert nodes so release() can't un-inert something the
    // app inerted for its own reasons.
    const trap = () => {
      if (opener) return; // already trapped
      opener = document.activeElement;
      let el = modal;
      while (el && el.parentElement && el !== document.body) {
        for (const sib of el.parentElement.children) {
          if (sib !== el && !sib.inert) {
            sib.inert = true;
            inerted.push(sib);
          }
        }
        el = el.parentElement;
      }
      focusInto(modal);
    };

    const release = () => {
      if (!opener) return;
      for (const el of inerted) el.inert = false;
      inerted = [];
      const back = opener;
      opener = null;
      if (back?.isConnected && typeof back.focus === 'function') back.focus();
    };

    const sync = () => (modal.classList.contains('is-open') ? trap() : release());

    const onKey = (e) => {
      if (e.key === 'Escape' && opener) {
        modal.dispatchEvent(
          new CustomEvent('bronto:modal:close', {
            detail: { reason: 'escape' },
            bubbles: true,
            cancelable: true,
          }),
        );
      }
    };

    const observer = typeof MutationObserver === 'function' ? new MutationObserver(sync) : null;

    cleanups.push(
      bindOnce(modal, 'modal', () => {
        observer?.observe(modal, { attributes: true, attributeFilter: ['class'] });
        document.addEventListener('keydown', onKey, true);
        if (modal.classList.contains('is-open')) trap(); // already open at init
        return () => {
          observer?.disconnect();
          document.removeEventListener('keydown', onKey, true);
          release();
        };
      }),
    );
  }

  return () => cleanups.forEach((fn) => fn());
}
