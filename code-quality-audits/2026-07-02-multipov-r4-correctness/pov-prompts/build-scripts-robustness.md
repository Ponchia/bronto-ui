ROUND 4 multi-POV review of `@ponchia/ui` (bronto-ui). Theme: CORRECTNESS & ROBUSTNESS — hunt
REAL, REPRODUCIBLE DEFECTS. READ-ONLY.

Your lens: **BUILD / GENERATION / SCRIPT ROBUSTNESS.**
Hunt actual bugs in scripts/*.mjs and scripts/lib/*.mjs (the ~90-file gen-*/check-*/audit-*
system + shared libs):
- Non-determinism: output order that depends on `Object.keys`/filesystem/`Set` iteration/locale,
  making generated artifacts unstable → spurious check:fresh failures.
- Crash-on-odd-input / unhandled edge cases: empty file, missing file, malformed token, a
  primitive with no doc, a path with spaces/unicode; `JSON.parse` without try/catch on
  potentially-bad input; regex that can catastrophically backtrack (ReDoS) on real input.
- Path/encoding handling: non-POSIX path assumptions, `__dirname`/import.meta.url mistakes,
  reading with wrong encoding, `readdir` without filtering dirs.
- Logic bugs in the CHECK gates themselves: a check that passes when it should fail (false
  negative — the worst kind, since it gives false confidence) or fails spuriously.
- The round-2 advisory scripts (scripts/audit-selectors.mjs, scripts/audit-behavior-exports.mjs):
  correctness of their allowlist/matching logic.
- Error handling / exit codes: a script that swallows an error and exits 0, or reports success
  on partial completion.

Trace each; note whether it's a real failure mode or theoretical.

--- OUTPUT CONTRACT ---
READ-ONLY. REAL, REPRODUCIBLE DEFECTS only. Trace before reporting; unsure → confidence LOW.
FINAL ANSWER exactly:

# Build / scripts robustness — bronto-ui correctness review
**Verdict:** one paragraph.
## Confirmed defects
- **[P0/P1/P2/P3] [conf HIGH/MED/LOW]** `path:line` — defect.
  - Failure scenario: concrete input/state → wrong output/crash/false-pass.
  - Fix direction: minimal correct fix.
## Lower-confidence / needs-repro
- bullets.
## Notable (not a bug)
- worth knowing.
Evidence-dense; defects only; no restating this prompt.
