ROUND 9 multi-POV review of `@ponchia/ui` (bronto-ui). Theme: CORRECTNESS — find REAL,
REPRODUCIBLE DEFECTS. READ-ONLY. FRESH angle: storage/persistence.

Your lens: **STORAGE / PERSISTENCE CORRECTNESS.**
Hunt bugs in any `localStorage`/`sessionStorage`/cookie/persistence use (primarily
behaviors/theme.js — theme persistence — plus any behavior that remembers state):
- Failure modes: `localStorage` throwing (private mode, disabled cookies, quota exceeded,
  cross-origin iframe) — is every access wrapped so it degrades instead of crashing the behavior?
- Serialization/parse: a stored value read back with the wrong type, no validation of a corrupt/
  tampered value (e.g. `data-theme` set to garbage from storage → invalid attribute), missing
  `JSON.parse` try/catch, a value that round-trips wrong.
- Key hygiene: hard-coded storage key that could collide with a consumer's own key; a key not
  namespaced; the storageKey option honored everywhere it's read/written.
- Cross-tab / external change: `storage` event handling — does a theme change in one tab reflect
  in others (or is it documented not to)? A stale in-memory value after external storage change.
- The no-flash theme script (docs/getting-started + theme.js): reads storage before paint — is it
  robust to a throwing/absent/corrupt value, and does it match what the behavior later expects
  (no hydration mismatch)?
- Default/first-run: no stored value → correct default (system preference), not a crash or wrong
  fallback.

Give a concrete "storage is X (blocked/corrupt/absent) → behavior crashes/wrong-state" for each.

--- OUTPUT CONTRACT ---
READ-ONLY. REAL, REPRODUCIBLE DEFECTS only. FINAL ANSWER exactly:

# Storage / persistence — bronto-ui round 9 review
**Verdict:** one paragraph.
## Confirmed defects
- **[P0/P1/P2/P3] [conf HIGH/MED/LOW]** `path:line` — defect.
  - Failure scenario: storage state → crash/wrong-state.
  - Fix direction: minimal fix. Mark SAFE-FIX vs NEEDS-DESIGN · (JS?/docs?).
## Lower-confidence / needs-repro
- bullets.
## Notable (not a bug)
- worth knowing.
Evidence-dense; defects only; no restating this prompt.
