ROUND 7 multi-POV review of `@ponchia/ui` (bronto-ui). Theme: CORRECTNESS — find REAL,
REPRODUCIBLE DEFECTS. READ-ONLY. FRESH angle: SSR/hydration (deep, all frameworks).

Your lens: **SSR / HYDRATION CORRECTNESS.**
The library claims SSR-safe behaviors + framework adapters. Hunt server↔client mismatches:
- Behaviors at import/init time: any top-level or init-path `document`/`window`/`localStorage`/
  `matchMedia`/`navigator` access that THROWS or misbehaves under SSR (no DOM). Check behaviors/*
  module scope AND the exported init functions AND behaviors/internal.js helpers.
- Hydration mismatch: markup/attributes the behavior mutates on the CLIENT that differ from the
  SERVER-rendered HTML (ids minted differently server vs client, aria state, `hidden`/`inert`
  toggled at init) → a hydration warning or flash. The no-flash theme script (theme.js /
  getting-started) — is it correct + SSR-safe, and does it match what the adapter/hydration expects?
- Adapters: react/solid/qwik/svelte/vue SSR — does each run its effect only client-side, avoid
  server DOM access, and clean up? Does `useBrontoBehavior`/directive/action behave under SSR +
  hydration (e.g. Qwik resumability, Svelte SSR, Astro islands)? The examples/ include astro,
  sveltekit — do they hydrate cleanly?
- Deterministic ids: is id minting deterministic/stable across server+client, or random (→
  hydration mismatch)? (round 6 changed to per-instance ids — verify that's hydration-safe.)
- CSS: any style that depends on JS having run (FOUC), or `@starting-style`/entry animation that
  fires on hydration.

Give a concrete "framework X, SSR + hydrate → error/mismatch/flash" for each.

--- OUTPUT CONTRACT ---
READ-ONLY. REAL, REPRODUCIBLE DEFECTS only. FINAL ANSWER exactly:

# SSR / hydration — bronto-ui round 7 review
**Verdict:** one paragraph.
## Confirmed defects
- **[P0/P1/P2/P3] [conf HIGH/MED/LOW]** `path:line` — defect.
  - Failure scenario: framework + SSR/hydrate → error/mismatch.
  - Fix direction: minimal fix. Mark SAFE-FIX vs NEEDS-DESIGN.
## Lower-confidence / needs-repro
- bullets.
## Notable (not a bug)
- worth knowing.
Evidence-dense; defects only; no restating this prompt.
