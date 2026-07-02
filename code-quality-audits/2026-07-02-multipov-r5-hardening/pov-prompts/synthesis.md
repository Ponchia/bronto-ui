You are the SYNTHESIZER for ROUND 5 of a multi-POV review of `@ponchia/ui` (bronto-ui) —
correctness/optimization on fresh angles + verification of round-4 residuals. Five reviewers
each left a report in the CURRENT DIRECTORY. READ-ONLY.

Read ALL five:
- perf-bundle.report.md
- security-injection.report.md
- report-pdf-deep.report.md
- geometry-math-edge.report.md
- verify-r4-residual.report.md

If any is missing/empty, note it and synthesize from the rest — do not fabricate. TRIAGE: merge
duplicates, rank by severity × confidence, separate SAFE-FIX from NEEDS-DESIGN, and preserve
`path:line` + failure scenario + fix direction for each (the fixers need them).

Produce your synthesis as your FINAL ANSWER in EXACTLY this structure:

# bronto-ui — round 5 (fresh correctness + residual triage) synthesis

## Executive verdict
2–4 sentences: how many real, safe-to-fix items across perf/security/report/geometry/residuals;
the worst; anything security-sensitive to call out.

## Scorecard
Table: | Lens | Grade | # SAFE-FIX (HIGH/MED) | Worst item | — one row per report + Overall.

## Confirmed SAFE-FIX — the fix list (severity × confidence, ranked)
Deduped, ranked. For EACH: **[P#] [conf]** `path:line` — issue · failure scenario · fix
direction. Group by file/subsystem so fixes batch into DISJOINT scopes.

## NEEDS-DESIGN / held
Items whose fix could regress published behaviour or needs an API/design decision (incl. the
round-4 held items the residual reviewer re-confirmed).

## False alarms / non-issues
So we don't "fix" correct-by-design behaviour.

## Recommended fix batching
3–6 DISJOINT fixer batches (by file scope) over the SAFE-FIX items, each: scope (files) + items.

Evidence-dense, no filler. This is the only artifact the operator reads before dispatching
fixers — precise and self-contained.
