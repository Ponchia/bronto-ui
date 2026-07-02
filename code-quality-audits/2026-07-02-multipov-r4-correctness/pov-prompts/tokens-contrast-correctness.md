ROUND 4 multi-POV review of `@ponchia/ui` (bronto-ui). Theme: CORRECTNESS & ROBUSTNESS — hunt
REAL, REPRODUCIBLE DEFECTS. READ-ONLY.

Your lens: **TOKENS / THEME / CONTRAST CORRECTNESS.**
Hunt actual wrong VALUES and broken theming, in tokens/* (dtcg, resolved, skins, charts,
mermaid, d2, vega), css/tokens.css, css/skins.css, css/generated.css, and the generators
scripts/gen-tokens-*.mjs / gen-resolved.mjs / gen-skins.mjs / gen-contrast.mjs / gen-charts.mjs:
- Contrast failures: a shipped token pair (text on surface, accent states, on-accent) or a
  colorway (amber-CRT / phosphor / e-ink) that fails its stated WCAG floor. The repo has a
  contrast gate — look for what the gate does NOT cover (blended/translucent surfaces, focus
  rings, disabled text, chart series on surfaces).
- Resolved-value bugs: a `resolved.json`/generated value that doesn't match its DTCG source; a
  `color-mix()`/`oklch()` that produces an out-of-gamut or unintended color; a fallback that
  resolves to the wrong tier.
- `@property` registration mismatches: a registered custom property whose `syntax`/`initial`
  doesn't match how it's actually used, silently invalidating values.
- Skins correctness: a skin that repoints `--accent` but leaves a derived token stale, or breaks
  a status/data-viz tier; light/dark parity gaps.
- Renderer token drift: mermaid/d2/vega resolved palettes that disagree with the core charts
  palette for the same series/theme.

Give a concrete "token/colorway X, in context Y, is wrong/fails" for each.

--- OUTPUT CONTRACT ---
READ-ONLY. REAL, REPRODUCIBLE DEFECTS only. Trace/compute before reporting; unsure → conf LOW.
FINAL ANSWER exactly:

# Tokens / theme / contrast — bronto-ui correctness review
**Verdict:** one paragraph.
## Confirmed defects
- **[P0/P1/P2/P3] [conf HIGH/MED/LOW]** `path:line` — defect.
  - Failure scenario: concrete token/colorway/context → wrong value/contrast fail.
  - Fix direction: minimal correct fix.
## Lower-confidence / needs-repro
- bullets.
## Notable (not a bug)
- worth knowing.
Evidence-dense; defects only; no restating this prompt.
