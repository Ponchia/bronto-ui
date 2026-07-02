You are reviewing the `@ponchia/ui` (bronto-ui) design system from the
**ARCHITECTURE & DESIGN-SYSTEM COHERENCE** point of view. READ-ONLY: do not modify files.

Your lens: Is the architecture sound, internally consistent, and true to its own thesis?
Investigate and judge:
- The single-`@layer bronto` cascade strategy and the "your un-layered CSS wins with no
  !important" claim. Look at `css/core.css`, `css/base.css`, `css/primitives.css`,
  `css/tokens.css`, and how layers are declared/ordered across `css/*.css`.
- The token architecture: `tokens/` (DTCG `tokens.dtcg.json`, `resolved.json`, OKLCH,
  `skins.*`, colorways, chart/mermaid/d2/vega token bridges). Is there one source of truth?
  How are tokens generated → resolved → consumed? (`scripts/`, `css/generated.css`, `css/skins.css`).
- The stated primitive-boundary thesis in `docs/frontier-primitives.md` ("each primitive owns
  only its visual grammar and pure geometry — no chart engine, no domain state, no hit-testing").
  Do the actual primitives (`css/dataviz.css`, `css/spark.css`, `css/marks.css`, `css/legend.css`,
  `css/interval.css`, `css/connectors.css`, `behaviors/`) honor that boundary, or leak concerns?
- Layering of the "identity layer" (app shell/nav/forms/tables/feedback) vs the opt-in
  "tooling/report layer". Is the separation clean and enforced (`css/app.css`, `css/report*.css`,
  `css/workbench.css`, `css/command.css`)?
- Overall module/directory structure, coupling, and whether the mental model scales.

Read the actual files — sample generously across `css/`, `tokens/`, `docs/architecture.md`,
`docs/frontier-primitives.md`, `docs/theming.md`, `docs/package-contract.md`, `scripts/`.

--- OUTPUT CONTRACT ---
This is one report on a multi-POV panel; a synthesizer merges it with others, so be concrete
and self-contained. Ground EVERY claim in a `file:line` you actually opened. Produce your
report as your FINAL ANSWER in EXACTLY this Markdown structure:

# Architecture & design-system coherence — bronto-ui review
**Verdict:** one paragraph overall take.
**Grade:** letter A–F + half-sentence why.
## Strengths
- bullets, each citing `path:line`.
## Weaknesses / risks
- bullets; prefix each with severity [P0]/[P1]/[P2]/[P3]; cite `path:line`; say what breaks & why it matters.
## Top recommendations
1..6 ranked, concrete, actionable.
## Notable observations
- surprising / clever / worth the synthesizer knowing.
Evidence-dense, no filler, no restating this prompt.
