# Theming & branding contract

`@ponchia/ui` is one framework meant to dress several different projects.
This is the **stable, supported surface** for re-branding without forking.
Anything not listed here is internal and may change between minor versions.

## The one knob: `--accent`

The whole accent family derives from `--accent` via `color-mix()`:

| Token                 | Derivation (light / dark)                    | Role |
| --------------------- | -------------------------------------------- | ---- |
| `--accent-strong`     | `--accent` mixed 83% with black / 84% white  | darker/lighter accent for hover, emphasis |
| `--accent-text`       | `var(--accent-strong)` (alias)               | **accent used as foreground text** — the on-surface, AA-safe one |
| `--accent-soft`       | `--accent` at 10% / 14% over transparent     | tinted fills |
| `--bg-accent`         | `--accent` at 6% / 8%                         | faint accent backgrounds |
| `--field-dot-accent`  | `--accent` at 78% / 82%                       | form dot indicators |
| `--focus-ring`        | `var(--accent)` (solid)                       | **every focus outline** — override to tune the ring alone |

So a full re-brand is one declaration — globally or on any subtree:

```css
:root      { --accent: #2f6df6; }   /* brand the whole app blue   */
.promo     { --accent: #16a34a; }   /* …or just this section green */
:root[data-theme='dark'] { --accent: #6ea8ff; } /* per-theme tuning */
```

Everything — buttons, focus rings, dot motifs, accent borders, soft
fills — follows automatically, in both light and dark.

> **Two contrast obligations when you change `--accent`:**
>
> 1. **Buttons** — pick an `--accent` with ≥ 4.5:1 against `--button-text`
>    (white in light, black in dark) for accessible primary buttons.
> 2. **Accent-as-text** — anywhere the accent is foreground text (links,
>    active nav/tabs, eyebrows, chips) the framework uses `--accent-text`,
>    **not** raw `--accent`, so it stays AA on surfaces. `--accent-text`
>    defaults to `--accent-strong` (a darkened/​lightened accent). If you
>    re-brand to a pale hue, raw `--accent` would fail as text — override
>    `--accent-text` to a sufficiently dark/light value rather than
>    relying on the 83%/84% mix.
>
> The defaults are tuned for both; verify if you deviate hard. The focus
> ring is solid `--accent` (≥ 3:1 non-text) — re-brand to a near-`--bg`
> hue and you must also raise `--focus-ring` (it's an independent knob).

## Other supported knobs

- **Spacing** — override the `--space-2xs … --space-2xl` scale, or use a
  preset: `data-density="compact"` / `data-density="comfortable"` on any
  element (defaults to the middle scale).
- **Radius** — `--radius-sm … --radius-xl`, `--radius-pill`. The Nothing
  default is near-sharp; raise these for a softer brand.
- **Type** — `--display` (dot-matrix face), `--mono`, `--sans`. Override
  to drop Doto or swap the body face; the token layer keeps working even
  if you self-host fonts (see the `fonts.css` note in the README).
- **Surfaces / lines / text** — the `--bg*`, `--panel*`, `--line*`,
  `--text*` tokens are overridable for a bespoke palette, but you then
  own their contrast. Prefer just `--accent` unless you need a full
  re-skin.
- **Native controls** — checkbox/radio/range tick marks use the CSS
  `accent-color: var(--accent)` (browser-rendered). The check glyph
  colour is the UA's choice and not in our control, so a very light
  `--accent` (e.g. a pale yellow) can make native checkmarks low-
  contrast. If you re-brand to a light hue, verify native controls or
  set `accent-color` yourself on them — this is the one accent surface
  the framework can't tune for you.

## Token tiers (0.4.0)

Three additive, non-breaking tiers sit on top of the primitives. The
short legacy names (`--panel`, `--line`, `--accent`, …) keep working
forever as aliases — the tiers are about giving consumers stabler,
coarser-grained handles.

- **Semantic tier — `--bronto-color-*`.** Role-named aliases:
  `--bronto-color-surface`, `-surface-raised`, `-border`,
  `-border-strong`, `-text`, `-text-muted`, `-action`, `-on-action`,
  `-focus`, `-success`, `-warning`, `-danger`, `-bg`. Target these in
  new consumer code: re-skinning a _role_ is now one override instead of
  chasing component internals. They resolve through the per-theme
  primitives, so light/dark still Just Works.
- **Accent ramp — `--accent-1 … --accent-6`.** A stepped family
  (subtle → bold) derived from the single `--accent` knob via
  `color-mix` against the theme background. Re-brands and theme-adapts
  automatically. This is the palette for charts / data-viz / multi-state
  surfaces (the use case the JS token export advertises).
- **Neutral ramp — `--surface-1 … --surface-6`** (low → high contrast
  against `--bg`) for layered surfaces without hand-picking greys.
- **Stacking scale — `--z-base / -raised / -sticky / -overlay /
  -popover / -toast`.** Every framework `z-index` now resolves through
  these; override one to slot your app's own layers around the
  framework's without specificity/`z-index` wars.

All four tiers are in the DTCG export and the JS token model.

## Accessibility markup contracts

A few components are styled but need the consumer to author the right
semantics — the CSS can't add ARIA for you:

- **`.ui-switch`** — put `role="switch"` on the `<input type="checkbox">`.
  It then announces "switch, on/off" and the native `checked` drives
  `aria-checked` (no JS). Forced-colors state cues ship in `forms.css`.
- **`.ui-tab` / tabs** — operability requires `initTabs()`; don't
  server-render panels `hidden` unless it's guaranteed to run (see the
  `initTabs` doc comment).
