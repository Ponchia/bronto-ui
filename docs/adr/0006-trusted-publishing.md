# 0006. Publish to npm without a stored credential

Status: accepted; applies from 0.10.0. CLI installation refined in October 2026.

## Context

Earlier releases used a stored npm access token. During the 0.10.0 release,
that token expired even though validation, browser tests, packed examples,
and the maintainer's environment approval all passed. npm returned `E404`
at publication, delaying the release while the authentication failure was
investigated.

The project needed publishing credentials whose lifetime followed a release
run. An environment approval determines whether a job may proceed; it does
not establish that the job can authenticate to npm.

## Decision

Publish through GitHub Actions using npm trusted publishing (OIDC). The
`publish-npm` job runs on a GitHub-hosted runner, receives `id-token: write`,
and waits for the protected `npm-publish` environment's approval. It publishes
with lifecycle scripts disabled and provenance enabled.

The registered publisher identifies these repository settings:

| Field | Value |
| --- | --- |
| GitHub owner | `Ponchia` |
| Repository | `bronto-ui` |
| Workflow filename | `release.yml` |
| Environment | `npm-publish` |
| Publishing operation | Direct `npm publish` |

Changing the owner, repository, workflow filename, environment, or allowed
operation requires reviewing the npm-side registration before releasing.
The package's `repository.url` must continue to identify this repository.

npm documents a minimum of Node 22.14.0 and npm CLI 11.5.1 for trusted
publishing. The release workflow uses Node 22 and installs its npm CLI from
the private, integrity-locked manifest under `tooling/npm/`, with
`npm ci --ignore-scripts`. It invokes that installed CLI directly. The
[CI tooling maintenance guide](https://github.com/Ponchia/bronto-ui/blob/main/.github/tooling/README.md)
explains how the executable is updated and verified.

`check:release` checks the installation and invocation contract alongside the
existing release gates. The publish job contains neither `NODE_AUTH_TOKEN`
nor a reference to `secrets.NPM_TOKEN`. The CLI can use OIDC before falling
back to traditional authentication; keeping stored credentials out of this
job preserves the intended authentication path.

## Consequences

The release workflow no longer relies on the expiry or rotation of a stored
npm token. The protected environment, validation, browser tests, packed
examples, and preflight still gate publication. Website deployments remain
separate from package releases.

A green PR can verify the locked CLI and perform a dry run, but it cannot
prove the npm-side identity exchange without an authorized publish. A
publisher-registration change therefore needs release-specific verification.
Do not reintroduce a stored token to work around an identity mismatch.

This ADR is part of the published documentation and remains covered by the
package-content and documentation-link checks.

## Reference

[npm's trusted publishing documentation](https://docs.npmjs.com/trusted-publishers/)
is the source for current provider support, runtime requirements, publisher
registration, and authentication behavior.
