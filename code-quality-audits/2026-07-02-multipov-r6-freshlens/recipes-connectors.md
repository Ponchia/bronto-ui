# Recipes / connectors / annotations — bronto-ui round 6 review
**Verdict:** Read-only review found multiple reproducible JS correctness defects, mostly from prototype-inherited string lookups and edge validation gaps. These are not style issues: each has a concrete input that returns a wrong class/path/ARIA object or throws where the public contract says unknown values are ignored.

## Confirmed defects
- **[P2] [conf HIGH]** `classes/index.js:716` — recipe option maps read inherited properties, so reserved object keys become emitted classes instead of unknown options.
  - Failure scenario: `ui.state({ state: 'toString' })` → `"ui-state function toString() { [native code] }"`; `ui.badge({ tone: 'constructor' })` similarly emits native function text.
  - Fix direction: SAFE-FIX: use own-property/null-prototype lookups for all recipe maps (`stateTone`, `jobTone`, `srcTone`, `toneClass`, `valueClass`).

- **[P3] [conf HIGH]** `classes/index.js:707` — `cx()` accepts boolean values but stringifies truthy booleans into class names.
  - Failure scenario: `cx(true, 'ui-button')` → `"true ui-button"` instead of `"ui-button"`.
  - Fix direction: SAFE-FIX: ignore booleans explicitly while preserving string/number class values and falsy dropping.

- **[P2] [conf HIGH]** `classes/index.js:1089` — value attribute helpers do not validate `min`/`max`, producing invalid ARIA ranges.
  - Failure scenario: `attrs.progress(5, { min: NaN, max: 10 })` returns `aria-valuenow: NaN`, `aria-valuemin: NaN`; `attrs.progress(50, { min: 100, max: 0 })` returns `aria-valuemin: 100`, `aria-valuemax: 0`, `aria-valuenow: 0`.
  - Fix direction: NEEDS-DESIGN: choose throw vs fail-safe omission for invalid ranges, but never emit NaN or inverted range attrs.

- **[P2] [conf HIGH]** `behaviors/connectors.js:143` — generated connector paths are not cleared when an endpoint disappears.
  - Failure scenario: draw `#a → #b`, remove `#b`, dispatch resize; `.ui-connector__path` remains `M50,40L200,40`, falsely showing a relationship to a removed element.
  - Fix direction: SAFE-FIX: when either endpoint is missing during `draw()`, remove or clear generated `.ui-connector__path` and `.ui-connector__end`.

- **[P2] [conf HIGH]** `annotations/index.js:709` — annotation subject dispatch uses inherited properties, bypassing the unsupported-subject guard.
  - Failure scenario: `annotationParts({ dx: 1, dy: 1, subject: { type: 'toString' } })` returns `subject: "[object Undefined]"` instead of throwing `TypeError`.
  - Fix direction: SAFE-FIX: make `SUBJECT_BUILDERS` null-prototype or guard with `Object.hasOwn()` before calling the builder.

- **[P2] [conf HIGH]** `glyphs/glyphs.js:1400` — glyph registry lookups treat inherited object properties as glyphs.
  - Failure scenario: `glyph('toString')` returns a function; `renderGlyph('toString')` throws `TypeError: rows is not iterable` instead of returning `''` for an unknown glyph.
  - Fix direction: SAFE-FIX: centralize glyph row lookup with `Object.hasOwn(GLYPHS, name)` or build `GLYPHS` as a null-prototype frozen object.

- **[P3] [conf HIGH]** `glyphs/glyphs.js:1454` — CSS length “sanitization” allows bare identifiers that are not lengths.
  - Failure scenario: `renderGlyph('check', { dot: 'red' })` emits `--dotmatrix-dot:red`; `renderGlyph('check', { render: 'mask', size: 'red' })` emits `--icon-size:red`, despite docs saying these are sanitized CSS lengths.
  - Fix direction: SAFE-FIX: replace the regex with a real length/function allowlist and mirror it in `behaviors/glyph.js`.

## Lower-confidence / needs-repro
- None.

## Notable (not a bug)
- None.