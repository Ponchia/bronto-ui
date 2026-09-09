# 0006. Publish to npm without a stored credential

Status: accepted; applies from 0.10.0

## Context

Releases authenticated to npm with a granular access token held in the
`NPM_TOKEN` secret of the protected `npm-publish` environment. The token was
created on 2026-05-30 with 2FA bypass, write access to `@ponchia/ui`, and an
expiry of 2026-08-28.

The v0.10.0 release exposed the cost of that design. Every gate passed —
validation, cross-engine end-to-end, packed examples, publish preflight — the
maintainer approved the protected environment, and the publish then failed
with `E404` on an existing package. `E404` reads as "no such package", so the
first hypothesis was package metadata. The real cause was that the token had
expired eleven days earlier. A read-only `whoami` request would have returned
`401` at any point in those eleven days, but nothing was asking.

Three properties of the old design combined into that outcome:

- The credential's validity was invisible until the most expensive moment in
  the pipeline, after roughly twenty minutes of gates and a human approval.
- npm's failure mode misattributes an authentication problem to the package,
  so the error text actively points investigation the wrong way.
- Expiry is silent. Nothing in the repository, the environment, or CI knew the
  date; it lived only in a note beside the token in the password manager.

The approval gate did not and could not help. A required reviewer releases the
job; it does not check that the job can authenticate.

Two further constraints made "rotate the token and continue" unattractive.
From August 2026 npm forbids tokens with 2FA bypass from performing token
management, so a CI token can no longer mint or rotate its successor — every
renewal is a manual browser session with a second factor. And npm has stated
that direct token publishing will be reduced further, with trusted publishing
as the endorsed path.

Trusted publishing was previously assessed as unavailable to this estate: npm
supports it only on provider-hosted runners, and most repositories here run on
self-hosted `arc-vps-*` runners because GitHub-hosted minutes are billing
blocked. That assessment does not hold for this repository. `bronto-ui` is
public, so GitHub-hosted minutes are free, and the release workflow already
runs entirely on `ubuntu-latest`.

## Decision

Publish by trusted publishing (OIDC). No npm credential is stored.

GitHub mints a short-lived token for the workflow run; npm exchanges it for a
publish credential scoped to that run. The publisher is registered on npmjs.com
against a four-part identity: the organization `Ponchia`, the repository
`bronto-ui`, the workflow filename `release.yml`, and the environment
`npm-publish`. All four must match or the exchange is refused.

Two conditions are enforced by `check:release` rather than left to review,
because both fail only at publish time:

- `publish-npm` raises the npm CLI past 11.5.1. Node 22 bundles npm 10.x,
  which predates OIDC support and falls back to looking for a token.
- `publish-npm` references neither `NODE_AUTH_TOKEN` nor `secrets.NPM_TOKEN`.
  A reintroduced token takes precedence over OIDC, which would quietly restore
  the failure mode this decision removes.

## Consequences

The expiry class of failure is gone: there is no long-lived credential, so
there is no date to miss and no rotation to schedule. The blast radius of a
compromised repository secret shrinks to nothing, because the secret does not
exist. Provenance is generated automatically instead of depending on a flag.

The identity is now positional, which is the cost. Renaming `release.yml`,
moving the publish to another environment, or transferring the repository
breaks publishing until the npm-side registration is updated — a rename that
is otherwise routine becomes a release-blocking change. The workflow header
and `docs/architecture.md` both say so at the point where someone would make
that edit.

Registration itself remains a browser action requiring the maintainer's second
factor. That is a one-time cost rather than a recurring one, which is the
whole point.

The `NPM_TOKEN` secret and its password-manager entry are retired after the
first successful trusted publish, not before, so the previous path stays
available if the exchange needs debugging.

Like every other ADR, this record ships in the package. `check:pack` enforces
that: the published documentation points into `docs/adr/`, so an ADR that
exists but is not in `files` leaves a consumer following that pointer at a
404. The decision set is published whole or not at all — a release-mechanics
record is not carved out on the grounds that consumers are unlikely to want
it.
