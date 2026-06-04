# Term & Glossary

`@ponchia/ui/css/term.css` is an opt-in **inline glossary** — the accessible
upgrade of the famously touch/keyboard-broken `abbr[title]`. A dotted-underline
term whose definition lives in real, reachable DOM via the native `[popover]` +
`popovertarget` pairing, plus a `ui-glossary` `<dl>` that collects every term at
the end of a document. Jargon that explains itself inline and gathers into a
reference.

```css
@import '@ponchia/ui';
@import '@ponchia/ui/css/term.css';
```

## How it behaves

- The term is a real `<button>`, so it is keyboard- and touch-reachable — the
  exact failure of `abbr[title]`, which only reveals on desktop hover.
- The definition is a native popover: `popovertarget` gives open/close, Esc, and
  light-dismiss for free, with no JavaScript.
- Where CSS anchor positioning exists the definition opens beside the word and
  flips at the viewport edge; otherwise it falls back to a centred top-layer card.

## Wiring — native popover pairing

The host owns the `popovertarget` ↔ `id` wiring. No Bronto kernel is involved.

```html
<p>
  We held the
  <button class="ui-term" popovertarget="def-eb">error budget</button>
  through the change.
  <span class="ui-def" popover id="def-eb">
    The amount of unreliability a service is allowed before its SLO is breached.
  </span>
</p>
```

To anchor the definition to its term where supported, set a matching
`anchor-name` on the button and `position-anchor` on the `.ui-def` (a
progressive enhancement; the centred fallback works everywhere):

```css
#def-eb {
  position-anchor: --eb;
}
.ui-term[popovertarget='def-eb'] {
  anchor-name: --eb;
}
```

The end-of-document glossary is a plain `<dl>`:

```html
<dl class="ui-glossary">
  <dt class="ui-glossary__term">Error budget</dt>
  <dd class="ui-glossary__def">The unreliability a service may spend before its SLO breaches.</dd>
  <dt class="ui-glossary__term">p95</dt>
  <dd class="ui-glossary__def">The 95th-percentile value of a latency distribution.</dd>
</dl>
```

## Class reference

| Class                 | Role                                                              |
| --------------------- | ---------------------------------------------------------------- |
| `.ui-term`            | The inline term `<button>` (dotted underline "has a definition"). |
| `.ui-def`             | The definition body — a native `[popover]` styled as a raised card. |
| `.ui-glossary`        | The end-of-document `<dl>` two-column glossary block.            |
| `.ui-glossary__term`  | A glossary `<dt>` (mono, the term).                              |
| `.ui-glossary__def`   | A glossary `<dd>` (the definition).                              |

## Accessibility & robustness

- Because the term is a `<button popovertarget>`, the definition is reachable by
  **keyboard and touch**, not just hover — the whole point versus `abbr[title]`.
- The definition is real DOM in reading order, so a screen reader encounters it
  right after the term.
- Popovers don't print; the **printed document leans on the `ui-glossary` block**,
  so include it at the end of any report that uses inline terms.
- On narrow viewports the glossary stacks each term over its definition.
