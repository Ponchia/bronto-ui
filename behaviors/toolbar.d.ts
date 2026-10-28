/**
 * One Tab entry and roving arrows for `[data-bronto-toolbar]`. Orientation and
 * direction come from the DOM. Native fields and nested widgets retain their
 * keys; the host provides the label and commands. Dynamic items use their own
 * document's observer. No geometry/style reads for idle toolbar discovery.
 * SSR-safe, idempotent; cleanup restores authored roles and tab stops.
 * @param {ToolbarOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function initToolbar({ root, ownsKey, exclude }?: ToolbarOpts): import("./internal.js").Cleanup;
export type ToolbarOpts = {
    /**
     * Scope; null never widens to the document.
     */
    root?: Element | Document | null | undefined;
    /**
     * Additional host widgets whose keys the toolbar must leave untouched.
     */
    ownsKey?: ((event: KeyboardEvent, toolbar: HTMLElement) => boolean) | undefined;
    /**
     * Host-owned controls excluded from the toolbar, for example portal menu content.
     */
    exclude?: ((element: HTMLElement, toolbar: HTMLElement) => boolean) | undefined;
};
//# sourceMappingURL=toolbar.d.ts.map