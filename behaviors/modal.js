import {
  hasDom,
  resolveHost,
  noop,
  bindOnce,
  byIdInHost,
  collectHosts,
  focusInto,
  closestSafe,
} from './internal.js';

const states = new WeakMap();

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

function modalState(doc) {
  let state = states.get(doc);
  if (state) return state;
  state = {
    doc,
    records: new Set(),
    byModal: new Map(),
    ownedInert: new Set(),
    pendingOverlays: new Set(),
    observer: null,
    observing: false,
    sequence: 0,
    scheduled: false,
    top: null,
  };
  states.set(doc, state);
  return state;
}

function isEffectivelyActive(record, state) {
  if (!record.active || !record.modal.isConnected) return false;
  for (let node = record.modal.parentElement; node; node = node.parentElement) {
    const ancestor = state.byModal.get(node);
    if (ancestor && (!ancestor.active || !ancestor.modal.isConnected)) return false;
  }
  return true;
}

function activeTop(state) {
  let top = null;
  for (const record of state.records) {
    if (!isEffectivelyActive(record, state)) continue;
    if (!top || top.modal.contains(record.modal)) {
      top = record;
      continue;
    }
    if (!record.modal.contains(top.modal) && record.openedAt > top.openedAt) top = record;
  }
  return top;
}

function popoverIsOpen(panel, state) {
  if (state.pendingOverlays.has(panel) || panel.classList.contains('is-open')) return true;
  try {
    return panel.matches(':popover-open');
  } catch {
    return false;
  }
}

function modalOwnsPopover(modal, panel) {
  if (modal.contains(panel)) return true;
  if (!panel.id) return false;
  return collectHosts(modal, '[data-bronto-popover]').some(
    (trigger) => trigger.getAttribute('data-bronto-popover') === panel.id,
  );
}

function liveRoots(state, top) {
  const roots = new Set([top.modal]);
  for (const trigger of collectHosts(top.modal, '[data-bronto-popover]')) {
    const panel = byIdInHost(top.modal, trigger.getAttribute('data-bronto-popover'));
    if (panel && popoverIsOpen(panel, state)) roots.add(panel);
  }
  for (const panel of state.pendingOverlays) {
    if (modalOwnsPopover(top.modal, panel)) roots.add(panel);
  }
  return roots;
}

function desiredInert(state, top) {
  const body = state.doc.body;
  if (!body || !top) return new Set();
  const roots = liveRoots(state, top);
  const livePath = new Set([body]);
  for (const root of roots) {
    for (let node = root; node && node !== body; node = node.parentElement) {
      livePath.add(node);
    }
  }

  const desired = new Set();
  for (const parent of livePath) {
    if (roots.has(parent)) continue;
    for (const child of parent.children || []) {
      if (!livePath.has(child)) desired.add(child);
    }
  }
  return desired;
}

function reconcileInert(state) {
  const previousTop = state.top;
  const nextTop = activeTop(state);
  const desired = desiredInert(state, nextTop);

  for (const element of [...state.ownedInert]) {
    if (desired.has(element)) {
      if (!element.inert) element.inert = true;
      continue;
    }
    element.inert = false;
    state.ownedInert.delete(element);
  }
  for (const element of desired) {
    if (state.ownedInert.has(element) || element.inert) continue;
    element.inert = true;
    state.ownedInert.add(element);
  }
  state.top = nextTop;
  return { previousTop, nextTop };
}

function scheduleReconcile(state) {
  if (state.scheduled) return;
  state.scheduled = true;
  queueMicrotask(() => {
    state.scheduled = false;
    reconcileInert(state);
  });
}

function ensureDocumentObserver(state) {
  if (state.observing) return;
  state.observing = true;
  const view = state.doc.defaultView;
  const Observer = view?.MutationObserver;
  if (Observer && state.doc.body) {
    state.observer = new Observer((mutations) => {
      const relevant = mutations.some(
        (mutation) =>
          mutation.type === 'childList' || mutation.target.matches?.('.ui-popover, [popover]'),
      );
      if (relevant && state.top) scheduleReconcile(state);
    });
    state.observer.observe(state.doc.body, {
      attributes: true,
      attributeFilter: ['class'],
      childList: true,
      subtree: true,
    });
  }

  state.onBeforeToggle = (event) => {
    const panel = event.target;
    if (!panel?.matches?.('[popover]')) return;
    if (event.newState === 'open') state.pendingOverlays.add(panel);
    else state.pendingOverlays.delete(panel);
    reconcileInert(state);
  };
  state.onToggle = (event) => {
    state.pendingOverlays.delete(event.target);
    scheduleReconcile(state);
  };
  state.doc.addEventListener('beforetoggle', state.onBeforeToggle, true);
  state.doc.addEventListener('toggle', state.onToggle, true);
}

function releaseDocumentState(state) {
  if (state.records.size) return;
  state.observer?.disconnect();
  state.observer = null;
  state.observing = false;
  state.doc.removeEventListener('beforetoggle', state.onBeforeToggle, true);
  state.doc.removeEventListener('toggle', state.onToggle, true);
  state.pendingOverlays.clear();
  reconcileInert(state);
  states.delete(state.doc);
}