- **`.ui-combobox`** — use `initCombobox()`; it owns the APG ARIA.
- **`.ui-tooltip`** — fine for short labels; for edge-critical or rich
  content use `.ui-popover` + `initPopover()` (collision-aware).

## Contrast

- `data-contrast="high"` on any element, **and** the OS
  `prefers-contrast: more` signal, collapse the soft greys toward the
  strong end (hairlines → `--line-strong`, dim text → `--text-soft`,
  solid focus ring). Theme-agnostic — they reference the per-theme
  `*-strong` tokens, so they work under light and dark.
- Windows High Contrast / `forced-colors: active` is handled in
  `base.css`: state that was signalled only by a fill (progress, status
  dots, switch, segmented) is re-asserted with system colors.

## Design-token interop (DTCG)

`@ponchia/ui/tokens.dtcg.json` is the token model in the W3C Design
Tokens Community Group format, for Style Dictionary / Figma / other
tooling. Generated from `tokens/index.js` and drift-checked by
`npm run check`. Resolvable primitives (the scale, `--accent`, literal
palette) carry real `$value`s; the CSS-runtime-derived family
(`accent-soft`, `focus-ring`, aliases) is spec-shaped with
`$value: null` + the CSS in `$extensions["com.ponchia.css"]` rather than
fabricating a number — the resolvable knob is `color.<theme>.accent`.

## Reading tokens from JS

`@ponchia/ui/tokens` exposes the model as data. The ergonomic view only
strips the `--` prefix — **keys stay kebab-case**, so they must be
bracket-accessed: `themeColor('dark')['accent-soft']`, **not**
`.accentSoft`. (`themeColor('dark').accent` works only because `accent`
is a single word.) `--accent` and the non-derived colors resolve to
literal hex; the derived members (`accent-strong`, `accent-soft`,
`focus-ring`, …) are `color-mix(…)` / alias strings — resolve them in the
DOM via `getComputedStyle` if you need the final value, or just read/​set
`--accent` itself. The `.d.ts` now types these keys as literal unions
(`ColorKey`/`ScaleKey`), so a mistyped key is a compile error and
autocomplete lists the real names.

## Stability

The token **names** and the `--accent` derivation are the contract and
are covered by `npm run check` (the `tokens.css ⇄ tokens/index.js ⇄
index.json` drift check). Token **values** may be tuned within a theme;
treat a value change as visual, a name/derivation change as breaking.
