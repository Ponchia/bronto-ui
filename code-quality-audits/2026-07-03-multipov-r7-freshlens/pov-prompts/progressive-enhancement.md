ROUND 7 multi-POV review of `@ponchia/ui` (bronto-ui). Theme: CORRECTNESS — find REAL,
REPRODUCIBLE DEFECTS. READ-ONLY. FRESH angle: progressive enhancement / no-JS / feature support.

Your lens: **PROGRESSIVE ENHANCEMENT, NO-JS & FEATURE DETECTION.**
The library markets tiers: "CSS-native (works with JS off)", print/PDF (no JS), and a thin
behavior layer. Verify those claims + graceful degradation:
- No-JS accuracy: for every component DOCUMENTED as CSS-native/works-without-JS, confirm it
  actually is (details/summary disclosure, CSS-only reveals like clamp show-more, checkbox/label
  patterns). Find any component claimed no-JS that actually REQUIRES the behavior to be usable or
  accessible. Cross-check docs claims vs the CSS + markup.
- Behavior-required-but-not-obvious: a component that renders but is INOPERABLE or a11y-broken
  until its init runs (no fallback, no visible affordance) — and whether that's honestly documented.
- Feature detection & fallbacks: modern CSS used without an `@supports` fallback where the feature
  isn't universally supported at the stated browser floor — `:has()`, `color-mix()`,
  `@starting-style`, `::target-text`, CSS Custom Highlight API (highlights.css), Custom Highlight/
  `::highlight()`, container queries, `field-sizing`, `text-wrap: balance/pretty`, `@property`,
  scroll-driven animations. A missing fallback = broken, not degraded.
- JS feature detection: behaviors using a browser API (`Popover API`, `inert`, `dialog`,
  ResizeObserver, `scrollend`, `matchMedia`, CSS Highlight) without a guard/fallback → throws or
  silently no-ops on an in-floor browser.
- The "load one stylesheet" promise: does any component need MORE than the documented import to
  work/look right (a hidden dependency on another leaf)?

Give a concrete "with JS off / feature X missing, component Y is broken/unusable" for each.

--- OUTPUT CONTRACT ---
READ-ONLY. REAL, REPRODUCIBLE DEFECTS only. FINAL ANSWER exactly:

# Progressive enhancement / no-JS / features — bronto-ui round 7 review
**Verdict:** one paragraph.
## Confirmed defects
- **[P0/P1/P2/P3] [conf HIGH/MED/LOW]** `path:line` — defect.
  - Failure scenario: JS-off / missing feature → broken/unusable.
  - Fix direction: minimal fix (fallback / @supports / doc correction). Mark SAFE-FIX vs NEEDS-DESIGN.
## Lower-confidence / needs-repro
- bullets.
## Notable (not a bug)
- worth knowing.
Evidence-dense; defects only; no restating this prompt.
