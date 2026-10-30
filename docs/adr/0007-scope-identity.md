# 0007. Scope identity is its own colour tier, legal in chrome

Status: accepted · 2026-10-30 · amends [ADR-0001](0001-color-system.md) rule 4
and its tier table.

## Context

A consumer that holds several scopes at once needs to show which scope a thing
belongs to. Spatial, the canvas workspace, has estates (bronto, hive, chiara)
and canvases. Its floating terminal bubbles, windows and canvas lists mix items
from all of them. On 30 Oct 2026 the maintainer asked for a colour per estate,
"so at a glance of eye I would know my bubbles to which estate/canvas or
whatever belongs".

The constitution had no legal place for that colour:

- **Status was being used as identity.** Spatial painted its canvas families
  with `--info`, `--warning` and `--success`, so a Hive bubble would have read
  as "OK". Rule 4 says status is never decorative.
- **The categorical set is charts-only.** `--cat-N` already described itself
  as "categorical identity", with gated `-ink` and `-tint` pairs, but rule 4
  says chart colour is never UI chrome, and `check:color-policy` enforces it.
- **A free hex is unsafe.** Spatial's personal violet `#9b8cff` measured
  2.77:1 on the light panel, and an image on the accent-tinted bubble disc
  measured 1.63:1.

## Decision

1. **Add Tier 5, scope identity.** Eight hues, named by hue, each with a
   swatch, an ink and a tint: `--identity-<hue>`, `--identity-<hue>-ink` and
   `--identity-<hue>-tint`. They ship in the opt-in leaf
   `@ponchia/ui/css/identity.css`, never in the default bundle (rule 3).
2. **Reuse the measured categorical values.** `scripts/gen-charts.mjs`
   generates the leaf from `tokens/charts.js`, so the lightness band, chroma
   floor, colour-vision separation and the 4.5:1 ink floor that `check:charts`
   holds for `--cat-N` hold for identity too. The leaf declares its own names
   and imports nothing from `dataviz.css`, so chrome never loads the chart
   leaf.
3. **Identity is legal in chrome, as a mark.** A consumer may draw it as a
   ring, chip, underline or band on anything that names a scope. It may not
   repaint the accent, focus, selection, attention or status.
4. **Identity never travels alone.** Every mark pairs the hue with the scope's
   glyph or label (rule 6). Eight hues is a governed set, not a cap on scopes.
5. **The namespace is reserved.** `--identity-*` may not enter the token model
   (`tokens/index.js`); `check:color-policy` fails if it does. The leaf is a
   definition file, exempt from the raw-colour scan like `dataviz.css`.

Rule 4 of ADR-0001 now reads: status is never decorative; chart colour is never
UI chrome; scope identity is chrome only as a mark (ADR-0007).

## Consequences

- Consumers get contrast-safe identity colours without forking tokens. Spatial
  adopts the leaf for estate and canvas identity.
- A consumer that lets a person choose a custom hex carries the contrast
  obligation itself, to the same floors.
- Changing a categorical value changes the identity hue with it. The categorical
  set is gated, and identity inherits that gate.

## Alternatives considered

- **Allow `--cat-N` in chrome.** Rejected: the name declares the tier (rule 4),
  and chrome would have to import the chart leaf with its ramps and patterns.
- **A scoped accent (re-brand a subtree).** Rejected: the derived accent family
  resolves at `:root`, and the accent also paints focus and selection, so a
  scope's colour would hide those meanings.
- **A free palette per consumer.** Rejected: it gives up the gate that caught
  2.77:1 and 1.63:1.
