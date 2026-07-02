ROUND 2 multi-POV review of `@ponchia/ui` (bronto-ui). STRUCTURE & ARCHITECTURE ONLY
(round 1 did the broad pass — go deeper). READ-ONLY: do not modify files.

Your lens: **REPOSITORY STRUCTURE, CONVENTIONS & NEWCOMER NAVIGABILITY.**
Step back and judge the repo as a whole tree a new contributor must navigate:
- Top-level layout: css/ tokens/ classes/ behaviors/ react|solid|qwik|svelte|vue/ connectors/
  annotations/ schemas/ glyphs/ shiki/ fonts/ scripts/ test/ examples/ demo/ docs/ dist/. Is the
  layout intuitive and self-explaining? Does anything live where a newcomer would NOT expect it?
  Are related things co-located, or scattered?
- Config sprawl at the root: .stylelintrc.json, knip.json, tsconfig.json, tsconfig.dts.json,
  .prettierrc/.prettierignore, .editorconfig, .gitattributes, .semgrepignore, playwright.config,
  MIGRATIONS.json, llms.txt, ROADMAP, CONTRIBUTING, CHANGELOG (121kB!). Is this a reasonable
  surface, or accreted config? Anything redundant/conflicting?
- Conventions: are naming/placement conventions consistent and DISCOVERABLE (documented in
  AGENTS.md / CONTRIBUTING / a structure doc), or tribal knowledge? Is there a map of the repo?
- The examples/ (per-framework) and demo/ split — is the purpose of each clear and are they
  structured consistently?
- test/ (~118 files) organization: unit vs e2e vs type-tests vs fixtures — is the test tree
  structured to mirror the source, discoverable, and non-duplicative?
- Onboarding-by-structure: could a competent dev find "where do I add a new primitive" and "what
  do I regenerate" from the structure + docs alone? What's the single biggest structural
  friction for a newcomer?

--- OUTPUT CONTRACT ---
One report on a multi-POV STRUCTURE/ARCHITECTURE panel; a synthesizer merges it. Ground EVERY
claim in a `path:line`/path. Produce your report as your FINAL ANSWER in EXACTLY this structure:

# Repository structure, conventions & navigability — bronto-ui structure review
**Verdict:** one paragraph.
**Grade:** A–F + half-sentence why.
## Strengths
- bullets citing path.
## Weaknesses / risks
- bullets; prefix [P0]/[P1]/[P2]/[P3]; cite path; say the onboarding/maintainability cost.
## Top recommendations
1..6 ranked, concrete, actionable.
## Notable observations
- surprising / worth the synthesizer knowing.
Evidence-dense, no filler, no restating this prompt.