function restoreAfterClose(record, nextTop) {
  const back = record.opener;
  record.opener = null;
  if (nextTop) {
    if (back?.isConnected && nextTop.modal.contains(back)) back.focus?.();
    else focusInto(nextTop.modal);
    return;
  }
  if (back?.isConnected && typeof back.focus === 'function') back.focus();
}

function syncRecord(record) {
  const { modal, state } = record;
  const nextActive = modal.classList.contains('is-open');
  if (nextActive === record.active) {
    if (!record.isNativeDialog) modal.hidden = !nextActive;
    scheduleReconcile(state);
    return;
  }

  const oldTop = state.top ?? activeTop(state);
  record.active = nextActive;
  if (nextActive) {
    record.opener = state.doc.activeElement;
    record.openedAt = ++state.sequence;
    if (!record.isNativeDialog) modal.hidden = false;
    const { nextTop } = reconcileInert(state);
    if (nextTop && (nextTop === record || modal.contains(nextTop.modal))) {
      focusInto(nextTop.modal);
    }
    return;
  }

  if (!record.isNativeDialog) modal.hidden = true;
  const closedOwnedTop = oldTop && (oldTop === record || modal.contains(oldTop.modal));
  const { nextTop } = reconcileInert(state);
  if (closedOwnedTop) restoreAfterClose(record, nextTop);
  else record.opener = null;
}

function unregisterRecord(record) {
  const { state, modal } = record;
  const oldTop = state.top ?? activeTop(state);
  const removedOwnedTop = oldTop && (oldTop === record || modal.contains(oldTop.modal));
  record.active = false;
  state.records.delete(record);
  state.byModal.delete(modal);
  const { nextTop } = reconcileInert(state);
  if (removedOwnedTop) restoreAfterClose(record, nextTop);
  else record.opener = null;
  releaseDocumentState(state);
}

function targetIsOwnedPopover(target, modal, state) {
  const panel = closestSafe(target, '.ui-popover, [popover]');
  return Boolean(panel && popoverIsOpen(panel, state) && modalOwnsPopover(modal, panel));
}

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
 * dev-warns when it has no accessible name. While open, a document-level stack
 * reconciler keeps only the top controlled modal interactive, marks the rest of
 * the page `inert`, admits an open popover owned by the top modal even when the
 * panel is portaled elsewhere, and applies the trap to background nodes added
 * after open. Nested and sibling portal modals therefore share one ownership
 * model instead of independently inverting each other's `inert` state.
 *
 * Bronto owns focus only: the **consumer still owns open/close state** (the
 * `is-open` class). Escape dispatches a cancelable `bronto:modal:close`
 * ({@link ModalCloseDetail}) on the modal so the consumer can drop `is-open` in
 * response; the behavior never changes visibility itself. Closing a parent
 * modal temporarily suspends any still-`is-open` controlled descendants; they
 * resume at the top of the stack if the parent reopens.
 *
 * SSR-safe, idempotent per modal; returns a cleanup function.
 *
 * @deprecated Use a native `<dialog>` with `initDialog()`. This controlled
 * non-dialog path remains compatible in 0.7 and is scheduled for removal no
 * earlier than 0.8 because no real consumer adopted it.
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
    const doc = modal.ownerDocument;
    if (!doc) continue;
    const view = doc.defaultView;
    cleanups.push(
      bindOnce(modal, 'modal', () => {
        const attrs = snapshotAttrs(modal, ['role', 'aria-modal', 'tabindex', 'hidden']);
        const state = modalState(doc);
        const record = {
          active: modal.classList.contains('is-open'),
          isNativeDialog: modal.localName === 'dialog',
          modal,
          openedAt: 0,
          opener: null,
          state,
        };

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

        if (record.active) {
          record.opener = doc.activeElement;
          record.openedAt = ++state.sequence;
        }
        if (!record.isNativeDialog) modal.hidden = !record.active;
        state.records.add(record);
        state.byModal.set(modal, record);
        ensureDocumentObserver(state);
        reconcileInert(state);
        if (state.top === record) focusInto(modal);

        const Observer = view?.MutationObserver;
        const observer = Observer ? new Observer(() => syncRecord(record)) : null;
        observer?.observe(modal, { attributes: true, attributeFilter: ['class'] });
        const onKey = (event) => {
          if (event.key !== 'Escape' || state.top !== record) return;
          if (targetIsOwnedPopover(event.target, modal, state)) return;
          const ModalCloseEvent = view?.CustomEvent ?? CustomEvent;
          modal.dispatchEvent(
            new ModalCloseEvent('bronto:modal:close', {
              detail: { reason: 'escape' },
              bubbles: true,
              cancelable: true,
            }),
          );
        };
        doc.addEventListener('keydown', onKey, true);

        return () => {
          observer?.disconnect();
          doc.removeEventListener('keydown', onKey, true);
          unregisterRecord(record);
          restoreAttrs(modal, attrs);
        };
      }),
    );
  }

  return () => cleanups.forEach((fn) => fn());
}
