ROUND 7 multi-POV review of `@ponchia/ui` (bronto-ui). Theme: CORRECTNESS — find REAL,
REPRODUCIBLE DEFECTS. READ-ONLY. FRESH angle: the TypeScript consumer experience.

Your lens: **TYPESCRIPT / TYPED-API CONSUMER DX.**
Put yourself in a strict-mode TS consumer's seat and hunt TYPE-level defects (the shipped types
are generated from JSDoc → check the JSDoc source + the emitted `.d.ts`):
- Imprecise/loose public types: `any`/`unknown`/`object`/`string` where a literal union or precise
  type is knowable; a recipe option typed `string` when only a fixed set is valid; a return type
  wider than reality. Check classes/index.js recipes + their `.d.ts`, tokens/*.d.ts, the adapters'
  `.d.ts`, behaviors public exports.
- Wrong types: a JSDoc `@param`/`@returns`/`@typedef` that contradicts the implementation; an
  optional that should be required (or vice-versa); a nullable not marked; a union missing a real
  member or including an impossible one.
- Generic/inference failures: an adapter/hook/recipe where TS can't infer the option type, or a
  generic default that erases precision (round 1-4 touched adapter generics — look for remaining).
- Export/module typing: `exports` subpath `types` conditions that resolve to the wrong/missing
  `.d.ts`; `attw` (Are-The-Types-Wrong) style dual-package/ESM issues; a public value with no type.
- DX traps: an API that type-checks but is easy to misuse; missing `readonly`/`as const`; an enum
  of magic strings a consumer must guess.

For each, give the concrete "a TS consumer writing X gets wrong/missing type Y".

--- OUTPUT CONTRACT ---
READ-ONLY. REAL, REPRODUCIBLE type defects only; trace JSDoc↔impl↔.d.ts. FINAL ANSWER exactly:

# TypeScript / typed-API DX — bronto-ui round 7 review
**Verdict:** one paragraph.
## Confirmed defects
- **[P0/P1/P2/P3] [conf HIGH/MED/LOW]** `path:line` — defect.
  - Failure scenario: consumer code → wrong/missing type.
  - Fix direction: minimal fix (usually a JSDoc change; note the generated .d.ts regenerates).
    Mark SAFE-FIX vs NEEDS-DESIGN.
## Lower-confidence / needs-repro
- bullets.
## Notable (not a bug)
- worth knowing.
Evidence-dense; defects only; no restating this prompt.
