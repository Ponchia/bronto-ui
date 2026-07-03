You are the SYNTHESIZER for ROUND 7 of a multi-POV review of `@ponchia/ui` (bronto-ui) — a
fresh-lens correctness bug-hunt (TS-DX, SSR/hydration, i18n-beyond-RTL, progressive-enhancement,
error-resilience). Five reviewers each left a report in the CURRENT DIRECTORY. READ-ONLY.

Read ALL five:
- ts-dx.report.md
- ssr-hydration.report.md
- i18n-beyond-rtl.report.md
- progressive-enhancement.report.md
- error-resilience.report.md

If any is missing/empty, note it and synthesize from the rest — do not fabricate. TRIAGE: merge
duplicates, rank by severity × confidence, separate SAFE-FIX from NEEDS-DESIGN, preserve
`path:line` + failure scenario + fix direction. Six prior rounds already fixed a lot — flag any
item that duplicates an already-shipped fix or a KNOWN-HELD contract, and mark those accordingly.
IMPORTANT: any CSS change carries cross-engine e2e risk — note CSS-touching fixes so the operator
watches e2e.

Produce your synthesis as your FINAL ANSWER in EXACTLY this structure:

# bronto-ui — round 7 (fresh-lens correctness) synthesis

## Executive verdict
2-4 sentences: how many real, safe-to-fix items; the worst; where they cluster; any that touch
CSS (e2e risk) vs JS/types (lower risk).

## Scorecard
Table: | Lens | Grade | # SAFE-FIX (HIGH/MED) | Worst item | — one row per report + Overall.

## Confirmed SAFE-FIX — the fix list (severity × confidence, ranked)
Deduped, ranked. For EACH: **[P#] [conf]** `path:line` — issue · failure scenario · fix
direction · (CSS? / JS? / types? / docs?). Group by file/subsystem for DISJOINT batching.

## NEEDS-DESIGN / held
Items whose fix could regress published behaviour or needs a design/API decision (incl. known-held).

## False alarms / non-issues
So we don't "fix" correct-by-design behaviour or re-fix shipped items.

## Recommended fix batching
3-6 DISJOINT fixer batches (by file scope) over the SAFE-FIX items; separate CSS-only batches
(higher e2e risk) from JS/types/docs batches. Each: scope (files) + items.

Evidence-dense, no filler. This is the only artifact the operator reads before dispatching
fixers — precise and self-contained.
