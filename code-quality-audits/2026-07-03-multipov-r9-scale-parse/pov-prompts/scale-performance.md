ROUND 9 multi-POV review of `@ponchia/ui` (bronto-ui). Theme: CORRECTNESS/PERF — find REAL,
actionable issues. READ-ONLY. FRESH angle: behavior performance under scale.

Your lens: **SCALE / PERFORMANCE UNDER LOAD (behaviors JS).**
Hunt real perf defects that bite at scale (not micro-optimizations):
- Algorithmic cost: an O(n²) or worse pattern in a behavior — e.g. re-querying the whole document
  per item, nested loops over options/rows/tabs, `querySelectorAll` inside a loop, rebuilding a
  list on every keystroke without diffing. Check command/combobox filtering, table sort,
  connectors (all-pairs?), carousel/observer bookkeeping.
- Per-instance global work: a behavior that adds a document/window listener PER instance (N
  instances → N listeners all firing on every event) instead of delegation; N observers where one
  would do.
- Layout thrash: reading layout (`getBoundingClientRect`/`offset*`/`scroll*`) then writing in a
  loop (forced synchronous reflow per iteration); connectors/annotations/crosshair geometry
  recomputed for all elements on every resize/scroll without batching or rAF.
- Large-list handling: filtering/sorting/rendering a big option list or table — does it touch
  every node on every input, toggle `hidden` on thousands, or thrash the accessibility tree?
- Event storms: `input`/`scroll`/`resize`/`pointermove` handlers without debounce/throttle/rAF
  doing heavy work per event.
- Memory growth: caches/maps/WeakMaps that grow unbounded; listeners/observers accumulated across
  re-inits (beyond the leak cases rounds 4/6 fixed).

Give a concrete "with N items / rapid events, behavior X does O(?) work / thrashes" for each.

--- OUTPUT CONTRACT ---
READ-ONLY. REAL, actionable perf defects only; quantify the cost. FINAL ANSWER exactly:

# Scale / performance — bronto-ui round 9 review
**Verdict:** one paragraph.
## Confirmed defects
- **[P0/P1/P2/P3] [conf HIGH/MED/LOW]** `path:line` — defect.
  - Failure scenario: N items / event rate → cost/thrash.
  - Fix direction: minimal fix. Mark SAFE-FIX vs NEEDS-DESIGN · (JS?).
## Lower-confidence / needs-measurement
- bullets.
## Notable (not actionable)
- worth knowing.
Evidence-dense; defects only; no restating this prompt.
