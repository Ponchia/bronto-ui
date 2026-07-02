# CSS correctness & cross-browser — bronto-ui correctness review
**Verdict:** The CSS is mostly solid for the stated evergreen floor; the modern features are generally gated or intentionally baseline-bound. Worst confirmed issues are global `@property` overreach and RTL/logical-axis geometry bugs.

## Confirmed defects
- **[P2] [conf HIGH]** `css/feedback.css:13` — Global registration of generic `--value` can break host CSS outside Bronto.
  - Failure scenario: Chrome/Firefox/Safari with `@ponchia/ui` loaded; a consumer uses `style="--value: 50%"` and `.bar { inline-size: var(--value); }`. The registered `<number>` rejects `50%`, falls back to `0`, and the bar collapses.
  - Fix direction: Use a prefixed Bronto-specific typed property, or remove the global registration of `--value`.

- **[P2] [conf HIGH]** `css/bullet.css:46` — RTL bullet graph bands do not mirror with the value axis.
  - Failure scenario: In `dir="rtl"`, measure/target use `inset-inline-start` from the right, but the band gradient remains `to right`; values are read against reversed qualitative bands. The target tick at line 91 also shifts the wrong way.
  - Fix direction: Add an RTL `to left` gradient and mirror target `translateX`, or make the whole bullet axis consistently physical LTR.

- **[P2] [conf HIGH]** `css/feedback.css:329` — Tooltip centering breaks in RTL.
  - Failure scenario: In `dir="rtl"`, `inset-inline-start: 50%` anchors the bubble’s right edge at center, then `translate(-50%, …)` moves it left again; the bubble center lands about one bubble-width left of the trigger.
  - Fix direction: Use physical `left: 50%` for visual centering, or mirror the transform in RTL.

- **[P3] [conf HIGH]** `css/interval.css:64` — RTL interval point is offset from its value.
  - Failure scenario: In `dir="rtl"`, `inset-inline-start` anchors from the right, but `translate(-50%, -50%)` still moves left; a point at `--v: 0` is inset by roughly its full diameter instead of centered on the endpoint.
  - Fix direction: Mirror the X translate in RTL.

- **[P3] [conf MED]** `css/dots.css:508` — Dotfit container query uses physical `width` with an `inline-size` container.
  - Failure scenario: In vertical writing mode, `.ui-dotfit` tracks inline-size, but `(width < 18rem)` tests the physical axis; densification can fail for a narrow inline axis.
  - Fix direction: Use `(inline-size < 18rem)` / `(max-inline-size: 18rem)`.

## Lower-confidence / needs-repro
- `css/marks.css:33` — WebKit may still require `-webkit-box-decoration-break: clone`; if so, wrapped `.ui-mark` highlights do not clone padding/background across lines.

## Notable (not a bug)
- Direct public `./css/*.css` exports point at generated layered `dist/css/*.css`; raw unlayered leaves are explicit under `./css/unlayered/*`.
- `::details-content`, scroll timelines, and `@starting-style` uses looked intentionally gated/progressive rather than fallback bugs.