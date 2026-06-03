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
export function initDialog({ root }?: import("./internal.js").DelegateOpts): import("./internal.js").Cleanup;
//# sourceMappingURL=dialog.d.ts.map