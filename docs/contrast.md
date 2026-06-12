<!-- @ponchia/ui — GENERATED from the resolved token model by
     scripts/gen-contrast.mjs. Do not edit by hand; run
     `npm run contrast:build`. Drift-checked AND gated in CI
     (scripts/check-contrast.mjs fails the build below the declared
     floor — so this table is a guarantee, not a snapshot). -->

# Contrast & WCAG conformance

Every contractual token pairing, the WCAG 2.1 level it is **held to**,
and its measured sRGB ratio per theme. Generated from the resolved token
model (`tokens/resolved.json`) so it cannot drift from the palette, and
**gated**: `npm run check` fails if any pairing drops below its floor.

## Guaranteed level

- **Body / UI text** pairings are guaranteed **WCAG 2.1 AA — 4.5:1**
  (1.4.3). This covers `--text`, `--text-soft`, `--text-dim`,
  `--accent-text`, neutral text on soft accent-tint components, and the
  primary-button label.
- **Non-text UI** (focus ring, accent fill, status colour) is guaranteed
  **3:1** (1.4.11 non-text contrast / the large-text bar). These are
  deliberately *not* held to 4.5:1 — a focus
  ring is a UI boundary, not body copy, and WCAG agrees.
- **Hairlines** (`--line`, `--line-strong`) are a deliberate identity
  choice and are **reported but not gated**: WCAG 1.4.11 exempts
  decorative borders that are not the sole identifier of a control. Where
  a boundary must be perceivable, the `forced-colors` /
  `data-contrast="high"` paths re-assert it (see
  [theming.md](theming.md)). The low hairline ratio is published here on
  purpose — hiding it would defeat the point of a gate.
- AAA (7:1) is **not** guaranteed; the high-contrast preset
  (`data-contrast="high"` / `prefers-contrast: more`) raises ratios
  further but is out of scope for this gated baseline.

Translucent foregrounds (soft fills) are alpha-flattened over their
background before measuring. When a translucent background is a component
tint, the table names the neutral base it is composited over.

Overall: **all contractual pairings meet their floor ✅**.

## Light theme

| Foreground | Background | Role | Held to | Ratio | APCA _(advisory)_ | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| `--text` | `--bg` | Body text on page background | AA text (4.5:1) | 17.98:1 | Lc 99.2 | ✅ pass |
| `--text` | `--surface` | Body text on a card/panel | AA text (4.5:1) | 19.80:1 | Lc 105.8 | ✅ pass |
| `--text` | `--surface-muted` | Body text on a muted panel | AA text (4.5:1) | 16.74:1 | Lc 94.5 | ✅ pass |
| `--text-soft` | `--bg` | Secondary text on page background | AA text (4.5:1) | 11.16:1 | Lc 91.4 | ✅ pass |
| `--text-soft` | `--surface` | Secondary text on a card | AA text (4.5:1) | 12.29:1 | Lc 98.1 | ✅ pass |
| `--text-soft` | `--surface-muted` | Secondary text on a muted panel | AA text (4.5:1) | 10.39:1 | Lc 86.7 | ✅ pass |
| `--text-dim` | `--bg` | Dim/meta text on page background | AA text (4.5:1) | 5.09:1 | Lc 71.4 | ✅ pass |
| `--text-dim` | `--surface` | Dim/meta text on a card | AA text (4.5:1) | 5.60:1 | Lc 78.0 | ✅ pass |
| `--text-dim` | `--surface-muted` | Dim/meta text on a muted panel | AA text (4.5:1) | 4.74:1 | Lc 66.7 | ✅ pass |
| `--accent-text` | `--bg` | Accent text on page background | AA text (4.5:1) | 6.32:1 | Lc 75.4 | ✅ pass |
| `--accent-text` | `--surface` | Accent text on a card | AA text (4.5:1) | 6.96:1 | Lc 82.1 | ✅ pass |
| `--text-soft` | `--accent-soft` over `--surface-muted` | Neutral tag/badge text on an accent tint | AA text (4.5:1) | 8.88:1 | Lc 77.0 | ✅ pass |
| `--accent-text` | `--accent-soft` | Accent text on an accent tint | Advisory (translucent tint — not gated) | 5.91:1 | Lc 71.0 | ℹ️ not gated |
| `--accent-text` | `--bg-accent` | Accent text on an accent-tinted surface | Advisory (translucent tint — not gated) | 6.31:1 | Lc 75.3 | ℹ️ not gated |
| `--button-text` | `--accent` | Label on the primary button | AA text (4.5:1) | 5.18:1 | Lc 78.9 | ✅ pass |
| `--on-accent` | `--accent` | Ink on an accent fill | AA text (4.5:1) | 5.18:1 | Lc 78.9 | ✅ pass |
| `--focus-ring` | `--bg` | Focus ring vs page background | UI / large (3:1) | 4.71:1 | Lc 66.8 | ✅ pass |
| `--focus-ring` | `--surface` | Focus ring vs a card | UI / large (3:1) | 5.18:1 | Lc 73.5 | ✅ pass |
| `--accent` | `--bg` | Accent fill vs page background | UI / large (3:1) | 4.71:1 | Lc 66.8 | ✅ pass |
| `--success` | `--surface` | Success indicator vs a card | UI / large (3:1) | 5.04:1 | Lc 74.6 | ✅ pass |
| `--warning` | `--surface` | Warning indicator vs a card | UI / large (3:1) | 5.60:1 | Lc 77.8 | ✅ pass |
| `--danger` | `--surface` | Danger indicator vs a card | UI / large (3:1) | 6.21:1 | Lc 78.9 | ✅ pass |
| `--info` | `--surface` | Info indicator vs a card | UI / large (3:1) | 5.77:1 | Lc 78.3 | ✅ pass |
| `--line-strong` | `--surface` | Strong hairline vs a card | Decorative (1.4.11-exempt) | 2.39:1 | Lc 47.1 | ℹ️ not gated |

