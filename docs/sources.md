# Sources, citations & provenance

`@ponchia/ui/css/sources.css` is an opt-in **trust layer** for generated
reports, AI output, audits, and docs — the grammar that answers _"where did
this come from?"_. Generic UI kits have tags and footnotes; this is a small,
explicit vocabulary for sources and their trust state.

```css
@import '@ponchia/ui';
@import '@ponchia/ui/css/sources.css';
```

Bronto owns the visual grammar and the trust **states**. The host owns fetching,
citation numbering, permission checks, and whether a source is actually
trustworthy. The state is carried by a rationed tone **and** an author-written
label, so it never relies on colour alone (WCAG 1.4.1). Not in the core bundle.

## Trust states

A cross-cutting trust-state class — `ui-src--verified`, `ui-src--stale`, and the
rest in the table below — sets the tone on a citation chip, source card, or
provenance item. Always pair it with a word: the colour is a second channel, not
the only one.

| State | Class | Tone |
| --- | --- | --- |
| Verified | `ui-src--verified` | success |
| Reviewed (by a human) | `ui-src--reviewed` | accent |
| Generated | `ui-src--generated` | info |
| Unverified | `ui-src--unverified` | muted |
| Stale | `ui-src--stale` | warning |
| Conflict | `ui-src--conflict` | danger |

## Inline citation — `.ui-citation`

A reference marker on a real `<a>` or `<button>` (the visual index is never the
only label — give it an accessible name).

```html
<p>
  Latency fell 38%<a class="ui-citation" href="#s1" aria-label="Source 1">[1]</a>.
</p>

<!-- Named-source pill, with a leading trust dot: -->
<a class="ui-citation ui-citation--chip ui-src--verified" href="#s1">
  Q3 incident review
</a>
```

## Source card — `.ui-source-card`

A single source preview: title, origin, time, excerpt, actions. The
`border-inline-start` carries the trust tone.

```html
<article class="ui-source-card ui-src--generated">
  <h3 class="ui-source-card__title">Model output — pricing summary</h3>
  <p class="ui-source-card__origin">gpt-x · internal</p>
  <p class="ui-source-card__time">2026-06-01 09:42</p>
  <p class="ui-source-card__excerpt">The migration cut p95 latency by 38%…</p>
  <div class="ui-source-card__actions">
    <button class="ui-button ui-button--subtle ui-button--sm" type="button">Open</button>
  </div>
</article>
```

## Source list — `.ui-source-list`

A references section: a reset list of source cards (or rows).

```html
<ol class="ui-source-list">
  <li class="ui-source-list__item"><article class="ui-source-card ui-src--verified">…</article></li>
  <li class="ui-source-list__item"><article class="ui-source-card ui-src--stale">…</article></li>
</ol>
```

## Provenance — `.ui-provenance`

A compact metadata row beside generated content — each `__item` carries a trust
dot and a label.

```html
<p class="ui-provenance">
  <span class="ui-provenance__item ui-src--generated">Generated</span>
  <span class="ui-provenance__item ui-src--verified">3 sources</span>
  <span class="ui-provenance__item ui-src--reviewed">Human-reviewed</span>
</p>
```

## Recipes

```js
import { ui } from '@ponchia/ui/classes';

ui.citation({ chip: true, state: 'verified' });
// "ui-citation ui-citation--chip ui-src--verified"
ui.source({ state: 'generated' }); // "ui-source-card ui-src--generated"
ui.provenance({ state: 'reviewed' }); // "ui-provenance ui-src--reviewed"
```

## Accessibility & print

- A citation must be a real link or button with a stable accessible name; the
  bracketed index alone is not enough.
- The trust state must be readable as text — the tone dot/border is decorative
  reinforcement. Under `forced-colors`, dots and borders fall back to
  `CanvasText`, so the label remains the channel.
- Tone dots and the card's tone border carry `print-color-adjust: exact`, so
  they survive printing; expand citation URLs in print where it helps the reader.
