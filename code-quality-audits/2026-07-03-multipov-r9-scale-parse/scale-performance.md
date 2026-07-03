# Scale / performance — bronto-ui round 9 review
**Verdict:** The behavior layer is generally thin, but several hot paths do full-list or full-geometry work on high-frequency events. The biggest risks are scroll/resize connector redraws, per-combobox document listeners, and DOM-authored list/table behaviors that repeatedly touch every node under keyboard/input/sort load.

## Confirmed defects
- **[P2] [conf HIGH]** `behaviors/connectors.js:187` — connector redraw is synchronous, unbatched, and re-discovers all connectors on every scroll/resize/RO callback.
  - Failure scenario: C connectors, I ids in a scoped island, 60 scroll events/sec → `collectHosts()` plus 2 endpoint lookups per connector; with element roots `byIdInHost()` scans `[id]` each lookup, so worst case is O(60 * C * I) DOM scans plus O(60 * C) layout reads/writes.
  - Fix direction: SAFE-FIX · JS. Cache connector records/endpoints at bind time, schedule redraw with one rAF, and rebuild records only on explicit re-init.

- **[P2] [conf HIGH]** `behaviors/combobox.js:148` — every combobox instance adds its own document click listener.
  - Failure scenario: N comboboxes in a filter-heavy page/table → every unrelated document click runs N `box.contains()` checks and may call `close()` N times.
  - Fix direction: SAFE-FIX · JS. Delegate one outside-click listener per root/document, or attach it lazily only while at least one combobox is open.

- **[P2] [conf HIGH]** `behaviors/command.js:169` — command active movement rewrites every item; same pattern exists in combobox at `behaviors/combobox.js:282`.
  - Failure scenario: 5,000 commands/options and key repeat at 30 Hz → each Arrow key filters visible items O(N), then toggles active/`aria-selected` or classes across all N nodes, causing large DOM and accessibility-tree churn.
  - Fix direction: SAFE-FIX · JS. Track previous active item and update only previous/next; cache normalized search text and skip unchanged `hidden` writes.

- **[P2] [conf HIGH]** `behaviors/table.js:217` — table sort extracts DOM cell text/number inside the sort comparator.
  - Failure scenario: 10,000 rows → ~130k comparisons, each doing live DOM reads/parsing for both compared rows; this is O(N log N) DOM extraction instead of O(N) extraction plus JS sort.
  - Fix direction: SAFE-FIX · JS. Decorate rows once with `{ row, key }`, sort keys, then append rows.

- **[P3] [conf HIGH]** `behaviors/sources.js:78` — source seeding resolves each citation by repeatedly scanning all ids in the island.
  - Failure scenario: 1,000 citations and 1,200 ids in a report island → about 1.2M id-scan candidates during init, plus repeated source preview queries for duplicate citations.
  - Fix direction: SAFE-FIX · JS. Build one `Map(id, element)` per island and cache preview text per source element.

- **[P3] [conf HIGH]** `behaviors/crosshair.js:76` — pointermove does layout/style reads and DOM writes on every raw pointer event.
  - Failure scenario: 120 Hz mouse/stylus over a plot → every event reads `getBoundingClientRect()` and `getComputedStyle()`, writes CSS vars/data attrs/classes, then dispatches a custom event.
  - Fix direction: SAFE-FIX · JS for caching rect/direction with invalidation; NEEDS-DESIGN if coalescing public move events to rAF.

## Lower-confidence / needs-measurement
- `behaviors/forms.js:332` — once an error summary is visible, every `focusout` scans all controls and rebuilds the summary; measure on 300+ control forms before changing to an invalid-control set.
- `behaviors/spotlight.js:43` — same unbatched scroll/resize shape as connectors, but typical N is probably 1; batch with rAF if tour pages carry many overlays.
- `behaviors/popover.js:198` — open popover repositions synchronously on every captured scroll event; likely fine for one panel, but complex tall panels may need rAF batching.

## Notable (not actionable)
- The pure connector and annotation geometry helpers are not all-pairs; connector path math is constant-time per connector.
- Existing e2e coverage checks connector/spotlight re-init cleanup, so I did not count stale redraw listeners as current defects.