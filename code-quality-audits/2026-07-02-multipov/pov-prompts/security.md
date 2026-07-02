You are reviewing the `@ponchia/ui` (bronto-ui) design system from the
**SECURITY & SUPPLY CHAIN** point of view. READ-ONLY: do not modify files.

This is a published npm package (`@ponchia/ui`, public, with npm provenance and an OpenSSF
Scorecard badge). Judge its security posture as both a dependency others install and a codebase:
- Supply chain: `package.json` (`dependencies` — is it truly zero-runtime-dep?, `devDependencies`,
  `scripts` — any risky `postinstall`/lifecycle hooks?, `publishConfig`, `provenance`), and
  `package-lock.json` integrity. `.github/` workflows: pinned action SHAs vs floating tags,
  token/permissions scoping, release/publish flow, OpenSSF Scorecard findings it would trip.
- Dependency hygiene: dependabot config, lockfile freshness, any known-risky dev deps.
- Client-side injection surface: search JS (`behaviors/`, `classes/`, adapters, `connectors/`,
  `annotations/`) for `innerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function`,
  template injection, or unsanitized user/data input rendered to the DOM (XSS in a UI lib matters).
- Secrets/leakage: any tokens, endpoints, or credentials committed? Check `.semgrepignore`,
  `scripts/`, workflows.
- CSS-side risks: `url()` with external origins, `@import` of remote resources, or data
  exfiltration patterns (attribute selectors + background url).
- CI/build integrity: can a PR alter published output without review? Is the release provenance chain sound?

Read real files: `package.json`, `.github/workflows/*`, `.semgrepignore`, `scripts/`, and grep
the JS dirs for the injection sinks above.

--- OUTPUT CONTRACT ---
One report on a multi-POV panel; a synthesizer merges it, so be concrete and self-contained.
Ground EVERY claim in a `file:line` you actually opened. Produce your report as your FINAL
ANSWER in EXACTLY this Markdown structure:

# Security & supply chain — bronto-ui review
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
