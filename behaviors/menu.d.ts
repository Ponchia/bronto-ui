/**
 * Dropdown-menu close affordances for a native `<details data-bronto-menu>`
 * holding a `.ui-menu`. `<details>` alone won't close on Escape, on an
 * outside click, or when a `.ui-menu__item` is activated — this adds
 * exactly those, returning focus to the `<summary>` on Esc/activate.
 *
 * Deliberately NOT a full WAI-ARIA menu (no arrow-key roving): the items
 * are real buttons, Tab-reachable; this is a disclosure of actions, and
 * over-claiming `role="menu"` semantics would be worse. SSR-safe,
 * idempotent; returns a cleanup function.
 *
 * @param {import('./internal.js').DelegateOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function initMenu({ root }?: import("./internal.js").DelegateOpts): import("./internal.js").Cleanup;
//# sourceMappingURL=menu.d.ts.map