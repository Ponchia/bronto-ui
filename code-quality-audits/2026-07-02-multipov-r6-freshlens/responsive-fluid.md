# Responsive / container / fluid — bronto-ui round 6 review
**Verdict:** The current container-query primitives are mostly corrected, including the prior dotfit axis issue, but several opt-in surfaces still respond to viewport width instead of their actual container, and a few dense controls still miss small-screen or touch-target contracts.

## Confirmed defects
- **[P2] [conf HIGH]** `css/overlay.css:427` — mobile dropdown menu collapses to trigger width.
  - Failure scenario: 520px viewport → `.ui-menu` inside the demo “Menu” trigger becomes only as wide as `.ui-menu-host`, so “Duplicate” overflows/clips.
  - Fix direction: keep a content/min width and cap to viewport instead of `inset-inline: 0` against the inline-block host. SAFE-FIX.

- **[P2] [conf HIGH]** `css/report.css:633` — meter rows overflow narrow containers on desktop.
  - Failure scenario: 1024px viewport, 20rem card/container → `9rem + 8rem + value + gaps` remains three columns because only viewport `max-width: 32rem` collapses it.
  - Fix direction: make the row container-aware or intrinsically wrapping. NEEDS-DESIGN.

- **[P3] [conf HIGH]** `css/term.css:81` — glossary uses `max-content` plus a viewport-only collapse.
  - Failure scenario: 1024px viewport, 18rem sidebar/card, term `KubernetesHorizontalPodAutoscaler` → first column exceeds the container before the 32rem media query can help.
  - Fix direction: cap/wrap the term column and add `min-inline-size: 0` / `overflow-wrap: anywhere`. SAFE-FIX.

- **[P3] [conf HIGH]** `css/command.css:53` — command rows cannot shrink long labels beside shortcuts.
  - Failure scenario: 320px command palette with a long path-like command label + shortcut → flex item `min-width:auto` pushes shortcut/text off-canvas under `.ui-command { overflow: hidden; }`.
  - Fix direction: make the label flex child shrinkable and wrap/ellipsis; keep shortcut/meta non-shrinking. SAFE-FIX.

- **[P3] [conf HIGH]** `css/code.css:24` — code headers clip long filenames without scroll or ellipsis.
  - Failure scenario: 320px viewport, header `src/components/VeryLongFileNameWithoutBreak.tsx` + language → `.ui-code` hides overflow and the flex header has no shrink/ellipsis rule.
  - Fix direction: add shrinkable header children with ellipsis or wrapping. SAFE-FIX.

- **[P3] [conf HIGH]** `css/diff.css:71` — diff hunk/file headers clip long tokens.
  - Failure scenario: 320px viewport, hunk header with long file path/hash → `.ui-diff { overflow: hidden; }` clips the unwrapped `.ui-diff__head`.
  - Fix direction: add `overflow-wrap: anywhere` or a scoped horizontal scroller for headers. SAFE-FIX.

- **[P2] [conf HIGH]** `css/table.css:120` — sortable table header buttons are below 24px hit height.
  - Failure scenario: 390px coarse-pointer viewport, dense sortable table → `.ui-table__sort` has `padding: 0`; with inherited tiny header text its clickable box is about 16px tall.
  - Fix direction: give sort buttons a 24px minimum block size or stretch the button over the header cell padding. SAFE-FIX.

- **[P3] [conf HIGH]** `css/primitives.css:543` — CTA/arrow links miss the stated coarse-pointer 24px floor.
  - Failure scenario: coarse pointer at 390px; root is 15px, so `min-block-size: 1.5rem` is 22.5px.
  - Fix direction: use `min-block-size: max(24px, 1.6rem)`. SAFE-FIX.

## Lower-confidence / needs-repro
- `css/feedback.css:322` — tooltip bubbles are `white-space: nowrap` with no viewport cap; long tooltip copy near a viewport edge likely overflows.
- `css/overlay.css:333` — `.ui-combobox` has a 14rem floor that only resets below 560px viewport; narrow desktop containers can still overflow.
- `css/figure.css:39` — key-right figure layout is viewport-collapsed, not container-collapsed; very narrow embedded figures can keep a two-column key.

## Notable (not a bug)
- `.ui-cq` establishes `container: bronto / inline-size`, and current dotfit uses `inline-size < 18rem`; I did not find another missing-container equivalent to the round 4 dotfit issue.
- The existing responsive e2e sweep covers page-level overflow at 320/360px, but it does not cover narrow containers inside wider viewports.