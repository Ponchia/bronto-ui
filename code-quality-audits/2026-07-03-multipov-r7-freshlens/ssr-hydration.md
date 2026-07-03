# SSR / hydration — bronto-ui round 7 review
**Verdict:** No import-time SSR crash found in behavior modules or adapters; the real issues are client-only initialization effects that change visible/server-rendered UI after hydration, producing flashes or short unsafe interaction windows in SSR apps.

## Confirmed defects
- **[P2] [conf HIGH]** `behaviors/tabs.js:111` — `initTabs()` hides inactive panels only on the client.
  - Failure scenario: SvelteKit SSR of `examples/sveltekit/src/routes/+page.svelte:40` renders both tab panels visible; `use:tabs` then hydrates and hides panel two. Same for Next/SolidStart/Qwik City/Vue SSR using `useTabs`/directives.
  - Fix direction: emit deterministic tab ids/roles/`aria-selected`/`tabindex`/`hidden` in SSR markup, or provide an SSR render helper. NEEDS-DESIGN.

- **[P2] [conf HIGH]** `behaviors/combobox.js:269` — combobox list is closed by JS after first paint, while CSS displays `.ui-combobox__list` unless `[hidden]`.
  - Failure scenario: React/Next SSR renders the documented/demo combobox shape (`demo/index.html:427`) without `hidden`; the dropdown list is visible until `useCombobox()` runs and hides it.
  - Fix direction: require SSR markup to include `hidden`, stable ids, and initial ARIA state, or add an SSR helper/recipe that emits the enhanced resting state. SAFE-FIX for docs/examples; NEEDS-DESIGN for API.

- **[P2] [conf HIGH]** `behaviors/glyph.js:216` — `initDotGlyph()` injects the glyph DOM client-side.
  - Failure scenario: SvelteKit SSR sends `<span data-bronto-glyph="spark">` from `examples/sveltekit/src/routes/+page.svelte:46`; hydration later appends 256 cells plus role/style/ARIA, so the icon is missing on first paint. React/Solid/Vue examples use the same placeholder pattern.
  - Fix direction: use existing `renderGlyph()`/mask helpers for SSR-visible glyphs, and let `initDotGlyph()` be only a client-only fallback. SAFE-FIX.

- **[P2] [conf MED]** `behaviors/modal.js:177` — an initially open controlled modal traps focus/inerts siblings only after client init.
  - Failure scenario: Next/Vue/SvelteKit SSR renders `.ui-modal.is-open[data-bronto-modal]`; CSS shows and scroll-locks it immediately, but background content remains focusable/clickable until `useModal()`/directive hydrates and calls `trap()`.
  - Fix direction: avoid SSRing controlled modals open unless server markup also encodes the inert/ARIA state, or document native `<dialog>`/client-open as the SSR-safe path. NEEDS-DESIGN.

## Lower-confidence / needs-repro
- Qwik City resumability for `useToast()` needs a real Qwik City SSR build check; the repo’s Qwik example is `csr: true`, so it does not prove SSR/resume behavior.

## Notable (not a bug)
- No top-level `document`/`window`/`localStorage` SSR import crash reproduced for `behaviors`, `react`, `solid`, `qwik`, `svelte`, or `vue`.
- ID minting is monotonic client-side, not random; the problem is missing server-emitted enhanced state, not nondeterministic server/client id generation.
- The theme script’s `<html data-theme>` mismatch is intentional in Next docs and paired with `suppressHydrationWarning`.