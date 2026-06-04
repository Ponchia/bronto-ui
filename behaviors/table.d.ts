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
 * The numeric sort parses each cell's display text after normalizing the
 * common report shapes: a Unicode minus (U+2212) and en/em dashes count as a
 * sign (so a "−5" loss sorts BELOW a "5" gain, not above it), accounting
 * parentheses `(1,234)` read as negative, and `,` thousands separators are
 * dropped. For anything ambiguous (e.g. a European decimal comma, mixed units)
 * put the canonical number in a `data-sort-value` attribute on the cell — it
 * wins over the parsed text. It is a client-side convenience sorter, not a data
 * grid. (component audit C3.)
 *
 * @param {import('./internal.js').DelegateOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function initTableSort({ root }?: import("./internal.js").DelegateOpts): import("./internal.js").Cleanup;
//# sourceMappingURL=table.d.ts.map