# Sidenote

`@ponchia/ui/css/sidenote.css` is an opt-in **margin-note** grammar in the Tufte
tradition — the channel for evidence, caveats, and provenance asides that belong
*beside* the prose, not interrupting it. `ui-sidenote` is numbered;
`ui-marginnote` is the unnumbered variant.

```css
@import '@ponchia/ui';
@import '@ponchia/ui/css/sidenote.css';
```

## How it behaves

- **Wide viewports** (≥ 60rem) float the note into the inline-end margin.
- **Narrow viewports** collapse it to an indented inline block right after its
  anchor, so nothing is lost on a phone or in a narrow column.
- **Numbering** is a CSS counter — no host bookkeeping.

## Wiring — two things the host owns

1. **Where numbering restarts.** Put `counter-reset: ui-sidenote` on the article
   (or a section) so the count starts at 1 there.
2. **The margin gutter.** At the same breakpoint, give that container
   `padding-inline-end: calc(var(--sidenote-width) + var(--sidenote-gap))` so the
   floated note has room. The two knobs are **root-scoped** (defaults `12rem` /
   `2rem`) precisely so this calc resolves on any container — and overriding
   either one on the container re-sizes the notes and the gutter together.
   **This is load-bearing, not cosmetic:** without the gutter the floated note
   spills past the page edge — a horizontal-overflow defect any visual QA pass
   will flag. In a constrained shell that cannot spare a gutter, use the
   in-flow `ui-sidenote` (which collapses inline) rather than `ui-marginnote`.

```html
<article style="counter-reset: ui-sidenote">
  <p>
    The migration cut p95 latency by 38%<label class="ui-sidenote__ref"></label>.
    <span class="ui-sidenote">
      Measured over the first 24h after rollout; see the incident review §4.
    </span>
    The error budget held<span class="ui-marginnote">No paging events fired.</span>.
  </p>
</article>
```

The `.ui-sidenote__ref` renders the superscript number and increments the
counter; place the `.ui-sidenote` immediately after it in the DOM so it reads
the same number.

## Class reference

| Class | Role |
| --- | --- |
| `.ui-sidenote` | A numbered margin note. |
| `.ui-marginnote` | An unnumbered margin note (no `__ref`). |
| `.ui-sidenote__ref` | The inline superscript anchor; increments + prints the number. |

| Custom property | On | Meaning |
| --- | --- | --- |
| `--sidenote-width` | `.ui-sidenote` / `.ui-marginnote` | Floated width on wide viewports (default `12rem`). |
| `--sidenote-gap` | same | Gap between the text column and the note (default `2rem`). |

## Accessibility & robustness

- The note is **real DOM in reading order**, so a screen reader encounters it
  right after the anchor — no off-screen trickery.
- On narrow viewports the note is always visible (an indented block with an
  inline-start rule), so there is no hidden-content trap.
- Keep the note's meaning in its text; the number is a wayfinding aid, not the
  content.
