You are reviewing the `@ponchia/ui` (bronto-ui) design system from the
**PERFORMANCE & BUNDLE** point of view. READ-ONLY: do not modify files.

The README advertises "~88kB / ~15kB gzip" dist and "zero runtime dependencies". Test whether
the library delivers on performance:
- Bundle size discipline: read `scripts/check-dist.mjs` (and any size budgets), inspect `dist/`
  and `css/` to see what actually ships. Is the size gate real and enforced in CI? Is the
  headline number honest (full bundle vs opt-in layers)?
- Tree-shaking / opt-in cost: `package.json` `exports`, `sideEffects: ["**/*.css"]`, and whether
  a consumer can take just the identity layer without dragging the report/analytical layers.
  Can behaviors and adapters be imported granularly?
- CSS runtime cost: selector complexity, `:has()` / universal selectors, heavy `@property` or
  `color-mix()` usage, and any layout-thrash-prone patterns. Font loading strategy (`fonts/`,
  `css/fonts.css`) — FOUT/FOIT, `font-display`, subsetting, preload.
- Animation/motion performance: `css/motion.css` — GPU-friendly (transform/opacity) vs layout
  properties; reduced-motion fallback cost.
- JS cost: are behaviors lazy / on-demand, or eagerly initialized? Any heavy work at import time?
- Build/generation pipeline cost and correctness (`scripts/`, token generation → `generated.css`).

Read real files: `scripts/check-dist.mjs` and other `scripts/`, `dist/`, `package.json`,
`css/fonts.css`, `css/motion.css`, `fonts/`, sample `css/*.css`, `behaviors/`.

--- OUTPUT CONTRACT ---
One report on a multi-POV panel; a synthesizer merges it, so be concrete and self-contained.
Ground EVERY claim in a `file:line` you actually opened. Produce your report as your FINAL
ANSWER in EXACTLY this Markdown structure:

# Performance & bundle — bronto-ui review
**Verdict:** one paragraph.
**Grade:** letter A–F + half-sentence why.
## Strengths
- bullets, each citing `path:line`.
## Weaknesses / risks
- bullets; prefix severity [P0]/[P1]/[P2]/[P3]; cite `path:line`; say what breaks & why.
## Top recommendations
1..6 ranked, concrete, actionable.
## Notable observations
- surprising / clever / worth knowing.
Evidence-dense, no filler, no restating this prompt.
