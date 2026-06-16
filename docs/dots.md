# Dot surfaces

The dot-matrix is the library's signature: one lit/dim/accent dot vocabulary
expressed across backgrounds, dividers, indicators, loaders, and a family of
data-bound reporting surfaces. Everything here lives in the core stylesheet
(`@ponchia/ui` / `@ponchia/ui/css`); the glyph icon set built on the same
primitive is documented in `docs/glyphs.md`.

All classes are in the typed registry (`@ponchia/ui/classes`) and the
language-neutral `classes.json`; those are authoritative.

## Tokens

Density and expression are token-driven, so a surface re-skins without new CSS:

| Token | Role |
| --- | --- |
| `--field-dot` | the dim (unlit) dot |
| `--field-dot-hot` | a lit cell |
| `--field-dot-accent` | the accented lit cell |
| `--dot-gap` / `--dot-size` | `.ui-dotgrid` background density |
| `--dotmatrix-cols` / `--dotmatrix-gap` / `--dotmatrix-dot` | matrix density |
| `--dotmatrix-dot-radius` | `0` fuses dots into crisp pixels |

The Tier-3 **display-expression** knobs speak in brightness + time rather than
hue (a dot-matrix display has no decorative colour). They default to a no-op, so
the base render is unchanged; the opt-in colorways (`@ponchia/ui/css/skins.css`)
set them:

| Knob | Default | Effect |
| --- | --- | --- |
| `--dotmatrix-glow` | `0` (off) | phosphor bloom around lit cells |
| `--dotmatrix-pulse-min` | `0.55` | the floor the `--pulse` animation dips to |
| `--dotmatrix-reveal-step` | `3ms` | per-cell cadence of the `--reveal` scan |

## Decorative surfaces

- `.ui-dotgrid` — a tiled dot-grid background (`--accent`, `--dense` modifiers).
- `.ui-dotfield` — a fixed full-bleed dot backdrop.
- `.ui-dotrule` — a dotted divider in place of a plain rule.
- `.ui-halftone` — render host content (an `<img>` or a box with its own
  background) through a dot lattice, so a thumbnail takes on the dot look. A
  **style filter**, not a data viz — the dots are a fixed lattice, not
  value-modulated. Tune with `--halftone-dot` / `--halftone-gap`.

## Indicators & loaders

- `.ui-dot` — a status dot with tones (`--accent/--success/--warning/--danger/--info`)
  and a `--live` pulse ring; `.ui-status` is the dot + label row.
- `.ui-dotloader` — three blinking dots.
- `.ui-dotspinner` — the signature comet loader (`--sm` / `--lg`).
- `.ui-dotbar` — a segmented LED progress bar; light a segment with `is-on`,
  or `--indeterminate` for the sweep.

## Data-bound reporting surfaces

These map data onto the dot vocabulary. The boundary is the same as `ui-spark`
and `ui-meter`: **the host normalises the data** (lights `is-on`, sets
`data-level`, or writes `--v` 0..1) and the leaf only lays out + tones. None
compute a scale, bin, or threshold. Each is opaque to assistive tech, so the
container MUST carry a host-written `role="img"` + `aria-label` with the exact
value — rounding to whole cells is presentation-only, so keep the figure in the
label (WCAG 1.4.1).

### `.ui-dotmatrix` cell grid

`.ui-dotmatrix` is the raw data-bound grid (the one the glyphs render on): a grid
of `.ui-dotmatrix__cell` (with `--hot` / `--accent` tones) plus the `--reveal` /
`--pulse` animations. You map data → cell class.

### `.ui-waffle` — unit / part-to-whole

An N×N field of dots ("73 of 100"). The host marks the lit cells with `is-on`.

```html
<div class="ui-waffle" role="img" aria-label="73 of 100 quota met" style="--waffle-cols: 10">
  <i class="is-on"></i><i class="is-on"></i><!-- … 73 lit, 27 dim … --><i></i>
</div>
```

Knobs: `--waffle-cols` (default 10), `--waffle-gap`, `--waffle-size`.

### `.ui-activity` — contribution / calendar heatmap

A GitHub-style density-over-time grid. Day cells flow down each weekday column
(`grid-auto-flow: column`); intensity is `data-level="0..4"`, a 5-step ramp the
host bins the data into.

```html
<div class="ui-activity" role="img" aria-label="commits, last 12 weeks">
  <i data-level="0"></i><i data-level="3"></i><i data-level="4"></i><!-- … -->
</div>
```

Knobs: `--activity-rows` (default 7), `--activity-cell`, `--activity-gap`.

### `.ui-level` — LED level / VU meter

A vertical column of discrete segments lit to a threshold (signal, load, VU). It
fills from the bottom; the host lights segments with `is-on`. `--warn` /
`--danger` re-point the lit colour for the whole meter when the host crosses a
threshold (the host owns the threshold).

```html
<div class="ui-level ui-level--warn" role="img" aria-label="CPU 82%, high">
  <i class="is-on"></i><i class="is-on"></i><i></i><!-- … --></div>
```

Knobs: `--level-segments` count is up to your markup; `--level-height`,
`--level-size`, `--level-gap`.

### `.ui-dotgauge` — radial dot gauge

A 0..1 reading (`--v`) drawn as a ring of dots filling along an arc.

```html
<div class="ui-dotgauge" role="img" aria-label="Health 64%" style="--v: .64"></div>
```

Knobs: `--v`, `--gauge-size`, `--gauge-sweep` (default 270deg), `--gauge-from`,
`--gauge-dot`.

### `.ui-readout` — big dot-matrix numeric

The row wrapper produced by `renderReadout` (see `docs/glyphs.md`) — a Nothing-style
hero numeric composed from digit glyphs. Tune character spacing with
`--readout-gap`; spaces render as a `.ui-readout__spacer` of width `--readout-space`.
Large multi-character readouts are intentionally intrinsic; on narrow report or
demo pages, either tune the glyph dot size or wrap the readout in a local
keyboard-focusable horizontal scroller so it does not widen the page.

### `.ui-spark--dots`

A modifier on the inline `ui-spark` dataword (`@ponchia/ui/css/spark.css`) that
renders each bar as a stack of dots instead of a solid bar — same `--v` contract.

## Responsive density — `.ui-dotfit`

Wrap a dot surface in `.ui-dotfit` to make it respond to its **container** (the
card) rather than the viewport, via a container query — so the same component
reads well in a wide hero and a narrow tile without per-instance overrides.

## Accessibility, forced colors & print

Lit/dim/accent encode meaning via background-color, which Windows High Contrast
Mode flattens — the dot surfaces opt out of forced-color remapping and pin lit
states to distinct system colours (the activity ramp collapses to present vs
absent). The data surfaces also set `print-color-adjust: exact` so their fills
survive printing. Animations honour `prefers-reduced-motion`.
