ROUND 3 multi-POV review of `@ponchia/ui` (bronto-ui). Theme: DOCUMENTATION & IA. Rounds 1
(broad docs-product) and 2 (repo navigation) are done — go DEEP on consumer docs. READ-ONLY.

Your lens: **GETTING-STARTED / ONBOARDING (install → first success).**
Walk the path a brand-new consumer takes and judge it end to end:
- The README quick-start + docs/getting-started/* (per-framework guides, e.g.
  react-solid.md) + docs/usage.md: is there a clear, correct, minimal path from `npm i` to a
  styled page in plain HTML AND in each framework? Is the ORDER right (load CSS → theme →
  components → behaviors)?
- Correctness of the very first snippets: would they actually work if pasted? Import paths,
  CSS entry (dist/bronto.css vs css/* vs the root export), the behaviors/adapters setup,
  theme persistence. Cross-check against package.json exports + the real files.
- Framework coverage parity: react/solid/qwik/svelte/vue — are all five onboarded equally, or
  are some guides thinner/missing/stale? Do they match the actual adapter APIs?
- The "no build / plain HTML / CDN" path and the print/PDF path — documented clearly for a
  first-timer?
- Time-to-first-success friction: what would trip a newcomer in the first 10 minutes? Missing
  prerequisites, unexplained concepts, dead ends.
- Does onboarding lead with the differentiated value (identity/report/tooling) or bury it?

--- OUTPUT CONTRACT ---
One report on a multi-POV DOCUMENTATION & IA panel; a synthesizer merges it. Ground EVERY claim
in a path you opened. Produce your report as your FINAL ANSWER in EXACTLY this structure:

# Getting-started / onboarding — bronto-ui documentation review
**Verdict:** one paragraph.
**Grade:** A–F + half-sentence why.
## Strengths
- bullets citing path.
## Weaknesses / risks
- bullets; prefix [P0]/[P1]/[P2]/[P3]; cite path; say the newcomer cost.
## Top recommendations
1..6 ranked; tag each safe-mechanical vs needs-writing.
## Notable observations
- surprising / worth the synthesizer knowing.
Evidence-dense, no filler, no restating this prompt.
