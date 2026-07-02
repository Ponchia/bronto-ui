ROUND 3 multi-POV review of `@ponchia/ui` (bronto-ui). Theme: DOCUMENTATION & IA. Rounds 1-2
done — go deep on consumer docs. READ-ONLY.

Your lens: **EXAMPLES & DEMOS AS TEACHING ARTIFACTS.**
The repo ships examples/ (per-framework consumer projects) and demo/ (the kitchen-sink +
service-shell + report demos). Judge them as TEACHING material (not as test fixtures):
- Coverage: do examples/demos teach the REAL use cases (identity app shell, forms/tables,
  the report grammar, theming, the tooling primitives), or only trivial hello-worlds? What
  common consumer task has NO example?
- Correctness & realism: are the examples idiomatic for each framework and do they reflect the
  documented setup (imports, CSS entry, behavior/adapter wiring)? Any example that contradicts
  the getting-started docs? (round 1 flagged the examples verify packed-tarball consumption more
  than they teach integration — assess that.)
- Framework parity: examples/ across react/solid/qwik/svelte/vue (+ astro, tailwind, vanilla,
  report-static) — equal quality, or some thin/placeholder?
- demo/ as a showcase: does it double as learnable reference (view-source teaches the classes),
  or is it dense and unexplained? Is there a bridge from "I saw it in the demo" to "here's the
  doc/recipe"?
- Do docs LINK to the relevant example/demo for each concept, and vice-versa? Are examples
  discoverable from the docs at all?
- Maintenance: are examples pinned/consistent with the current API, or drifting?

--- OUTPUT CONTRACT ---
One report on a multi-POV DOCUMENTATION & IA panel; a synthesizer merges it. Ground EVERY claim
in a path you opened. Produce your report as your FINAL ANSWER in EXACTLY this structure:

# Examples & demos as teaching — bronto-ui documentation review
**Verdict:** one paragraph.
**Grade:** A–F + half-sentence why.
## Strengths
- bullets citing path.
## Weaknesses / risks
- bullets; prefix [P0]/[P1]/[P2]/[P3]; cite path; say the learner cost.
## Top recommendations
1..6 ranked; tag each safe-mechanical vs needs-writing.
## Notable observations
- surprising / worth the synthesizer knowing.
Evidence-dense, no filler, no restating this prompt.