## Dark theme

| Foreground | Background | Role | Held to | Ratio | APCA _(advisory)_ | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| `--text` | `--bg` | Body text on page background | AA text (4.5:1) | 15.01:1 | Lc 91.1 | ✅ pass |
| `--text` | `--surface` | Body text on a card/panel | AA text (4.5:1) | 13.65:1 | Lc 90.1 | ✅ pass |
| `--text` | `--surface-muted` | Body text on a muted panel | AA text (4.5:1) | 12.44:1 | Lc 88.9 | ✅ pass |
| `--text-soft` | `--bg` | Secondary text on page background | AA text (4.5:1) | 11.20:1 | Lc 72.7 | ✅ pass |
| `--text-soft` | `--surface` | Secondary text on a card | AA text (4.5:1) | 10.19:1 | Lc 71.7 | ✅ pass |
| `--text-soft` | `--surface-muted` | Secondary text on a muted panel | AA text (4.5:1) | 9.28:1 | Lc 70.6 | ✅ pass |
| `--text-dim` | `--bg` | Dim/meta text on page background | AA text (4.5:1) | 7.16:1 | Lc 50.3 | ✅ pass |
| `--text-dim` | `--surface` | Dim/meta text on a card | AA text (4.5:1) | 6.52:1 | Lc 49.3 | ✅ pass |
| `--text-dim` | `--surface-muted` | Dim/meta text on a muted panel | AA text (4.5:1) | 5.94:1 | Lc 48.1 | ✅ pass |
| `--accent-text` | `--bg` | Accent text on page background | AA text (4.5:1) | 6.42:1 | Lc 46.6 | ✅ pass |
| `--accent-text` | `--surface` | Accent text on a card | AA text (4.5:1) | 5.84:1 | Lc 45.6 | ✅ pass |
| `--text-soft` | `--accent-soft` over `--surface-muted` | Neutral tag/badge text on an accent tint | AA text (4.5:1) | 8.05:1 | Lc 68.4 | ✅ pass |
| `--accent-text` | `--accent-soft` | Accent text on an accent tint | Advisory (translucent tint — not gated) | 2.42:1 | Lc 42.2 | ℹ️ not gated |
| `--accent-text` | `--bg-accent` | Accent text on an accent-tinted surface | Advisory (translucent tint — not gated) | 2.63:1 | Lc 47.4 | ℹ️ not gated |
| `--button-text` | `--accent` | Label on the primary button | AA text (4.5:1) | 5.95:1 | Lc 42.9 | ✅ pass |
| `--on-accent` | `--accent` | Ink on an accent fill | AA text (4.5:1) | 5.95:1 | Lc 42.9 | ✅ pass |
| `--focus-ring` | `--bg` | Focus ring vs page background | UI / large (3:1) | 5.31:1 | Lc 40.0 | ✅ pass |
| `--focus-ring` | `--surface` | Focus ring vs a card | UI / large (3:1) | 4.83:1 | Lc 39.0 | ✅ pass |
| `--accent` | `--bg` | Accent fill vs page background | UI / large (3:1) | 5.31:1 | Lc 40.0 | ✅ pass |
| `--success` | `--surface` | Success indicator vs a card | UI / large (3:1) | 7.58:1 | Lc 56.6 | ✅ pass |
| `--warning` | `--surface` | Warning indicator vs a card | UI / large (3:1) | 9.29:1 | Lc 66.6 | ✅ pass |
| `--danger` | `--surface` | Danger indicator vs a card | UI / large (3:1) | 5.23:1 | Lc 41.5 | ✅ pass |
| `--info` | `--surface` | Info indicator vs a card | UI / large (3:1) | 7.33:1 | Lc 54.8 | ✅ pass |
| `--line-strong` | `--surface` | Strong hairline vs a card | Decorative (1.4.11-exempt) | 2.29:1 | Lc 14.5 | ℹ️ not gated |

