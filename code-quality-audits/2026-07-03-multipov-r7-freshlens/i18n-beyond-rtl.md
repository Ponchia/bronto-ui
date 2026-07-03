# i18n beyond RTL — bronto-ui round 7 review
**Verdict:** Several real i18n defects remain outside basic RTL geometry: locale-blind filtering/sorting, vertical-writing-mode breakage from physical transforms mixed with logical sizing, source-code bidi leakage, and generated English accessibility text that consumers cannot fully localize.

## Confirmed defects
- **[P2] [conf HIGH]** `behaviors/command.js:149`, `behaviors/combobox.js:276` — filtering uses default `toLowerCase()`.
  - Failure scenario: `lang="tr"` command/combobox option `İstanbul`; typing `istanbul` hides it because JS lowercases to `i\u0307stanbul`.
  - Fix direction: SAFE-FIX: derive locale from closest `[lang]`/document and use locale-aware normalization for both query and option text.

- **[P2] [conf HIGH]** `behaviors/table.js:165` — numeric sort parser assumes ASCII digits, dot decimals, comma thousands.
  - Failure scenario: French/German display `1,5` sorts as `15`; Arabic `١٢` parses as `0`; `1 234,5` parses as `12345`.
  - Fix direction: NEEDS-DESIGN: use `data-sort-value` in docs/tests as required for localized numbers, or add locale-aware parsing/normalization.

- **[P3] [conf HIGH]** `behaviors/table.js:190` — text sort ignores document/component locale.
  - Failure scenario: `lang="sv"` table with `Zebra`, `Ängelholm`, `Örebro` sorts by the browser default locale, not Swedish collation, so `Ä/Ö` can land before `Z`.
  - Fix direction: SAFE-FIX: sort with `Intl.Collator(locale, { numeric: false, sensitivity: 'base' })`, locale from closest `[lang]`.

- **[P2] [conf HIGH]** `css/forms.css:423`, `css/navigation.css:70` — switch/theme-toggle checked state moves thumbs with physical `translateX`.
  - Failure scenario: `writing-mode: vertical-rl` settings panel; tracks become vertical because sizes are logical, but checked thumbs move sideways out of the track.
  - Fix direction: SAFE-FIX: position thumbs with logical `inset-inline-start`/track-relative placement, or explicitly pin these controls to horizontal writing mode.

- **[P2] [conf MED]** `css/code.css:16`, `css/diff.css:25` — code/diff grammars inherit page `direction` and `writing-mode`.
  - Failure scenario: Arabic `dir="rtl"` report renders code punctuation/numbers with bidi reordering; `writing-mode: vertical-rl` article turns source lines and diff gutters vertical.
  - Fix direction: SAFE-FIX: set code bodies/cells to `direction: ltr; unicode-bidi: isolate; writing-mode: horizontal-tb`.

- **[P3] [conf MED]** `css/bullet.css:46` — bullet graph mixes logical sizing/placement with physical gradient direction and `translateX`.
  - Failure scenario: `writing-mode: vertical-rl`; measure/target use the vertical inline axis, but qualitative bands still paint `to right`, and the target tick is physically X-centered.
  - Fix direction: NEEDS-DESIGN: either pin bullet graphs horizontal or add vertical-writing-mode-specific gradients/transforms.

- **[P2] [conf HIGH]** `behaviors/carousel.js:68` — carousel overwrites localized `aria-roledescription`.
  - Failure scenario: French consumer authors `aria-roledescription="carrousel"` / `diapositive`; init replaces them with English `carousel` and `slide`.
  - Fix direction: SAFE-FIX: only set roledescription if absent, and add data/option hooks for localized defaults.

- **[P2] [conf HIGH]** `behaviors/forms.js:230` — validation summary title is hard-coded English.
  - Failure scenario: `lang="de"` form with localized labels/messages still announces “There is a problem”.
  - Fix direction: SAFE-FIX: preserve authored summary heading or accept a localized title option/data attribute.

- **[P3] [conf HIGH]** `behaviors/toast.js:122` — generated toast close button has hard-coded English `aria-label="Dismiss"`.
  - Failure scenario: sticky toast in Japanese UI announces an English close action with no option to localize.
  - Fix direction: SAFE-FIX: add `dismissLabel` option and/or data attribute; default only as fallback.

## Lower-confidence / needs-repro
- Generic `text-transform: uppercase` plus `letter-spacing` on consumer-authored labels (`css/forms.css:15`, `css/primitives.css:562`) likely harms Arabic cursive scripts and some CJK/Turkish presentation, but needs a product decision on whether these classes are metadata-only or arbitrary localized text.
- Bidi truncation in command/tree labels (`css/command.css:64`, `css/tree.css:93`) may need `dir=auto`/`unicode-bidi: plaintext` guidance, but needs browser repro with mixed Hebrew/English/number labels.

## Notable (not a bug)
- Many physical-looking hits were block-axis sizing, viewport media queries, or internal ASCII identifiers, not directional layout defects.
- `data-sort-value` is already an escape hatch for localized numeric tables; the bug is that the default displayed-text parser still mis-sorts common localized formats.