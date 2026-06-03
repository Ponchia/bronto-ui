# Diff

`@ponchia/ui/css/diff.css` is an opt-in change-review grammar — the surface for
showing what **changed**: code review, changelogs, version history, config
diffs, and generated reports. Marks call out a sentence; diff calls out a line.

```css
@import '@ponchia/ui';
@import '@ponchia/ui/css/diff.css';
```

```html
<!-- node_modules / CDN: source css/ → built dist/css/ -->
<link rel="stylesheet" href="./node_modules/@ponchia/ui/dist/css/diff.css" />
```

## Boundary — what Bronto owns vs. what you own

Bronto paints the gutter grammar. **You** pre-classify each row (`add` /
`remove` / `context`), compute the hunks, and align the two sides in split
view. Bronto never parses or diffs source — that needs your tokenizer and your
alignment, the same line that removed the local chart renderer in `0.6.0`. Feed
it rows that are already classified by your diff engine (`jsdiff`, `git`, a
language server, …).

## Unified view — `.ui-diff`

Rows are direct children of `.ui-diff` (optionally grouped in a
`.ui-diff__hunk`). Columns are `[old-ln] [new-ln] [code]`. Mark each changed row
`--add` / `--remove`, and leave unchanged rows `--context`. Line numbers are
decorative — keep them `aria-hidden`; the `__code` cell carries the content.

```html
<div class="ui-diff">
  <div class="ui-diff__hunk">
    <div class="ui-diff__header">@@ -12,6 +12,6 @@ .ui-diff</div>

    <div class="ui-diff__row ui-diff__row--context">
      <span class="ui-diff__ln" aria-hidden="true">12</span>
      <span class="ui-diff__ln" aria-hidden="true">12</span>
      <code class="ui-diff__code">  border: 1px solid var(--line);</code>
    </div>

    <div class="ui-diff__row ui-diff__row--remove">
      <span class="ui-diff__ln" aria-hidden="true">13</span>
      <span class="ui-diff__ln" aria-hidden="true"></span>
      <code class="ui-diff__code">  font-size: var(--text-sm);</code>
    </div>

    <div class="ui-diff__row ui-diff__row--add">
      <span class="ui-diff__ln" aria-hidden="true"></span>
      <span class="ui-diff__ln" aria-hidden="true">13</span>
      <code class="ui-diff__code">  font-size: var(--text-xs);</code>
    </div>
  </div>
</div>
```

A removed row leaves the **new** line-number cell empty; an added row leaves the
**old** one empty. The `+` / `−` gutter glyph is painted for you from the row
modifier.

## Split view — `.ui-diff--split`

`.ui-diff--split` lays two `.ui-diff__pane` columns side by side (old | new),
each its own `[ln] [code]` grid. Put `--remove` / `--context` rows in the left
pane and `--add` / `--context` rows in the right. You align the panes by
emitting matching row counts (filler `--context` rows where one side is empty).

```html
<div class="ui-diff ui-diff--split">
  <div class="ui-diff__pane">
    <div class="ui-diff__row ui-diff__row--context">
      <span class="ui-diff__ln" aria-hidden="true">1</span>
      <code class="ui-diff__code">retries: 3</code>
    </div>
    <div class="ui-diff__row ui-diff__row--remove">
      <span class="ui-diff__ln" aria-hidden="true">2</span>
      <code class="ui-diff__code">timeout: 30</code>
    </div>
  </div>
  <div class="ui-diff__pane">
    <div class="ui-diff__row ui-diff__row--context">
      <span class="ui-diff__ln" aria-hidden="true">1</span>
      <code class="ui-diff__code">retries: 3</code>
    </div>
    <div class="ui-diff__row ui-diff__row--add">
      <span class="ui-diff__ln" aria-hidden="true">2</span>
      <code class="ui-diff__code">timeout: 10</code>
    </div>
  </div>
</div>
```

For a hard before/after of two whole files, you can also drop two plain
`.ui-diff` blocks into a [`.ui-compare--2up`](./reporting.md) layout.

## Class reference

| Class | Role |
| --- | --- |
| `.ui-diff` | The grid container (unified view). |
| `.ui-diff--split` | Two-pane (old \| new) layout modifier. |
| `.ui-diff__pane` | One column in split view; its own `[ln] [code]` grid. |
| `.ui-diff__hunk` | Optional `role="rowgroup"` wrapper for a hunk (layout-transparent). |
| `.ui-diff__header` | A hunk / file header row, spanning all columns. |
| `.ui-diff__row` | A line row (layout-transparent; the cells are the grid items). |
| `.ui-diff__row--add` | Added line — green tint + `+` gutter glyph. |
| `.ui-diff__row--remove` | Removed line — red tint + `−` gutter glyph. |
| `.ui-diff__row--context` | Unchanged line — no tint, blank gutter. |
| `.ui-diff__ln` | A line-number gutter cell (`tabular-nums`, `user-select:none`; keep it `aria-hidden`). |
| `.ui-diff__code` | A code cell. Long lines wrap (no horizontal scroll), so it prints cleanly. |

## Recipes

```js
import { ui } from '@ponchia/ui/classes';

ui.diff();                       // "ui-diff"
ui.diff({ split: true });        // "ui-diff ui-diff--split"
ui.diffRow({ change: 'add' });   // "ui-diff__row ui-diff__row--add"
ui.diffRow({ change: 'remove' }); // "ui-diff__row ui-diff__row--remove"
ui.diffRow();                    // "ui-diff__row"  (use --context for an explicit unchanged row)
```

## Accessibility & robustness

- **Redundant channel (WCAG 1.4.1).** Add/remove is never colour-only: the
  `+` / `−` gutter glyph is generated content, so it survives **forced colours**
  and **print**, where the tone tint is dropped. In forced-colors mode the
  changed code cell also gains an inline-start border.
- **Print.** Tints are forced through with `print-color-adjust: exact`, and long
  lines wrap rather than clip — the diff survives the PDF pipeline.
- **Line numbers** are decorative: `aria-hidden` them and they stay out of a
  copy selection (`user-select: none`), so copying the diff yields clean code.
- **Semantics** live in your markup. By default the surface is role-free: with
  the line numbers `aria-hidden`, a screen reader reads the `__code` lines in
  DOM order, which is a faithful reading of the diff. If you want grid/table
  semantics, use a real `<table>` or add the full ARIA chain
  (`role="table" > rowgroup > row > cell`) — a bare `role="row"` without
  `role="cell"` children is an ARIA violation. If the change kind itself must be
  announced, add an off-screen label per changed row; do not rely on the glyph
  alone.
