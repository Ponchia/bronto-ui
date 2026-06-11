# Release Runbook

## Before Tagging

0. Run `npm run release:prep -- X.Y.Z` — bumps `package.json` + lock, dates the
   `## Unreleased — X.Y.Z` CHANGELOG heading, and re-pins every
   `@ponchia/ui@X.Y.Z` literal across the gated README/shipped docs **and** the
   ungated `demo/*.html` pages (the surface that drifted when this was manual).
1. Reconcile `README.md`, `CHANGELOG.md`, `ROADMAP.md`, `.github/SECURITY.md`, and
   `docs/adr/*` against the version being released.
2. Run `npm run check`, `npm test`, and the Playwright suite in the pinned
   container when visual baselines changed.
3. Run `npm run size:report` and call out any intentional payload increase in
   the changelog.
4. Build the packed example matrix from the tarball, not a workspace link.

## Publish

1. Land the release commit on `main`.
2. Push a `vX.Y.Z` tag. Stable tags publish to `latest`; prerelease tags publish
   to `next`.
3. Wait for `validate`, `e2e`, `examples`, and `publish-preflight` to pass.
4. Review the `publish-preflight` job summary: generated size report and pack
   manifest.
5. Approve the protected `npm-publish` environment only after the gates and
   preflight are green. After publish, the `publish-npm` summary attempts to
   record the npm registry view: published version, tarball, integrity, and
   current dist-tags. That observation is best-effort; the irreversible gate is
   the publish itself, not the later `npm view`.

## After Publish

1. Confirm the npm package page shows the new version and provenance.
2. Confirm the recorded `npm view @ponchia/ui version dist-tags --json` reports the expected
   `latest` / `next`.
3. Confirm the GitHub Release body is the curated changelog section.
4. Run one clean consumer install if the release touched exports, package files,
   bindings, glyphs, or docs shipped in the tarball.

## Rollback

Published npm versions are immutable. If a bad stable version ships:

1. Deprecate the exact version with a clear reason and replacement.
2. Publish a fixed patch as soon as possible.
3. Add a changelog note and, for security issues, use GitHub private security
   advisories.
4. Do not move `latest` backward unless there is no viable fixed version; prefer
   deprecation + forward patch.
