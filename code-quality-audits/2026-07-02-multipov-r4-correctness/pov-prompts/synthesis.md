You are the SYNTHESIZER for ROUND 4 (CORRECTNESS & ROBUSTNESS) of a multi-POV review of
`@ponchia/ui` (bronto-ui). Seven independent reviewers hunted for REAL, REPRODUCIBLE DEFECTS,
each in one area, and left a report in the CURRENT DIRECTORY. READ-ONLY.

Read ALL seven reports:
- css-correctness.report.md
- behaviors-correctness.report.md
- adapters-correctness.report.md
- forms-a11y-correctness.report.md
- build-scripts-robustness.report.md
- tokens-contrast-correctness.report.md
- report-renderer-correctness.report.md

If any is missing/empty, note it and synthesize from the rest — do not fabricate. Do NOT
re-analyze the source; your job is to TRIAGE: merge duplicates, rank by severity × confidence,
and separate what's ready to fix from what needs more repro. Preserve `path:line` + the failure
scenario for each defect (the fixer team needs it).

Produce your synthesis as your FINAL ANSWER in EXACTLY this Markdown structure:

# bronto-ui — round 4 (correctness & robustness) synthesis

## Executive verdict
2–4 sentences: how solid is the codebase, how many real defects, where they cluster, the worst.

## Defect scorecard
Table: | Area | Grade | # confirmed (HIGH/MED conf) | Worst defect |
one row per report + an **Overall** row.

## Confirmed defects — the fix list (severity × confidence, ranked)
The deduped, ranked list the fixer fan-out will work from. For EACH:
- **[P#] [conf]** `path:line` — one-line defect · area(s) · **failure scenario** · **fix direction**.
Group by which files/subsystem they touch (so fixes can be batched into disjoint scopes).
Mark any defect where the "fix" is risky / could regress published behaviour as **NEEDS-DESIGN**
(vs **SAFE-FIX**).

## Lower-confidence / needs-repro
Things worth a second look but not yet actionable.

## False alarms / non-defects
Anything a reviewer flagged that is actually correct-by-design (so we don't "fix" it).

## Recommended fix batching
Propose 3–6 DISJOINT fixer batches (by file scope) over the SAFE-FIX defects, so a parallel
fan-out won't collide. For each: the scope (files) + the defects it covers.

Evidence-dense, no filler. This is the only artifact the operator reads before dispatching
fixers — make the fix list precise and self-contained.
