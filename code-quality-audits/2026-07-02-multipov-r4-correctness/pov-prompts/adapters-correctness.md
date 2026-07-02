ROUND 4 multi-POV review of `@ponchia/ui` (bronto-ui). Theme: CORRECTNESS & ROBUSTNESS — hunt
REAL, REPRODUCIBLE DEFECTS. READ-ONLY.

Your lens: **FRAMEWORK ADAPTERS — real per-framework bugs.**
The adapters (react/ solid/ qwik/ svelte/ vue/) are thin wrappers over the vanilla behaviors.
Hunt actual defects:
- React: stale closures, missing/incorrect `useEffect` deps causing a real bug, cleanup not
  returned/registered, double-invoke under StrictMode, SSR (`useEffect` won't run server-side —
  is anything relied on that breaks?), ref timing (ref null on first effect).
  NOTE: round 1 REVERTED a change that re-ran the effect every commit (per-render churn). Assess
  whether there is a GENUINE bug where late refs / changed options are silently ignored, and if
  so what the CORRECT (non-churny) fix is (e.g. a proper deps array) — with a concrete repro.
- Solid: `onMount` vs reactivity — is a signal-backed root/options case genuinely broken?
  `onCleanup` registration correctness.
- Qwik: `useVisibleTask$` cleanup + serialization constraints; the non-QRL shared helper.
- Svelte: action `update`/`destroy` correctness; does changing the action parameter re-apply?
- Vue: directive `mounted`/`updated`/`unmounted` correctness; `onScopeDispose`.
- Cross-framework: does the SAME public API actually behave the same in all five? Any adapter
  that leaks or fails to clean up where the others don't?

Give a concrete framework + scenario + wrong-behaviour for each defect.

--- OUTPUT CONTRACT ---
READ-ONLY. REAL, REPRODUCIBLE DEFECTS only. Trace before reporting; unsure → confidence LOW.
FINAL ANSWER exactly:

# Framework adapters — bronto-ui correctness review
**Verdict:** one paragraph.
## Confirmed defects
- **[P0/P1/P2/P3] [conf HIGH/MED/LOW]** `path:line` — framework + defect.
  - Failure scenario: concrete steps → wrong behaviour/leak.
  - Fix direction: minimal correct fix (idiomatic to that framework; no per-render churn).
## Lower-confidence / needs-repro
- bullets.
## Notable (not a bug)
- worth knowing.
Evidence-dense; defects only; no restating this prompt.
