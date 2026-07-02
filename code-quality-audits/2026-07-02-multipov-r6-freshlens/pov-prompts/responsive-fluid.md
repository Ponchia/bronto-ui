ROUND 6 multi-POV review of `@ponchia/ui` (bronto-ui). Theme: CORRECTNESS — find REAL,
REPRODUCIBLE DEFECTS. READ-ONLY. FRESH angle (rounds didn't deep-dive responsive/fluid).

Your lens: **RESPONSIVE, CONTAINER-QUERY & FLUID CORRECTNESS.**
Hunt layout bugs at real viewport/container sizes across css/:
- Container queries: `@container` used with the right `container-type`/`container-name`; a query
  that tests the wrong axis (physical vs inline-size), or a container that never establishes
  containment so the query silently never matches (round 4 found one dotfit case — find more).
- Breakpoints / media queries: gaps or overlaps between ranges; `min`/`max` off-by-one; hard px
  breakpoints that break at zoom / large text.
- Fluid type & sizing: `clamp()`/`min()`/`max()` bounds that invert or clamp wrong; values that
  overflow their container at very small (320px) or very large (4k) widths; `vw`/`vh` units that
  misbehave in a scroll container or paged media.
- Overflow & wrapping: content that overflows (tables, code, long tokens, nav, command palette)
  without a scroll/ellipsis affordance; `white-space`/`text-overflow` gaps; flex/grid children
  that can't shrink (`min-width:auto` overflow).
- App shell / navigation at small widths: the service shell, sidebar, topbar, workbench panes —
  do they collapse/scroll correctly on mobile, or overlap/clip?
- Touch targets: interactive controls below ~24px (WCAG 2.5.8) at any breakpoint.

Give a concrete "at viewport/container size X, element Y breaks" for each.

--- OUTPUT CONTRACT ---
READ-ONLY. REAL, REPRODUCIBLE DEFECTS only. FINAL ANSWER exactly:

# Responsive / container / fluid — bronto-ui round 6 review
**Verdict:** one paragraph.
## Confirmed defects
- **[P0/P1/P2/P3] [conf HIGH/MED/LOW]** `path:line` — defect.
  - Failure scenario: viewport/container size → broken layout.
  - Fix direction: minimal fix. Mark SAFE-FIX vs NEEDS-DESIGN.
## Lower-confidence / needs-repro
- bullets.
## Notable (not a bug)
- worth knowing.
Evidence-dense; defects only; no restating this prompt.
