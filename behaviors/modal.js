import {
  hasDom,
  resolveHost,
  noop,
  bindOnce,
  collectHosts,
  focusInto,
  closestSafe,
} from './internal.js';

function insideOpenPopover(target, modal) {
  const classPanel = closestSafe(target, '.ui-popover.is-open');
  if (classPanel && modal.contains(classPanel)) return true;

  const nativePanel = closestSafe(target, '[popover]');
  if (!nativePanel || !modal.contains(nativePanel)) return false;
  try {
    return nativePanel.matches(':popover-open');
  } catch {
    return false;
  }
}

const activeModals = [];

const snapshotAttrs = (el, names) => {
  const attrs = {};
  for (const name of names) {
    attrs[name] = {
      had: el.hasAttribute(name),
      value: el.getAttribute(name),
    };
  }
  return attrs;
};

const restoreAttrs = (el, attrs) => {
  for (const [name, state] of Object.entries(attrs)) {
    if (state.had) el.setAttribute(name, state.value);
    else el.removeAttribute(name);
  }
};

const pushActiveModal = (modal) => {
  const index = activeModals.indexOf(modal);
  if (index !== -1) activeModals.splice(index, 1);
  activeModals.push(modal);
};

const removeActiveModal = (modal) => {
  const index = activeModals.indexOf(modal);
  if (index !== -1) activeModals.splice(index, 1);
};

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
 * Mark the overlay `[data-bronto-modal]` (opt-in). On bind it gives the modal a
 * `role="dialog"` + `aria-modal="true"` (unless the author set a role) and
 * dev-warns when it has no accessible name, so it announces as a named modal
 * dialog — parity with `initPopover`. The behavior watches its
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
      pushActiveModal(modal);
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
      removeActiveModal(modal);
      for (const el of inerted) el.inert = false;
      inerted = [];
      const back = opener;
      opener = null;
      if (back?.isConnected && typeof back.focus === 'function') back.focus();
    };

    const sync = () => (modal.classList.contains('is-open') ? trap() : release());

    const onKey = (e) => {
      if (e.key === 'Escape' && opener) {
        if (activeModals.at(-1) !== modal) return;
        if (insideOpenPopover(e.target, modal)) return;
        modal.dispatchEvent(
          new CustomEvent('bronto:modal:close', {
            detail: { reason: 'escape' },
            bubbles: true,
            cancelable: true,
          }),
        );
      }
    };

    cleanups.push(
      bindOnce(modal, 'modal', () => {
        const attrs = snapshotAttrs(modal, ['role', 'aria-modal', 'tabindex']);

        // A controlled modal must announce AS a modal dialog, not a generic group —
        // parity with initPopover. Apply a dialog role + aria-modal (unless the
        // author set a role), and dev-warn on a missing accessible name since we
        // can't invent a good one. (component audit C13.)
        if (!modal.hasAttribute('role')) modal.setAttribute('role', 'dialog');
        if (!modal.hasAttribute('aria-modal')) modal.setAttribute('aria-modal', 'true');
        const named =
          modal.hasAttribute('aria-label') ||
          modal.hasAttribute('aria-labelledby') ||
          modal.hasAttribute('title');
        if (!named && typeof console !== 'undefined') {
          console.warn(
            `[bronto] initModal(): a [data-bronto-modal] has no accessible name — add aria-label or aria-labelledby so it is announced as a named dialog.`,
          );
        }

        const observer = typeof MutationObserver === 'function' ? new MutationObserver(sync) : null;
        observer?.observe(modal, { attributes: true, attributeFilter: ['class'] });
        document.addEventListener('keydown', onKey, true);
        if (modal.classList.contains('is-open')) trap(); // already open at init
        return () => {
          observer?.disconnect();
          document.removeEventListener('keydown', onKey, true);
          release();
          restoreAttrs(modal, attrs);
        };
      }),
    );
  }

  return () => cleanups.forEach((fn) => fn());
}
