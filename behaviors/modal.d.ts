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