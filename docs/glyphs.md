# Display glyphs

`@ponchia/ui/glyphs` is a small, frozen bitmap icon set rendered on the same
`.ui-dotmatrix` dot primitive as every other dot surface (see `docs/dots.md`).
CSS-first to the core: a glyph is just a grid of dot cells — `.` off, `#` hot,
`*` accent — so it re-skins with the same `--field-dot*` tokens and the Tier-3
display knobs as the rest of the dot family. No icon font, no SVG sprite, no
runtime dependency. The module is side-effect-free and SSR-safe (`renderGlyph`
returns a string; nothing touches the DOM).

```js
import { renderGlyph } from '@ponchia/ui/glyphs';
el.innerHTML = renderGlyph('check', { label: 'Done' });
```

The authoritative API is the generated, CI-drift-checked `glyphs/glyphs.d.ts`.
Read it before guessing a name — `GlyphName` is a literal union, so a typo is a
type error.

## Three render paths

A glyph can be drawn three ways; pick by size regime.

| Path | Call | DOM | When |
| --- | --- | --- | --- |
| Dot display | `renderGlyph(name)` | `GLYPH_SIZE²` cells (256) | the signature dot-matrix look at display sizes |
| Solid pixel | `renderGlyph(name, { solid: true })` | 256 cells, fused | legible crisp icon at small/inline sizes (~16–24px) |
| Mask icon | `renderGlyph(name, { render: 'mask' })` | **one** `.ui-icon` node | icon-at-scale (e.g. one per table row): inherits `currentColor`, scales with the text |

The mask path is the lightest — one node instead of 256 — and the right default
for an icon repeated many times. It is single-tone: an accent `*` cell renders
the same as a hot `#` cell (both become opaque mask regions).

> Pixel-crisp sizes: the bitmap is a 16-unit grid, so the dot/solid paths look
> sharpest at integer multiples (16/32/48/64px). The mask path scales smoothly
> with the text; arbitrary `em` sizes soften the edges slightly, which is fine
> for inline use.

### `renderGlyph(name, options)`

| Option | Type | Default | Effect |
| --- | --- | --- | --- |
| `grid` | boolean | `true` | show the unlit panel dots; `false` → glyph-only |
| `solid` | boolean | `false` | square, gapless pixels (implies glyph-only) |
| `anim` | `'reveal' \| 'pulse'` | — | decorative animation (reduced-motion-safe) |
| `label` | string | — | expose as `role="img"` with this name; omit → decorative (`aria-hidden`) |
| `dot` | CSS length | `0.08em` | one dot size (`--dotmatrix-dot`; sanitized) |
| `gap` | CSS length | — | gap between dots (`--dotmatrix-gap`; sanitized) |
| `render` | `'mask'` | — | the one-node `.ui-icon` path |
| `size` | CSS length | `1em` | with `render: 'mask'`, the icon size (`--icon-size`) |

## Big numeric readout — `renderReadout`

Compose digits and punctuation into a row of dot-matrix glyphs — the
Nothing-style hero numeric for a KPI, clock, countdown, or percentage.

```js
import { renderReadout } from '@ponchia/ui/glyphs';
el.innerHTML = renderReadout('12:48', { label: '12:48 remaining' });
el.innerHTML = renderReadout('73%', { label: '73 percent of quota', render: 'mask' });
```

Recognised characters: `0-9`, `:`, `,`, `.`, `%`, `-`, `+`, and space (a blank
advance). Anything else is skipped. Every per-glyph option (`solid`, `render`,
`dot`, `gap`, `anim`) passes through to each character; `gap` sets the spacing
between characters. The digits are decorative — the readout's **value** is its
accessible name, so pass a `label` (it defaults to the raw text). Output wraps
in `.ui-readout` (see `docs/dots.md`).

## Finding a glyph — `findGlyphs` / `GLYPH_TAGS`

Names follow the "depict, don't name the purpose" convention (`trash`, not
`delete`). `findGlyphs(query)` resolves an intent word to real names by matching
the name OR a curated search alias (`GLYPH_TAGS`), case-insensitively:

```js
import { findGlyphs } from '@ponchia/ui/glyphs';
findGlyphs('delete'); // → ['trash']
findGlyphs('chart'); // → ['bar-chart']
findGlyphs(''); // → every name
```

## DOM placeholders — `initDotGlyph`

When you would rather drop a placeholder than inline markup, the optional
`initDotGlyph` behavior (`@ponchia/ui/behaviors`) expands
`[data-bronto-glyph="name"]` in place. It is idempotent and returns a cleanup.

| Attribute | Value | Effect |
| --- | --- | --- |
| `data-bronto-glyph` | glyph name | expand into a `.ui-dotmatrix` grid |
| `data-bronto-glyph-label` | text | expose as `role="img"`; omit → decorative |
| `data-bronto-glyph-solid` | — | square, gapless pixel glyph |
| `data-bronto-glyph-anim` | `reveal \| pulse` | decorative animation |
| `data-bronto-glyph-render` | `mask` | the one-node `.ui-icon` path (not 256 cells) |
| `data-bronto-glyph-size` | CSS length | with `render="mask"`, sets `--icon-size` |

An unknown name is left untouched.

## Accessibility

- A glyph next to a text label is redundant → keep it decorative (`aria-hidden`,
  the default).
- An icon-only control labels the **control** (`aria-label` on the `<button>`),
  not the glyph.
- A standalone meaningful glyph passes `label` → `role="img"` + `aria-label`.
- A cell-mode glyph is a sea of 256 nodes; the wrapper carries the single
  `role="img"`/`aria-hidden`, so assistive tech never walks the cells.

## Two-tone glyphs

The accent (`*`) tone lifts one feature of a glyph onto `--field-dot-accent`.
The curated two-tone set is `spark`, `warning`, and `info`; every other glyph is
monotone. Two-tone only shows in the cell render — the mask path is single-tone.
