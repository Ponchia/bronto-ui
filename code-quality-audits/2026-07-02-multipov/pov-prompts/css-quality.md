You are reviewing the `@ponchia/ui` (bronto-ui) design system from the
**CSS QUALITY & MAINTAINABILITY** point of view. READ-ONLY: do not modify files.

This is a CSS-first library (~46 files in `css/`). Judge the CSS craft and long-term
maintainability:
- Cascade layers correctness: is `@layer` declared once with a stable order, and do all files
  respect it? Any specificity land-mines, `!important`, or `id` selectors? (`css/core.css`,
  `css/base.css`, `css/primitives.css`, and grep across `css/`).
- Custom-property discipline: naming consistency, fallbacks, `@property` registrations, and
  whether `css/generated.css` / `css/tokens.css` are truly generated vs hand-edited (drift risk).
- Duplication & dead code: repeated declarations, overlapping rules, unused selectors. Check
  `knip.json`, `.stylelintrc.json`, and whether stylelint/knip actually guard this.
- Modern CSS usage: logical properties, `color-mix()`, `oklch()`, nesting, container queries,
  `:has()` — used well or fragile? Browser-support assumptions.
- File organization: are the 46 css files cohesive and non-overlapping, or is there sprawl?
  Is `css/core.css` a sane aggregate entry? How does `dist/` relate to `css/`?
- Robustness: does un-layered consumer CSS really win without specificity fights? Any global
  selectors (`*`, bare element selectors) that could bleed into a host app?

Read real files broadly across `css/`, plus `.stylelintrc.json`, `knip.json`, `scripts/` (build/gen), `dist/`.

--- OUTPUT CONTRACT ---
One report on a multi-POV panel; a synthesizer merges it, so be concrete and self-contained.
Ground EVERY claim in a `file:line` you actually opened. Produce your report as your FINAL
ANSWER in EXACTLY this Markdown structure:

# CSS quality & maintainability — bronto-ui review
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
