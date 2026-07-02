ROUND 2 multi-POV review of `@ponchia/ui` (bronto-ui). STRUCTURE & ARCHITECTURE ONLY
(round 1 did the broad pass — go deeper). READ-ONLY: do not modify files.

Your lens: **CSS FILE ORGANIZATION, COHESION & DUPLICATION AT SCALE.**
There are ~46 files in css/. Judge the organization as a system a maintainer must live with:
- Cohesion vs overlap: is each css/*.css a single coherent concern, or do responsibilities
  smear across files? Which files overlap (same component styled in two places)? Map it.
- Duplication: repeated declaration blocks, near-identical rules, copy-paste across files.
  (round 1 flagged duplication + that knip/stylelint don't catch it — quantify structurally
  with concrete examples and `path:line`.)
- Dead / unreferenced selectors and files: anything not reachable from core.css or the
  documented entry points; anything shipped-but-unused.
- The aggregation model: how does css/core.css compose the parts? How does dist/ relate to
  css/ (per-file dist/css/* vs the flattened bundle)? Is the split principled?
- Naming consistency of classes and files (ui-* vocabulary, file naming) — conventions vs
  exceptions.
- File-size distribution: outlier "god" stylesheets vs tiny fragments — is the granularity right?

Use rg/fd to survey breadth, then open the specific files you cite.

--- OUTPUT CONTRACT ---
One report on a multi-POV STRUCTURE/ARCHITECTURE panel; a synthesizer merges it. Ground EVERY
claim in a `path:line`. Produce your report as your FINAL ANSWER in EXACTLY this structure:

# CSS organization, cohesion & duplication — bronto-ui structure review
**Verdict:** one paragraph.
**Grade:** A–F + half-sentence why.
## Strengths
- bullets citing `path:line`.
## Weaknesses / risks
- bullets; prefix [P0]/[P1]/[P2]/[P3]; cite `path:line`; say the maintainability cost.
## Top recommendations
1..6 ranked, concrete, actionable.
## Notable observations
- surprising / worth the synthesizer knowing.
Evidence-dense, no filler, no restating this prompt.