## Display colorways (skins)

The opt-in `data-bronto-skin` colorways (`@ponchia/ui/css/skins.css`,
authored in `tokens/skins.js`) re-point the one accent to a different single
hue. Because a shipped colorway is part of the framework — not an arbitrary
consumer re-brand — **its accent is gated to the same floors as the core**:
the primary-button label, accent-as-text, and the focus ring/accent fill. Only
the accent-touching pairings are shown (a skin leaves the canvas and status
palette untouched). Accents are authored in OKLCH; `--accent-text` is the
`color-mix`-derived `--accent-strong`, exactly as in the core palette.

### Amber CRT — light

| Foreground | Background | Role | Held to | Ratio | APCA _(advisory)_ | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| `--accent-text` | `--bg` | Accent text on page background | AA text (4.5:1) | 6.75:1 | Lc 78.9 | ✅ pass |
| `--accent-text` | `--surface` | Accent text on a card | AA text (4.5:1) | 7.44:1 | Lc 85.6 | ✅ pass |
| `--text-soft` | `--accent-soft` over `--surface-muted` | Neutral tag/badge text on an accent tint | AA text (4.5:1) | 9.13:1 | Lc 78.7 | ✅ pass |
| `--accent-text` | `--accent-soft` | Accent text on an accent tint | Advisory (translucent tint — not gated) | 6.48:1 | Lc 76.1 | ℹ️ not gated |
| `--accent-text` | `--bg-accent` | Accent text on an accent-tinted surface | Advisory (translucent tint — not gated) | 6.85:1 | Lc 79.9 | ℹ️ not gated |
| `--button-text` | `--accent` | Label on the primary button | AA text (4.5:1) | 5.66:1 | Lc 83.3 | ✅ pass |
| `--on-accent` | `--accent` | Ink on an accent fill | AA text (4.5:1) | 5.66:1 | Lc 83.3 | ✅ pass |
| `--focus-ring` | `--bg` | Focus ring vs page background | UI / large (3:1) | 5.14:1 | Lc 71.4 | ✅ pass |
| `--focus-ring` | `--surface` | Focus ring vs a card | UI / large (3:1) | 5.66:1 | Lc 78.0 | ✅ pass |
| `--accent` | `--bg` | Accent fill vs page background | UI / large (3:1) | 5.14:1 | Lc 71.4 | ✅ pass |

