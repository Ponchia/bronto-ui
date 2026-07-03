ROUND 8 multi-POV review of `@ponchia/ui` (bronto-ui). Theme: CORRECTNESS — find REAL,
REPRODUCIBLE DEFECTS. READ-ONLY. FRESH angle: the custom-EVENT contract (never audited as a
system).

Your lens: **CUSTOM EVENT API (`bronto:*`) CONTRACT.**
Behaviors emit `bronto:*` CustomEvents consumers listen to. Sweep behaviors/ for event-contract
defects:
- Naming consistency: are event names consistent (`bronto:themechange` vs `bronto:splitter:resize`
  — colon vs no-colon, tense, namespacing)? An inconsistent scheme makes the API hard to use and
  is a real DX defect. Map every emitted event.
- Payload correctness: does `event.detail` carry what a consumer needs, with correct/complete
  data? A detail that's missing a field, wrong value, stale, or undefined. A payload documented
  but not emitted (or vice-versa).
- Bubbling / cancelable / composed: is each event `bubbles` (so delegation works) where it should
  be, `cancelable` where the consumer should be able to `preventDefault`, `composed` if it must
  cross shadow boundaries? An event that DOESN'T bubble but is documented as delegable; a
  cancelable event whose `preventDefault` is ignored by the behavior.
- Timing: is the event dispatched at the right moment (after state is committed, not before)?
  Does the behavior read its own event handlers re-entrantly?
- Dispatch target: dispatched on the right element (the host, not document) so listeners attach
  predictably; a fresh CustomEvent per dispatch (not reused).
- Documentation/contract drift: events emitted but NOT in docs/reference/classes.json, or
  documented events that don't fire. Cross-check against docs + gen-classes-json.mjs.
- Cleanup: are dispatched-event listeners the behavior itself adds removed on teardown?

Give a concrete "consumer listens for X → gets wrong name/payload/timing/no-bubble" for each.

--- OUTPUT CONTRACT ---
READ-ONLY. REAL, REPRODUCIBLE DEFECTS only. Map the events before asserting. FINAL ANSWER exactly:

# Custom event API contract — bronto-ui round 8 review
**Verdict:** one paragraph.
## Confirmed defects
- **[P0/P1/P2/P3] [conf HIGH/MED/LOW]** `path:line` — defect.
  - Failure scenario: consumer listens → wrong name/payload/timing/bubble.
  - Fix direction: minimal fix (note if changing an emitted event name/shape is a BREAKING public
    change → NEEDS-DESIGN). Mark SAFE-FIX vs NEEDS-DESIGN · (JS?/docs?).
## Lower-confidence / needs-repro
- bullets.
## Notable (not a bug)
- worth knowing.
Evidence-dense; defects only; no restating this prompt.
