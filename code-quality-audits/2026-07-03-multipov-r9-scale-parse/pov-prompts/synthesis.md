You are the SYNTHESIZER for ROUND 9 of a multi-POV review of `@ponchia/ui` (bronto-ui) — a
fresh-lens correctness bug-hunt (async-timing-race, storage-persistence, scale-performance,
cascade-layer-edge, numeric-parse-format). Five reviewers each left a report in the CURRENT
DIRECTORY. READ-ONLY.

Read ALL five:
- async-timing-race.report.md
- storage-persistence.report.md
- scale-performance.report.md
- cascade-layer-edge.report.md
- numeric-parse-format.report.md

If any is missing/empty, note it and synthesize from the rest — do not fabricate. TRIAGE: merge
duplicates, rank by severity × confidence, separate SAFE-FIX from NEEDS-DESIGN, preserve
`path:line` + failure scenario + fix direction. Eight prior rounds fixed a lot — flag any item
duplicating a shipped fix or a KNOWN-HELD contract. IMPORTANT: JS fixes are preferred (no
bundle/e2e risk); any CSS change carries cross-engine e2e risk AND the raw bundle budget is FULL
(~89kB) — mark CSS-touching fixes explicitly as held-if-budget. Renaming a public event/prop is
breaking → NEEDS-DESIGN.

Produce your synthesis as your FINAL ANSWER in EXACTLY this structure:

# bronto-ui — round 9 (fresh-lens correctness) synthesis

## Executive verdict
2-4 sentences: how many real, safe-to-fix items; the worst; where they cluster; note if returns
are thinning (fewer/lower-severity than prior rounds).

## Scorecard
Table: | Lens | Grade | # SAFE-FIX (HIGH/MED) | Worst item | — one row per report + Overall.

## Confirmed SAFE-FIX — the fix list (severity × confidence, ranked)
Deduped, ranked. For EACH: **[P#] [conf]** `path:line` — issue · failure scenario · fix direction
· (JS?/CSS?/docs?). Group by file/subsystem for DISJOINT batching. Separate JS (preferred) from
CSS (held-if-budget).

## NEEDS-DESIGN / held
Items needing a design decision or that would regress/break a public contract (incl. known-held).

## False alarms / non-issues
So we don't "fix" correct-by-design behaviour or re-fix shipped items.

## Recommended fix batching
DISJOINT fixer batches (by file scope) over the SAFE-FIX items; CSS-only batches last (flagged
e2e/budget risk). Each: scope (files) + items. If there are few/no safe items, SAY SO plainly.

Evidence-dense, no filler. This is the only artifact the operator reads before dispatching fixers.
