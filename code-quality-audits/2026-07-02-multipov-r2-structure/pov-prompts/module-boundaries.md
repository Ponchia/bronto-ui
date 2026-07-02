ROUND 2 of a multi-POV review of `@ponchia/ui` (bronto-ui), a CSS-first design system.
This round is STRUCTURE & ARCHITECTURE ONLY (round 1 already did a broad
quality/a11y/security/docs pass — go DEEPER into structure, don't re-report surface issues).
READ-ONLY: do not modify files.

Your lens: **MODULE BOUNDARIES & THE PRIMITIVE-OWNERSHIP THESIS IN PRACTICE.**
The project's thesis (docs/frontier-primitives.md) is "each primitive owns only its visual
grammar and pure geometry — no chart engine, no domain state, no hit-testing," and there's a
declared split between the shared "identity layer" (app shell/nav/forms/tables/feedback) and
the opt-in "tooling/report/analytical layer". Test whether the CODE actually honors these
boundaries:
- Do primitives leak concerns across the boundary? (round 1 spotted app-shell aliases inside
  css/primitives.css — verify and map the full extent). Look at css/primitives.css,
  css/core.css, css/app.css, css/dataviz.css, css/spark.css, css/marks.css, css/legend.css,
  css/interval.css, css/report*.css, css/workbench.css, css/command.css.
- Is the identity-vs-tooling separation enforced structurally (separate files/layers/exports)
  or only by convention? Can a consumer take the identity layer without dragging tooling?
- Cross-module coupling: which modules reference which others' classes/tokens/selectors? Are
  there implicit dependencies a refactor would break?
- Does the behaviors/ ↔ css/ boundary hold (JS owns behavior, CSS owns grammar), or do
  behaviors encode visual/layout decisions that belong in CSS (or vice versa)?
- Are there "god files" or grab-bag modules that violate single-responsibility?

--- OUTPUT CONTRACT ---
One report on a multi-POV STRUCTURE/ARCHITECTURE panel; a synthesizer merges it, so be
concrete and self-contained. Ground EVERY claim in a `path:line` you opened. Produce your
report as your FINAL ANSWER in EXACTLY this structure:

# Module boundaries & primitive-ownership — bronto-ui structure review
**Verdict:** one paragraph.
**Grade:** A–F + half-sentence why.
## Strengths
- bullets citing `path:line`.
## Weaknesses / risks
- bullets; prefix [P0]/[P1]/[P2]/[P3]; cite `path:line`; say the coupling/maintainability cost.
## Top recommendations
1..6 ranked, concrete, actionable.
## Notable observations
- surprising / worth the synthesizer knowing.
Evidence-dense, no filler, no restating this prompt.
