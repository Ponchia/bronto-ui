# Multi-POV review — Round 4: correctness & robustness (2026-07-02)

Round 4 of the multi-POV review series — an adversarial bug-hunt. Seven independent Codex
agents hunted for REAL, REPRODUCIBLE DEFECTS (not style), each in one area; a synthesizer
triaged the results into a deduped, severity × confidence fix-list. Orchestrated with
`codex-fan`. Prior rounds: `../2026-07-02-multipov/` (1),
`../2026-07-02-multipov-r2-structure/` (2), `../2026-07-02-multipov-r3-docs/` (3).

## Verdict

**Overall: B−** — generally solid, **no P0s**, but **23 confirmed HIGH/MED-confidence defects**
clustered in CSS logical-axis/RTL handling, behavior lifecycle/a11y, adapter reactivity, and
validator false-negatives. Worst: a **P1 print-contrast regression** where dark opt-in skins
override the print-safe palette (~1.5:1). See [`SYNTHESIS.md`](./SYNTHESIS.md) for the ranked
fix-list, the SAFE-FIX vs NEEDS-DESIGN split, and the disjoint fix batching.

## Files

| File | Lens | Grade |
|---|---|---|
| [`SYNTHESIS.md`](./SYNTHESIS.md) | Triaged fix-list, batching, false-alarms | **B−** |
| [`css-correctness.md`](./css-correctness.md) | CSS correctness & cross-browser risk | B |
| [`behaviors-correctness.md`](./behaviors-correctness.md) | Behaviors: leaks/races/SSR/teardown | B− |
| [`adapters-correctness.md`](./adapters-correctness.md) | Framework-adapter bugs | B− |
| [`forms-a11y-correctness.md`](./forms-a11y-correctness.md) | Forms / interaction / a11y correctness | B− |
| [`build-scripts-robustness.md`](./build-scripts-robustness.md) | Build/script robustness (incl. false-passing gates) | B |
| [`tokens-contrast-correctness.md`](./tokens-contrast-correctness.md) | Tokens / theme / contrast correctness | C+ |
| [`report-renderer-correctness.md`](./report-renderer-correctness.md) | Report/PDF & data-viz renderer | B |

Briefs under [`pov-prompts/`](./pov-prompts/). Point-in-time snapshot; citations are the
reviewers' own.