### Amber CRT — dark

| Foreground | Background | Role | Held to | Ratio | APCA _(advisory)_ | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| `--accent-text` | `--bg` | Accent text on page background | AA text (4.5:1) | 11.84:1 | Lc 76.1 | ✅ pass |
| `--accent-text` | `--surface` | Accent text on a card | AA text (4.5:1) | 10.77:1 | Lc 75.1 | ✅ pass |
| `--text-soft` | `--accent-soft` over `--surface-muted` | Neutral tag/badge text on an accent tint | AA text (4.5:1) | 6.83:1 | Lc 65.5 | ✅ pass |
| `--accent-text` | `--accent-soft` | Accent text on an accent tint | Advisory (translucent tint — not gated) | 1.46:1 | Lc 20.8 | ℹ️ not gated |
| `--accent-text` | `--bg-accent` | Accent text on an accent-tinted surface | Advisory (translucent tint — not gated) | 1.51:1 | Lc 23.2 | ℹ️ not gated |
| `--button-text` | `--accent` | Label on the primary button | AA text (4.5:1) | 11.88:1 | Lc 71.6 | ✅ pass |
| `--on-accent` | `--accent` | Ink on an accent fill | AA text (4.5:1) | 11.88:1 | Lc 71.6 | ✅ pass |
| `--focus-ring` | `--bg` | Focus ring vs page background | UI / large (3:1) | 10.60:1 | Lc 69.9 | ✅ pass |
| `--focus-ring` | `--surface` | Focus ring vs a card | UI / large (3:1) | 9.64:1 | Lc 68.9 | ✅ pass |
| `--accent` | `--bg` | Accent fill vs page background | UI / large (3:1) | 10.60:1 | Lc 69.9 | ✅ pass |

### E-ink — light

| Foreground | Background | Role | Held to | Ratio | APCA _(advisory)_ | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| `--accent-text` | `--bg` | Accent text on page background | AA text (4.5:1) | 12.23:1 | Lc 93.3 | ✅ pass |
| `--accent-text` | `--surface` | Accent text on a card | AA text (4.5:1) | 13.47:1 | Lc 99.9 | ✅ pass |
| `--text-soft` | `--accent-soft` over `--surface-muted` | Neutral tag/badge text on an accent tint | AA text (4.5:1) | 8.78:1 | Lc 76.3 | ✅ pass |
| `--accent-text` | `--accent-soft` | Accent text on an accent tint | Advisory (translucent tint — not gated) | 11.31:1 | Lc 88.2 | ℹ️ not gated |
| `--accent-text` | `--bg-accent` | Accent text on an accent-tinted surface | Advisory (translucent tint — not gated) | 12.15:1 | Lc 92.8 | ℹ️ not gated |
| `--button-text` | `--accent` | Label on the primary button | AA text (4.5:1) | 11.74:1 | Lc 100.6 | ✅ pass |
| `--on-accent` | `--accent` | Ink on an accent fill | AA text (4.5:1) | 11.74:1 | Lc 100.6 | ✅ pass |
| `--focus-ring` | `--bg` | Focus ring vs page background | UI / large (3:1) | 10.66:1 | Lc 90.4 | ✅ pass |
| `--focus-ring` | `--surface` | Focus ring vs a card | UI / large (3:1) | 11.74:1 | Lc 97.0 | ✅ pass |
| `--accent` | `--bg` | Accent fill vs page background | UI / large (3:1) | 10.66:1 | Lc 90.4 | ✅ pass |

### E-ink — dark

