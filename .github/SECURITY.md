# Security Policy

## Supported versions

`@ponchia/ui` is pre-1.0; only the latest published minor receives
fixes. Breaking changes ship in the minor (see the Versioning section of
the README).

| Version | Supported |
| ------- | --------- |
| 0.17.x   | ✅        |
| < 0.17   | ❌        |

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Use GitHub's private vulnerability reporting:
**Security → Report a vulnerability**
(<https://github.com/Ponchia/bronto-ui/security/advisories/new>).

You'll get an acknowledgement within a few days. Fixes are released as a
new patch/minor and noted in `CHANGELOG.md`.

## Attack surface

The package ships **zero runtime or peer dependencies**. Its public
surface is CSS, design tokens, class recipes, optional browser behaviors,
glyph renderers, and static geometry/rendering helpers. The optional
JavaScript entrypoints are side-effect-free on import and safe to import
without a DOM. Renderer theme/configuration exports do not bundle the
renderers they configure.

Behaviors assume trusted application markup. Do not initialize them over
untrusted user/CMS HTML unless you have sanitized that markup and are
comfortable with its `data-bronto-*`, `aria-controls`, and `id`
relationships controlling elements inside the delegated root. Dialog,
disclosure, and popover targets resolve root-first and then document-wide
for body/portal-mounted overlays, so a scoped root is an ergonomics and
conflict-avoidance boundary, not an untrusted-markup sandbox.

The `.ui-icon` glyph mask renderer uses an inline CSS `data:` URL. If
your app ships a strict CSP and uses `renderGlyph(..., { render:
'mask' })`, allow the required inline style/custom-property path and
`data:` mask/image source, or use the DOM dot/solid renderers instead.

Releases are published from a gated CI pipeline with npm provenance
(SLSA), every GitHub Action is pinned to a commit SHA, and the publish
step runs with `--ignore-scripts`. The realistic project surface is
supply-chain (dev dependencies, Actions, docs-site CDN dependencies) —
kept current via Dependabot and locked CI.

## Tooling advisories

### Lint dependencies

As of 23 October 2026, the development lockfile includes `braces@3.0.3`
through Stylelint's `micromatch` and glob dependencies.
GitHub withdrew
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
on 23 October 2026 because it is not a practically exploitable vulnerability.
This is an advisory withdrawal, not a new patched package release.

In this repository, that dependency is used by maintainer lint tooling;
the `lint` and `lint:fix` scripts pass the fixed `css/**/*.css` pattern.
The published package has zero runtime dependencies and does not include
this tooling stack. The 23 October 2026 full root lockfile audit, including
development dependencies, reports **zero vulnerabilities** (exit 0). Recheck
the lockfile audit when updating the lint toolchain.

### Release CLI

The isolated `npm@11.21.1` publisher project was audited on 23 October 2026.
The patch removes the previously reported high-severity bundled findings. Its
complete lockfile audit still reports one moderate advisory in
`ip-address@10.7.2`:
[GHSA-rxp7-6hxx-x8q5](https://github.com/advisories/GHSA-rxp7-6hxx-x8q5).
Upstream fixes that package in 10.7.4, but the examined npm 11.21.1 and 12.2.1
distributions both bundle 10.7.2. The remaining publisher advisory is tracked
in [issue #234](https://github.com/Ponchia/bronto-ui/issues/234).

The [CI tooling advisory review](tooling/README.md#current-npm-bundle-advisory-review)
records the exact bundled versions, reproducible audit commands and upgrade
limits. Keep it current when updating the upstream CLI; integrity locking and
protected publishing controls do not remediate the remaining advisory.
