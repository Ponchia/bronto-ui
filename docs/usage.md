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

**Tone vocabulary varies by family — by design.** Colour is rationed, so not
every component carries every tone: `--info`/`--muted` exist on some families
(badge, dot, state) and not others (alert/toast/meter lead with
`--success`/`--warning`/`--danger`). The authoritative per-component tone list is
each base's `modifiers` array in
[`@ponchia/ui/classes.json`](../classes/classes.json) — read it rather than
extrapolating a tone you saw on one component onto another.

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

## Static reports

Use the opt-in `@ponchia/ui/css/report.css` layer for static, PDF-first
reports. A report composes `ui-report` + existing primitives: `ui-statgrid`
for KPIs, `ui-alert` for persistent notices, `ui-table` for evidence,
`ui-timeline` for events, `ui-meter` for measured values, and `ui-prose` only
for narrative body content you do not fully control.

Do not turn every report block into a card. Use `ui-report__summary`,
`ui-report__finding`, and `ui-report__evidence` for document structure; use
`ui-card` only when the block is genuinely a repeated card item. bronto ships
**no chart component**: for a chart, theme Vega-Lite (`@ponchia/ui/vega`, see
[vega.md](vega.md)) or hand-author a token-themed inline SVG painted from the
data-viz palette tokens. Always wrap it in a `ui-report__figure` with a caption,
a `.ui-legend` key, and fallback data. Full LLM/static report cookbook:
[reporting.md](reporting.md).

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

The CSS `ui-tooltip` is hover/focus-only and CSS can't wire it to assistive
tech for you — associate the bubble with its trigger yourself, or it conveys
nothing to a screen reader: give `.ui-tooltip__bubble` an `id`, point the
trigger's `aria-describedby` at it, and keep the bubble `role="tooltip"`. For a
tooltip that must stay visible near a viewport edge or inside a scroll
container, use `initPopover` (a real focus-managed panel) instead.

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

## Navigation: the landmarks and names the classes don't carry

The navigation classes are styling only — the ARIA scaffolding is yours, and
without it these widgets are unlabelled or unannounced:

- **`ui-breadcrumb`** — wrap it in `<nav aria-label="Breadcrumb">` and mark the
  last (current) crumb with `aria-current="page"`.
- **`ui-pagination`** — wrap it in `<nav aria-label="Pagination">`; give the
  current page `aria-current="page"`; label icon-only prev/next controls
  (`aria-label="Previous page"`). Disable a control with native `disabled`
  (a `<button>`) **or** `aria-disabled="true"` — both now render disabled and
  are non-interactive; don't ship an `aria-disabled` control that still acts.
- **`ui-tabs`** — `initTabs` adds the full APG wiring (roles, roving tabindex,
  `aria-selected`, panel `hidden`, focusable panel). If you wire tabs yourself,
  name the `ui-tabs__list` (`role="tablist"` + an `aria-label`) and pair each
  tab with its panel via `aria-controls`/`aria-labelledby`.
- **`ui-sitenav` / `ui-app-nav`** — signal the current link with
  `aria-current="page"` (both honour it; `ui-app-nav` also accepts the
  visual-only `.is-active`, but prefer `aria-current`).
- **`ui-skiplink`** — keep it the first focusable element and point its `href`
  at the `id` of your main landmark.

## Avatar: it's an unlabelled blob until you name it

`ui-avatar` is a presentation box. Give it an accessible name yourself: an
image avatar needs real `alt` text (`alt=""` only if it's purely decorative
beside a visible name); an initials avatar needs an accessible name on the
element (e.g. `aria-label="Ada Lovelace"`) because the initials alone don't
convey identity to AT. Keep initials to ~2 characters — the box is
`overflow: hidden` and silently clips a third.

## Modal: native `<dialog>` vs `is-open`

Prefer the **native `<dialog>`** path — you get top-layer, backdrop and
focus-trap free (wire it with `initDialog` for open-triggers + focus-return).
Only use `ui-modal.is-open` (`ui.modal({ open: true })`) when a portal/React
modal genuinely can't be a `<dialog>`. The **backdrop and top-layer stacking
stay yours**, but you no longer have to hand-roll the focus trap: mark the
overlay `data-bronto-modal` and call `initModal()`. While `is-open` it traps
focus with `inert` (the rest of the page goes non-interactive), returns focus to
the opener on close, and dispatches a cancelable `bronto:modal:close` on Escape —
you still own the `is-open` class, so drop it in response. A drawer is a modal
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

