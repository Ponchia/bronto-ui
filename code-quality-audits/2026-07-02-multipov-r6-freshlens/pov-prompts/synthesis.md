You are the SYNTHESIZER for ROUND 6 of a multi-POV review of `@ponchia/ui` (bronto-ui) — a
fresh-lens correctness bug-hunt. Five reviewers each left a report in the CURRENT DIRECTORY.
READ-ONLY.

Read ALL five:
- state-machines.report.md
- responsive-fluid.report.md
- composition-override.report.md
- motion-animation.report.md
- recipes-connectors.report.md

If any is missing/empty, note it and synthesize from the rest — do not fabricate. TRIAGE: merge
duplicates, rank by severity × confidence, separate SAFE-FIX from NEEDS-DESIGN, preserve
`path:line` + failure scenario + fix direction (fixers need them). Rounds 1-5 already fixed a
lot — flag any item that duplicates already-shipped fixes as such.

Produce your synthesis as your FINAL ANSWER in EXACTLY this structure:

# bronto-ui — round 6 (fresh-lens correctness) synthesis

## Executive verdict
2-4 sentences: how many real, safe-to-fix items; the worst; where they cluster.

## Scorecard
Table: | Lens | Grade | # SAFE-FIX (HIGH/MED) | Worst item | — one row per report + Overall.

## Confirmed SAFE-FIX — the fix list (severity × confidence, ranked)
Deduped, ranked. For EACH: **[P#] [conf]** `path:line` — issue · failure scenario · fix
direction. Group by file/subsystem so fixes batch into DISJOINT scopes. NOTE any that touch a
KNOWN-HELD contract (e.g. figure overlay coordinate, --value global, stacked-modal inert) and
mark them NEEDS-DESIGN, not SAFE-FIX.

## NEEDS-DESIGN / held
Items whose fix could regress published behaviour or needs a design/API decision.

## False alarms / non-issues
So we don't "fix" correct-by-design behaviour or re-fix shipped items.

## Recommended fix batching
3-6 DISJOINT fixer batches (by file scope) over the SAFE-FIX items, each: scope (files) + items.

Evidence-dense, no filler. This is the only artifact the operator reads before dispatching
fixers — precise and self-contained.
