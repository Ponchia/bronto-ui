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
  `--accent-text`, and the primary-button label.
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
background before measuring — the ratio the eye actually gets.

Overall: **all contractual pairings meet their floor ✅**.

## Light theme

| Foreground | Background | Role | Held to | Ratio | APCA _(advisory)_ | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| `--text` | `--bg` | Body text on page background | AA text (4.5:1) | 17.98:1 | Lc 99 | ✅ pass |
| `--text` | `--surface` | Body text on a card/panel | AA text (4.5:1) | 19.80:1 | Lc 106 | ✅ pass |
| `--text` | `--surface-muted` | Body text on a muted panel | AA text (4.5:1) | 16.74:1 | Lc 94 | ✅ pass |
| `--text-soft` | `--bg` | Secondary text on page background | AA text (4.5:1) | 11.16:1 | Lc 91 | ✅ pass |
| `--text-soft` | `--surface` | Secondary text on a card | AA text (4.5:1) | 12.29:1 | Lc 98 | ✅ pass |
| `--text-soft` | `--surface-muted` | Secondary text on a muted panel | AA text (4.5:1) | 10.39:1 | Lc 87 | ✅ pass |
| `--text-dim` | `--bg` | Dim/meta text on page background | AA text (4.5:1) | 5.09:1 | Lc 71 | ✅ pass |
| `--text-dim` | `--surface` | Dim/meta text on a card | AA text (4.5:1) | 5.60:1 | Lc 78 | ✅ pass |
| `--text-dim` | `--surface-muted` | Dim/meta text on a muted panel | AA text (4.5:1) | 4.74:1 | Lc 67 | ✅ pass |
| `--accent-text` | `--bg` | Accent text on page background | AA text (4.5:1) | 6.32:1 | Lc 75 | ✅ pass |
| `--accent-text` | `--surface` | Accent text on a card | AA text (4.5:1) | 6.96:1 | Lc 82 | ✅ pass |
| `--button-text` | `--accent` | Label on the primary button | AA text (4.5:1) | 5.18:1 | Lc 79 | ✅ pass |
| `--focus-ring` | `--bg` | Focus ring vs page background | UI / large (3:1) | 4.71:1 | Lc 67 | ✅ pass |
| `--focus-ring` | `--surface` | Focus ring vs a card | UI / large (3:1) | 5.18:1 | Lc 73 | ✅ pass |
| `--accent` | `--bg` | Accent fill vs page background | UI / large (3:1) | 4.71:1 | Lc 67 | ✅ pass |
| `--success` | `--surface` | Success indicator vs a card | UI / large (3:1) | 5.04:1 | Lc 75 | ✅ pass |
| `--warning` | `--surface` | Warning indicator vs a card | UI / large (3:1) | 5.60:1 | Lc 78 | ✅ pass |
| `--danger` | `--surface` | Danger indicator vs a card | UI / large (3:1) | 6.21:1 | Lc 79 | ✅ pass |
| `--info` | `--surface` | Info indicator vs a card | UI / large (3:1) | 5.77:1 | Lc 78 | ✅ pass |
| `--line-strong` | `--surface` | Strong hairline vs a card | Decorative (1.4.11-exempt) | 2.39:1 | Lc 47 | ℹ️ not gated |

## Dark theme

