# CSS cascade / @layer edge cases — bronto-ui round 9 review
**Verdict:** Layer ordering and dist assembly look sound: `check:dist` passes, and generated `dist/*.css` files are single `@layer bronto` wrappers. The confirmed cascade defects are global `@property` registrations: layer wrapping does not scope property registration, so generic Bronto custom-property names can invalidate unrelated consumer CSS even when the consumer writes normal unlayered rules.

## Confirmed defects
- **[P2] [conf HIGH]** `css/feedback.css:13` — global `@property --value` in the default bundle types a generic host variable as `<number>`.
  - Failure scenario: consumer CSS → `@import '@ponchia/ui'; .bar { --value: 50%; inline-size: var(--value); }` collapses to `0` because Bronto’s registration rejects `50%`; unlayered CSS cannot out-cascade a global property registration.
  - Fix direction: SAFE-FIX · CSS: register an internal namespaced property such as `--bronto-value`, feed it from the public unregistered `--value`, and keep the current invalid-percent guard inside Bronto fills.

- **[P2] [conf HIGH]** `css/interval.css:13` — opt-in `@property --lo` / `--hi` globally types very generic names as `<number>`.
  - Failure scenario: consumer CSS → `@import '@ponchia/ui/css/report-kit.css'; .panel { --hi: 3rem; inline-size: var(--hi); }` resolves `--hi` to registered initial `1`, so `inline-size` becomes invalid/auto instead of `3rem`.
  - Fix direction: SAFE-FIX · CSS: register namespaced internal interval props and map from public unregistered `--lo` / `--hi`; keep public names as aliases.

- **[P2] [conf HIGH]** `css/bullet.css:36` — opt-in `@property --t` globally reserves a one-letter consumer variable as `<number>`.
  - Failure scenario: consumer CSS → `@import '@ponchia/ui/css/bullet.css'; .thing { --t: 250ms; transition-duration: var(--t); }` computes as registered initial `0`, killing the transition.
  - Fix direction: SAFE-FIX · CSS: move the typed registration to a namespaced internal target prop and feed it from unregistered public `--t`.

## Lower-confidence / needs-repro
- None.

## Notable (not a bug)
- `@layer bronto` order is stable in `css/core.css`, and `dist/bronto.css` plus `dist/css/*` preserve single-layer semantics.
- Layered `!important` rules do beat normal unlayered consumer CSS, but README documents this as a print/reduced-motion media-boundary carve-out.
- Consumer CSS in its own layer only wins if its layer is ordered after `bronto`; unlayered consumer CSS still wins normal declarations regardless of source order.