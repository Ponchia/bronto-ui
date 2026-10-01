# BlockNote interop

[BlockNote](https://www.blocknotejs.org) is a block editor. It themes its
editor, menus, side menu, formatting toolbar and text highlights through
`--bn-*` custom properties declared on `.bn-root`, with its own light and dark
values. `css/blocknote.css` points those properties at bronto tokens, so the
editor follows the theme, skins, contrast and the OLED surface like the rest of
the page.

## Import

BlockNote's stylesheet is unlayered, and an unlayered rule outranks every
layered one. Import this leaf's **unlayered** build, after BlockNote's:

```css
@import '@blocknote/mantine/style.css';
@import '@ponchia/ui/css/dataviz.css';
@import '@ponchia/ui/css/unlayered/blocknote.css';
```

The rule targets `.bn-root` and `.bn-root[data-color-scheme]`, which has the
same specificity as BlockNote's dark block, so source order is what makes it
win.

## What maps to what

| BlockNote | bronto |
| --- | --- |
| editor text, background | `--text`, `--panel` |
| menu text, background | `--text`, `--panel-strong` |
| tooltip, hovered background | `--panel-soft` |
| selected text, background | `--on-accent`, `--accent` |
| disabled text | `--text-dim` |
| border, shadow | `--line` |
| side menu (drag handle, add) | `--text-dim` |
| font, radius | `--sans`, `--radius-lg` |

Text and background highlights are categorical identity: a colour someone chose
for a span. They take `--cat-N-ink` (text, 4.5:1 on its tint and the panel) and
`--cat-N-tint` (background) from `css/dataviz.css`:

| BlockNote highlight | Categorical hue |
| --- | --- |
| blue | 1 · blue |
| orange, brown (text) | 2 · orange |
| yellow | 4 · yellow |
| pink | 5 · magenta |
| green | 6 · green |
| purple | 7 · violet |
| red | 8 · red |
| gray | `--text-dim` on `--panel-soft` |

Without `css/dataviz.css` the highlights fall back to the status colours.

## A read view that matches the editor

A surface that shows the same text read-only (a preview, a fallback while the
editor loads) can use `.ui-prose.ui-prose--blocks`. That variant reproduces
BlockNote's block geometry, so text does not jump when the surface switches
between reading and editing. See [the prose reference](../reference.md).
