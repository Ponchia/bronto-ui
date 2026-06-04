/**
 * Editable combobox with a filtered listbox popup, implementing the
 * WAI-ARIA APG combobox pattern (the widget the framework most lacked
 * and consumers most often build badly). Dependency-free, no
 * positioning library — the list is CSS-anchored under the input.
 *
 * The input MUST have an accessible name — a `<label>`, `aria-label`, or
 * `aria-labelledby` (a placeholder does not count). A nameless `role="combobox"`
 * is a silent screen-reader failure, so the behavior warns at dev time when it
 * finds one, and mirrors the input's name onto the listbox.
 *
 * Markup: `[data-bronto-combobox]` wrapping an `<input role="combobox">`
 * (`.ui-combobox__input`) and a `<ul role="listbox">`
 * (`.ui-combobox__list`) of `<li role="option">` (`.ui-combobox__option`,
 * optional `data-value`). An optional `.ui-combobox__empty` (hidden at rest)
 * shows when nothing matches. The behavior owns ids, `aria-expanded`,
 * `aria-controls`, `aria-activedescendant`, roving active option,
 * type-to-filter, full keyboard (Down/Up/Home/End/Enter/Escape/Tab),
 * pointer select, and outside-click close. On select the **visible input shows
 * the option's text label**, while the emitted `bronto:change` CustomEvent
 * carries the option's `data-value` code: `{ detail: { value, label } }` (value
 * falls back to the label when there is no `data-value`). SSR-safe, idempotent
 * per instance; returns a cleanup function.
 *
 * Single-select APG deviations (intentional, for a filtering text combobox):
 * ArrowDown on a CLOSED list opens + filters rather than pre-activating the
 * first option, and Tab closes the list without committing the merely-highlighted
 * option (only Enter/click commits). Both are safe for single-select.
 *
 * Options are read from the DOM at init; if you replace the listbox contents
 * (e.g. async/remote results), either re-run initCombobox, or add
 * `data-bronto-combobox-live` to the `[data-bronto-combobox]` host so a
 * MutationObserver re-reads the options in place (opt-in — off by default so
 * the common static case stays observer-free).
 *
 * @param {import('./internal.js').DelegateOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function initCombobox({ root }?: import("./internal.js").DelegateOpts): import("./internal.js").Cleanup;
//# sourceMappingURL=combobox.d.ts.map