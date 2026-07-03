You are the SYNTHESIZER for ROUND 8 of a multi-POV review of `@ponchia/ui` (bronto-ui) — a
fresh-lens correctness bug-hunt (report-data-semantics, deep-a11y-screenreader, focus-management,
css-custom-prop-api, event-api-contract). Five reviewers each left a report in the CURRENT
DIRECTORY. READ-ONLY.

Read ALL five:
- report-data-semantics.report.md
- deep-a11y-screenreader.report.md
- focus-management.report.md
- css-custom-prop-api.report.md
- event-api-contract.report.md

If any is missing/empty, note it and synthesize from the rest — do not fabricate. TRIAGE: merge
duplicates, rank by severity × confidence, separate SAFE-FIX from NEEDS-DESIGN, preserve
`path:line` + failure scenario + fix direction. Seven prior rounds fixed a lot — flag any item
duplicating a shipped fix or a KNOWN-HELD contract (--value global prop, modal inert, figure
overlay, svelte/vue generics, combobox/tabs/modal SSR, CSS writing-mode batch, bundle at raw
budget). IMPORTANT: any CSS change carries cross-engine e2e risk AND may exceed the raw bundle
budget (~89kB, near full) — mark CSS-touching fixes explicitly. Renaming a public event name or
CSS custom-property is a BREAKING change → NEEDS-DESIGN.

Produce your synthesis as your FINAL ANSWER in EXACTLY this structure:

# bronto-ui — round 8 (fresh-lens correctness) synthesis

## Executive verdict
2-4 sentences: how many real, safe-to-fix items; the worst; where they cluster; JS/types/docs
(low risk) vs CSS (e2e + budget risk).

## Scorecard
Table: | Lens | Grade | # SAFE-FIX (HIGH/MED) | Worst item | — one row per report + Overall.

## Confirmed SAFE-FIX — the fix list (severity × confidence, ranked)
Deduped, ranked. For EACH: **[P#] [conf]** `path:line` — issue · failure scenario · fix direction
· (CSS?/JS?/docs?). Group by file/subsystem for DISJOINT batching. Explicitly separate
non-CSS (preferred this round) from CSS (held-if-budget/e2e-risk).

## NEEDS-DESIGN / held
Items whose fix could regress published behaviour, break a public event/prop name, or needs a
design decision (incl. known-held).

## False alarms / non-issues
So we don't "fix" correct-by-design behaviour or re-fix shipped items.

## Recommended fix batching
3-6 DISJOINT fixer batches (by file scope) over the SAFE-FIX items; put CSS-only batches last and
flag them as e2e/budget risk. Each: scope (files) + items.

Evidence-dense, no filler. This is the only artifact the operator reads before dispatching
fixers — precise and self-contained.
