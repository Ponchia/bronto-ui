ROUND 2 multi-POV review of `@ponchia/ui` (bronto-ui). STRUCTURE & ARCHITECTURE ONLY
(round 1 did the broad pass — go deeper). READ-ONLY: do not modify files.

Your lens: **PACKAGE / EXPORT SURFACE ARCHITECTURE (the public contract shape).**
Judge the structure of what the package exposes and how:
- The package.json `exports` map: its overall shape and internal consistency. Families —
  css/*, tokens, classes, behaviors (now with per-leaf subpaths), adapters, glyphs, shiki,
  schemas, connectors, annotations. Are subpath conventions CONSISTENT across families? (round 1
  noted behaviors got per-leaf exports but adapters only have index — is that a real structural
  gap or correct?). Every export must map to a shipped file (`files` array) with matching types.
- The public/private boundary: what is exported vs internal (e.g. behaviors/internal.js is NOT
  exported — is the internal/public line drawn cleanly and consistently, or do internals leak
  through the barrel / types?).
- The `files` manifest vs `exports` vs what's actually shipped (scripts/lib/shipped-files.mjs,
  check-exports.mjs, check-consumer-surface.mjs, publint/attw gates). Is the shipped surface
  exactly the intended surface? Any dead exports or unshipped-but-referenced paths?
- Entry-point design: main/module/types/exports coherence; conditional exports (types+default);
  dual-consumption (framework vs plain). CSS entry (dist/bronto.css vs css/* vs dist/css/*) —
  is the consumer's mental model of "what do I import" clean?
- Versioning/stability surface: how MIGRATIONS.json + docs/package-contract.md + docs/stability.md
  structurally encode the contract. Is the contract machine-checked end to end?

--- OUTPUT CONTRACT ---
One report on a multi-POV STRUCTURE/ARCHITECTURE panel; a synthesizer merges it. Ground EVERY
claim in a `path:line`. Produce your report as your FINAL ANSWER in EXACTLY this structure:

# Package / export surface architecture — bronto-ui structure review
**Verdict:** one paragraph.
**Grade:** A–F + half-sentence why.
## Strengths
- bullets citing `path:line`.
## Weaknesses / risks
- bullets; prefix [P0]/[P1]/[P2]/[P3]; cite `path:line`; say the contract/consumer cost.
## Top recommendations
1..6 ranked, concrete, actionable.
## Notable observations
- surprising / worth the synthesizer knowing.
Evidence-dense, no filler, no restating this prompt.
