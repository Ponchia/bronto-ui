You are reviewing the `@ponchia/ui` (bronto-ui) design system from the
**DEVELOPER EXPERIENCE & PUBLIC API** point of view. READ-ONLY: do not modify files.

Judge how it feels to ADOPT and LIVE WITH this library:
- The semantic `ui-*` class API surface: is it consistent, discoverable, and well-named?
  Read `classes/` (typed class-name recipes), `css/*.css` class vocab, `docs/reference.md`,
  `docs/usage.md`, `llms.txt`.
- The "no component runtime" ergonomics: how much do you write by hand vs get for free?
  Look at `examples/`, `demo/`, and the typed recipes in `classes/`.
- Framework adapters: `react/`, `solid/`, `qwik/`, `svelte/`, `vue/` — are they thin, consistent,
  and idiomatic per framework? Same API shape across all five? Any adapter clearly weaker?
- Override & theming story from a consumer's seat: the single `--accent` knob, `docs/theming.md`,
  and the "no !important / your CSS wins" promise — is it actually easy to customize?
- Adoption friction: install/import story (`package.json` exports, `tailwind.css`, `css/` entry),
  the migration guide (`MIGRATIONS.json`, `docs/stability.md`, `docs/package-contract.md`),
  and whether SemVer/stability guarantees are clear.
- Error-proneness: easy ways to hold it wrong; missing guardrails; TypeScript types (`*.d.ts`)
  quality for the recipes and tokens.

Read real files across `classes/`, `react|solid|qwik|svelte|vue/`, `examples/`, `docs/usage.md`,
`docs/reference.md`, `docs/theming.md`, `docs/package-contract.md`, `package.json`, `llms.txt`.

--- OUTPUT CONTRACT ---
One report on a multi-POV panel; a synthesizer merges it, so be concrete and self-contained.
Ground EVERY claim in a `file:line` you actually opened. Produce your report as your FINAL
ANSWER in EXACTLY this Markdown structure:

# Developer experience & public API — bronto-ui review
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