`@ponchia/ui/glyphs` is a 48-glyph dot-matrix icon set — navigation
(`arrow-*`, `chevron-*`), actions (`check`, `close`, `plus`, `minus`,
`search`, `menu`, `gear`), status (`info`, `warning`, `bell`, `lock`) and
common marks (`home`, `user`, `heart`, `star`, `spark`, circle-family marks) — rendered on the
`.ui-dotmatrix` primitive, so they re-skin with the same `--field-dot*`
tokens as every other dot surface. The default and `solid` renderers emit
dot-matrix DOM, not an icon font; the dense `.ui-icon` renderer uses an
internal SVG data URL as a CSS mask so it can stay one DOM node.

**Two rendering modes — pick by size.** The dots need physical room to
read, so the default _dot_ look is for **display** sizes (~40px up: hero
marks, empty states, status bursts, section headers, large buttons). For
small/inline use pass **`solid: true`** (or `data-bronto-glyph-solid`):
that fuses the cells into a square, gapless pixel glyph that stays crisp and
legible down to **~16px** — so the same set doubles as real inline UI icons,
not just decoration. (Below the dot fragments into dot-soup; solid does not.)

One caveat on ink: `solid` cells inherit the dot palette (`--field-dot-hot`,
~40% alpha), so at small sizes a solid glyph reads as a soft grey, not full
ink. When you want a crisp, full-strength small icon (toolbar, button affordance),
use the one-node mask renderer instead — `renderGlyph(name, { render: 'mask' })`
paints the glyph in `currentColor` on a `.ui-icon`, so it tracks text colour at
any size.

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
- **Cost / icon-at-scale.** The default (cell) render is a 16×16 grid = 256
  cells (DOM nodes), regardless of `solid`/`grid`; `anim: 'reveal'` adds a
  per-cell `--i`. That's the dot-matrix display look — but for **many** icons
  (one in every row of a long table) use **`renderGlyph(name, { render: 'mask' })`**:
  it returns a **single** `.ui-icon` element masked by the bitmap (one node, not
  256), sizes to `size` / `--icon-size` (default `1em`) and inherits
  `currentColor` — a normal inline icon. Pick `render: 'mask'` for icons,
  the cell render for display marks/animation.

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

## Data-viz colours: charts, not chrome

`@ponchia/ui/css/dataviz.css` (opt-in) adds a Tier-4 chart palette for
dashboards: `--chart-1..8` (categorical), `--chart-seq-*` (sequential),
`--chart-div-*` (diverging), and `--chart-pattern-1..8` (dot-matrix fills).

- **Use it for charts only.** These are not UI tokens — a build gate fails if
  `var(--chart-*)` appears in component CSS. Style buttons/badges with the
  accent/status tiers, not chart colours.
- **Series 1 is the accent**, so your brand leads the palette; series 2–8 are a
  colourblind-safe set (gated for distinctness under protan/deutan/tritan).
- **Always pair colour with pattern** (`--chart-pattern-N`) and/or a direct
  label — never colour alone (WCAG 1.4.1):
  `background: var(--chart-3); background-image: var(--chart-pattern-3); background-size: var(--chart-pattern-size);`
- **In JS** (Chart.js, canvas, SVG): import resolved hex from
  `@ponchia/ui/charts.json` (`{ light, dark }`, series 1 = the resolved accent).
  Cap a chart at ~8 series. Full detail in [theming.md](theming.md) →
  "Data-viz palette".

## SVG annotations: subject, connector, note

`@ponchia/ui/css/annotations.css` (opt-in) adds Bronto-styled SVG annotations
for reports and chart figures. It is a visual grammar, not a charting or
authoring engine.

- Compose each callout from `ui-annotation` plus a subject
  (`ui-annotation__subject`), connector (`ui-annotation__connector`), and note
  (`ui-annotation__note`, `ui-annotation__title`, `ui-annotation__label`).
- Use `ui.annotation({ variant, tone, motion })` when building class strings in
  JS. The default is a callout in the accent tone; motion is always opt-in.
- Use `@ponchia/ui/annotations` when you want deterministic SVG path strings
  for circle, rect, threshold, bracket, band, slope, comparison, cluster, axis,
  timeline, line, elbow, or curve annotations. Use `notePlacement()` for a
  single bounded note when you need a conservative first placement pass.
- Status tones are only for status-bearing callouts; otherwise use `accent` for
  the main insight and `muted` for secondary labels.
- Keep annotated charts sparse. Dense figures need a scrollable SVG, a
  simplified mobile SVG, or complete caption/fallback text.
- Annotation text must be visible or represented in the figure caption, SVG
  `<desc>`, or fallback table. Full detail in [annotations.md](annotations.md).

## Forms: the contracts the markup alone won't tell you

- **Disabled — pick one mechanism.** Use the native `disabled` attribute for a
  genuinely inert control (`ui-input`, `ui-select`, `ui-textarea`, `ui-switch`
  /`ui-check`/`ui-segmented` wrapping a native input, `ui-range`, `ui-file`,
  `ui-button`): the browser greys it, blocks activation, and skips it in tab
  order, and bronto styles the disabled cue. Use `aria-disabled="true"` **only**
  when the control must stay focusable/announced — bronto then adds
  `pointer-events: none` to `ui-button`/`ui-link` so it can't be activated, but
  you still own removing it from the submit logic.
