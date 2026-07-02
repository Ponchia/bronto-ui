# Verify round-4 residuals — bronto-ui round 5 review
**Verdict:** 4 residuals are real and safe to fix now: WebKit mark wrapping, dialog cleanup focus restore, radio-summary dedupe, and exact changelog heading matching.

## Confirmed SAFE-FIX (do now)
- **[P3] [high]** `css/marks.css:33` — defect · Safari/WebKit still needs `-webkit-box-decoration-break` for inline clone behavior; wrapped `.ui-mark` can slice padding/background despite the unprefixed rule. Add prefixed declaration before `box-decoration-break`; MDN’s example uses both.
- **[P2] [high]** `behaviors/dialog.js:96` — defect · cleanup removes `restoreFocus` before `dlg.close()`, so an open dialog closed during cleanup leaves focus on the inside control. Repro observed: active element stayed `#inside` after cleanup. Close while listener is still attached, or explicitly call the restorer after successful close.
- **[P2] [high]** `behaviors/forms.js:267` — defect · required same-name radio groups produce one invalid control per radio, and `refreshSummary()` maps all of them. Repro observed 2 summary links: `Basic` and `Pro`. Deduplicate summary entries by radio `form + name`, focus/link the first radio, and prefer group legend text for the summary label.
- **[P2] [high]** `scripts/check-release.mjs:41` / `scripts/changelog-section.mjs:28` — defect · `includes(target)` lets heading `0.6.0-rc.1` satisfy stable `0.6.0`; release notes can also select the rc section first. Match an exact SemVer heading token, e.g. escaped target with non-semver-char boundaries.

## False alarms (do NOT change)
- `css/interval.css:62` / `css/bullet.css:98` — boundary marker half-bleed is correct-by-design: the marker center is the normalized endpoint. Pulling it fully inside would misrepresent `0` and `1`; RTL transforms already mirror the centerline.
- `css/spark.css:27` / `css/bullet.css:72` / `css/interval.css:48` — out-of-contract `<0` / `>1` values are producer bugs by documented contract. These primitives explicitly require host-normalized `0..1`; defensive CSS clamping would mask scale bugs and change invalid-input behavior.

## Still NEEDS-DESIGN (with smallest safe partial, if any)
- `qwik/index.d.ts:37` — safe partial: narrow/document Qwik-safe roots to signals/plain objects and warn against function resolvers; full fix needs a Qwik-specific public type story around QRL/serialization, not the React resolver shape.
- `css/feedback.css:13` — safe partial: add a namespaced alias such as `--bronto-value` plus a caveat/deprecation note. None fully removes the collision while `@property --value` remains registered globally.
- `behaviors/modal.js:107` — safe partial: add the sibling-portal stacked-modal repro test and dev warning. Real repro: both sibling modals ended `inert=true`, including the top modal. Full fix needs Bronto-owned inert ownership/ref-counting.
- `css/figure.css:65` — safe partial: document overlay coordinates are stage coordinates and warn against reserved-stage overlays unless media fills the stage. Sizing overlay to rendered media needs a new wrapper/coordinate contract.
- `css/dataviz.css:39` — safe partial: add contrast docs/gate for pattern ink. Measured pattern-on-fill ratios are as low as 1.11–2.79, so a single theme-global ink cannot solve all fills; likely needs per-series ink tokens.
- `react/index.js:104` — safe partial: document “runs once after mount” and late-ref limitations. Correct re-init needs an explicit public `deps` API to avoid accidental listener churn.