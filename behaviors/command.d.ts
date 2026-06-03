/**
 * @typedef {object} CommandSelectDetail
 * @property {string} value The chosen command's value.
 * @property {string} label The chosen command's visible label.
 */
/**
 * Command palette — filter + keyboard-navigate a DOM-authored command list.
 * The CSS shell (`.ui-command`) is opt-in; this wires the listbox behavior the
 * shell needs. Bronto filters and navigates; the HOST owns the action registry,
 * permission checks, routing, async effects, and command execution (it listens
 * for `bronto:command:select`). There is no global Cmd/Ctrl+K — open the palette
 * yourself (e.g. a `<dialog>` via `initDialog`).
 *
 * Markup: `[data-bronto-command]` wrapping an `<input>` (`.ui-command__input`)
 * and a list (`.ui-command__list`) of `.ui-command__item` rows (optional
 * `data-value`), interleaved with `.ui-command__group` labels and an optional
 * `.ui-command__empty`. The behavior owns ids, `role=combobox/listbox/option`,
 * `aria-activedescendant`, a roving active item, substring filtering (hiding
 * empty groups), full keyboard (Down/Up/Home/End/Enter/Escape), and pointer
 * select. It emits `bronto:command:select` ({ detail: { value, label } }) on
 * choose and `bronto:command:close` on Escape. SSR-safe, idempotent per
 * instance; returns a cleanup function.
 *
 * Items are read from the DOM at init; re-run initCommand after replacing the
 * command list so filtering/navigation see the current nodes.
 *
 * @param {import('./internal.js').DelegateOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function initCommand({ root }?: import("./internal.js").DelegateOpts): import("./internal.js").Cleanup;
export type CommandSelectDetail = {
    /**
     * The chosen command's value.
     */
    value: string;
    /**
     * The chosen command's visible label.
     */
    label: string;
};
//# sourceMappingURL=command.d.ts.map