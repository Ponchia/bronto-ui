You are reviewing the `@ponchia/ui` (bronto-ui) design system from the
**JS BEHAVIORS, TYPES & FRAMEWORK ADAPTERS** point of view. READ-ONLY: do not modify files.

The library is "CSS-first" with "a thin layer of SSR-safe vanilla behaviors" for the few things
that need JS (theme persistence, dialogs, toasts, disclosure), plus adapters for 5 frameworks.
Judge the JS/TS engineering:
- `behaviors/` (~72 files): are they genuinely SSR-safe (no top-level `window`/`document` access,
  guarded, hydration-safe)? Idempotent init? Event-listener cleanup / teardown (leaks)? Correct
  handling of `null` elements? Read a broad sample of `behaviors/*`.
- The "zero runtime dependencies" claim: verify no runtime imports leak in (`package.json`
  `dependencies` vs `devDependencies`, and imports in `behaviors/`, `classes/`, adapters).
- Framework adapters `react/ solid/ qwik/ svelte/ vue/`: correctness per framework (effects/cleanup,
  SSR, ref handling), consistency of API across the five, and whether they're truly thin wrappers.
- Type quality: `tsconfig.json`, `tsconfig.dts.json`, the shipped `*.d.ts` (`tokens/*.d.ts`,
  `classes/*.d.ts`), `schemas/`. Are public types precise (literal unions vs `string`), no `any` leaks?
- `connectors/` and `annotations/` JS: correctness and boundary discipline.
- DOM-manipulation safety: any `innerHTML`/`insertAdjacentHTML` with unsanitized input (XSS surface)?

Read real files broadly across `behaviors/`, `react|solid|qwik|svelte|vue/`, `classes/`,
`connectors/`, `annotations/`, `tsconfig*.json`, `*.d.ts`.

--- OUTPUT CONTRACT ---
One report on a multi-POV panel; a synthesizer merges it, so be concrete and self-contained.
Ground EVERY claim in a `file:line` you actually opened. Produce your report as your FINAL
ANSWER in EXACTLY this Markdown structure:

# JS behaviors, types & framework adapters — bronto-ui review
**Verdict:** one paragraph.
**Grade:** letter A–F + half-sentence why.
## Strengths
- bullets, each citing `path:line`.
## Weaknesses / risks
- bullets; prefix severity [P0]/[P1]/[P2]/[P3]; cite `path:line`; say what breaks & why.
## Top recommendations
1..6 ranked, concrete, actionable.
## Notable observations
- surprising / clever / worth knowing.
Evidence-dense, no filler, no restating this prompt.
