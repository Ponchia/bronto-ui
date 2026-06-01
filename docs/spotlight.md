# Spotlight (guided focus)

`@ponchia/ui/css/spotlight.css` is an opt-in **guided-focus overlay** — a
dimming layer with a cutout over a target element, an optional ring, and a
callout note. It's the *visual language* of a product tour or onboarding step.

```css
@import '@ponchia/ui';
@import '@ponchia/ui/css/spotlight.css';
```

**Bronto is not a tour engine.** It owns the look and (via `initSpotlight`)
positions the cutout over a target. Step order, advancing, persistence, and
whether the overlay is shown are the host's job — Bronto deliberately stays out
of that state machine.

## Markup

```html
<div
  class="ui-spotlight ui-spotlight--ring"
  data-bronto-spotlight
  data-target="save-button"
  role="region"
  aria-label="Tour"
>
  <div class="ui-spotlight__hole"></div>

  <div class="ui-tour-note" style="position: absolute; …place near the hole…">
    <span class="ui-tour-note__step">Step 2 of 4</span>
    <h2 class="ui-tour-note__title">Save your work</h2>
    <p class="ui-tour-note__body">Changes autosave, but you can force a save here.</p>
    <div class="ui-tour-note__actions">
      <button class="ui-button ui-button--ghost" type="button">Skip</button>
      <button class="ui-button" type="button">Next</button>
    </div>
  </div>
</div>
```

```js
import { initSpotlight } from '@ponchia/ui/behaviors';
const stop = initSpotlight(); // positions the cutout; re-places on resize/scroll
// Advance the tour by pointing at the next target — the cutout follows:
document.querySelector('[data-bronto-spotlight]').dataset.target = 'next-thing';
// Hide it when the tour ends (host-owned):
document.querySelector('[data-bronto-spotlight]').hidden = true;
```

## Pieces

| Class | Role |
| --- | --- |
| `ui-spotlight` | The fixed overlay. Non-blocking (`pointer-events: none`) — a visual highlight, not a modal trap. |
| `ui-spotlight__hole` | The cutout. Dims the page via one box-shadow; positioned by `--spot-x/y/w/h`. |
| `ui-spotlight--ring` | Adds an accent ring around the cutout. |
| `ui-tour-note` | The callout card (re-enables pointer events for its controls). |
| `ui-tour-note__step` / `__title` / `__body` / `__actions` | Callout parts. |

`ui.spotlight({ ring })` builds the overlay class string.

## How positioning works

`initSpotlight` reads each `[data-bronto-spotlight]`'s `data-target` id, measures
that element with `getBoundingClientRect`, and sets `--spot-x/y/w/h` (viewport
coordinates) on the overlay. Because the overlay is `position: fixed`, those map
directly. It re-places on resize, scroll, and whenever `data-target` changes —
so stepping a tour is just updating `data-target`. `--spot-pad` insets the
cutout from the target; `--spot-radius` rounds it.

## Accessibility notes

- The overlay is **non-blocking by design** (the dim is a box-shadow, not an
  interaction trap). If a step must block interaction, that's a host concern —
  add your own inert/`aria-hidden` handling around it.
- Put the tour's real content in `.ui-tour-note` (a focusable region with a
  heading), not in the visual dim, so screen-reader users get the same guidance.
- Keep the callout's label stable and move focus to it when a step opens (host).
