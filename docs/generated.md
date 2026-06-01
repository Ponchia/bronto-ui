# Generated content & AI trust

`@ponchia/ui/css/generated.css` is an opt-in layer of **trust surfaces for AI /
system-generated content**. Bronto is not a chat framework — it does not ship
chat bubbles. It ships the surfaces that make generated content legible and
accountable: a marked region, an origin label, and quiet collapsible reasoning
and tool-call logs. It pairs with the [source & provenance layer](./sources.md).

```css
@import '@ponchia/ui';
@import '@ponchia/ui/css/generated.css';
```

Bronto styles the disclosure, origin, and trace surfaces. The host owns model
metadata, reasoning-visibility policy, tool execution, redaction, and safety.
Prefer evidence and source links over decorative "AI sparkle" styling. Not in
the core bundle.

## Generated region — `.ui-generated`

Wraps a block of machine-authored content with a quiet accent edge and an
optional origin `__label`.

```html
<section class="ui-generated">
  <p class="ui-generated__label">Model output</p>
  <p>The migration cut p95 latency by 38% in the first hour.</p>
</section>
```

## Origin label — `.ui-origin-label`

A small tag for "AI assisted", "model output", "tool output", or "human
reviewed". `--ai` accent-tints it for model-generated origin; the default is a
neutral tag. The words carry the meaning — the tint is reinforcement.

```html
<span class="ui-origin-label ui-origin-label--ai">AI generated</span>
<span class="ui-origin-label">Human reviewed</span>
```

## Reasoning — `.ui-reasoning`

A quiet, collapsible "how this was produced" block on a native `<details>` (zero
JS). Keep it closed by default; the host decides what reasoning is safe to show.

```html
<details class="ui-reasoning">
  <summary>Reasoning</summary>
  <p class="ui-reasoning__body">Compared the Q2 and Q3 latency tables, then…</p>
</details>
```

## Tool log — `.ui-tool-log` / `.ui-tool-call`

A document-grade record of tool invocations. Each `.ui-tool-call` is a
collapsible `<details>`: a `__name`, an optional `__status` (put a `.ui-dot` or
text), and a `__body` with the arguments or output.

```html
<div class="ui-tool-log">
  <details class="ui-tool-call">
    <summary>
      <span class="ui-tool-call__name">search_docs(query)</span>
      <span class="ui-tool-call__status"><span class="ui-dot ui-dot--live"></span> ok</span>
    </summary>
    <pre class="ui-tool-call__body">{ "query": "p95 latency", "hits": 3 }</pre>
  </details>
</div>
```

## Recipe

```js
import { ui } from '@ponchia/ui/classes';

ui.originLabel({ ai: true }); // "ui-origin-label ui-origin-label--ai"
```

The other parts are class-only (`cls.generated`, `cls.toolCall`, …) — they have
no options, so apply the class directly.

## Accessibility

- The reasoning and tool-call disclosures are native `<details>` — keyboard- and
  screen-reader-accessible with no JS.
- An origin label must read as text ("AI generated"); the accent tint is not the
  only signal.
- A confidence / verdict widget is intentionally **not** shipped: don't
  fabricate precision. Add a confidence surface only when the product has a real
  signal to show.
