ROUND 8 multi-POV review of `@ponchia/ui` (bronto-ui). Theme: CORRECTNESS — find REAL,
REPRODUCIBLE DEFECTS. READ-ONLY. FRESH angle: the PUBLIC CSS custom-property (theming knob) API
surface as a system.

Your lens: **CSS CUSTOM-PROPERTY / THEMING-KNOB API SURFACE.**
Consumers customize via `--*` custom properties. Sweep the public knob surface across css/ +
tokens/ for API defects:
- Naming collisions with CONSUMERS: overly-generic public property names likely to clash with a
  consumer's own CSS vars (round 4/5 found `--value`; find more — `--gap`, `--size`, `--color`,
  `--bg`, `--radius`, `--v`, `--t`, `--lo`, `--hi`, etc. used unprefixed as PUBLIC knobs). A
  registered `@property` on a generic name is worst (it hijacks the consumer's type).
- @property registration correctness for public knobs: a `syntax`/`inherits`/`initial-value` that
  mismatches how the knob is actually used, silently rejecting a valid consumer value; a knob that
  SHOULD be typed (`@property`) for animation but isn't, or is typed too narrowly.
- Fallback discipline: a public knob used as `var(--knob)` with NO fallback, so omitting it breaks
  rendering (should degrade); a fallback chain that resolves to the wrong tier.
- Consistency: the same conceptual knob named differently across components; a documented knob
  that doesn't exist (or exists but isn't documented in reference.md/theming.md/classes.json);
  units inconsistent (some expect a number, some a length, some a percentage) without docs.
- Override reachability: a public knob a consumer sets that is overridden by a more-specific
  internal rule (so setting it does nothing) — verify the documented knob actually takes effect.
- Skin/colorway knobs: do the re-skin knobs (`--accent` etc.) actually flow to every component
  that should follow them, or do some hard-code a value?

Give a concrete "consumer sets/omits knob X → collision/no-effect/rejected/broken" for each.

--- OUTPUT CONTRACT ---
READ-ONLY. REAL, REPRODUCIBLE DEFECTS only. FINAL ANSWER exactly:

# CSS custom-property API surface — bronto-ui round 8 review
**Verdict:** one paragraph.
## Confirmed defects
- **[P0/P1/P2/P3] [conf HIGH/MED/LOW]** `path:line` — defect.
  - Failure scenario: consumer knob usage → collision/no-effect/rejected.
  - Fix direction: minimal fix (note if a rename/registration change is a BREAKING public-API
    change → then NEEDS-DESIGN). Mark SAFE-FIX vs NEEDS-DESIGN · (CSS?/docs?).
## Lower-confidence / needs-repro
- bullets.
## Notable (not a bug)
- worth knowing.
Evidence-dense; defects only; no restating this prompt.
