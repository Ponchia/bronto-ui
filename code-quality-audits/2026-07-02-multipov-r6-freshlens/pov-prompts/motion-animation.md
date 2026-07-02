ROUND 6 multi-POV review of `@ponchia/ui` (bronto-ui). Theme: CORRECTNESS — find REAL,
REPRODUCIBLE DEFECTS. READ-ONLY. FRESH angle: motion/animation.

Your lens: **MOTION, TRANSITIONS & REDUCED-MOTION CORRECTNESS.**
Hunt animation/transition bugs in css/motion.css + every animated component (overlay, toast,
disclosure, tooltip, spotlight, dialog, command, carousel, skins) and the JS that coordinates
transitions (toast/dialog/disclosure use transitionend/timers):
- `prefers-reduced-motion: reduce` COMPLETENESS: every non-trivial transition/animation must be
  disabled or reduced. Find any animation/`@keyframes`/`transition` NOT covered by a
  reduced-motion guard — a real vestibular-safety gap.
- Transition/JS coordination: `transitionend` that never fires (property doesn't actually
  transition, or is interrupted) leaving a permanent stuck state; a fallback timer mismatched
  with the CSS duration; an element removed mid-transition (round 4 fixed toast — find others).
- `@starting-style`/`transition-behavior: allow-discrete` for entry/exit animations on
  `display`/`popover`/`dialog` — correctness + engine support/fallback.
- GPU vs layout: animations of layout/paint properties (width/height/top/left/margin) that
  should be transform/opacity for perf; missing `will-change` discipline (or overuse leaking
  layers).
- Animation cleanup: `animation-fill-mode`/`forwards` leaving an element in a final state that
  desyncs from JS state; infinite animations not paused when off-screen/hidden.
- Focus/scroll during motion: focus moved before an entry animation completes; scroll-into-view
  fighting a transition.

Give a concrete "with setting/interaction X, animation Y misbehaves" for each.

--- OUTPUT CONTRACT ---
READ-ONLY. REAL, REPRODUCIBLE DEFECTS only. FINAL ANSWER exactly:

# Motion / reduced-motion — bronto-ui round 6 review
**Verdict:** one paragraph.
## Confirmed defects
- **[P0/P1/P2/P3] [conf HIGH/MED/LOW]** `path:line` — defect.
  - Failure scenario: setting/interaction → misbehaving animation.
  - Fix direction: minimal fix. Mark SAFE-FIX vs NEEDS-DESIGN.
## Lower-confidence / needs-repro
- bullets.
## Notable (not a bug)
- worth knowing.
Evidence-dense; defects only; no restating this prompt.
