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
 * `aria-activedescendant`, a roving active item, filtering (substring by
 * default, `match` to replace it, hiding empty groups), keyboard list
 * navigation (Down/Up/Enter/Escape), and pointer select. It emits
 * `bronto:command:select` ({ detail: { value, label } }) on choose and
 * `bronto:command:close` on Escape. SSR-safe, idempotent per instance; returns
 * a cleanup function.
 *
 * Items are read from the DOM at init; re-run initCommand after replacing the
 * command list so filtering/navigation see the current nodes — or pass
 * `headless: true` and render the results yourself.
 *
 * @param {CommandOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function initCommand({ root, match, headless }?: CommandOpts): import("./internal.js").Cleanup;
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
export type CommandOpts = {
    /**
     * Event-delegation root; also scopes which palettes are queried. Default: `document`.
     * `null` means a scope was requested but is not ready yet, so the behavior no-ops.
     */
    root?: Element | Document | null | undefined;
    /**
     * Decides whether an item stays visible for a query. `query` is the trimmed
     * input, lower-cased in the palette's locale; an empty query shows every item.
     * Default: the item's text contains the query. Use it to match on keywords
     * (`data-keywords`, say) or to keep a row such as "Search everything" visible
     * for every query. Not called in headless mode.
     */
    match?: ((item: HTMLElement, query: string) => boolean) | undefined;
    /**
     * The host renders the result set. Bronto never hides an item or group; it
     * reads the list live, so the host can replace rows on every keystroke
     * without re-running `initCommand`. It still owns ids, roles, the roving
     * active item, the keyboard, pointer select and the empty state's live
     * region. After the query changes, the first row the host renders becomes
     * active.
     */
    headless?: boolean | undefined;
};
//# sourceMappingURL=command.d.ts.map