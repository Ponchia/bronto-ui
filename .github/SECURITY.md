# Security Policy

## Supported versions

`@ponchia/ui` is pre-1.0; only the latest published minor receives
fixes. Breaking changes ship in the minor (see the Versioning section of
the README).

| Version | Supported |
| ------- | --------- |
| 0.19.x   | ✅        |
| < 0.19   | ❌        |

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

### Current protected npm publisher

As of **29 October 2026**, `@ponchia/ui@0.18.1` is successfully published on
npm through the protected GitHub Actions trusted-publishing workflow. The
registry exposes its [SLSA provenance attestation](https://registry.npmjs.org/-/npm/v1/attestations/@ponchia%2fui@0.18.1).
A green workflow or source-only preparation is not itself a publication;
the package and attestation were independently verified after the release.

The executed publisher uses unchanged official npm CLI source, pinned by commit
and reviewed source-file hashes, with a separately integrity-locked complete
dependency graph. The installed graph includes patched
`undici@6.29.1` and `ip-address@10.7.4`; the complete audit includes the
unchanged CLI (147 total components). On 25 October the qualified graph had
**zero reported findings**. Before every future execution, the pipeline
checks source and dependency identities, installed manifests and a fresh
complete advisory report. High/critical findings and unavailable or
inconsistent reports block publication. The protected environment, short-lived
OIDC, disabled lifecycle scripts and provenance remain required.

The authoritative execution and qualification instructions are in the
[active publisher guide](tooling/README.md#active-publishing-inputs), alongside
[read-only qualification](tooling/README.md#read-only-qualification).
A historical clean audit is not a permanent waiver: new advisories must be
reviewed against the actual source and installed graph.

### Historical bundled-distribution blocker — resolved as an execution input

On **24 October 2026**, the examined *official bundled distributions* of
`npm@11.21.1` and `npm@12.2.1` still contained the following vulnerable
dependencies. Publishing through the bundled CLI was correctly **blocked at
that time**:

| Bundled package | Advisory | Severity | First patched version |
| --- | --- | --- | --- |
| `undici@6.29.0` | [GHSA-xjj6-f33q-929c](https://github.com/advisories/GHSA-xjj6-f33q-929c) | High | 6.29.1 |
| `undici@6.29.0` | [GHSA-4qv8-2p9j-2685](https://github.com/advisories/GHSA-4qv8-2p9j-2685) | Moderate | 6.29.1 |
| `ip-address@10.7.2` | [GHSA-rxp7-6hxx-x8q5](https://github.com/advisories/GHSA-rxp7-6hxx-x8q5) | Moderate | 10.7.4 |

The executable publisher changed in
[PR #281](https://github.com/Ponchia/bronto-ui/pull/281): it uses hash-pinned
upstream *source* with a separately locked patched graph rather than the
affected bundled npm distribution. The obsolete, installable bundled npm
dependency graph was removed in
[PR #288](https://github.com/Ponchia/bronto-ui/pull/288). Its adversarial
negative tests remain without retaining a vulnerable executable input.
No advisory exception, bundle relabeling or weaker audit threshold was used.

[Issue #234](https://github.com/Ponchia/bronto-ui/issues/234) was **closed on
29 October 2026**, after a protected 0.18.1 publication with provenance and
GitHub's dependency-alert list returned zero open records. The official
historical bundled artifacts remain affected; they are *not* the published
library's dependencies or the current release job's executed source. Continue
to report any new findings through the private vulnerability-reporting link
above rather than treating the historical closure as future approval.
