/**
 * Make `aria-disabled="true"` controls keyboard-inert, not just pointer-inert.
 *
 * CSS can dim an `aria-disabled` control and set `pointer-events: none`, but it
 * cannot block keyboard activation: a focused `<a aria-disabled>` or
 * `<button aria-disabled>` still fires on Enter/Space, so a keyboard user can
 * activate a control that looks dead. (Native `disabled` is already fully inert;
 * this guard brings the ARIA path up to parity.) The element intentionally stays
 * focusable and announced — the WAI-ARIA disabled pattern keeps it in the tab
 * order — but it no longer *acts*.
 *
 * Wire once near the root, like {@link applyStoredTheme}. Capturing listeners
 * intercept activation before any component handler (tabs, pagination, menus)
 * sees it. (component audit C4.)
 *
 * @param {import('./internal.js').DelegateOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function initDisabledGuard({ root }?: import("./internal.js").DelegateOpts): import("./internal.js").Cleanup;
//# sourceMappingURL=inert.d.ts.map