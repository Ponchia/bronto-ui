# Security Policy

## Supported versions

`@ponchia/ui` is pre-1.0; only the latest published minor receives
fixes. Breaking changes ship in the minor (see the Versioning section of
the README).

| Version | Supported |
| ------- | --------- |
| 0.16.x   | ✅        |
| < 0.16   | ❌        |

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

As of 12 October 2026, the development lockfile includes `braces@3.0.3`
through Stylelint's `micromatch` and glob dependencies.
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
reports stack exhaustion from deeply nested brace patterns. Upstream has
not published a patched release.

In this repository, that dependency is used by maintainer lint tooling;
the `lint` and `lint:fix` scripts pass the fixed `css/**/*.css` pattern.
The published package has zero runtime dependencies and does not include
this tooling stack. The development advisory remains open. Recheck
upstream releases and the lockfile audit when updating the lint toolchain.

### Release CLI

The isolated `npm@11.21.0` publisher project was also audited on 12 October
2026. Its bundled dependencies report **five affected packages** (three high
and two moderate) across 12 advisory records. This is a separate dependency
graph from the root development tools and the published UI package.

The [CI tooling advisory review](tooling/README.md#current-npm-bundle-advisory-review)
records exact versions, advisory links, the reproducible audit command, and
why the reviewed npm major update and overrides did not remove these findings.
Keep this review current when updating the upstream CLI; integrity locking
and protected publishing controls do not remediate the bundled advisories.
