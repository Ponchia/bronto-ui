# Highlights

`@ponchia/ui/css/highlights.css` is an opt-in paint layer for the CSS Custom
Highlight API. It styles named `Range` sets without adding wrapper spans to the
DOM.

```css
@import '@ponchia/ui';
@import '@ponchia/ui/css/highlights.css';
```

Bronto only paints the names below. The host owns range discovery, search,
source mapping, current-match state, and cleanup.

Because highlights are paint only, mirror search and current-match state in
host-owned controls or text when users need to navigate it.

| Highlight name | Use |
| --- | --- |
| `bronto-evidence` | Cited evidence or selected proof text. |
| `bronto-search` | Search result matches. |
| `bronto-current` | The active/current match. |

```html
<article class="ui-highlights" id="review">
  <p id="evidence">Latency improved after the migration, but the window is short.</p>
</article>
```

```js
const text = document.querySelector('#evidence').firstChild;
if (CSS.highlights) {
  const range = new Range();
  range.setStart(text, 0);
  range.setEnd(text, 16);
  CSS.highlights.set('bronto-evidence', new Highlight(range));
}
```

## Contract

| Class | Role |
| --- | --- |
| `.ui-highlights` | Scope for Bronto's named highlight paints. |

| Custom property | On | Meaning |
| --- | --- | --- |
| `--highlight-evidence` | `.ui-highlights` | Wash for `bronto-evidence`. |
| `--highlight-search` | `.ui-highlights` | Wash for `bronto-search`. |
| `--highlight-current` | `.ui-highlights` | Wash for `bronto-current`. |

## Robustness

Check `CSS.highlights` before registering ranges. Without support, the page
falls back to plain text; no wrapper spans or extra cleanup are required.

## Related

`highlights.css` is part of
[`analytical.css`](./reporting.md#the-analytical-toolbox-in-a-report). Use
[reference.md](./reference.md) for the generated class catalog.
