# Text marks & evidence

`@ponchia/ui/css/marks.css` is an opt-in layer of **evidence and emphasis marks
for running text** — the prose counterpart to the [SVG annotations](./annotations.md)
layer. Annotations call out a figure; marks call out a sentence. The look is
sober and report-grade (good for docs, audits, and generated/LLM reports), not
a hand-drawn highlighter.

```css
@import '@ponchia/ui';
@import '@ponchia/ui/css/marks.css';
```

Monochrome by default — the rationed accent is opt-in via `--accent`, and the
status tones are only for status-bearing emphasis.

## Inline marks — `.ui-mark`

Put `.ui-mark` on a `<mark>` so the emphasis is semantic, not just visual.

```html
<p>
  The migration <mark class="ui-mark ui-mark--accent">cut p95 latency by 38%</mark>,
  but <mark class="ui-mark ui-mark--danger ui-mark--underline">error rate doubled</mark>
  in the first hour.
</p>
```

| Style | Effect |
| --- | --- |
| _(default)_ | Highlighter fill. |
| `ui-mark--underline` | Coloured underline (no fill). |
| `ui-mark--box` | Outlined box. |
| `ui-mark--strike` | Strikethrough (removed/superseded text). |

| Tone | Use |
| --- | --- |
| _(default)_ | Neutral ink emphasis (monochrome). |
| `ui-mark--accent` | The rationed accent — "this is the proof". |
| `ui-mark--success` / `--warning` / `--danger` / `--info` | Status-bearing emphasis only. |
| `ui-mark--muted` | De-emphasis. |

`ui-mark--draw` sweeps the highlight in once on load; it respects
`prefers-reduced-motion` (reduced motion shows the resting full highlight). It
applies to the highlight fill, so pair it with the default (no style modifier).

> **A mark is a behind-text highlight, not a filled chip.** The fill is a
> low-alpha gradient *behind* the running text, so the text keeps its normal ink
> and the contrast stays text-on-background — even `ui-mark--accent` is
> contrast-safe by construction. Don't reach for `--on-accent` here (that ink is
> for a *solid* accent fill, like a button or a D2 node); a `<mark>` never needs
> it.

## Passage bracket — `.ui-bracket-note`

Brackets a whole block and optionally labels it — the prose analogue of
`ui-annotation--bracket`. Useful for "this paragraph is the evidence/caveat".

```html
<blockquote class="ui-bracket-note ui-bracket-note--accent">
  <span class="ui-bracket-note__label">Source</span>
  Q3 incident review, §4 — sustained for 47 minutes before rollback.
</blockquote>
```

Tones: `--accent` (the rationed accent), `--warning`, `--danger`, `--info`. The
default is a neutral bracket.

## Recipes

```js
import { ui } from '@ponchia/ui/classes';

ui.mark({ tone: 'accent', motion: 'draw' });
// "ui-mark ui-mark--accent ui-mark--draw"
ui.mark({ style: 'underline', tone: 'danger' });
// "ui-mark ui-mark--underline ui-mark--danger"
ui.bracketNote({ tone: 'warning' });
// "ui-bracket-note ui-bracket-note--warning"
```

## Accessibility

- A `.ui-mark` is **visual emphasis**; it does not announce itself to screen
  readers. When the emphasis carries meaning that the surrounding words don't,
  state it in the text (a screen-reader user can't see the highlight) — the same
  rule as colour (WCAG 1.4.1). Use a native `<mark>` so the relationship is at
  least semantic.
- In `forced-colors` mode a highlight `background` is dropped, so marks add an
  underline to keep the emphasis visible; the `--box`/`--underline`/`--strike`
  styles already survive as a system colour.
- `.ui-bracket-note` is a plain block; wrap a quotation in `<blockquote>` (or a
  region with its own heading/label) so its role is conveyed without the border.
