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
export function initActionMenu({ root, ...options }?: ActionMenuOpts): import("./internal.js").Cleanup;
export type ActionMenuCloseReason = "escape" | "tab" | "outside" | "select";
export type ActionMenuCloseDetail = {
    reason: ActionMenuCloseReason;
    backwards: boolean;
};
export type ActionMenuOpts = {
    /**
     * Scope for open `[data-bronto-action-menu]` elements.
     */
    root?: Element | Document | null | undefined;
    /**
     * Explicit origin; recommended for pointer-opened menus.
     */
    invoker?: HTMLElement | null | undefined;
    /**
     * The host closes/unmounts the menu.
     */
    onClose?: ((detail: ActionMenuCloseDetail) => void) | undefined;
    /**
     * Optional host tab-order resolver (for portals). Otherwise native Tab continues from the invoker.
     */
    tabTarget?: ((backwards: boolean) => HTMLElement | null) | undefined;
    /**
     * Request close after an uncancelled item click. Default true.
     */
    closeOnSelect?: boolean | undefined;
};
//# sourceMappingURL=action-menu.d.ts.map