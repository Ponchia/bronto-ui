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

| Foreground | Background | Role | Held to | Ratio | Verdict |
| --- | --- | --- | --- | --- | --- |
| `--text` | `--bg` | Body text on page background | AA text (4.5:1) | 17.98:1 | ✅ pass |
| `--text` | `--surface` | Body text on a card/panel | AA text (4.5:1) | 19.80:1 | ✅ pass |
| `--text` | `--surface-muted` | Body text on a muted panel | AA text (4.5:1) | 16.74:1 | ✅ pass |
| `--text-soft` | `--bg` | Secondary text on page background | AA text (4.5:1) | 11.16:1 | ✅ pass |
| `--text-soft` | `--surface` | Secondary text on a card | AA text (4.5:1) | 12.29:1 | ✅ pass |
| `--text-dim` | `--bg` | Dim/meta text on page background | AA text (4.5:1) | 5.09:1 | ✅ pass |
| `--text-dim` | `--surface` | Dim/meta text on a card | AA text (4.5:1) | 5.60:1 | ✅ pass |
| `--accent-text` | `--bg` | Accent text on page background | AA text (4.5:1) | 6.32:1 | ✅ pass |
| `--accent-text` | `--surface` | Accent text on a card | AA text (4.5:1) | 6.96:1 | ✅ pass |
| `--button-text` | `--accent` | Label on the primary button | AA text (4.5:1) | 5.18:1 | ✅ pass |
| `--focus-ring` | `--bg` | Focus ring vs page background | UI / large (3:1) | 4.71:1 | ✅ pass |
| `--focus-ring` | `--surface` | Focus ring vs a card | UI / large (3:1) | 5.18:1 | ✅ pass |
| `--accent` | `--bg` | Accent fill vs page background | UI / large (3:1) | 4.71:1 | ✅ pass |
| `--success` | `--surface` | Success indicator vs a card | UI / large (3:1) | 5.04:1 | ✅ pass |
| `--warning` | `--surface` | Warning indicator vs a card | UI / large (3:1) | 5.60:1 | ✅ pass |
| `--danger` | `--surface` | Danger indicator vs a card | UI / large (3:1) | 6.21:1 | ✅ pass |
| `--info` | `--surface` | Info indicator vs a card | UI / large (3:1) | 5.77:1 | ✅ pass |
| `--line-strong` | `--surface` | Strong hairline vs a card | Decorative (1.4.11-exempt) | 2.39:1 | ℹ️ not gated |

## Dark theme

| Foreground | Background | Role | Held to | Ratio | Verdict |
| --- | --- | --- | --- | --- | --- |
| `--text` | `--bg` | Body text on page background | AA text (4.5:1) | 18.76:1 | ✅ pass |
| `--text` | `--surface` | Body text on a card/panel | AA text (4.5:1) | 17.47:1 | ✅ pass |
| `--text` | `--surface-muted` | Body text on a muted panel | AA text (4.5:1) | 15.55:1 | ✅ pass |
| `--text-soft` | `--bg` | Secondary text on page background | AA text (4.5:1) | 12.04:1 | ✅ pass |
| `--text-soft` | `--surface` | Secondary text on a card | AA text (4.5:1) | 11.22:1 | ✅ pass |
| `--text-dim` | `--bg` | Dim/meta text on page background | AA text (4.5:1) | 5.69:1 | ✅ pass |
| `--text-dim` | `--surface` | Dim/meta text on a card | AA text (4.5:1) | 5.30:1 | ✅ pass |
| `--accent-text` | `--bg` | Accent text on page background | AA text (4.5:1) | 6.88:1 | ✅ pass |
| `--accent-text` | `--surface` | Accent text on a card | AA text (4.5:1) | 6.41:1 | ✅ pass |
| `--button-text` | `--accent` | Label on the primary button | AA text (4.5:1) | 5.95:1 | ✅ pass |
| `--focus-ring` | `--bg` | Focus ring vs page background | UI / large (3:1) | 5.95:1 | ✅ pass |
| `--focus-ring` | `--surface` | Focus ring vs a card | UI / large (3:1) | 5.55:1 | ✅ pass |
| `--accent` | `--bg` | Accent fill vs page background | UI / large (3:1) | 5.95:1 | ✅ pass |
| `--success` | `--surface` | Success indicator vs a card | UI / large (3:1) | 8.70:1 | ✅ pass |
| `--warning` | `--surface` | Warning indicator vs a card | UI / large (3:1) | 10.66:1 | ✅ pass |
| `--danger` | `--surface` | Danger indicator vs a card | UI / large (3:1) | 6.00:1 | ✅ pass |
| `--info` | `--surface` | Info indicator vs a card | UI / large (3:1) | 8.41:1 | ✅ pass |
| `--line-strong` | `--surface` | Strong hairline vs a card | Decorative (1.4.11-exempt) | 2.01:1 | ℹ️ not gated |

## Scope & caveats

- This gates the **framework token contract**, not arbitrary consumer
  re-brands. Re-accenting via `--accent` is your contrast obligation
  (see [theming.md](theming.md) → "Re-brand obligations"); this table is
  the guarantee for the *shipped* palettes only.
- Status colours (`--success` / `--warning` / `--danger`) are gated
  as **indicators** (3:1). If you set status text *as body copy* on a
  surface, verify 4.5:1 yourself or pair it with an icon/label.
- Ratios are sRGB WCAG 2.1. The newer APCA model is intentionally not
  used — WCAG 2.1 AA is the testable legal/again-axe baseline the e2e
  suite already asserts.
