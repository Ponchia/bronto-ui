# Security Policy

## Supported versions

`@ponchia/ui` is pre-1.0; only the latest published minor receives
fixes. Breaking changes ship in the minor (see the Versioning section of
the README).

| Version | Supported |
| ------- | --------- |
| 0.18.x   | ✅        |
| < 0.18   | ❌        |

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

On 25 October 2026, the replacement publisher was qualified from unchanged,
commit- and hash-pinned official npm source with separately locked dependencies.
Its full 147-component audit (CLI included) reports zero findings. It retains the
high/critical threshold, protected environment, OIDC and disabled lifecycle
scripts. See the [tooling guide](tooling/README.md#current-publisher-upstream-source-and-locked-dependencies).
This qualifies the publisher input, not a package release or live authentication.

### Historical bundled-distribution blocker

As of 24 October 2026, publication is **blocked** by a high-severity advisory
in the isolated `npm@11.21.1` publisher bundle. The complete reviewed findings
are:

| Bundled package | Advisory | Severity | First patched version |
| --- | --- | --- | --- |
| `undici@6.29.0` | [GHSA-xjj6-f33q-929c](https://github.com/advisories/GHSA-xjj6-f33q-929c) | High | 6.29.1 |
| `undici@6.29.0` | [GHSA-4qv8-2p9j-2685](https://github.com/advisories/GHSA-4qv8-2p9j-2685) | Moderate | 6.29.1 |
| `ip-address@10.7.2` | [GHSA-rxp7-6hxx-x8q5](https://github.com/advisories/GHSA-rxp7-6hxx-x8q5) | Moderate | 10.7.4 |

The examined upstream npm 11.21.1 and 12.2.1 distributions both contain these
affected bundled versions. The 23 October audit predates the newer Undici
advisory data; its then-current result is not the current release status.
These are release-tool dependencies, not dependencies shipped by `@ponchia/ui`.

Both publication preflight and the protected publish job audit the actual
installed bundle against the complete lockfile. They refuse high/critical
findings, inconsistent installed bytes, or unavailable audits. Ordinary CI can
pass while publication remains blocked: deterministic guard tests do not
substitute for the live publisher audit.

The [CI tooling advisory review](tooling/README.md#current-npm-bundle-advisory-review)
records the reviewed bundle, reproducible commands and criteria for a replacement.
Keep [issue #234](https://github.com/Ponchia/bronto-ui/issues/234) open until its
bundled findings are resolved. Integrity locking, OIDC and protected publishing
controls do not remediate those findings; do not bypass the guard or relabel
bundled package versions to publish.
