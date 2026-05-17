# Usage — when to reach for what

`docs/reference.md` is the *catalog* (every class, generated). This is
the *decision guide*: the rules a kitchen-sink demo can't tell you. It is
hand-written and stable — treated as contract like
[theming.md](theming.md), not auto-generated.

The one principle everything below follows:

> **Color is rationed. Structure carries meaning.** Reach for layout,
> type weight, and the hairline before reaching for a hue. The accent is
> a spotlight, not a paint bucket.

## Density: what "default" means

`data-density` has three steps. **Default (unset) is the middle.** Set it
on `<html>` or any subtree:

| Value                  | Use for                                          |
| ---------------------- | ------------------------------------------------ |
| `compact`              | data-dense admin: tables, dashboards, toolbars   |
| _(unset)_ / `default`  | general app & content — the design target        |
| `roomy`                | marketing / landing / reading-first pages        |

Scope it, don't globalize blindly: a dashboard with one marketing-style
hero can set `compact` on `<html>` and `roomy` on the hero section.

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

## Modal: native `<dialog>` vs `is-open`

Prefer the **native `<dialog>`** path — you get top-layer, backdrop and
focus-trap free. Only use `ui-modal.is-open` (`ui.modal({ open: true })`)
when a portal/React modal genuinely can't be a `<dialog>`; then the
backdrop and focus-trap are **yours** to provide. A drawer is a modal
that enters from an edge — same rule.

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
