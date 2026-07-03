ROUND 9 multi-POV review of `@ponchia/ui` (bronto-ui). Theme: CORRECTNESS — find REAL,
REPRODUCIBLE DEFECTS. READ-ONLY. FRESH angle: numeric parsing/formatting + attribute value parsing.

Your lens: **NUMERIC PARSING, FORMATTING & ATTRIBUTE-VALUE PARSING.**
Hunt bugs where the JS parses/formats numbers or reads attribute/option VALUES (behaviors/,
classes/, connectors/, annotations/, glyphs/):
- Number parsing: `parseInt`/`parseFloat`/`Number(...)`/unary `+` on an attribute or option that
  can be empty/`NaN`/`Infinity`/non-numeric/locale-formatted → is the result validated, or does
  `NaN` flow into `calc()`/aria/style? `parseInt` without radix; `parseInt('08')`; leading/trailing
  units silently dropped or kept wrong.
- Attribute value parsing: `data-*` / `aria-*` values read as strings then compared/mathed — a
  boolean data-attr treated as truthy when present-but-"false"; a value with whitespace;
  case-sensitivity; a comma vs dot decimal; an enum value not in the allowed set (round 6/7 covered
  prototype keys + some ranges — this is the string→number/enum PARSE step).
- Formatting: any number shown to the user (counts, positions, percentages, durations) formatted
  without `Intl.NumberFormat`/locale, or with wrong rounding/precision; a template that concatenates
  a raw number where a formatted one is expected.
- Off-by-one / rounding in index/position math driven by parsed values (carousel index, table row,
  legend/chart index, splitter position) — distinct from round-6 CSS geometry: here it's the JS
  parse+compute.
- Coercion traps: `'' == 0`, `[] == false`, `+''===0`, `Number(null)===0` sneaking a default where
  an explicit value was intended.

Give a concrete "attribute/option value X parses to wrong number/enum → wrong behavior" for each.

--- OUTPUT CONTRACT ---
READ-ONLY. REAL, REPRODUCIBLE DEFECTS only; trace the parse. FINAL ANSWER exactly:

# Numeric parsing / formatting — bronto-ui round 9 review
**Verdict:** one paragraph.
## Confirmed defects
- **[P0/P1/P2/P3] [conf HIGH/MED/LOW]** `path:line` — defect.
  - Failure scenario: input value → wrong parse/format → wrong behavior.
  - Fix direction: minimal fix. Mark SAFE-FIX vs NEEDS-DESIGN · (JS?).
## Lower-confidence / needs-repro
- bullets.
## Notable (not a bug)
- worth knowing.
Evidence-dense; defects only; no restating this prompt.
