# CI tooling inputs

Tooling is excluded from the published `@ponchia/ui` tarball. The library
declares no runtime dependencies. Security checks must audit the *executed*
publisher and retain its complete dependency graph, not a deprecated test
candidate.

## Active publishing inputs

The protected workflow uses unchanged official npm 11.21.1 source, pinned to
upstream commit `1e39046cfae5a28c06e048403199c35458133ff3`. The archive
URL, byte size, SHA-512 and SHA-256 of all retained source files are reviewed in
`tooling/publisher/source.json`. `scripts/extract-publisher-source.py`
rejects extra, missing, modified, duplicate and linked files.

A separate `tooling/publisher/package-lock.json` pins the complete production
dependency graph from the original source. Compatible patched `undici@6.29.1`
and `ip-address@10.7.4` are selected with their actual registry-integrity
bytes. `scripts/source-publisher.mjs` verifies the installed graph, includes
the unchanged CLI in the audit inventory, writes the raw npm audit output and
applies the shared fail-closed `scripts/lib/publisher-audit.mjs` validator
**before executing any publisher CLI code**. High/critical advisories, missing
packages, incomplete audits, malformed responses or installation failures
block publication. Neither source nor lockfile metadata can make a known
vulnerable installed package safe.

The official npm *bundled distribution* was reviewed and found to include
affected Undici and ip-address. It was replaced as an execution input by
#281; it was never repacked or relabeled. The old `tooling/npm` lock was
subsequently removed because no current workflow runs that distribution.
Retaining its vulnerable packages solely as a committed negative-control
dependency graph caused Dependabot to raise alerts that did not describe
executed tooling. The adversarial coverage is retained using synthetic
installed-inventory, source-integrity and audit-report fixtures in
`test/source-publisher.test.mjs` and `test/publishing-tooling.test.mjs`.
There is no exemption, suppressed live advisory, or reduced audit threshold.
See [issue #234](https://github.com/Ponchia/bronto-ui/issues/234) for the
dated investigation and upstream-bundle evidence.

### Read-only qualification

Use `npm run publisher:readiness -- /path/to/evidence-parent` to prepare an
ephemeral source-locked runtime with lifecycle scripts disabled, inventory its
actual source and dependencies, audit the complete graph and attempt package
assembly only if clean. It retains JSON evidence and removes executable source
and dependencies on every result. The equivalent manual GitHub Actions workflow
has no publish Environment, OIDC permissions or registry-write step. Neither
readiness result is an approval or a publication.

The `release.yml` job uses the existing `npm-publish` protected environment,
short-lived OIDC, provenance and `--ignore-scripts`. Validation, all browser
engines, packed examples and live publisher preflight must pass before that
job. The publish stage independently repeats the complete audit. Changing
publisher identity, the upstream source or the dependency lock requires a
separate reviewed change with full CI and a new live publisher observation.

Version 0.18.1 was published successfully on 29 October 2026 with trusted
provenance. The registry reports the attestation at
`https://registry.npmjs.org/-/npm/v1/attestations/@ponchia%2fui@0.18.1`.
A successful past release does not override a new advisory; always audit the
current installed executable before releasing again.

### Updating the publisher

Review the exact upstream npm source, supported Node runtime and official
registry metadata. Regenerate the reviewed source-file hashes and separate
integrity-locked production graph together. Confirm the installed contents
and all dependency edges, rerun the full live audit, execute package assembly
in a clean consumer and pass the protected workflow checks. Dependabot
proposes changes to `/tooling/publisher`; it no longer updates the removed
bundled-distribution negative control. If an official bundled CLI eventually
becomes clean, returning to it requires an explicit separate review.

## Static analysis


The `sast` job runs the [official Semgrep image](https://hub.docker.com/r/semgrep/semgrep)
at `semgrep/semgrep:1.166.0`, pinned to OCI index digest
`sha256:c180f0c93a17b420c0af5006214a29d3c747c5459c732b740191adf657dd0068`.
The tag is a readable version label; the digest fixes the executable, Python
dependencies, and base image used by the job. No pip resolution occurs in CI.
The digest was verified against the Docker Registry response bytes on
2026-10-12. The image provides Linux amd64 and arm64 variants.

The toolchain is pinned; the **`p/default` rule feed deliberately stays current**.
It is data used by the scanner, not a package installation. This keeps the full
upstream default threat coverage without maintaining a selected subset. The
same source and tool image can therefore produce new findings when the feed
changes. For a finding under review, retain the scan log and rule identifier;
do not claim scans are completely reproducible across rule-feed revisions.
Metrics and version checks are disabled. Existing `.semgrepignore` rules still
apply. CI retains full JSON and SARIF for seven days on success or failure.
`ci-gate` requires SAST on docs-only changes too. New or changed findings fail
`semgrep-gate.py`; scanner execution/configuration errors always fail.

`semgrep-baseline.json` is an explicit review ledger, not a set of ignored rules
or files. Every finding exception binds its exact rule, path, start/end location
and the SHA-256 of the entire source file and rule details (message, severity,
metadata), plus a rationale and evidence. Editing
source context invalidates the exception. Duplicates cannot reuse an exception.
Removed findings are allowed and reported as stale entries for later pruning.
The scanner still reports every reviewed finding in its JSON/SARIF output.

The pinned scanner has documented partial-parser limitations on HTML comment
regular expression literals, literal ampersands in static HTML fixtures, and Actions
expressions parsed as shell. Each known diagnostic is separately bound to the
complete diagnostic JSON and whole-file hash. Only these exact warning-level
`PartialParsing` diagnostics may pass; new/changed diagnostics, timeouts, empty
scans, malformed results and execution errors fail. These limitations mean the
scan does not prove complete parsing of those constructs. Every scan path and rule remains. See the per-entry parser rationale and independent syntax checks.

### Finding review on 24 October 2026

[Run 40092974432](https://github.com/Ponchia/bronto-ui/actions/runs/40092974432)
reported 17 findings. Three were missing-cooldown recommendations, resolved by
setting seven days on each ecosystem. The other 14 are audit false positives
under the reviewed source and input contracts:

| Locations | Count | Review and regression evidence |
| --- | --- | --- |
| Site HTML escaping (now `scripts/lib/html-text.mjs`) | 4 | All occurrences of `&`, `<`, `>` and double quotes are encoded, ampersands first. Call sites use text or double-quoted attributes, never CSS/script or URL validation. `test/html-text.test.mjs` parses hostile values and confirms exact round trips without injected elements/attributes. |
| Changelog/release token regular expressions, release job name, component array name, ownership word | 5 | Dynamic literals escape every regular expression special character; the remaining regular expression structures are fixed. `test/security-contexts.test.mjs` exercises literal regular expression special characters and release version boundaries; `check:release`, `check:component-matrix` and `check:behavior-matrix` exercise the ownership/array contracts. |
| Report vocabulary, schema pattern, font token regular expressions | 3 | Report words come from fixed severity/status enumerations; schema patterns are maintainer-owned checked-in JSON, not a user-supplied schema service; font tokens are the two fixed `LEAVES` constants. `check:report`, `check:schemas`, `test/report-schema.test.mjs` and `test/font-leaves.test.mjs` exercise them. |
| Consumer and glyph test fixtures | 2 | `root` is a temporary filesystem path, not script content. The glyph test uses an inert DOM fragment to assert hostile labels cannot introduce markup. Both original regression tests remain. |

The baseline has no automatic accept/update command. When the feed or a reviewed
file changes, inspect the complete finding or diagnostic, its input and output contexts,
and its behavioral regression proof before explicitly updating the relevant
identity and rationale. Gate tests mutate rule, location, source, multiplicity,
scanner version and diagnostics to prove changed/new results fail.

To update Semgrep, review the intended upstream release and obtain the official
image digest (`docker buildx imagetools inspect semgrep/semgrep:VERSION`). Pin
both version and digest in `ci.yml`, update these notes, and prove in CI that
checkout plus the full `semgrep scan --config p/default` command still run.
Changing the rules feed or exclusions is a separate coverage decision.

## GitHub Actions

Workflow actions are pinned to full commit SHAs. The setup-node 7.1.0,
upload-artifact 7.0.2, download-artifact 8.0.2, and CodeQL 4.38.3 updates were
reviewed from [Dependabot PR #244](https://github.com/Ponchia/bronto-ui/pull/244)
and integrated on the maintainer branch. Their SHAs were checked against the
upstream release tags; future updates should follow the same review path.

## Browser failure reports

The reusable e2e workflow retains `playwright-report/` and `test-results/` for
seven days when a job fails or its JSON reporter records a passing retry.
Ordinary successful runs do not upload these reports. The same retention rules
apply to pull requests, main CI, and release runs.
