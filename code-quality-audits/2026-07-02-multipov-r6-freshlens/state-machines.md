# Behavior state machines & dynamic DOM — bronto-ui round 6 review
**Verdict:** Found five reproducible state-machine defects. The strongest are shared-state bugs: controls bound to one target do not update together, overlapping roots can double-apply the same event, and nested modal inert ownership is not reference-counted.

## Confirmed defects
- **[P2] [conf HIGH]** `behaviors/modal.js:114` — nested/stacked modal inert ownership is released by the lower modal while an inner modal is still open.
  - Failure scenario: outer and inner `[data-bronto-modal].is-open` are initialized together → background is inert → remove `is-open` from outer only → inner still has `is-open`, but background sibling becomes `inert=false` and focus returns behind the modal.
  - Fix direction: centralize modal stack/inert ownership with ref-counting or recompute inert from remaining active modals on every release. NEEDS-DESIGN.

- **[P2] [conf HIGH]** `behaviors/disclosure.js:43` — overlapping roots double-toggle the same disclosure click.
  - Failure scenario: call `initDisclosure()` on `document`, then `initDisclosure({ root: section })` on an ancestor section → click the trigger once → section handler opens, document handler sees bubbled event and closes → `aria-expanded="false"` and panel remains hidden.
  - Fix direction: mark handled events or ignore already-handled/default-prevented Bronto disclosure events. SAFE-FIX.

- **[P3] [conf HIGH]** `behaviors/disclosure.js:45` — two disclosure triggers controlling the same panel desynchronize.
  - Failure scenario: buttons A and B both `aria-controls="p"` and start `aria-expanded="false"` with panel hidden → click A → panel opens, A says true, B still says false → click A again after B has been used → panel closes while B still says true.
  - Fix direction: derive open state from the panel and update every in-scope trigger with the same `aria-controls` id. SAFE-FIX.

- **[P3] [conf HIGH]** `behaviors/theme.js:78` — scoped theme-toggle roots do not reflect document-global theme changes in other scoped roots.
  - Failure scenario: two islands each call `initThemeToggle({ root })` → both toggles initially false → click island A → `<html data-theme="dark">`, A pressed true, B remains false → click B → theme becomes light, B false, A remains stale true.
  - Fix direction: have each binding reflect on `bronto:themechange`, or use a document-level registry for all toggle controls while preserving cleanup. SAFE-FIX.

- **[P3] [conf HIGH]** `behaviors/popover.js:143` — duplicate popover triggers for one panel do not share expanded state.
  - Failure scenario: triggers A and B both target panel `p` in the `.is-open` fallback branch → click A → panel opens, A `aria-expanded="true"`, B remains `"false"` while controlling the visible panel → click B → line 178 treats the same open panel as a close toggle and closes A’s popover instead of syncing/retargeting.
  - Fix direction: track triggers by controlled panel and update all matching `aria-expanded` values on open/close; decide whether same-panel second-trigger click should close or retarget focus. NEEDS-DESIGN.

## Lower-confidence / needs-repro
- **[conf LOW]** `behaviors/popover.js:147` — a trigger added after `initPopover()` opens via delegated click but never gets `aria-haspopup="dialog"` because seeding only runs at init. This is reproducible, but may be outside contract if late controls require explicit re-init.
- **[conf LOW]** `behaviors/modal.js:107` — if an initially-open controlled modal is initialized while focus is already inside it, `opener` becomes an element inside the modal and close can return focus into hidden content. Needs real-browser autofocus/effect-order repro.

## Notable (not a bug)
- `initTabs` static child snapshots refresh on explicit re-init because `bindOnce` tears down and rebinds the same tab group.
- `initCombobox` dynamic option handling is explicitly opt-in via `data-bronto-combobox-live`; I did not find a defect in that documented live path.