# Usage — when to reach for what

`docs/reference.md` is the *catalog* (every class, generated). This is
the *decision guide*: the rules a kitchen-sink demo can't tell you. It is
hand-written and stable — treated as contract like
[theming.md](theming.md), not auto-generated.

The one principle everything below follows:

> **Color is rationed. Structure carries meaning.** Reach for layout,
> type weight, and the hairline before reaching for a hue. The accent is
> a spotlight, not a paint bucket.

## Density: the unset default and its two presets

`data-density` has two presets over an unset middle default. There is no
`data-density="default"` value — *unset* is the design target; you opt
into a preset on `<html>` or any subtree:

| Value                  | Use for                                          |
| ---------------------- | ------------------------------------------------ |
| _(unset)_              | general app & content — the design target        |
| `compact`              | data-dense admin: tables, dashboards, toolbars   |
| `comfortable`          | marketing / landing / reading-first pages        |

Scope it, don't globalize blindly: a dashboard with one marketing-style
hero can set `compact` on `<html>` and `comfortable` on the hero section.

## Badge vs chip vs status dot

All three are small. They are **not** interchangeable:

| Use            | When                                                              |
| -------------- | ----------------------------------------------------------------- |
| **status dot** | a single piece of state on something else (row online, build ok). Smallest possible signal; pair with text for a11y, never color-only. |
| **badge**      | a label *classifying* the thing it sits on (count, tone, "BETA"). Static, not actionable. `ui.badge({ tone })`. |
| **chip**       | a discrete, often removable/selectable token the user manipulated (a filter, a tag input value). Interactive affordance implied. |

Rule of thumb: state → dot, classification → badge, user-controlled value
→ chip.

## Numbers: `ui-num` vs the table state classes

- Inside `.ui-table`, a numeric cell is `.is-num` (+ `.is-pos` /
  `.is-neg` for P&L tone). These are table-local `is-*` hooks, not in
  `cls` by design.
- **Anywhere else** (a card, a stat, inline figures) use the `ui-num`
  primitive — `ui.num({ tone })`. Same tabular/aligned/tone intent,
  freed from the table. Do not hand-roll right-align + `text-green`;
  that's the duplication `ui-num` exists to kill.

## Prose vs primitives, and prose inside a card

- `ui-prose` styles **raw, unclassed semantic HTML** (MDX / CMS / LLM
  output). Use it for *body content you don't control the markup of*.
- Do **not** wrap app UI in `ui-prose` to "get nice spacing" — compose
  primitives instead; prose deliberately restyles bare `<h2>`, `<table>`,
  `<a>` and will fight your components.
- Prose **inside a card**: put `ui-prose` on an inner wrapper, not on
  `.ui-card` itself, so card padding/border stays the card's and prose
  rhythm stays the content's. One responsibility per element.

## Buttons: variant and size

- **primary** — the single most important action in a view. Aim for one.
- **ghost** — secondary actions; the default for "another button here".
- **subtle** — tertiary / low-stakes (toolbar, inline).
- Size: default everywhere; `--sm` for dense tooling (toolbars,
  pagination, table row actions), `--lg` for a hero CTA only.
- Loading is **not** a class: set `aria-busy="true"` (+ `disabled`); the
  spinner is CSS. This is the ARIA-driven contract — see reference.md
  → "Composition & state".

## Link vs link--cta

Plain `ui-link` for in-flow links. `ui-link--cta` is the eyebrow-faced
action link (accent · display · uppercase + arrow) — a *navigational
call to action*, not a substitute for a button (no form submit, no
destructive action).

## Feedback: alert vs toast vs tooltip

| Surface  | Lifetime / trigger                                          |
| -------- | ----------------------------------------------------------- |
| alert / callout | persistent, in-flow, part of the page (form errors, page-level notice). |
| toast    | transient, out-of-flow, system-initiated. Danger toasts route to an assertive live region; everything else polite. |
| tooltip  | supplemental, hover/focus, never essential info (it's not announced reliably; don't hide required content in it). |

## Meter vs progress

Both are a thin horizontal bar; they mean different things.

- **`ui-progress`** — *task* progress: how far an operation has run. Can be
  indeterminate (`ui-progress--indeterminate`). The fill is always accent.
- **`ui-meter`** — a *measured static value*: coverage, disk, capacity, a
  KPI against a target. Never indeterminate. Tone the fill by threshold
  (`ui.meter({ tone })` → accent/success/warning/danger); the unset
  default is neutral. Drive the width with the shared `--value` knob
  (`style="--value: 72"`, 0–100) and author `role="meter"` +
  `aria-valuenow/min/max` for AT.