| Foreground | Background | Role | Held to | Ratio | APCA _(advisory)_ | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| `--text` | `--bg` | Body text on page background | AA text (4.5:1) | 18.76:1 | Lc 99 | ✅ pass |
| `--text` | `--surface` | Body text on a card/panel | AA text (4.5:1) | 17.47:1 | Lc 99 | ✅ pass |
| `--text` | `--surface-muted` | Body text on a muted panel | AA text (4.5:1) | 15.55:1 | Lc 98 | ✅ pass |
| `--text-soft` | `--bg` | Secondary text on page background | AA text (4.5:1) | 12.04:1 | Lc 71 | ✅ pass |
| `--text-soft` | `--surface` | Secondary text on a card | AA text (4.5:1) | 11.22:1 | Lc 71 | ✅ pass |
| `--text-soft` | `--surface-muted` | Secondary text on a muted panel | AA text (4.5:1) | 9.98:1 | Lc 70 | ✅ pass |
| `--text-dim` | `--bg` | Dim/meta text on page background | AA text (4.5:1) | 5.69:1 | Lc 37 | ✅ pass |
| `--text-dim` | `--surface` | Dim/meta text on a card | AA text (4.5:1) | 5.30:1 | Lc 37 | ✅ pass |
| `--text-dim` | `--surface-muted` | Dim/meta text on a muted panel | AA text (4.5:1) | 4.72:1 | Lc 36 | ✅ pass |
| `--accent-text` | `--bg` | Accent text on page background | AA text (4.5:1) | 6.88:1 | Lc 45 | ✅ pass |
| `--accent-text` | `--surface` | Accent text on a card | AA text (4.5:1) | 6.41:1 | Lc 45 | ✅ pass |
| `--button-text` | `--accent` | Label on the primary button | AA text (4.5:1) | 5.95:1 | Lc 43 | ✅ pass |
| `--focus-ring` | `--bg` | Focus ring vs page background | UI / large (3:1) | 5.95:1 | Lc 41 | ✅ pass |
| `--focus-ring` | `--surface` | Focus ring vs a card | UI / large (3:1) | 5.55:1 | Lc 40 | ✅ pass |
| `--accent` | `--bg` | Accent fill vs page background | UI / large (3:1) | 5.95:1 | Lc 41 | ✅ pass |
| `--success` | `--surface` | Success indicator vs a card | UI / large (3:1) | 8.70:1 | Lc 58 | ✅ pass |
| `--warning` | `--surface` | Warning indicator vs a card | UI / large (3:1) | 10.66:1 | Lc 68 | ✅ pass |
| `--danger` | `--surface` | Danger indicator vs a card | UI / large (3:1) | 6.00:1 | Lc 43 | ✅ pass |
| `--info` | `--surface` | Info indicator vs a card | UI / large (3:1) | 8.41:1 | Lc 56 | ✅ pass |
| `--line-strong` | `--surface` | Strong hairline vs a card | Decorative (1.4.11-exempt) | 2.01:1 | Lc 10 | ℹ️ not gated |

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
| `--accent-text` | `--bg` | Accent text on page background | AA text (4.5:1) | 6.75:1 | Lc 79 | ✅ pass |
| `--accent-text` | `--surface` | Accent text on a card | AA text (4.5:1) | 7.44:1 | Lc 86 | ✅ pass |
| `--button-text` | `--accent` | Label on the primary button | AA text (4.5:1) | 5.66:1 | Lc 83 | ✅ pass |
| `--focus-ring` | `--bg` | Focus ring vs page background | UI / large (3:1) | 5.14:1 | Lc 71 | ✅ pass |
| `--focus-ring` | `--surface` | Focus ring vs a card | UI / large (3:1) | 5.66:1 | Lc 78 | ✅ pass |
| `--accent` | `--bg` | Accent fill vs page background | UI / large (3:1) | 5.14:1 | Lc 71 | ✅ pass |

### Amber CRT — dark

| Foreground | Background | Role | Held to | Ratio | APCA _(advisory)_ | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| `--accent-text` | `--bg` | Accent text on page background | AA text (4.5:1) | 12.97:1 | Lc 75 | ✅ pass |
| `--accent-text` | `--surface` | Accent text on a card | AA text (4.5:1) | 12.08:1 | Lc 75 | ✅ pass |
| `--button-text` | `--accent` | Label on the primary button | AA text (4.5:1) | 11.88:1 | Lc 72 | ✅ pass |
| `--focus-ring` | `--bg` | Focus ring vs page background | UI / large (3:1) | 11.88:1 | Lc 70 | ✅ pass |
| `--focus-ring` | `--surface` | Focus ring vs a card | UI / large (3:1) | 11.07:1 | Lc 70 | ✅ pass |
| `--accent` | `--bg` | Accent fill vs page background | UI / large (3:1) | 11.88:1 | Lc 70 | ✅ pass |

