# Tree (hierarchy outline)

`@ponchia/ui/css/tree.css` is an opt-in **hierarchy outline** — a depth-indented
view of nested structure (file trees, report contents, nested generated-content
provenance, object graphs). It is built on nested native `<details>` (optionally
`name` exclusive-accordion groups), so open/close, keyboard toggling and the
open/close animation come from the platform. This leaf is the hierarchy *layer*
(rails, indent, chevron); it does **not** reinvent the disclosure grammar
`ui-accordion` already owns.

```css
@import '@ponchia/ui';
@import '@ponchia/ui/css/tree.css';
```

## How it behaves

- A **branch** is a `<details class="ui-tree__branch">`; a **leaf** is a plain
  `.ui-tree__leaf` row with no disclosure.
- Nested rows indent and carry a hairline guide rail back to their parent.
- The summary's chevron rotates open; auto-height open/close is gated exactly like
  `ui-accordion` (Chrome 131+/Safari 18.4+; Firefox snaps).

## Wiring

```html
<div class="ui-tree">
  <details class="ui-tree__branch" open>
    <summary class="ui-tree__summary"><span class="ui-tree__label">src</span></summary>
    <details class="ui-tree__branch">
      <summary class="ui-tree__summary"><span class="ui-tree__label">components</span></summary>
      <div class="ui-tree__leaf"><span class="ui-tree__label">button.css</span></div>
      <div class="ui-tree__leaf"><span class="ui-tree__label">card.css</span></div>
    </details>
    <div class="ui-tree__leaf"><span class="ui-tree__label">index.js</span></div>
  </details>
</div>
```

Add `name="…"` to sibling `<details class="ui-tree__branch">` to make them an
exclusive-accordion group (only one open at a time) — a platform behaviour, no
script.

## A11y honesty — disclosure group, not an ARIA tree

A native `<details>` group is a **disclosure group**, not an ARIA `tree`. Do not
bolt `role="tree"` / `role="treeitem"` / `aria-level` onto this markup: those
roles imply a roving-focus keyboard model (Up/Down to move, Left/Right to
collapse/expand, typeahead) that native `<details>` does not provide, so the
result would announce a contract the keyboard can't honour.

That roving-focus kernel is intentionally **not shipped** with this leaf. It
lands behind a real consumer that needs the full APG tree interaction (e.g. a
workbench file pane). Until then, the disclosure semantics are correct and
honest as-is.

## Class reference

| Class                | Role                                                       |
| -------------------- | ---------------------------------------------------------- |
| `.ui-tree`           | The outline container.                                     |
| `.ui-tree__branch`   | A `<details>` node with children (twist chevron).          |
| `.ui-tree__leaf`     | A leaf row with no disclosure (chevron-aligned spacer).    |
| `.ui-tree__summary`  | The branch's `<summary>` toggle row.                       |
| `.ui-tree__label`    | The row label (truncates with ellipsis).                   |

## Accessibility & robustness

- Open/close, keyboard toggling (Enter/Space on the summary) and the exclusive
  `name` grouping are all native `<details>` behaviour.
- The chevron is `currentColor` geometry, so it survives `forced-colors`; the
  open-branch accent cue is re-asserted with the system highlight.
- The chevron spin and the auto-height animation both respect
  `prefers-reduced-motion`.
