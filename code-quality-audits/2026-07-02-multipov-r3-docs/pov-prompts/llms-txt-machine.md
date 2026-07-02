ROUND 3 multi-POV review of `@ponchia/ui` (bronto-ui). Theme: DOCUMENTATION & IA. Rounds 1-2
done — go deep on consumer docs. READ-ONLY.

Your lens: **THE `llms.txt` / MACHINE-CONSUMPTION SURFACE.**
`llms.txt` (~42kB) is a machine-readable doc surface for LLM consumers — a distinctive, modern
artifact. Judge it hard:
- Accuracy: does its content match the actual code + docs, or has it drifted? Spot-check class
  names, recipe options, import paths, tokens, and version claims against source. (Round 1 had
  to correct claims in llms.txt — look for remaining drift.)
- Generated vs hand-maintained: is llms.txt generated from a source of truth (find any
  scripts/gen-*.mjs that emits it), or hand-authored and therefore drift-prone? If generated,
  is it in the freshness/check gates? If hand-authored, that's a structural risk — flag it.
- Structure/quality for LLM consumption: is it well-organized (sections, stable headings,
  concise canonical facts), or a wall of prose? Does it follow the llms.txt convention
  (llmstxt.org)? Is there both an index and full-text where appropriate?
- Coverage: does it capture the things an LLM actually needs to author bronto-ui correctly
  (the class vocabulary, the "colour is rationed" rules, the layer/override model, the do/don't
  guardrails), or does it miss the load-bearing constraints?
- Redundancy/consistency with README + docs: does it repeat and potentially contradict them?

--- OUTPUT CONTRACT ---
One report on a multi-POV DOCUMENTATION & IA panel; a synthesizer merges it. Ground EVERY claim
in a path (`llms.txt:line` or source path) you opened. Produce your report as your FINAL ANSWER
in EXACTLY this structure:

# llms.txt / machine-consumption surface — bronto-ui documentation review
**Verdict:** one paragraph.
**Grade:** A–F + half-sentence why.
## Strengths
- bullets citing path.
## Weaknesses / risks
- bullets; prefix [P0]/[P1]/[P2]/[P3]; cite path; say the drift/consumer cost.
## Top recommendations
1..6 ranked; tag each safe-mechanical vs needs-writing.
## Notable observations
- surprising / worth the synthesizer knowing.
Evidence-dense, no filler, no restating this prompt.