| Foreground | Background | Role | Held to | Ratio | APCA _(advisory)_ | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| `--accent-text` | `--bg` | Accent text on page background | AA text (4.5:1) | 12.72:1 | Lc 80.3 | ✅ pass |
| `--accent-text` | `--surface` | Accent text on a card | AA text (4.5:1) | 11.57:1 | Lc 79.3 | ✅ pass |
| `--text-soft` | `--accent-soft` over `--surface-muted` | Neutral tag/badge text on an accent tint | AA text (4.5:1) | 6.66:1 | Lc 65.0 | ✅ pass |
| `--accent-text` | `--accent-soft` | Accent text on an accent tint | Advisory (translucent tint — not gated) | 1.38:1 | Lc 18.0 | ℹ️ not gated |
| `--accent-text` | `--bg-accent` | Accent text on an accent-tinted surface | Advisory (translucent tint — not gated) | 1.42:1 | Lc 19.9 | ℹ️ not gated |
| `--button-text` | `--accent` | Label on the primary button | AA text (4.5:1) | 12.86:1 | Lc 75.6 | ✅ pass |
| `--on-accent` | `--accent` | Ink on an accent fill | AA text (4.5:1) | 12.86:1 | Lc 75.6 | ✅ pass |
| `--focus-ring` | `--bg` | Focus ring vs page background | UI / large (3:1) | 11.48:1 | Lc 74.1 | ✅ pass |
| `--focus-ring` | `--surface` | Focus ring vs a card | UI / large (3:1) | 10.44:1 | Lc 73.1 | ✅ pass |
| `--accent` | `--bg` | Accent fill vs page background | UI / large (3:1) | 11.48:1 | Lc 74.1 | ✅ pass |

### Phosphor Green — light

| Foreground | Background | Role | Held to | Ratio | APCA _(advisory)_ | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| `--accent-text` | `--bg` | Accent text on page background | AA text (4.5:1) | 6.22:1 | Lc 76.6 | ✅ pass |
| `--accent-text` | `--surface` | Accent text on a card | AA text (4.5:1) | 6.85:1 | Lc 83.3 | ✅ pass |
| `--text-soft` | `--accent-soft` over `--surface-muted` | Neutral tag/badge text on an accent tint | AA text (4.5:1) | 9.16:1 | Lc 78.9 | ✅ pass |
| `--accent-text` | `--accent-soft` | Accent text on an accent tint | Advisory (translucent tint — not gated) | 5.98:1 | Lc 74.1 | ℹ️ not gated |
| `--accent-text` | `--bg-accent` | Accent text on an accent-tinted surface | Advisory (translucent tint — not gated) | 6.32:1 | Lc 77.7 | ℹ️ not gated |
| `--button-text` | `--accent` | Label on the primary button | AA text (4.5:1) | 5.19:1 | Lc 80.7 | ✅ pass |
| `--on-accent` | `--accent` | Ink on an accent fill | AA text (4.5:1) | 5.19:1 | Lc 80.7 | ✅ pass |
| `--focus-ring` | `--bg` | Focus ring vs page background | UI / large (3:1) | 4.71:1 | Lc 68.6 | ✅ pass |
| `--focus-ring` | `--surface` | Focus ring vs a card | UI / large (3:1) | 5.19:1 | Lc 75.3 | ✅ pass |
| `--accent` | `--bg` | Accent fill vs page background | UI / large (3:1) | 4.71:1 | Lc 68.6 | ✅ pass |

### Phosphor Green — dark

| Foreground | Background | Role | Held to | Ratio | APCA _(advisory)_ | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| `--accent-text` | `--bg` | Accent text on page background | AA text (4.5:1) | 13.18:1 | Lc 82.8 | ✅ pass |
| `--accent-text` | `--surface` | Accent text on a card | AA text (4.5:1) | 11.99:1 | Lc 81.8 | ✅ pass |
| `--text-soft` | `--accent-soft` over `--surface-muted` | Neutral tag/badge text on an accent tint | AA text (4.5:1) | 6.66:1 | Lc 65.0 | ✅ pass |
| `--accent-text` | `--accent-soft` | Accent text on an accent tint | Advisory (translucent tint — not gated) | 1.33:1 | Lc 15.3 | ℹ️ not gated |
| `--accent-text` | `--bg-accent` | Accent text on an accent-tinted surface | Advisory (translucent tint — not gated) | 1.37:1 | Lc 17.3 | ℹ️ not gated |
| `--button-text` | `--accent` | Label on the primary button | AA text (4.5:1) | 13.75:1 | Lc 79.7 | ✅ pass |
| `--on-accent` | `--accent` | Ink on an accent fill | AA text (4.5:1) | 13.75:1 | Lc 79.7 | ✅ pass |
| `--focus-ring` | `--bg` | Focus ring vs page background | UI / large (3:1) | 12.27:1 | Lc 78.5 | ✅ pass |
| `--focus-ring` | `--surface` | Focus ring vs a card | UI / large (3:1) | 11.16:1 | Lc 77.5 | ✅ pass |
| `--accent` | `--bg` | Accent fill vs page background | UI / large (3:1) | 12.27:1 | Lc 78.5 | ✅ pass |

