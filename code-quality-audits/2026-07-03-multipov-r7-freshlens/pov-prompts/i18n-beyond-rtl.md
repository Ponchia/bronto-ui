ROUND 7 multi-POV review of `@ponchia/ui` (bronto-ui). Theme: CORRECTNESS — find REAL,
REPRODUCIBLE DEFECTS. READ-ONLY. FRESH angle: internationalization BEYOND the RTL basics round 4
already fixed.

Your lens: **INTERNATIONALIZATION (bidi, vertical/CJK, lang, locale).**
Hunt i18n correctness bugs (round 4 fixed several RTL geometry cases — go beyond):
- Logical-property COMPLETENESS: remaining physical properties (`left/right/top/bottom`,
  `margin-left`, `padding-right`, `text-align:left/right`, `float`, physical `border-*`,
  `transform: translateX`) that should be logical, causing RTL/vertical breakage. Sweep css/ for
  physical props on directional layout.
- Vertical / CJK writing modes (`writing-mode: vertical-*`): components that assume horizontal
  flow — fixed heights, physical dimensions, container queries testing the wrong axis, icons/
  arrows that don't rotate, line-based grammar (code/diff/toc/tree) in vertical text.
- Bidi text: mixed LTR/RTL runs — isolation (`unicode-bidi`/`dir`), punctuation/number direction,
  truncation/ellipsis on bidi, the command/combobox/search inputs with RTL input.
- Lang-sensitivity: hyphenation/`hyphens`, quotation marks (`q`/`::before` hard-coded quotes),
  `text-transform` that breaks in some locales (Turkish i), letter-spacing on cursive scripts.
- JS locale assumptions in behaviors/recipes: any string compare/sort/format that assumes a
  locale, `toLowerCase()` without locale, hard-coded separators, number/percent formatting.
- Content that assumes English (aria-label defaults, visually-hidden text, the `novalidate`/error
  strings) — hard-coded user-facing English a consumer can't localize.

Give a concrete "in locale/mode X, component Y breaks" for each.

--- OUTPUT CONTRACT ---
READ-ONLY. REAL, REPRODUCIBLE DEFECTS only. FINAL ANSWER exactly:

# i18n beyond RTL — bronto-ui round 7 review
**Verdict:** one paragraph.
## Confirmed defects
- **[P0/P1/P2/P3] [conf HIGH/MED/LOW]** `path:line` — defect.
  - Failure scenario: locale/writing-mode/bidi → broken.
  - Fix direction: minimal fix. Mark SAFE-FIX vs NEEDS-DESIGN.
## Lower-confidence / needs-repro
- bullets.
## Notable (not a bug)
- worth knowing.
Evidence-dense; defects only; no restating this prompt.
