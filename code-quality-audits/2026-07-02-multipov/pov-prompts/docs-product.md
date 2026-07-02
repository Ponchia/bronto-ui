You are reviewing the `@ponchia/ui` (bronto-ui) design system from the
**DOCUMENTATION, POSITIONING & PRODUCT** point of view. READ-ONLY: do not modify files.

Judge the docs quality AND the product/positioning: is the story coherent, is it discoverable
and adoptable, and who is it actually for?
- Docs quality & completeness: `README.md`, `docs/` (~57 files — architecture, reference, usage,
  theming, contrast, stability, package-contract, frontier-primitives, reporting, glyphs, mermaid,
  d2, vega, figure, annotations, dots, etc.), `CONTRIBUTING.md`, `ROADMAP.md`, `llms.txt`.
  Accuracy vs the code, freshness, gaps, and whether a newcomer can get productive fast.
- Positioning: the "deliberate stance" narrative (monochrome, rationed accent, dot-matrix, CSS-first,
  no component runtime). Is the value proposition clear and differentiated vs Tailwind/shadcn/Pico/
  Open Props/Radix? Who is the target user, and is that user served by the docs?
- The `llms.txt` (LLM-consumption doc) — is it a genuinely useful machine-readable surface, accurate,
  and maintained? Novel and worth highlighting?
- Coherence of scope: identity layer + tooling/report/analytical layer + framework adapters — does the
  product feel focused or sprawling? Does the ROADMAP reflect a clear thesis or feature-creep?
- Onboarding & examples: do `examples/` and `demo/` teach the system well? Is the migration/stability
  story (`MIGRATIONS.json`, `docs/stability.md`) trustworthy for someone betting on it?
- Anti-marketing / honest docs: does it over-claim, or are limitations stated plainly?

Read real files: `README.md`, `ROADMAP.md`, `CONTRIBUTING.md`, `docs/**` (sample broadly),
`llms.txt`, `examples/`, `demo/`, `MIGRATIONS.json`.

--- OUTPUT CONTRACT ---
One report on a multi-POV panel; a synthesizer merges it, so be concrete and self-contained.
Ground EVERY claim in a `file:line` you actually opened. Produce your report as your FINAL
ANSWER in EXACTLY this Markdown structure:

# Documentation, positioning & product — bronto-ui review
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
