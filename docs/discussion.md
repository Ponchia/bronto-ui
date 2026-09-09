# Discussions

Use the opt-in discussion leaf for readable thread lists, messages, quotations,
and composers in a host application:

```css
@import '@ponchia/ui';
@import '@ponchia/ui/css/discussion.css';
```

BrontoUI supplies the visual structure. The host owns storage, identity,
thread resolution, text anchoring, unread state, and posting behavior. This leaf
adds no JavaScript or editor dependency.

## Thread structure

```html
<section class="ui-discussion" aria-labelledby="thread-title">
  <header class="ui-discussion__header">
    <div>
      <h2 id="thread-title">Discussion</h2>
      <p>Release notes</p>
    </div>
  </header>
  <p class="ui-discussion__state">Open · passage attached</p>
  <blockquote class="ui-discussion__quote">The selected passage.</blockquote>
  <ol class="ui-discussion__messages">
    <li class="ui-discussion__message">
      <p class="ui-discussion__meta"><strong>Reviewer</strong> · today</p>
      <p>Can we clarify this sentence?</p>
    </li>
  </ol>
  <form class="ui-discussion__composer">
    <label for="reply">Reply</label>
    <textarea id="reply" name="reply" rows="4"></textarea>
    <div class="ui-discussion__actions">
      <button class="ui-button" type="submit">Post reply</button>
    </div>
  </form>
</section>
```

Wire the form to the host's posting mechanism. Keep the draft when posting
fails, disable duplicate submissions while a request is pending, and announce
success only after confirmation. Use native buttons for actions and real links
for navigation. A modal host must supply focus management and focus return.

## Reading and recovery

The styles use sentence case and sans-serif prose, wrap long text, and allow
action rows to wrap in narrow panels. Keep secondary actions visually quiet
with `ui-button--ghost`; posting is normally the primary action. The quote
should remain visible when its anchor disappears, with a clear status and a
host-owned way to choose a new target. Anchor status and thread resolution
answer different questions and should be labelled separately.

`ui-discussion__list` and `ui-discussion__item` style a host-owned thread index.
Keep the list bounded and offer more results explicitly. If a canvas uses pins,
provide the same discussions in a keyboard-accessible list. Pins, positions,
and annotation geometry are outside this CSS leaf.

The [discussion specimen](https://ponchia.github.io/bronto-ui/demo/discussion.html) includes a narrow-container
example and a local reply/resolve demonstration. Its state lasts only until
the page reloads.
