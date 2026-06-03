/**
 * Client-side sortable + selectable data table. Wires
 * `[data-bronto-sortable]`:
 *
 *  - clicking a header's `.ui-table__sort` button sorts the tbody by
 *    that column. Sortable headers are seeded `aria-sort="none"`; a
 *    click toggles that header ascending ⇄ descending (first click =
 *    ascending) and resets the other sortable headers to `none`.
 *    Numeric columns (`data-sort="num"` or `.is-num` cells) sort
 *    numerically; everything else, locale string compare. Any
 *    `.ui-table__empty` sentinel row is kept last after a sort.
 *  - a `[data-bronto-select-all]` checkbox toggles every
 *    `[data-bronto-select]` row checkbox and the rows'
 *    `aria-selected`; toggling a row keeps the header checkbox's
 *    checked/indeterminate state in sync. Emits `bronto:selectionchange`
 *    ({ detail: { count } }) on the table.
 *
 * SSR-safe, idempotent per table; returns a cleanup function.
 *
 * The numeric sort parses each cell as display text (strips non-[0-9.-] chars),
 * so it is locale-naive — group/decimal separators beyond `.`/`-` are not
 * interpreted. It is a client-side convenience sorter, not a data grid.
 *
 * @param {import('./internal.js').DelegateOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function initTableSort({ root }?: import("./internal.js").DelegateOpts): import("./internal.js").Cleanup;
//# sourceMappingURL=table.d.ts.map