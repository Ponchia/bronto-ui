ROUND 5 multi-POV review of `@ponchia/ui` (bronto-ui). Theme: CORRECTNESS & SAFETY — find REAL,
REPRODUCIBLE issues. READ-ONLY.

Your lens: **SECURITY / INJECTION SURFACE (product, not infra).**
Hunt actual client-side safety defects a consumer would inherit:
- DOM-injection sinks in the JS: `innerHTML`, `outerHTML`, `insertAdjacentHTML`,
  `document.write`, `Range.createContextualFragment`, template literals interpolated into HTML,
  or attribute writes of untrusted data — across behaviors/, classes/, connectors/, annotations/,
  the adapters, and especially the DOCS VIEWER `docs/index.html` (it renders markdown — is it
  sanitized? is DOMPurify actually applied to the rendered HTML, and is the markdown/sanitize
  order correct? any `href="javascript:"`/`on*` passthrough?).
- The shiki/highlight path and any code that sets element HTML from doc/user content.
- CSS-based exfiltration/abuse: `url()` to external origins, `@import` of remote resources,
  attribute-selector + `background: url()` leak patterns in shipped css/.
- Prototype-pollution / unsafe merges in option handling (`Object.assign`/spread of
  attacker-influenced objects), `eval`/`new Function`.
- Clickjacking/focus-stealing or `target=_blank` without `rel=noopener` in shipped/demo markup.
NOTE: this is about the PUBLISHED PACKAGE + docs site, not box/infra secrets.

Trace each to a concrete "attacker-controlled X reaches sink Y → effect Z".

--- OUTPUT CONTRACT ---
READ-ONLY. REAL, REPRODUCIBLE issues only. FINAL ANSWER exactly:

# Security / injection surface — bronto-ui round 5 review
**Verdict:** one paragraph.
## Findings
- **[P0/P1/P2/P3] [conf HIGH/MED/LOW]** `path:line` — issue.
  - Failure scenario: attacker input → sink → effect.
  - Fix direction: minimal fix. Mark SAFE-FIX vs NEEDS-DESIGN.
## Lower-confidence / needs-repro
- bullets.
## Notable (not a defect)
- worth knowing.
Evidence-dense; defects only; no restating this prompt.
