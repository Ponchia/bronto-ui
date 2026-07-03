# Textref

`@ponchia/ui/css/textref.css` is an opt-in **deep-link-to-the-cited-sentence**
provenance primitive. A citation whose `href` is a URL [Text
Fragment](https://developer.mozilla.org/en-US/docs/Web/Text_fragments)
(`#section:~:text=`): supporting browsers scroll to the exact quoted text and
highlight it, while the leading `#section` gives older engines a stable landing.
Bronto owns the on-brand `::target-text` paint. It is the inline counterpart to
the static `ui-src` / `ui-citation` trust layer (`sources.css`), which can label
a source but cannot point *inside* it.

```css
@import '@ponchia/ui';
@import '@ponchia/ui/css/textref.css';
```

## How it behaves

- In Chrome/Edge 80+, Safari 16.1+, and Firefox 131+, the browser scrolls to
  and highlights the first match of the quoted text — no script.
- Bronto repaints that browser highlight (`::target-text`) in the rationed
  accent wash so it matches the rest of the trust layer.
- On engines without Text Fragments, the `:~:text=` directive is ignored. Use a
  real `#section:~:text=...` URL when you own the target page; a bare `#section`
  can land only at the section, not at the quoted sentence.

## Wiring — the host builds the fragment URL

`::target-text` highlighting is driven entirely by the URL; Bronto ships no
runtime for it. Build the `href` with a three-line pure helper and drop it on the
`.ui-textref` link:

```js
// Encode a quote as a URL Text Fragment directive.
// encodeTextFragment('p95 latency fell 38%', { section: 'incident-summary' })
// -> '#incident-summary:~:text=p95%20latency%20fell%2038%25'
export function encodeTextFragment(quote, { prefix, section } = {}) {
  const enc = (s) => encodeURIComponent(s).replace(/-/g, '%2D');
  const text = prefix ? `${enc(prefix)}-,${enc(quote)}` : enc(quote);
  return `${section ? `#${encodeURIComponent(section)}` : '#'}:~:text=${text}`;
}
```

```html
<p>
  The migration cut p95 latency by 38%
  <a
    class="ui-textref"
    href="https://example.com/incident-review#incident-summary:~:text=p95%20latency%20fell%2038%25"
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
- Firefox support starts at 131. The project floor includes Firefox 129, so make
  the leading section fallback meaningful when exact quote landing matters.

## Class reference

| Class         | Role                                                                |
| ------------- | ------------------------------------------------------------------- |
| `.ui-textref` | A citation link whose `href` is a `#section:~:text=` fragment; dotted underline + quote-jump cue. |

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
