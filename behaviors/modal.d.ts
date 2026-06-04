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
export function initModal({ root }?: import("./internal.js").DelegateOpts): import("./internal.js").Cleanup;
export type ModalCloseDetail = {
    /**
     * What asked the modal to close (currently only Escape).
     */
    reason: "escape";
};
//# sourceMappingURL=modal.d.ts.map