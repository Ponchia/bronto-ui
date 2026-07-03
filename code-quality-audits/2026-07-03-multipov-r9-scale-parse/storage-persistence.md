# Storage / persistence — bronto-ui round 9 review
**Verdict:** Theme behavior storage access is mostly defensive, but the public no-flash snippets are not equivalent to `applyStoredTheme()` and can persist an invalid `data-theme` contract state. Cross-tab storage changes also leave initialized tabs stale, with no documented opt-out.

## Confirmed defects
- **[P2] [conf HIGH]** `docs/integration.md:24` — canonical no-flash snippet copies any truthy stored value into `<html data-theme>`, unlike `behaviors/theme.js:34` which validates against `light|dark`.
  - Failure scenario: `localStorage['bronto-theme']='garbage'` → snippet sets `data-theme="garbage"` before paint; later `applyStoredTheme()` does not clear it, so the page remains in an invalid theme state until user interaction.
  - Fix direction: SAFE-FIX · docs/examples/JS. Change all no-flash snippets to `if (t === 'light' || t === 'dark') ...`; optionally remove `data-theme` for corrupt values.

- **[P3] [conf HIGH]** `behaviors/theme.js:99` — toggles write `localStorage`, but `initThemeToggle()` never listens for `storage` events.
  - Failure scenario: Tab A toggles `bronto-theme` to `dark`; Tab B already initialized on `light` receives the browser `storage` event but keeps `data-theme="light"` and stale toggle ARIA.
  - Fix direction: NEEDS-DESIGN · JS/docs. Either handle `window.storage` for the configured `storageKey` and validated values, or document that cross-tab sync is intentionally unsupported.

## Lower-confidence / needs-repro
- `storageKey` is honored inside `theme.js`, but every documented no-flash snippet hardcodes `bronto-theme`; consumers using a custom key will flash until `initThemeToggle({ storageKey })` runs. This is a docs gap unless custom-key first-paint support is intended.

## Notable (not a bug)
- `behaviors/theme.js` wraps `localStorage.getItem/setItem` and ignores corrupt stored values.
- Demo skin/surface persistence is guarded and validates stored values before applying attributes.