### E-ink — light

| Foreground | Background | Role | Held to | Ratio | APCA _(advisory)_ | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| `--accent-text` | `--bg` | Accent text on page background | AA text (4.5:1) | 12.23:1 | Lc 93 | ✅ pass |
| `--accent-text` | `--surface` | Accent text on a card | AA text (4.5:1) | 13.47:1 | Lc 100 | ✅ pass |
| `--button-text` | `--accent` | Label on the primary button | AA text (4.5:1) | 11.74:1 | Lc 101 | ✅ pass |
| `--focus-ring` | `--bg` | Focus ring vs page background | UI / large (3:1) | 10.66:1 | Lc 90 | ✅ pass |
| `--focus-ring` | `--surface` | Focus ring vs a card | UI / large (3:1) | 11.74:1 | Lc 97 | ✅ pass |
| `--accent` | `--bg` | Accent fill vs page background | UI / large (3:1) | 10.66:1 | Lc 90 | ✅ pass |

### E-ink — dark

| Foreground | Background | Role | Held to | Ratio | APCA _(advisory)_ | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| `--accent-text` | `--bg` | Accent text on page background | AA text (4.5:1) | 13.98:1 | Lc 80 | ✅ pass |
| `--accent-text` | `--surface` | Accent text on a card | AA text (4.5:1) | 13.02:1 | Lc 79 | ✅ pass |
| `--button-text` | `--accent` | Label on the primary button | AA text (4.5:1) | 12.86:1 | Lc 76 | ✅ pass |
| `--focus-ring` | `--bg` | Focus ring vs page background | UI / large (3:1) | 12.86:1 | Lc 75 | ✅ pass |
| `--focus-ring` | `--surface` | Focus ring vs a card | UI / large (3:1) | 11.98:1 | Lc 74 | ✅ pass |
| `--accent` | `--bg` | Accent fill vs page background | UI / large (3:1) | 12.86:1 | Lc 75 | ✅ pass |

### Phosphor Green — light

| Foreground | Background | Role | Held to | Ratio | APCA _(advisory)_ | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| `--accent-text` | `--bg` | Accent text on page background | AA text (4.5:1) | 6.22:1 | Lc 77 | ✅ pass |
| `--accent-text` | `--surface` | Accent text on a card | AA text (4.5:1) | 6.85:1 | Lc 83 | ✅ pass |
| `--button-text` | `--accent` | Label on the primary button | AA text (4.5:1) | 5.19:1 | Lc 81 | ✅ pass |
| `--focus-ring` | `--bg` | Focus ring vs page background | UI / large (3:1) | 4.71:1 | Lc 69 | ✅ pass |
| `--focus-ring` | `--surface` | Focus ring vs a card | UI / large (3:1) | 5.19:1 | Lc 75 | ✅ pass |
| `--accent` | `--bg` | Accent fill vs page background | UI / large (3:1) | 4.71:1 | Lc 69 | ✅ pass |

### Phosphor Green — dark

| Foreground | Background | Role | Held to | Ratio | APCA _(advisory)_ | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| `--accent-text` | `--bg` | Accent text on page background | AA text (4.5:1) | 14.54:1 | Lc 82 | ✅ pass |
| `--accent-text` | `--surface` | Accent text on a card | AA text (4.5:1) | 13.55:1 | Lc 82 | ✅ pass |
| `--button-text` | `--accent` | Label on the primary button | AA text (4.5:1) | 13.75:1 | Lc 80 | ✅ pass |
| `--focus-ring` | `--bg` | Focus ring vs page background | UI / large (3:1) | 13.75:1 | Lc 79 | ✅ pass |
| `--focus-ring` | `--surface` | Focus ring vs a card | UI / large (3:1) | 12.81:1 | Lc 79 | ✅ pass |
| `--accent` | `--bg` | Accent fill vs page background | UI / large (3:1) | 13.75:1 | Lc 79 | ✅ pass |

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
