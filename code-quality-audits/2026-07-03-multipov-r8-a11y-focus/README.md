# Multi-POV review — Round 8: a11y, focus & API surface (2026-07-03)

Round 8 of the multi-POV series — a fresh-lens bug-hunt: report-data/provenance semantics, deep
screen-reader a11y, system-wide focus management, the CSS custom-property (theming knob) API, and
the `bronto:*` custom-event contract. Five Codex agents + a synthesizer triage. `codex-fan`.

## Verdict

**Overall: A−** — the codebase is solid; **14 SAFE-FIX (13 HIGH)**, one P1 (a closed controlled
non-`<dialog>` modal stays tabbable). Fixes cluster in focus/a11y behavior JS + short CSS
custom-property APIs (several of which are breaking-prop-rename → needs-design). See
[`SYNTHESIS.md`](./SYNTHESIS.md).

## Files

| File | Lens | Grade |
|---|---|---|
| [`SYNTHESIS.md`](./SYNTHESIS.md) | Triaged fix-list + batching | **A−** |
| [`focus-management.md`](./focus-management.md) | System-wide focus management | A |
| [`css-custom-prop-api.md`](./css-custom-prop-api.md) | CSS custom-property / theming-knob API | A |
| [`report-data-semantics.md`](./report-data-semantics.md) | Report data & provenance semantics | A− |
| [`deep-a11y-screenreader.md`](./deep-a11y-screenreader.md) | Screen-reader a11y (announcements/names) | A− |
| [`event-api-contract.md`](./event-api-contract.md) | `bronto:*` custom-event contract | B+ |

Briefs under [`pov-prompts/`](./pov-prompts/). Point-in-time snapshot; citations are the
reviewers' own.
