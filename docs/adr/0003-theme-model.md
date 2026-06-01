# ADR-0003 — The theme model: a binary base axis, not a named-theme catalog

Status: accepted · 2026-06-01 · records why theming is light/dark + derivation +
orthogonal axes, and the readability re-tune of the dark base. Builds on
[ADR-0001](0001-color-system.md) (the color tier model) and
[ADR-0002](0002-scope-and-2026-baseline.md) (scope + restraint).

## Context

Recurring question: "isn't a simple dark/light theme outdated — should we ship
*named themes* instead?" And a real complaint: the dark theme was **hard to
read**.

Two things had to be separated: the **theme architecture** (is binary
dark/light the right model?) and the **dark palette tuning** (is our dark
actually good?). They have different answers.

## Decision

### The theme model is a binary base axis + derivation + orthogonal axes — and that is the modern shape, not the dated one

`@ponchia/ui` themes along **one binary base axis** (light/dark, honouring
`prefers-color-scheme`, overridable with `[data-theme]`), with everything else
*derived* or carried on *orthogonal axes*:

- **Base:** light / dark (`css/tokens.css`).
- **Brand (derivation):** one `--accent` knob → the whole accent family via
  OKLCH `color-mix()` (ADR-0001). Material-3-style single-seed derivation, in
  CSS, with zero runtime.
- **Colorway:** `data-bronto-skin` (amber-crt / phosphor-green / e-ink) —
  re-points the one accent; opt-in `skins.css`.
- **Surface:** `data-surface="oled"` — true-black variant of the dark base
  (see below).
- **Contrast:** `data-contrast="high"` + `prefers-contrast`.
- **Density:** `data-density="compact|comfortable"`.

This is the pattern the leaders converged on (Material 3 tonal + contrast axis;
GitHub Primer's base × {dimmed, high-contrast, colorblind}; Radix light/dark
pairs; Tailwind v4 CSS-var tokens; Apple appearance × Increase-Contrast × accent).
A **flat named-theme catalog** (IBM Carbon's white/g10/g90/g100) is the *older*
model — and for a single-consumer project (ADR-0002) every named theme is another
contrast matrix to gate, more DTCG surface, more baselines, for one user who
picks one look. **We reject the named-theme catalog**: composable axes are more
powerful and cheaper. A new base palette is added only when a concrete need
appears (the bar ADR-0001 used for the data-viz module).

### The dark base is re-tuned for readability (and pure black becomes opt-in)

The old dark base was **pure `#000` + `--text #f2f2f2`**. By WCAG 2.1 every
pairing "passed" (18:1), but WCAG 2.x **over-rates dark-mode contrast** (its
symmetric ratio saturates near black). The APCA column we already compute
(advisory) told the truth:

- `--text` on `--bg`: WCAG 18.76:1 but **APCA Lc 99** — over-driven → *halation*
  on pure black.
- `--text-dim` on dark surfaces: WCAG 4.7–5.7:1 ("pass") but **APCA Lc 36–37** —
  below the perceptual floor for readable meta text. **This was the "hard to
  read."**
- Surfaces `#000→#0c0c0c`: an imperceptible elevation step → cards melted into
  the page.

Re-tuned dark neutral ramp: base lifted to an elevated near-black
(`--bg #121212`, panels `#1c1c1c`/`#222`/`#242424`, lines `#383838`/`#555`),
body text eased to `#e6e6e6` (Lc 99 → ~91, halation gone), and **`--text-dim`
raised to `#a0a0a0` (Lc 36 → ~48–50)** — the change users feel. Everything still
clears WCAG AA 4.5:1; accent/status are unchanged. The true-black "Nothing" look
is preserved as the opt-in **`data-surface="oled"`** (OLED power-saving + brand),
a CSS-only preset like `data-density`/`data-contrast`.

APCA is promoted from purely advisory to a **tracked, non-failing warning** on
dark text in `check-contrast.mjs` (WCAG stays the hard gate; a hard APCA gate
remains an open ADR-0001 decision while WCAG 3 is a Working Draft). This is the
early-warning that the Lc 36 regression would have tripped.

## Consequences

- Re-tuning dark token *values* changes the default rendered output in dark mode
  → the dark Playwright visual baselines must be regenerated in the pinned Linux
  container (`visual-baselines.yml`). Kept in 0.4.1 per the maintainer's call.
- The dark palette was originally written in three places (the `@media` block,
  the `[data-theme]` block, and the `cssVars.dark` JS mirror). **Resolved in
  0.4.2:** `tokens/index.js` (`cssVars`) is now the single source, and the four
  `:root` palette blocks of `css/tokens.css` are generated from it
  (`scripts/gen-tokens-css.mjs`); the two dark blocks are identical by
  construction, so a dark edit is a one-place edit, still guarded by
  `check:tokens`.
- `data-surface` joins `data-theme`/`data-bronto-skin`/`data-density`/
  `data-contrast` as a documented root-level attribute (theming.md). The kitchen
  sink ships a unified picker (theme × colorway × surface) so the full axis set
  is selectable and visible.

## Method

Prompted by the maintainer's question and the "dark is hard to read" report,
analysed with the project's own APCA data plus a design-systems landscape review
(Material 3 / Primer / Radix / Tailwind v4 / Apple / Carbon). The fix is palette
tuning + recording the axis decision, not a re-architecture.
