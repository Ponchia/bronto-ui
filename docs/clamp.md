# Clamp

`@ponchia/ui/css/clamp.css` is an opt-in bounded excerpt primitive for source
excerpts, claim basis, caveats, and evidence text that should scan compactly but
remain reachable.

```css
@import '@ponchia/ui';
@import '@ponchia/ui/css/clamp.css';
```

## Bounded excerpt

```html
<div class="ui-clamp" style="--clamp-lines: 3">
  <input class="ui-clamp__toggle" id="source-excerpt" type="checkbox" />
  <p class="ui-clamp__body">
    The source excerpt remains real text in the DOM. The visible block is
    clamped for scanning, but the full passage is available through the reveal
    control and is expanded for print.
  </p>
  <label class="ui-clamp__control" for="source-excerpt">
    <span class="ui-clamp__more">Show more</span>
    <span class="ui-clamp__less">Show less</span>
  </label>
</div>
```

If the host should not offer expansion, omit the toggle and control and keep
only `ui-clamp` plus `ui-clamp__body`.

## Contract

| Class | Role |
| --- | --- |
| `.ui-clamp` | Wrapper and `--clamp-lines` host. |
| `.ui-clamp__body` | The clamped text block. |
| `.ui-clamp__toggle` | Optional checkbox state for CSS-only reveal. |
| `.ui-clamp__control` | Optional visible reveal control. |
| `.ui-clamp__more` / `.ui-clamp__less` | Explicit labels for closed/open state. |

| Custom property | On | Meaning |
| --- | --- | --- |
| `--clamp-lines` | `.ui-clamp` | Number of lines before the excerpt is clamped. Default `4`. |

## Print

Print expands the body and hides the toggle/control. Do not use `ui-clamp` to
hide information from archived or PDF output.
