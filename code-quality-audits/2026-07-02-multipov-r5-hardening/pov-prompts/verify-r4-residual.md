ROUND 5 multi-POV review of `@ponchia/ui` (bronto-ui). Theme: CORRECTNESS — VERIFY & TRIAGE
round-4 residuals. READ-ONLY.

Your lens: **VERIFY ROUND-4 RESIDUALS + PROBE THE HELD ITEMS.**
Round 4 confirmed 23 defects (now fixed) but left LOWER-CONFIDENCE items and NEEDS-DESIGN items.
Your job: for EACH item below, trace the current code and decide: (a) REAL defect (confirm with a
concrete repro + a SAFE-FIX direction), (b) FALSE ALARM (explain why it's correct), or (c)
genuinely NEEDS-DESIGN (state the smallest SAFE partial improvement, if any).

LOWER-CONFIDENCE (verify each):
- css/marks.css:33 — WebKit may need `-webkit-box-decoration-break: clone`; wrapped `.ui-mark`
  highlights failing to clone padding/background across line wraps.
- behaviors/dialog.js:96 — cleanup removes the native `<dialog>` close focus-restorer before
  `dlg.close()`, so focus may be left inside a closed dialog.
- behaviors/forms.js — required RADIO groups may duplicate error-summary entries (one per radio in
  the same named group) after round 4's summary-label change.
- scripts/check-release.mjs / scripts/changelog-section.mjs — changelog heading `includes`
  matching could let `0.6.0-rc.1` satisfy/shadow `0.6.0`.
- css/interval.css / css/bullet.css — boundary markers at 0|1 bleed half a marker outside the
  track (maybe intentional scale-boundary rendering).
- css/spark.css / css/bullet.css / css/interval.css — out-of-contract normalized values (<0 or >1)
  overflow/collapse (docs require 0..1 — is a defensive clamp warranted?).
- qwik/index.d.ts — Qwik types accept plain-function option resolvers even though Qwik
  serialization may reject captured functions.

HELD / NEEDS-DESIGN (probe for the smallest SAFE partial fix, if any exists without breaking the
public API — else confirm it must stay design-track):
- css/feedback.css:13 — global `--value` `@property` collides with consumers' `--value` (it IS a
  documented public knob, so a rename breaks consumers). Is there ANY non-breaking mitigation
  (e.g. a documented caveat, an `@supports` guard, an additional accepted syntax)?
- behaviors/modal.js — stacked controlled modals can leave the top modal inert.
- css/figure.css — annotation overlays size to the reserved stage, not the rendered media.
- css/dataviz.css — chart pattern ink is too low-contrast on some fills.
- react/index.js — hook ignores changed options / late refs (fix needs a public `deps` API).

--- OUTPUT CONTRACT ---
READ-ONLY. For EACH item: a verdict. FINAL ANSWER exactly:

# Verify round-4 residuals — bronto-ui round 5 review
**Verdict:** one paragraph — how many residuals are real & safe to fix now.
## Confirmed SAFE-FIX (do now)
- **[P#] [conf]** `path:line` — defect · failure scenario · minimal safe fix.
## False alarms (do NOT change)
- item — why it's correct-by-design.
## Still NEEDS-DESIGN (with smallest safe partial, if any)
- item — the safe partial (or "none; must stay design-track") + why.
Evidence-dense; no restating this prompt.