Rule of thumb: *something is happening* → progress; *something measures
this much* → meter.

## Steps, timeline, kbd, input icons

- **`ui-steps`** — a stepper for a multi-step flow. Use an `<ol>`. State is
  ARIA-driven (the framework rule): the active step is `aria-current="step"`
  (no class); completed steps take `ui-steps__item--done`. Markers are
  auto-numbered by CSS counter.
- **`ui-timeline`** — a vertical event list on a hairline spine (`<ol>` of
  `ui-timeline__item`, optional `ui-timeline__time`). `aria-current` on an
  item marks the live/most-recent event.
- **`ui-kbd`** — an inline keyboard-key glyph. Wrap a `<kbd>`; for a
  shortcut, use one per key (`<kbd>⌘</kbd> <kbd>K</kbd>`).
- **`ui-input-icon`** — a leading (or `--end` trailing) icon *inside* one
  control. This is distinct from `ui-input-group`, whose addon sits
  *adjacent* to the control. Wrap the input; the icon is decorative
  (`aria-hidden`) and the input keeps its full width. Don't hand-roll an
  absolute overlay.

## Modal: native `<dialog>` vs `is-open`

Prefer the **native `<dialog>`** path — you get top-layer, backdrop and
focus-trap free. Only use `ui-modal.is-open` (`ui.modal({ open: true })`)
when a portal/React modal genuinely can't be a `<dialog>`; then the
backdrop and focus-trap are **yours** to provide. A drawer is a modal
that enters from an edge — same rule.

## Carousel & lightbox: one primitive, two skins

`ui-carousel` is a scroll-snap track of `__slide`s wired by `initCarousel`
(prev/next, keyboard, a `__thumb` strip, the `__status` counter, ARIA).
Because the track is **native horizontal scroll**, touch and trackpad
swipe — with momentum — are the browser's; the behavior only keeps the JS
index in sync with the scroll both ways. Add `data-bronto-carousel-loop`
to wrap at the ends.

A **lightbox is the same carousel inside a native
`<dialog class="ui-lightbox">`**, opened with `data-bronto-open` (wired by
`initDialog`). Do **not** hand-roll an overlay: the `<dialog>` gives the
top layer, the backdrop, the focus-trap, Escape, and focus-return for
free — exactly the parts a from-scratch lightbox gets wrong. The inline
carousel crops (`cover`); the lightbox shows the whole image (`contain`).

This is deliberately *not* an auto-playing marketing slider (no timers, no
infinite-clone track). It's a gallery: the user drives it.

## Display glyphs: when (and when not)

`@ponchia/ui/glyphs` is a 24-glyph dot-matrix icon set — navigation
(`arrow-*`, `chevron-*`), actions (`check`, `close`, `plus`, `minus`,
`search`, `menu`, `gear`), status (`info`, `warning`, `bell`, `lock`) and
common marks (`home`, `user`, `heart`, `star`, `spark`) — rendered on the
`.ui-dotmatrix` primitive, so they re-skin with the same `--field-dot*`
tokens as every other dot surface (no SVG, no icon font).

**It's a _display_ icon set, not a 16px toolbar set.** A dot-matrix glyph
needs physical room for the dots to read: it's crisp and recognizable at
roughly **40px and up** (hero marks, empty states, status bursts, section
headers, large buttons), and collapses into dot-soup below ~24px. For
dense, tiny inline affordances reach for a vector icon set — that's the
honest boundary of the medium, not a gap to fill with more glyphs.

`renderGlyph(name, { label })` returns an SSR-safe string: decorative
(`aria-hidden`) by default, or `role="img"` + `aria-label` when you pass a
`label` — which is how it conveys meaning to assistive tech. Prefer the
`data-bronto-glyph` placeholder + `initDotGlyph()` when the markup is
easier dropped than inlined. Size with `--dotmatrix-dot` (and a tight
`--dotmatrix-gap`) for an intrinsic dot, or let it stretch to its container.

## When to add a behavior

The CSS is the framework; `@ponchia/ui/behaviors` is the *sanctioned*
home for the little JS that genuinely needs scripting (theme persistence,
disclosure, dialog glue, toast, combobox, form-validation, table-sort).
Reach for it instead of reimplementing — every initializer is SSR-safe,
idempotent, and returns a cleanup. If you find yourself writing focus
management or `aria-expanded` toggling by hand, there is probably already
a behavior for it.

## Re-brand obligations (the short version)

Changing `--accent` is one declaration, but **contrast is then yours**:
the shipped palettes are gated (see [contrast.md](contrast.md)); your
custom accent is not. Verify primary-button label, `--accent-text`, and
the focus ring against their backgrounds. Full contract:
[theming.md](theming.md).
