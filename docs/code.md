# Code

`@ponchia/ui/css/code.css` is an opt-in chrome for **fenced code** — the surface
for code-as-evidence in changelogs, version history, config snippets, and
generated reports. It paints the frame, an optional line-number gutter, and
add / del / highlight line states.

```css
@import '@ponchia/ui';
@import '@ponchia/ui/css/code.css';
```

## Boundary — it never parses

Bronto owns the chrome; it does **not** tokenize or highlight syntax. The host
supplies the coloured token spans — hand-written, or from a real highlighter.
The shipped [`shiki/nothing.json`](../shiki/nothing.json) theme makes Shiki emit
spans with bronto token colours, so Shiki output drops straight in. A bronto
class that tried to parse source would cross the same line that removed the
chart renderer in 0.6.0.

## Markup

```html
<figure class="ui-code ui-code--numbered">
  <figcaption class="ui-code__head">theme.css</figcaption>
  <pre class="ui-code__body"><code><span class="ui-code__line">.ui-diff {</span>
<span class="ui-code__line ui-code__line--del">  font-size: var(--text-sm);</span>
<span class="ui-code__line ui-code__line--add">  font-size: var(--text-xs);</span>
<span class="ui-code__line ui-code__line--hl">  line-height: 1.6;</span>
<span class="ui-code__line">}</span></code></pre>
</figure>
```

- `ui-code--numbered` turns on the gutter; it numbers each `.ui-code__line` with
  a CSS counter (no host bookkeeping).
- Each token span the host emits lives **inside** `.ui-code__line`; Bronto never
  touches it.
- Plain text inside `.ui-code__body` (no `.ui-code__line` wrappers) renders as an
  unnumbered code block — the line grammar is opt-in.

## Class reference

| Class | Role |
| --- | --- |
| `.ui-code` | The `<figure>` frame. |
| `.ui-code--numbered` | Show the line-number gutter. |
| `.ui-code__head` | A filename / language bar (use on `<figcaption>`). |
| `.ui-code__body` | The `<pre>` scroll/wrap region. |
| `.ui-code__line` | One line — the unit numbered + state-tinted. |
| `.ui-code__line--add` | Added line (green wash). |
| `.ui-code__line--del` | Removed line (red wash). |
| `.ui-code__line--hl` | Neutral highlight / call-out (accent wash, not a change). |

## Recipes

```js
import { ui } from '@ponchia/ui/classes';

ui.code({ numbered: true });     // "ui-code ui-code--numbered"
ui.codeLine({ change: 'add' });  // "ui-code__line ui-code__line--add"
ui.codeLine({ change: 'hl' });   // "ui-code__line ui-code__line--hl"
ui.codeLine();                   // "ui-code__line"
```

## Accessibility & robustness

- **Line states never rely on colour.** In forced-colors mode each
  add/del/hl line gains an inline-start border, and the tints are forced through
  `print-color-adjust: exact`.
- **Long lines wrap** rather than scroll, so the block prints cleanly.
- **Line numbers** are generated content (`user-select: none`), so copying the
  block yields clean code with no line numbers.
- Keep real text in the `<code>`; don't encode meaning only in a tint.
