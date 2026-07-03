# Multi-POV review — Round 9: scale, timing & parsing (2026-07-03)

Round 9 of the multi-POV series — fresh-lens bug-hunt: async/timing/race, storage/persistence,
scale/performance under load, CSS cascade/`@layer` consumer-interaction, numeric parsing/
formatting. Five Codex agents + a synthesizer triage. `codex-fan`.

## Verdict

**Overall: B−** — **no P1s** (returns thinning after 8 prior rounds), **18 SAFE-FIX** (15 JS/docs,
3 CSS held-if-budget). Clusters: behavior-JS hot-path scale (unbatched connector redraw, O(n²)
table sort, list active-item churn), timing (carousel IO suppression, spotlight retarget), and
numeric/attribute parsing (Unicode-minus sort, enum/selector trimming). The 3 CSS items are the
`@property`-on-generic-name issue (breaking rename → design). See [`SYNTHESIS.md`](./SYNTHESIS.md).

## Files

| File | Lens | Grade |
|---|---|---|
| [`SYNTHESIS.md`](./SYNTHESIS.md) | Triaged fix-list + batching | **B−** |
| [`scale-performance.md`](./scale-performance.md) | Behavior performance under load | C+ |
| [`async-timing-race.md`](./async-timing-race.md) | Async / timing / race | B− |
| [`numeric-parse-format.md`](./numeric-parse-format.md) | Numeric parsing / formatting | B− |
| [`storage-persistence.md`](./storage-persistence.md) | Storage / persistence | B |
| [`cascade-layer-edge.md`](./cascade-layer-edge.md) | CSS cascade / `@layer` edge cases | C+ |

Briefs under [`pov-prompts/`](./pov-prompts/). Point-in-time snapshot; citations are the
reviewers' own.
