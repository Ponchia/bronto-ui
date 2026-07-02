ROUND 3 multi-POV review of `@ponchia/ui` (bronto-ui). Theme: DOCUMENTATION & IA. Rounds 1-2
done — go deep on consumer docs. READ-ONLY.

Your lens: **PER-PRIMITIVE HOW-TO DOCS + DOC HYGIENE/GOVERNANCE.**
Two related concerns:
(A) The ~40 per-primitive how-to docs (docs/dots.md, glyphs.md, spark.md, bullet.md,
   interval.md, clamp.md, highlights.md, diff.md, code.md, sidenote.md, textref.md, marks.md,
   sources.md, mermaid.md, d2.md, vega.md, figure.md, annotations.md, legends.md, state.md,
   command.md, workbench.md, reporting.md, dots, …):
   - Do they follow a CONSISTENT template (what it is → when to use → minimal example → options
     → a11y/limits), or is each ad hoc? Map the variance.
   - Completeness parity: which primitives are richly documented vs a stub? Any shipped
     primitive with NO how-to doc, or a doc for something not shipped?
   - Example correctness (spot-check several): do the code snippets use real classes/attributes?
   - Do they consistently state the a11y contract and the "host owns data/state" boundary?
(B) Doc hygiene & governance:
   - CHANGELOG.md (~121kB): is it well-structured (Keep a Changelog?), or unwieldy? MIGRATIONS.json
     + docs/stability.md: is the migration story coherent and discoverable?
   - Terminology consistency across the whole doc set; stale references; TODO/placeholder text;
     broken internal links; duplicated content.
   - Are there ADRs / decision records for the big choices, or is the "why" only in prose/commits?

--- OUTPUT CONTRACT ---
One report on a multi-POV DOCUMENTATION & IA panel; a synthesizer merges it. Ground EVERY claim
in a path you opened. Produce your report as your FINAL ANSWER in EXACTLY this structure:

# Per-primitive how-tos + doc hygiene — bronto-ui documentation review
**Verdict:** one paragraph.
**Grade:** A–F + half-sentence why.
## Strengths
- bullets citing path.
## Weaknesses / risks
- bullets; prefix [P0]/[P1]/[P2]/[P3]; cite path; say the reader/maintenance cost.
## Top recommendations
1..6 ranked; tag each safe-mechanical vs needs-writing.
## Notable observations
- surprising / worth the synthesizer knowing.
Evidence-dense, no filler, no restating this prompt.