- **Combobox** (`data-bronto-combobox`) reads its options from the DOM at
  `initCombobox()` time — re-run it after you replace the option list. The
  `<input>` owns the value; the listbox is a view.
- **Validation** is opt-in via `data-bronto-validate` on the form plus
  `initFormValidation()`; it surfaces messages into a `ui-error-summary` you
  provide. The summary's title is the legible sans, not the display face — it's
  meant to be read.

## Reveal: `ui-reveal` needs JS, `ui-scroll-reveal` doesn't

`ui-scroll-reveal` is scroll-driven and **zero-JS** — reach for it in a static
or LLM-authored report. `ui-reveal` is the JS variant: it starts hidden and you
toggle `is-visible` (e.g. from an `IntersectionObserver` you own) to play it in.
With scripting disabled it degrades to fully visible, but if scripting is *on*
and nothing toggles `is-visible`, the content stays hidden — so only use
`ui-reveal` when you are wiring that toggle.

## Loading affordances need a role you supply

`ui-spinner`, `ui-dotspinner`, `ui-skeleton`, and an indeterminate `ui-progress`
are decorative animations — bronto can't know their semantics. Give the busy
region `aria-busy="true"` (or `role="status"` with an `aria-live` text label like
"Loading…"), and mark a purely decorative spinner `aria-hidden="true"`. Without
one of these a screen reader announces nothing while the user waits.

## Popover: prefer the native top layer

`initPopover()` shows a `.ui-popover` in the browser **top layer** when the panel
carries the native `popover` attribute (never clipped by `overflow`/stacking);
without it, it falls back to an `is-open` class that a clipping ancestor can cut
off. Add `popover` to the panel for the robust path — the `is-open` form is a
fallback, not the default to copy.

## Two tiers: CSS-native vs behavior-required

Not every component works with JavaScript off — know which tier you are shipping
before you rely on the no-JS path.

**CSS-native — fully operable with JS off.** Safe in static or LLM-authored
HTML, print/PDF, and before any hydration:

| Component | How it works without JS |
| --- | --- |
| Tooltip (`ui-tooltip`) | `:hover` / `:focus-within` (+ anchor positioning where supported) |
| Accordion | native `<details>` / `<summary>` |
| Segmented control (`ui-segmented`) | `:has(input:checked)` over a radio group |
| Scroll-reveal (`ui-scroll-reveal`) | scroll-driven animation, zero JS |
| Modal via native `<dialog>` | the element brings focus-trap + Escape; `initDialog` only adds open-triggers + focus-return |

**Behavior-required — a CSS skin that needs its `init*` to be interactive.**
These are JS widgets wearing the Bronto look; without the behavior they are inert
(and a couple are *worse* than inert — see the tabs row):

| Component | Behavior | With the behavior absent |
| --- | --- | --- |
| Tabs (`ui-tabs`) | `initTabs` | **author panels visible** — ship `hidden` panels and if `initTabs` never runs the content is unreachable |
| Combobox (`ui-combobox`) | `initCombobox` | a plain text input beside an unfiltered list |
| Command palette (`ui-command`) | `initCommand` | a static, unfiltered list |
| Table sort/select (`[data-bronto-sortable]`) | `initTableSort` | a static table (still readable) |
| Popover (`ui-popover`) | `initPopover` | no placement/ARIA — prefer the native `popover` attribute |
| Carousel (`ui-carousel`) | `initCarousel` | a native scroll-snap track (usable, no controls) |
| Controlled modal (`ui-modal.is-open`) | `initModal` | no focus trap — provide one or use native `<dialog>` |
| Toast | `toast()` | nothing — it is imperative-only |

Rule of thumb: if a component needs ARIA-state sync, focus management, a keyboard
model, or persisted/dynamic state, it is behavior-required — that is the exact
boundary of what CSS alone cannot do.

## When to add a behavior

The CSS is the framework; `@ponchia/ui/behaviors` is the *sanctioned*
home for the little JS that genuinely needs scripting (theme persistence,
disclosure, dialog glue, modal focus-trap, toast, combobox, form-validation,
table-sort). Reach for it instead of reimplementing — every initializer is
SSR-safe, idempotent, and returns a cleanup. If you find yourself writing focus
management or `aria-expanded` toggling by hand, there is probably already
a behavior for it.

## Re-brand obligations (the short version)

Changing `--accent` is one declaration, but **contrast is then yours**:
the shipped palettes are gated (see [contrast.md](contrast.md)); your
custom accent is not. Verify primary-button label, `--accent-text`, and
the focus ring against their backgrounds. Full contract:
[theming.md](theming.md).