## Data-viz palette (advisory)

The opt-in Tier-4 chart palette (`@ponchia/ui/css/dataviz.css`, authored in
`tokens/charts.js`) is gated differently: categorical series are held to
**mutual distinguishability under normal + simulated protan/deutan/tritan
vision** (`check:charts`, OKLab ΔE), and colour is **never the sole signal** —
each series ships a matching `--chart-pattern-*` dot-matrix fill. So the
WCAG ratios below are **advisory** (a chart fill is not body text); use them to
pick a darker series for thin lines/points, or rely on the pattern. Series 1 is
the brand accent.

### Light theme — categorical vs `--bg`

| Series | Colour | Ratio _(advisory)_ | APCA _(advisory)_ |
| --- | --- | --- | --- |
| 1 _(accent)_ | `#d71921` | 4.71:1 | Lc 66.8 |
| 2 | `#e69f00` | 2.05:1 | Lc 37.4 |
| 3 | `#56b4e9` | 2.10:1 | Lc 38.6 |
| 4 | `#009e73` | 3.11:1 | Lc 54.4 |
| 5 | `#f0e442` | 1.20:1 | Lc 9.1 |
| 6 | `#0072b2` | 4.71:1 | Lc 68.4 |
| 7 | `#cc79a7` | 2.78:1 | Lc 50.6 |
| 8 | `#4d5358` | 7.08:1 | Lc 80.4 |

### Dark theme — categorical vs `--bg`

| Series | Colour | Ratio _(advisory)_ | APCA _(advisory)_ |
| --- | --- | --- | --- |
| 1 _(accent)_ | `#ff3b41` | 5.31:1 | Lc 40.0 |
| 2 | `#e69f00` | 8.32:1 | Lc 57.5 |
| 3 | `#56b4e9` | 8.12:1 | Lc 56.3 |
| 4 | `#009e73` | 5.48:1 | Lc 40.0 |
| 5 | `#f0e442` | 14.17:1 | Lc 87.4 |
| 6 | `#0072b2` | 3.61:1 | Lc 26.1 |
| 7 | `#cc79a7` | 6.12:1 | Lc 43.9 |
| 8 | `#4d5358` | 2.40:1 | Lc 14.4 |

## Scope & caveats

- This gates the **framework token contract** (core palette **and** every
  shipped colorway), not arbitrary consumer re-brands. Re-accenting via
  `--accent` yourself is your contrast obligation (see [theming.md](theming.md)
  → "Re-brand obligations"); this table is the guarantee for the *shipped*
  palettes and skins only.
- Status colours (`--success` / `--warning` / `--danger`) are gated
  as **indicators** (3:1). If you set status text *as body copy* on a
  surface, verify 4.5:1 yourself or pair it with an icon/label.
- The gated **Ratio** is sRGB WCAG 2.1 AA — the testable legal / axe-compatible
  baseline the e2e suite also asserts. The **APCA** column (APCA-W3 0.1.9 `Lc`)
  is **advisory only**: a perceptual cross-check that, unlike WCAG 2.1's
  symmetric ratio, accounts for polarity and is the WCAG 3 candidate. It does
  **not** gate the build while WCAG 3 is a Working Draft — use it to tune
  quality, not to override the WCAG 2.1 floor. As a rough read, body text wants
  `Lc` ≥ 75 and non-text/large ≥ 45–60.
