# Security Policy

## Supported versions

`@ponchia/ui` is pre-1.0; only the latest published minor receives
fixes. Breaking changes ship in the minor (see the Versioning section of
the README).

| Version | Supported |
| ------- | --------- |
| 0.3.x   | ✅        |
| < 0.3   | ❌        |

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Use GitHub's private vulnerability reporting:
**Security → Report a vulnerability**
(<https://github.com/Ponchia/bronto-ui/security/advisories/new>).

You'll get an acknowledgement within a few days. Fixes are released as a
new patch/minor and noted in `CHANGELOG.md`.

## Attack surface

The package ships **zero runtime dependencies** — it is CSS plus
optional dependency-free, side-effect-free-on-import, SSR-safe vanilla
JS (`tokens` / `classes` / `behaviors`). Releases are published from a
gated CI pipeline with npm provenance (SLSA), every GitHub Action is
pinned to a commit SHA, and the publish step runs with
`--ignore-scripts`. The realistic surface is supply-chain (dev
dependencies, Actions) — kept current via Dependabot.
