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
 * optional `data-value`). An optional `.ui-combobox__empty` shows when
 * nothing matches. The behavior owns ids, `aria-expanded`,
 * `aria-controls`, `aria-activedescendant`, roving active option,
 * type-to-filter, full keyboard (Down/Up/Home/End/Enter/Escape/Tab),
 * pointer select, and outside-click close; it emits a `bronto:change`
 * CustomEvent ({ detail: { value } }) on selection. SSR-safe,
 * idempotent per instance; returns a cleanup function.
 *
 * Options are read from the DOM at init; if you replace the listbox contents
 * (e.g. async/remote results) without re-initialising, filtering and keyboard
 * nav act on the stale nodes — re-run initCombobox after mutating the options.
 *
 * @param {import('./internal.js').DelegateOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function initCombobox({ root }?: import("./internal.js").DelegateOpts): import("./internal.js").Cleanup;
//# sourceMappingURL=combobox.d.ts.map