You are the SYNTHESIZER for ROUND 3 (DOCUMENTATION & INFORMATION ARCHITECTURE) of a multi-POV
review of `@ponchia/ui` (bronto-ui). Seven independent reviewers each analyzed the
consumer-facing documentation from one angle and left a report in the CURRENT DIRECTORY.
READ-ONLY. Rounds 1 (broad docs-product) and 2 (repo structure/navigation) are done — this
round is CONSUMER-FACING documentation QUALITY, ACCURACY-vs-code, and IA.

Read ALL seven reports in the current directory:
- reference-accuracy.report.md        (docs vs code drift)
- getting-started.report.md           (onboarding: install → first success)
- docs-ia-diataxis.report.md          (IA, Diátaxis balance, findability, cross-linking)
- llms-txt-machine.report.md          (the llms.txt machine-consumption surface)
- conceptual-explanatory.report.md    (the "why" / mental-model docs)
- examples-demos-teaching.report.md   (examples/ + demo/ as teaching artifacts)
- per-primitive-and-hygiene.report.md (the ~40 per-primitive how-tos + changelog/hygiene/governance)

If any file is missing/empty, note it and synthesize from the rest — do not fabricate. Do NOT
re-analyze the source; merge, de-duplicate, reconcile, and rank what the panel found. Preserve
path citations.

Produce your synthesis as your FINAL ANSWER in EXACTLY this Markdown structure:

# bronto-ui — round 3 (documentation & IA) synthesis

## Executive verdict
2–4 sentences: the panel's collective read on the DOCUMENTATION — is it accurate, navigable,
and teachable; where is the debt. Be direct.

## Scorecard
Table: | Lens | Grade | One-line takeaway | — one row per report + an **Overall** row.

## Cross-cutting themes
The 3–6 things MULTIPLE reviewers independently surfaced (agreement = signal): the theme, which
lenses raised it, why it matters for a reader/consumer.

## Consolidated findings (severity-ranked)
De-duplicated, merged across reports, P0 → P3. For each: `[P#]`, one-line description, the
lens(es), and path evidence. Prioritize DOC-vs-CODE ACCURACY problems (a wrong doc is worse
than a missing one) — call those out explicitly.

## Top recommendations (highest leverage first)
5–8 ranked, concrete, actionable. For each, note which lenses motivate it AND a
safe-mechanical (fix wording / add a link / correct a snippet) vs needs-writing (author new
tutorial/explanation) tag — this feeds the round-3 fixer fan-out.

## Documentation strengths worth preserving
The genuine doc strengths a rewrite must not lose.

## Tensions & disagreements
Where reviewers pulled in different directions (e.g. completeness vs conciseness, generated vs
authored docs, breadth of per-primitive docs vs a guided path). Surface honestly.

Evidence-dense, no filler, no restating this prompt. This is the only artifact the operator
reads for round 3 — make it complete and self-contained.
