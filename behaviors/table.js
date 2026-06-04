import { hasDom, resolveHost, noop, bindOnce, collectHosts } from './internal.js';

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
export function initTableSort({ root } = {}) {
  if (!hasDom()) return noop;
  const host = resolveHost(root);
  if (!host) return noop;
  const tables = collectHosts(host, '[data-bronto-sortable]');
  const cleanups = [];

  for (const table of tables) {
    const tbody = table.tBodies[0];
    if (!tbody) continue;

    // Seed the resting `aria-sort="none"` on every sortable header so AT
    // announces the column as sortable from the start (it was unset until the
    // first click — C10).
    for (const sort of table.querySelectorAll('.ui-table__sort')) {
      const th = sort.closest('th');
      if (th && !th.hasAttribute('aria-sort')) th.setAttribute('aria-sort', 'none');
    }

    const colIndex = (th) => [...th.parentElement.children].indexOf(th);
    const cellText = (row, i) => row.children[i]?.textContent.trim() ?? '';
    // Numeric value of a cell for sorting. A `data-sort-value` attribute is the
    // authoritative escape hatch; otherwise normalize the display text so the
    // sign survives (U+2212 / en-em dashes → minus, accounting parens →
    // negative) and `,` grouping is dropped. Returns 0 for unparseable cells so
    // they cluster rather than scatter. (component audit C3.)
    const cellNum = (row, i) => {
      const cell = row.children[i];
      const explicit = cell?.getAttribute?.('data-sort-value');
      if (explicit != null && explicit.trim() !== '') {
        const v = Number(explicit.trim());
        if (Number.isFinite(v)) return v;
      }
      let s = (cell?.textContent ?? '').trim();
      if (!s) return 0;
      let sign = 1;
      const paren = /^\((.*)\)$/.exec(s); // accounting negative
      if (paren) {
        sign = -1;
        s = paren[1];
      }
      s = s.replace(/[−–—]/g, '-'); // minus / en / em dash → '-'
      if (/-/.test(s)) sign *= -1;
      s = s.replace(/,/g, ''); // drop thousands separators
      const v = parseFloat(s.replace(/[^\d.]/g, '')); // magnitude
      return Number.isFinite(v) ? sign * v : 0;
    };

    const sortBy = (th, numeric) => {
      const headers = th.closest('tr').querySelectorAll('th');
      const dir = th.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending';
      // Reset the OTHER sortable headers to `none` (not removed) so they keep
      // announcing sortability; only previously-sortable headers carry aria-sort.
      headers.forEach((h) => {
        if (h !== th && h.hasAttribute('aria-sort')) h.setAttribute('aria-sort', 'none');
      });
      th.setAttribute('aria-sort', dir);
      const i = colIndex(th);
      const sign = dir === 'ascending' ? 1 : -1;
      // Empty/sentinel rows sort out of the data set AND must re-append LAST,
      // or after a sort they float above the real rows (C29).
      const emptyRows = [...tbody.rows].filter((r) => r.classList.contains('ui-table__empty'));
      const rows = [...tbody.rows].filter((r) => !r.classList.contains('ui-table__empty'));
      rows.sort((a, b) => {
        const cmp = numeric
          ? cellNum(a, i) - cellNum(b, i)
          : cellText(a, i).localeCompare(cellText(b, i));
        return cmp * sign;
      });
      // Re-parent in document order: sorted data rows, then any empty/sentinel
      // row last. A single appendChild pass over the existing <tr> nodes (no
      // markup is created — these are trusted DOM elements being moved).
      for (const r of [...rows, ...emptyRows]) tbody.appendChild(r);
    };

    const allBox = table.querySelector('[data-bronto-select-all]');
    const rowBoxes = () => [...table.querySelectorAll('[data-bronto-select]')];
    const syncAll = () => {
      const boxes = rowBoxes();
      const on = boxes.filter((b) => b.checked).length;
      if (allBox) {
        allBox.checked = on > 0 && on === boxes.length;
        allBox.indeterminate = on > 0 && on < boxes.length;
      }
      table.dispatchEvent(
        new CustomEvent('bronto:selectionchange', { detail: { count: on }, bubbles: true }),
      );
    };
    const markRow = (box) => {
      const tr = box.closest('tr');
      if (tr) tr.setAttribute('aria-selected', String(box.checked));
    };

    const onClick = (e) => {
      // Only the focusable `.ui-table__sort` button is a sort trigger — it is
      // keyboard-operable and carries the `::after` sort glyph. The bare
      // `th[data-sort]` path was mouse-only with no affordance, so it is gone
      // (C10); `data-sort="num"` is still read from the button or its th.
      const sorter = e.target.closest('.ui-table__sort');
      if (sorter && table.contains(sorter)) {
        const th = sorter.closest('th');
        const numeric =
          (sorter.getAttribute('data-sort') || th.getAttribute('data-sort')) === 'num' ||
          th.classList.contains('is-num');
        sortBy(th, numeric);
      }
    };
    const onChange = (e) => {
      const t = e.target;
      if (t.matches?.('[data-bronto-select-all]')) {
        rowBoxes().forEach((b) => {
          b.checked = t.checked;
          markRow(b);
        });
        syncAll();
      } else if (t.matches?.('[data-bronto-select]')) {
        markRow(t);
        syncAll();
      }
    };

    const bound = bindOnce(table, 'tableSort', () => {
      table.addEventListener('click', onClick);
      table.addEventListener('change', onChange);
      return () => {
        table.removeEventListener('click', onClick);
        table.removeEventListener('change', onChange);
      };
    });
    cleanups.push(bound);
  }

  return () => cleanups.forEach((fn) => fn());
}
