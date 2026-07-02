ROUND 6 multi-POV review of `@ponchia/ui` (bronto-ui). Theme: CORRECTNESS — find REAL,
REPRODUCIBLE DEFECTS. READ-ONLY. FRESH angle: composition + consumer override.

Your lens: **COMPOSITION, MULTIPLE INSTANCES & CONSUMER OVERRIDE.**
The library's thesis is "one `@layer bronto`, your un-layered CSS wins, no !important." Stress
that in real composition:
- Consumer override: find shipped rules that a consumer CANNOT cleanly override because of a
  `!important` (round 1 noted intentional print/reduced-motion ones — find any that block a
  legitimate override), an inline style the behaviors set, or specificity that beats un-layered
  consumer CSS. Verify the "@layer bronto always loses to un-layered CSS" promise holds.
- Multiple instances: two of the same component on one page — id collisions (minted ids,
  `aria-controls`/`labelledby`/`activedescendant` pointing to the wrong instance), shared global
  state (a module-level singleton that assumes one instance), event handlers bound to `document`
  that act on all instances.
- Nesting: a component inside another (dialog in a workbench, table in a report, figure in a
  card) — layout/stacking/z-index conflicts, focus-trap interaction, `inert` scope, overflow
  clipping of a nested popover/tooltip/menu.
- Stacking / z-index: overlay/popover/tooltip/menu/toast/command z-index collisions; a popover
  clipped by an ancestor `overflow`/`transform`/`contain` (the classic positioned-ancestor trap).
- Framework composition: the adapters used together / with consumer components — SSR + hydration
  order, portal targets, ref timing.

Give a concrete "compose X with Y → conflict Z" for each.

--- OUTPUT CONTRACT ---
READ-ONLY. REAL, REPRODUCIBLE DEFECTS only. FINAL ANSWER exactly:

# Composition & consumer override — bronto-ui round 6 review
**Verdict:** one paragraph.
## Confirmed defects
- **[P0/P1/P2/P3] [conf HIGH/MED/LOW]** `path:line` — defect.
  - Failure scenario: composition → conflict.
  - Fix direction: minimal fix. Mark SAFE-FIX vs NEEDS-DESIGN.
## Lower-confidence / needs-repro
- bullets.
## Notable (not a bug)
- worth knowing.
Evidence-dense; defects only; no restating this prompt.
