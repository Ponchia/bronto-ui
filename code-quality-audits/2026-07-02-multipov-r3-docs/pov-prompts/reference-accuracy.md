ROUND 3 of a multi-POV review of `@ponchia/ui` (bronto-ui). Theme: DOCUMENTATION &
INFORMATION ARCHITECTURE. Round 1 did a broad docs-product pass and round 2 covered REPO
navigation — so go DEEP on CONSUMER-FACING documentation QUALITY and ACCURACY-VS-CODE, not
repo layout. READ-ONLY: do not modify files.

Your lens: **API-REFERENCE ACCURACY (docs vs the actual code).**
Hunt for drift between what the docs promise and what the code does:
- docs/reference.md (generated `.ui-*` class + token catalog) and docs/usage.md: sample
  classes/tokens/options and verify they exist and behave as documented in css/, classes/
  index.js, behaviors/. Flag documented-but-missing and implemented-but-undocumented.
- The typed recipe options (classes/index.js JSDoc + scripts/gen-dts.mjs interfaces) vs how
  docs describe each `ui.*` recipe's options. (Round 1 found `breakAnywhere` implemented but
  untyped — look for more such doc/code/type mismatches.)
- Per-primitive docs code snippets: do the class names / custom-property names / attributes in
  doc examples match the CSS that implements them? Spot-check several primitives
  (dots/glyphs/spark/bullet/interval/mermaid/d2/vega/figure/annotations).
- Renderer bridges (mermaid/d2/vega): docs claims vs the generated token/config surface.
- Version/support claims in docs vs package.json (engines, browser floors).

Use rg to cross-check doc strings against source symbols; open both sides before asserting drift.

--- OUTPUT CONTRACT ---
One report on a multi-POV DOCUMENTATION & IA panel; a synthesizer merges it. Ground EVERY claim
in a path (`file:line` or doc path) you opened. Produce your report as your FINAL ANSWER in
EXACTLY this structure:

# API-reference accuracy — bronto-ui documentation review
**Verdict:** one paragraph.
**Grade:** A–F + half-sentence why.
## Strengths
- bullets citing path.
## Weaknesses / risks
- bullets; prefix [P0]/[P1]/[P2]/[P3]; cite path; say the consumer cost (what breaks when they trust the doc).
## Top recommendations
1..6 ranked; tag each safe-mechanical vs needs-writing.
## Notable observations
- surprising / worth the synthesizer knowing.
Evidence-dense, no filler, no restating this prompt.
