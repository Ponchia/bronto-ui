You are reviewing the `@ponchia/ui` (bronto-ui) design system from the
**TESTING & CI QUALITY GATES** point of view. READ-ONLY: do not modify files.

The repo has a large `test/` tree (~118 files), a `code-quality-audits/` directory, a
`playwright.config.mjs`, and recent commits about "harden/tighten quality gates". Judge whether
quality is actually guaranteed or just claimed:
- Test surface & type mix: unit vs integration vs visual-regression vs a11y/contrast tests.
  Read `playwright.config.mjs`, sample `test/**`, and see what's actually asserted (real behavior
  vs snapshot-only). Coverage of the CSS vocabulary, behaviors, adapters, and the report grammar.
- Visual regression: is there screenshot/pixel testing (the demo is the "kitchen sink")? Is it
  stable/deterministic, and does it gate merges?
- Contrast / a11y automation: are contrast and axe-style checks run in CI (`scripts/`, `test/`)?
- The CI pipeline `.github/workflows/*`: what gates a PR (lint, stylelint, knip, typecheck,
  dist-size, tests, semgrep)? Are gates required and non-bypassable? Any flaky/optional steps?
- `code-quality-audits/`: what is tracked here, is it living or stale, and does it feed back into gates?
- Trustworthiness of the "quality gate" narrative: gaps where a regression could ship undetected
  (e.g., a colorway breaking contrast, an adapter breaking SSR, a behavior leaking listeners).

Read real files: `playwright.config.mjs`, `test/**` (sample broadly), `.github/workflows/*`,
`scripts/`, `.stylelintrc.json`, `knip.json`, `code-quality-audits/`.

--- OUTPUT CONTRACT ---
One report on a multi-POV panel; a synthesizer merges it, so be concrete and self-contained.
Ground EVERY claim in a `file:line` you actually opened. Produce your report as your FINAL
ANSWER in EXACTLY this Markdown structure:

# Testing & CI quality gates — bronto-ui review
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
