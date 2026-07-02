# Motion / reduced-motion — bronto-ui round 6 review
**Verdict:** Reduced-motion coverage is mostly strong in the default bundle, but I found real motion defects in carousel timing, dialog close coordination, tooltip transition wiring, and layout-property animations.

## Confirmed defects
- **[P2] [conf HIGH]** `behaviors/carousel.js:188` — reduced-motion makes carousel scroll instant, but JS still suppresses IntersectionObserver updates for 500 ms.
  - Failure scenario: `prefers-reduced-motion: reduce` → click Next, then immediately swipe/scroll the carousel → the real user scroll is ignored and status/thumb state can stay stale.
  - Fix direction: skip or sharply shorten `holdProgrammatic()` when computed `scroll-behavior` is `auto`/reduced; prefer `scrollend` with fallback. SAFE-FIX.

- **[P2] [conf MED]** `css/overlay.css:95` — modal scroll lock is tied to `[open]`, but close exit motion keeps the dialog/backdrop visually present after `[open]` is removed.
  - Failure scenario: normal motion → close a scrollable-page dialog → during the fade-out, background overflow is already unlocked and focus is restored by `behaviors/dialog.js:40`.
  - Fix direction: add a closing state held through `transitionend` plus fallback, or make native dialog close snap if scroll/focus cannot be held. NEEDS-DESIGN.

- **[P3] [conf HIGH]** `css/feedback.css:337` — tooltip changes `transform` on hover/focus, but only `opacity` transitions.
  - Failure scenario: hover/focus tooltip → bubble jumps vertically by 4px instantly, then only opacity fades.
  - Fix direction: include `transform` in the transition, with reduced-motion still collapsing via the existing reset. SAFE-FIX.

- **[P3] [conf HIGH]** `css/spotlight.css:42` — spotlight animates `inline-size` and `block-size` while also repainting a `100vmax` box-shadow mask.
  - Failure scenario: tour target changes or page scroll repositions spotlight → hole size animation forces layout/paint instead of compositor-only motion.
  - Fix direction: animate transform/opacity only, or snap size and only translate; redesign mask if smooth resize is required. SAFE-FIX.

- **[P3] [conf HIGH]** `css/motion.css:133` — indeterminate progress animates `inset-inline-start` every frame.
  - Failure scenario: `.ui-progress--indeterminate` active in a loading panel → infinite layout-position animation instead of compositor transform.
  - Fix direction: keep the bar positioned once and animate `transform: translateX(...)`; preserve the reduced-motion hatch. SAFE-FIX.

## Lower-confidence / needs-repro
- `css/feedback.css:394` + `behaviors/popover.js:135` — allow-discrete popover exit may leave a visually closing fallback popover pointer-interactive after JS has set `openPanel = null`.
- `css/motion.css:112` / `css/motion.css:256` — skeleton shimmer animates `background-position`; likely paint-heavy with many placeholders, but needs perf trace to rank.

## Notable (not a bug)
- Default-bundle reduced-motion reset in `css/motion.css:381` is broad and intentionally uses `!important`.
- Scroll/view timelines and view-transition pseudos are explicitly gated or killed under reduced motion.
- Analytical draw/reveal animations in annotations/connectors/marks are guarded by `prefers-reduced-motion: no-preference`.