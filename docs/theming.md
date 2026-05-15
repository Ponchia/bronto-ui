# Theming & branding contract

`@ponchia/ui` is one framework meant to dress several different projects.
This is the **stable, supported surface** for re-branding without forking.
Anything not listed here is internal and may change between minor versions.

## The one knob: `--accent`

The whole accent family derives from `--accent` via `color-mix()`:

| Token                 | Derivation (light / dark)                    |
| --------------------- | -------------------------------------------- |
| `--accent-strong`     | `--accent` mixed 83% with black / 84% white  |
| `--accent-soft`       | `--accent` at 10% / 14% over transparent     |
| `--bg-accent`         | `--accent` at 6% / 8%                         |
| `--field-dot-accent`  | `--accent` at 78% / 82%                       |
| `--focus-ring`        | `--accent` at 50% / 55%                       |

So a full re-brand is one declaration — globally or on any subtree:

```css
:root      { --accent: #2f6df6; }   /* brand the whole app blue   */
.promo     { --accent: #16a34a; }   /* …or just this section green */
[data-theme='dark'] :root { --accent: #6ea8ff; } /* per-theme tuning */
```

Everything — buttons, focus rings, dot motifs, accent borders, soft
fills — follows automatically, in both light and dark.

> Pick an `--accent` with ≥ 4.5:1 contrast against `--button-text` (white
> in light, black in dark) for accessible primary buttons. The defaults
> are tuned for this; verify if you deviate hard.

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

## Contrast

- `data-contrast="high"` on any element, **and** the OS
  `prefers-contrast: more` signal, collapse the soft greys toward the
  strong end (hairlines → `--line-strong`, dim text → `--text-soft`,
  solid focus ring). Theme-agnostic — they reference the per-theme
  `*-strong` tokens, so they work under light and dark.
- Windows High Contrast / `forced-colors: active` is handled in
  `base.css`: state that was signalled only by a fill (progress, status
  dots, switch, segmented) is re-asserted with system colors.

## Reading tokens from JS

`@ponchia/ui/tokens` exposes the model as data. `--accent` and the
non-derived colors resolve to literal hex; the derived members
(`accentSoft`, `focusRing`, …) are expressed as `color-mix(var(--accent)…)`
strings — resolve them in the DOM via `getComputedStyle` if you need the
final value, or just read/​set `--accent` itself.

## Stability

The token **names** and the `--accent` derivation are the contract and
are covered by `npm run check` (the `tokens.css ⇄ tokens/index.js ⇄
index.json` drift check). Token **values** may be tuned within a theme;
treat a value change as visual, a name/derivation change as breaking.
