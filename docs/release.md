# Release Runbook

## Before Tagging

**Public install contract:** Version preparation belongs in an isolated release
branch until the maintainer is ready to complete the tag-driven publication
and protected environment approval. Do not merge a version-only metadata
change early: it updates the pinned CDN copy-paste URLs and package name/version
before that version exists on npm. If publication cannot proceed after merging,
restore the last *published* version in the default-branch package metadata,
public version snippets and issue template, keeping the next version's changelog
under `Unreleased`. Do not remove accepted source fixes or weaken checks to
work around an unpublished CDN URL.

Check the publisher first with `npm run publisher:readiness -- /path/to/evidence-parent`.
This installs and audits the reviewed CLI in disposable storage without requiring
an existing publisher installation, a version bump, a tag or publication.
Inspect its retained report and stop on a blocked result; a clean source CI run
is not a substitute for this live check.

0. Run `npm run release:prep -- X.Y.Z` — bumps `package.json` and only the root
   version metadata in the lockfile, dates a plain `## Unreleased` or matching
   `## Unreleased — X.Y.Z` CHANGELOG heading, and re-pins every
   `@ponchia/ui@X.Y.Z` literal across the same public docs/demo surfaces that
   `check:versions` gates. Prereleases name the base version's section without
   dating it. Missing/ambiguous release headings, mismatched root lock metadata,
   and missing input files are rejected before any files are written. Preparation
   does not install, resolve, or update dependencies and is safe to repeat for an
   already-prepared version. Filesystem write failures are not transactional:
   always inspect the diff and rerun the checks after an interrupted operation.
1. Reconcile `README.md`, `CHANGELOG.md`, `ROADMAP.md`, `.github/SECURITY.md`, and
   `docs/adr/*` against the version being released.
2. Run `npm run check` and `npm run test:e2e:nonpixel` locally. `npm run check`
   already includes the node:test unit and contract suite. Run
   `npm run test:e2e` in the pinned Playwright container when visual baselines
   changed, or run `npm run test:e2e:visual:container` with Docker running for a
   local dry-run of the Chromium screenshot gate.
3. Run `npm run size:report` and call out any intentional payload increase in
   the changelog.
4. Run `npm run test:examples` to build the packed example matrix from the
   tarball, not a workspace link. When framework lifecycle, browser behavior, or
   smoke coverage changed, also run `npm run test:examples:cross-browser`.
   When example visual composition changed, run `npm run test:examples:visual`
   as the local-safe packed-example desktop + mobile screenshot/layout health
   smoke.

## Publish

1. Land the release commit on `main` through the protected PR workflow, with
   `ci-gate` green and the branch up to date.
2. Push a `vX.Y.Z` tag. Stable tags publish to `latest`; prerelease tags publish
   to `next`.
3. Wait for `validate`, `e2e`, `examples`, and `publish-preflight` to pass.
   Release examples include Chromium, Firefox, WebKit, and desktop/mobile
   screenshot health checks.
4. Review the `publish-preflight` job summary: generated size report and pack
   manifest.
5. Approve the protected `npm-publish` environment only after the gates and
   preflight are green. Approval releases the job; it does not authenticate it
   — the job authenticates itself to npm by trusted publishing (OIDC), so there
   is no token to check or renew first. After publish, the `publish-npm` summary attempts to
   record the npm registry view: published version, tarball, integrity, and
   current dist-tags. That observation is best-effort; the irreversible gate is
   the publish itself, not the later `npm view`.

## Release tooling

The publish job uses unchanged official npm CLI source pinned by archive and
file hashes, with its complete production dependencies independently locked in
`tooling/publisher/`. Installation disables lifecycle scripts and prepares the
runtime outside the checkout in the runner's private temporary directory.
The workflow invokes that exact CLI explicitly. Keep source and dependency
updates reviewable together; follow the
[CI tooling maintenance guide](https://github.com/Ponchia/bronto-ui/blob/main/.github/tooling/README.md).

Validation, preflight and publication verify the source and actual installed
dependency graph, then audit all components, including the CLI identity, against
the public advisory registry. A high/critical finding or unavailable audit blocks
candidate execution. The original vulnerable bundled distribution was retired as an executable
release input and removed from the committed tooling graph in PR #288.
Adversarial negative controls use synthetic audit and integrity fixtures,
not a retained vulnerable installable dependency; the historical review is in
issue #234. This does not weaken the live publisher's fail-closed audit.
Review the retained audit artifact and the tooling guide before approving a
release. Earlier success does not replace a fresh publication-time audit.

A dry run validates package assembly without publishing or validating the
npm-side OIDC exchange. Changes to the registered repository, workflow,
environment, or allowed publishing operation must also follow
[ADR-0006](adr/0006-trusted-publishing.md).

## After Publish

1. Confirm the npm package page shows the new version and provenance.
2. Confirm the recorded `npm view @ponchia/ui version dist-tags --json` reports the expected
   `latest` / `next`.
3. Confirm the GitHub Release body is the curated changelog section.
4. Run one clean consumer install if the release touched exports, package files,
   behavior lifecycles, glyphs, or docs shipped in the tarball.

## Rollback

Published npm versions are immutable. If a bad stable version ships:

1. Deprecate the exact version with a clear reason and replacement.
2. Publish a fixed patch as soon as possible.
3. Add a changelog note and, for security issues, use GitHub private security
   advisories.
4. Do not move `latest` backward unless there is no viable fixed version; prefer
   deprecation + forward patch.
