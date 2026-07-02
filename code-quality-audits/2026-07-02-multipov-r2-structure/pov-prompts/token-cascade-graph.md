ROUND 2 multi-POV review of `@ponchia/ui` (bronto-ui). STRUCTURE & ARCHITECTURE ONLY
(round 1 did the broad pass — go deeper). READ-ONLY: do not modify files.

Your lens: **CASCADE-LAYER & TOKEN DEPENDENCY GRAPH.**
Map and judge the actual architecture of the layer + token system:
- The `@layer bronto` strategy: is the layer order declared once and stable? Trace how every
  css/*.css participates. Any file that breaks the layering or fights specificity? (css/core.css,
  css/base.css, css/primitives.css, css/tokens.css, css/generated.css, css/skins.css).
- The TOKEN dependency graph: source of truth → derived. tokens/tokens.dtcg.json,
  tokens/resolved.json, tokens/skins.*, tokens/charts|mermaid|d2|vega.*, css/tokens.css,
  css/generated.css. Which tokens derive from which? Is there ONE source of truth, or parallel
  hand-maintained copies that can drift? How do the renderer bridges (mermaid/d2/vega) get
  their palettes, and can they drift from the core tokens?
- Token TIERS: global vs light/dark vs skins vs status vs data-viz. Is the tiering coherent and
  documented in the structure, or ad hoc? (round 1 noted print palette remaps duplicate values
  and some geometry props are unregistered — verify structurally.)
- `@property` registration coverage for animated/typed custom props: which numeric/color props
  are registered vs bare, and is the policy consistent? Per-leaf variable self-containment
  (scripts/check-variables.mjs enforces something here — understand the rule and gaps).
- Circular or implicit token dependencies; fallback chains (`var(--x, var(--y))`) that encode
  hidden ordering.

--- OUTPUT CONTRACT ---
One report on a multi-POV STRUCTURE/ARCHITECTURE panel; a synthesizer merges it. Ground EVERY
claim in a `path:line`. Produce your report as your FINAL ANSWER in EXACTLY this structure:

# Cascade-layer & token dependency graph — bronto-ui structure review
**Verdict:** one paragraph.
**Grade:** A–F + half-sentence why.
## Strengths
- bullets citing `path:line`.
## Weaknesses / risks
- bullets; prefix [P0]/[P1]/[P2]/[P3]; cite `path:line`; say the drift/coupling/maintainability cost.
## Top recommendations
1..6 ranked, concrete, actionable.
## Notable observations
- surprising / worth the synthesizer knowing.
Evidence-dense, no filler, no restating this prompt.
