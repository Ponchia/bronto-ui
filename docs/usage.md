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

`@ponchia/ui/glyphs` is a 43-glyph dot-matrix icon set — navigation
(`arrow-*`, `chevron-*`), actions (`check`, `close`, `plus`, `minus`,
`search`, `menu`, `gear`), status (`info`, `warning`, `bell`, `lock`) and
common marks (`home`, `user`, `heart`, `star`, `spark`) — rendered on the
`.ui-dotmatrix` primitive, so they re-skin with the same `--field-dot*`
tokens as every other dot surface (no SVG, no icon font).

**Two rendering modes — pick by size.** The dots need physical room to
read, so the default _dot_ look is for **display** sizes (~40px up: hero
marks, empty states, status bursts, section headers, large buttons). For
small/inline use pass **`solid: true`** (or `data-bronto-glyph-solid`):
that fuses the cells into a square, gapless pixel glyph that stays crisp and
legible down to **~16px** — so the same set doubles as real inline UI icons,
not just decoration. (Below the dot fragments into dot-soup; solid does not.)

`renderGlyph(name, { label })` returns an SSR-safe string: decorative
(`aria-hidden`) by default, or `role="img"` + `aria-label` when you pass a
`label` — which is how it conveys meaning to assistive tech. Prefer the
`data-bronto-glyph` placeholder + `initDotGlyph()` when the markup is
easier dropped than inlined. Size with `--dotmatrix-dot` (and a tight
`--dotmatrix-gap`) for an intrinsic dot, or let it stretch to its container.
It is still a pixel-grid aesthetic, not a hairline vector set — but it now
spans both inline-icon and display use from one source.

**Animation** is opt-in via `anim` (`renderGlyph(name, { anim: 'reveal' })`)
or `data-bronto-glyph-anim`: `reveal` powers the cells on in a scan (a
dot-matrix booting up), `pulse` makes the glyph breathe for a live/attention
state. It's **decorative only** — disabled under `prefers-reduced-motion`,
and the meaning still lives in the static frame + `label`, never in the
motion. Don't animate to convey information a reduced-motion user would miss.
Tune the scan speed with `--dotmatrix-reveal-step` (delay per cell, default
`3ms`). Use `pulse` sparingly — one attention target per view: it loops
indefinitely, and animation that runs in parallel with other content is the
consumer's WCAG 2.2.2 (Pause/Stop/Hide) responsibility (reduced-motion is not
a substitute).

A few sharp edges to know:

- **Inline icon recipe.** `renderGlyph` returns a `<span>`, so it's valid
  inline and inside a `<button>`. For an inline UI icon, render `solid` and
  size the dot, e.g. inside a button:
  `` `<button class="ui-button">${renderGlyph('search', { solid: true, dot: '1.2px', label: 'Search' })}<span>Search</span></button>` `` —
  the button's `display: inline-flex; gap` aligns icon + text. For icon-in-prose,
  set `--dotmatrix-dot` to ~`0.08em` and `vertical-align: -0.15em` on the span.
- **`solid` wins.** `solid: true` implies glyph-only and forces
  `--dotmatrix-gap: 0` / square cells, so a `grid: true` or `gap` passed
  alongside it is ignored.
- **Directional glyphs are physical, not logical.** `arrow-left/right`,
  `chevron-left/right` are fixed bitmaps; in an RTL context flip them yourself
  (e.g. swap the name, or `transform: scaleX(-1)`), the framework won't.
- **Cost.** Each glyph is a 16×16 grid = 256 cells (DOM nodes / spans),
  regardless of mode; `anim: 'reveal'` adds a per-cell `--i` (≈doubles the
  string size). Fine for display marks and the odd inline icon — but don't
  render hundreds at once (e.g. one in every row of a long table) without
  measuring.

## Colorways: when to reach for a skin

`@ponchia/ui/css/skins.css` adds `data-bronto-skin="amber-crt |
phosphor-green | e-ink"` — a **root-level** colorway (apply on `<html>`, like
`data-theme`) that re-points the one accent to a different single hue.

- **Use a skin** when you want a distinct, on-brand _look_ (a phosphor/CRT or
  e-ink feel) for the whole page or app — it's the supported, contrast-gated
  way to recolour without leaving the design system.
- **Use a raw `--accent` override** when you just need _your_ brand hue: it's
  one declaration (see "Re-brand obligations" below) — but then contrast is
  yours, whereas the shipped skins are pre-gated.
- **Don't** put `data-bronto-skin` on a subtree — it's root-level by design
  (the derived accent family only recomputes at `:root`); a subtree skin
  no-ops. For a one-section recolour, scope a raw `--accent` override instead.
- It's **opt-in**: a separate stylesheet, never in `dist/bronto.css`. No skin
  imported → zero cost. Full detail in [theming.md](theming.md) → "Display
  colorways".

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
