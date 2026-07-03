# CSS custom-property API surface — bronto-ui round 8 review
**Verdict:** Confirmed defects are concentrated in short, inherited geometry knobs. The worst cases are `@property` registrations on generic names, because importing an opt-in report leaf globally changes the type contract of a consumer’s unrelated CSS variables. The default bundle also exposes unregistered one-letter knobs whose fallbacks are bypassed by inherited consumer variables.

## Confirmed defects
- **[P2] [conf HIGH]** `css/interval.css:13` — `@property --lo` / `--hi` globally registers very generic consumer names as `<number>`.
  - Failure scenario: consumer imports `@ponchia/ui/css/report-kit.css` and already uses `--hi: 3rem` / `--lo: 0.25rem` for its own layout tokens; those declarations are rejected after registration, so `var(--hi)` / `var(--lo)` in unrelated consumer CSS resolves to inherited/initial numeric values instead of the consumer’s length.
  - Fix direction: SAFE-FIX · CSS: remove generic registrations, or register namespaced internal props fed from unregistered legacy aliases. A public rename of `--lo`/`--hi` would be NEEDS-DESIGN.

- **[P2] [conf HIGH]** `css/bullet.css:36` — `@property --t` globally registers a one-letter public knob as `<number>`.
  - Failure scenario: consumer imports `@ponchia/ui/css/bullet.css` or `report-kit.css` and uses `--t: 250ms` for its own transition timing or `--t: 50%` for its own transform math; the declaration is rejected globally and unrelated `var(--t)` call sites stop seeing the consumer value.
  - Fix direction: SAFE-FIX · CSS: remove the generic registration or move typing to a namespaced internal property. Renaming the public bullet knob is NEEDS-DESIGN.

- **[P3] [conf HIGH]** `css/dots.css:451` — default-bundle `--v` relies on `var(--v, 0)`, but inherited consumer `--v` values bypass the fallback.
  - Failure scenario: consumer has `:root { --v: 12px; }` for its own vertical sizing; a `.ui-dotgauge` without local `--v` no longer defaults to `0`, and the conic-gradient math becomes invalid or paints the wrong gauge. Same inherited short-name risk appears in `spark`, `bullet`, and `interval` value geometry.
  - Fix direction: SAFE-FIX · CSS: set component-local defaults on the actual value hosts (`.ui-dotgauge`, `.ui-spark__bar`, `.ui-bullet__measure`, `.ui-interval__point`) so unrelated inherited `--v` cannot leak in. A rename is NEEDS-DESIGN.

- **[P3] [conf HIGH]** `css/motion.css:189` — default-bundle `--i` is an inherited one-letter index knob.
  - Failure scenario: consumer defines `:root { --i: 4; }` for its own index/iteration styling; every `.ui-stagger > *` without a local `--i` now gets a 240ms delay instead of the intended `0ms`. The same collision affects dot-matrix reveal cells at `css/dots.css:96`.
  - Fix direction: SAFE-FIX · CSS: set local `--i: 0` defaults on the affected component parts or introduce namespaced aliases while preserving inline `--i` compatibility.

## Lower-confidence / needs-repro
- None.

## Notable (not a bug)
- Short legacy theme tokens such as `--bg`, `--panel`, `--line`, and `--accent` are documented as permanent aliases in `docs/theming.md`; I did not count their generic naming alone as a defect.