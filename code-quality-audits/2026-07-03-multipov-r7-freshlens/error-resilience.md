# Error handling / misuse resilience — bronto-ui round 7 review
**Verdict:** Read-only review found several real misuse failures. The worst is `initConnectors()` letting one bad `data-*` enum throw through a batch init after mutating earlier SVGs, which can kill later behavior initializers. The rest are mostly invalid-option/ARIA drift cases where the library produces broken output silently instead of normalizing or warning.

## Confirmed defects
- **[P1] [conf HIGH]** `behaviors/connectors.js:154` — invalid connector markup can throw during init and leave partial generated SVG behind.
  - Failure scenario: consumer has two connectors, first valid and second `data-shape="bogus"` or invalid side; `connectRects()` throws from `connectors/index.js:116`, `initConnectors()` aborts, no cleanup is returned, and the first connector’s generated `.ui-connector__path` remains. Reproduced: throw plus `paths after failed init = 1`.
  - Fix direction: SAFE-FIX. Catch per connector in `draw()`, remove that connector’s generated parts, dev-warn with allowed values, and continue drawing siblings.

- **[P2] [conf HIGH]** `classes/index.js:1098` — `attrs.meter/progress/dotbar` emit invalid ARIA for malformed `min`/`max`.
  - Failure scenario: `attrs.progress(50, { min: 100, max: 0 })` returns `aria-valuenow=0 aria-valuemin=100 aria-valuemax=0`; `attrs.meter(50, { min: "nope", max: 100 })` returns `aria-valuenow=NaN aria-valuemin=NaN`.
  - Fix direction: SAFE-FIX. Validate `min`/`max` with finite checks and `max > min`; fall back to defaults or omit value attrs, with dev warnings for bad ranges.

- **[P2] [conf HIGH]** `behaviors/splitter.js:90` — invalid authored splitter ARIA is kept while internal math silently normalizes it.
  - Failure scenario: `<div class="ui-splitter__handle" aria-valuemin="80" aria-valuemax="20">` initializes to `aria-valuemin=80 aria-valuemax=20 aria-valuenow=80 --splitter-pos:80%`, an impossible separator range.
  - Fix direction: SAFE-FIX. If min/max are non-finite or inverted, normalize the DOM attrs too, or skip enhancement with a dev warning.

- **[P2] [conf HIGH]** `behaviors/toast.js:196` — invalid `duration` creates an undismissable sticky toast with no warning.
  - Failure scenario: `toast("stuck", { duration: -1 })` or `duration: NaN` appends a toast, schedules no timeout, adds no close button, and logs no warning. Reproduced: `toasts=1 closeButtons=0 warns=0`.
  - Fix direction: SAFE-FIX. Coerce `duration` to a finite non-negative number; treat invalid/negative values as default duration or sticky-with-close, and dev-warn.

- **[P2] [conf HIGH]** `behaviors/table.js:229` — `.ui-table__sort` outside a `<th>` crashes on click.
  - Failure scenario: consumer puts a sort button in a table caption/toolbar inside `[data-bronto-sortable]`; init succeeds, but clicking it throws `Cannot read properties of null (reading 'getAttribute')`.
  - Fix direction: SAFE-FIX. Guard `const th = sorter.closest('th')`; if missing, ignore and dev-warn that sort controls must live inside sortable headers.

- **[P3] [conf MED]** `behaviors/disclosure.js:51` — broken `aria-controls` silently makes the disclosure inert.
  - Failure scenario: consumer typo in `aria-controls` or missing target id; click does nothing, `aria-expanded` stays stale, default is not prevented, and there is no console hint.
  - Fix direction: SAFE-FIX. During click or init seeding, dev-warn once per trigger when `aria-controls` is missing or resolves to no panel.

## Lower-confidence / needs-repro
- Direct `null` options (`ui.button(null)`, `initTabs(null)`, `renderGlyph("x", null)`) throw from parameter destructuring. Reproducible, but I did not count it as a defect because the published types accept optional objects, not nullable objects.
- Several listless/incomplete containers (`data-bronto-command` without list, combobox without listbox, carousel without slides) silently no-op. That may be intended progressive enhancement; worth deciding whether dev warnings belong there.

## Notable (not a bug)
- Pure `connectors/` and `annotations/` helpers intentionally throw on invalid geometry/enums. The defect above is specifically the DOM behavior passing raw markup enums through without containment.
- Missing connector endpoints are already treated as “skip and clear generated parts”; tests cover that path, so I did not count missing `data-from`/`data-to` as a crash defect.