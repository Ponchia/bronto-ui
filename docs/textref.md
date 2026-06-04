# Textref

`@ponchia/ui/css/textref.css` is an opt-in **deep-link-to-the-cited-sentence**
provenance primitive. A citation whose `href` is a URL [Text
Fragment](https://developer.mozilla.org/en-US/docs/Web/Text_fragments)
(`#…:~:text=`): the browser scrolls to the exact quoted text and highlights it,
and Bronto owns the on-brand `::target-text` paint. It is the inline counterpart
to the static `ui-src` / `ui-citation` trust layer (`sources.css`), which can
label a source but cannot point *inside* it.

```css
@import '@ponchia/ui';
@import '@ponchia/ui/css/textref.css';
```

## How it behaves

- The link navigates to the document and the browser scrolls to + highlights the
  first match of the quoted text — no script, no anchors to pre-place.
- Bronto repaints that browser highlight (`::target-text`) in the rationed
  accent wash so it matches the rest of the trust layer.
- On engines without Text Fragments the link still navigates to the page (or its
  `#section` anchor); the highlight is purely additive, so nothing breaks.

## Wiring — the host builds the fragment URL

`::target-text` highlighting is driven entirely by the URL; Bronto ships no
runtime for it. Build the `href` with a three-line pure helper and drop it on the
`.ui-textref` link:

```js
// Encode a quote as a URL Text Fragment directive.
// encodeTextFragment('p95 latency fell 38%') -> '#:~:text=p95%20latency%20fell%2038%25'
export function encodeTextFragment(quote, { prefix } = {}) {
  const enc = (s) => encodeURIComponent(s).replace(/-/g, '%2D');
  const text = prefix ? `${enc(prefix)}-,${enc(quote)}` : enc(quote);
  return `#:~:text=${text}`;
}
```

```html
<p>
  The migration cut p95 latency by 38%
  <a
    class="ui-textref"
    href="https://example.com/incident-review#:~:text=p95%20latency%20fell%2038%25"
    >jump to the source</a
  >.
</p>
```

Notes for an autonomous author:

- Text Fragment navigation requires a **user activation** (a real click) on most
  engines — it will not fire from a programmatic `location.assign`.
- Keep the quote short and verbatim; a fuzzy or paraphrased quote won't match.
- Use the optional `prefix` (a `prefix-,` directive) to disambiguate a quote that
  appears more than once on the target page.

## Class reference

| Class         | Role                                                                |
| ------------- | ------------------------------------------------------------------- |
| `.ui-textref` | A citation link whose `href` is a `#:~:text=` fragment; dotted underline + quote-jump cue. |

| Custom property        | On            | Meaning                                                                   |
| ---------------------- | ------------- | ------------------------------------------------------------------------- |
| `--textref-highlight`  | `.ui-textref` | The `::target-text` wash for the matched sentence (default `var(--accent-soft)`). |

## Accessibility & robustness

- The link is a real `<a href>` — keyboard- and screen-reader-reachable, and it
  degrades to ordinary navigation everywhere.
- `::target-text` is repainted with the system highlight colours under
  `forced-colors`, so the landed-on sentence stays visible in high-contrast mode.
- The highlight is **global** once this leaf is imported: any text-fragment
  landing on the page gets the brand wash, which keeps provenance highlighting
  consistent across a report.
