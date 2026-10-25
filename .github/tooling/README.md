# CI tooling inputs

These files are maintainer tooling. They are excluded from the published UI
package, which continues to have zero runtime dependencies.

## Protected npm publisher

`tooling/npm/package.json` and `tooling/npm/package-lock.json` lock the release CLI separately
from the framework's development dependencies. The selected npm version is
11.21.1; its registry metadata points to the upstream
[npm/cli release commit](https://github.com/npm/cli/commit/8834421d14085fdf6e871e6f3a20f6ae1b3de599).
The lock records the registry tarball URL and SHA-512 integrity. npm bundles its
own dependencies inside that integrity-checked tarball, so the bundled package
entries inherit the tarball's byte-level pin.

The protected `publish-npm` job uses the runner's npm only to execute:

```bash
npm ci --prefix tooling/npm --ignore-scripts --no-audit --no-fund
```

CI and release validation prove the installed CLI's version and run a package
assembly dry run before protected approval. The preflight manifest is produced
by this same CLI. For local verification:

```bash
audit_report="$(mktemp)"
node scripts/audit-publishing-tooling.mjs tooling/npm "$audit_report" &&
  node tooling/npm/node_modules/npm/bin/npm-cli.js --version &&
  node tooling/npm/node_modules/npm/bin/npm-cli.js pack --dry-run --ignore-scripts --json
```

The actual publish remains inside `release.yml`, after all release gates and
the `npm-publish` Environment approval. The job disables automatic npm caching,
does not retain the checkout credential, and passes `--ignore-scripts` when
publishing. This tooling project must stay private and separate from the root
manifest. Trusted publishing requires a supported GitHub-hosted runner,
[Node.js 22.14.0+ and npm 11.5.1+](https://docs.npmjs.com/trusted-publishers/);
the repository's development toolchain uses Node.js 22.23.4 or later in the
Node.js 22 line.

### Publication advisory guard

Both `publish-preflight` and `publish-npm` run
`scripts/audit-publishing-tooling.mjs` after the isolated install. The guard
inventories the actual installed package manifests, requires an exact match to
the complete lock, checks the reviewed npm archive URL/integrity, and audits that
graph with the runner-provided npm against the public registry. It rejects
high/critical findings, malformed/inconsistent reports, missing packages,
metadata-only version changes, and unsuccessful or unavailable audits. In these two release stages, the
candidate CLI does not run until this guard passes. Raw audit results and
failure details are retained for seven days, including on failure.

The current 11.21.1 bundle fails this guard on its high advisory. This is an
intentional release blocker pending a genuinely patched upstream distribution;
it does not prevent deterministic CI tests of the guard or ordinary UI work.
No advisory scope or package is ignored. Moderate findings remain in the report.
A future candidate must update the manifest, lock, reviewed version/URL/integrity
in the guard, and source references together, then prove actual inventory and a
fresh complete audit before publishing. Offline tests cover malformed reports,
execution failures, high/critical findings, and inconsistent installed bytes.

### Check readiness without a release tag

Run `npm run publisher:readiness -- /path/to/evidence-parent` from a clean
checkout. The command installs only the reviewed publisher lock into a fresh,
private temporary directory, with lifecycle scripts disabled. It runs the same
complete installed-inventory/advisory guard as publication **before executing
the candidate CLI**. Only a successful audit permits a version check and package
assembly dry run. It does not change the checkout, create a tag, approve an
Environment, request OIDC credentials or publish anything.

Every attempt retains `readiness.json`, input hashes, installation diagnostics,
and any raw `audit.json`/`pack.json` in its own directory. Failure retains a
`failure.json`; installed executables are removed on either outcome. Exit 0
means this publisher passed this observation, not that a release is approved.
Exit 1 includes the current high-advisory blocker and unavailable audits. The
normal release gates and their fresh publication-time audit remain required.

The manual **Publisher readiness** GitHub workflow runs the same command on a
clean hosted runner and retains evidence for seven days, including blocked
results. It has read-only repository permissions, no publish Environment, no
OIDC permission, no stored checkout credential and no dependency cache. A
blocked result is expected while the upstream advisory remains; it is not a
request to bypass the release guard. Trigger it with
`gh workflow run publisher-readiness.yml` after the reviewed change reaches main.

### Updating the CLI

The dependency updater proposes patch/minor updates for the isolated `tooling/npm` project.
Version-update major CLI changes require manual review. The `allow.update-types`
selection keeps security updates eligible, including major security updates
([version-only selection](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference#update-types-allow)).
All three ecosystem entries use an
explicit seven-day version `cooldown`; GitHub exempts security updates from it
([configuration reference](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference#cooldown)).

The old `/.github/tooling/npm` update reached `create_pull_request` before
GitHub rejected it with HTTP 400, `invalid or unauthorized changes`
([run 40055277882](https://github.com/Ponchia/bronto-ui/actions/runs/40055277882)).
This was a PR validation failure after successful resolution, not an npm install
failure. Moving the unchanged manifest/lock to conventional `tooling/npm` avoids
the special GitHub configuration subtree while keeping the publisher isolated.
The backend did not identify the rejected file, so the location is a repair
candidate, not a proven root cause. Ignoring majors alone cannot repair it.
Confirm a successful hosted updater PR creation after this configuration
lands; a local lock update or CI dry run cannot prove the private backend
accepts an update. If it still fails, retain that run and escalate to GitHub
Support rather than removing the lock or weakening publisher controls.

Review the exact npm
release, its Node engine range, registry metadata, and upstream changes. To
prepare an update manually, substitute the reviewed version below:

```bash
npm install --prefix tooling/npm --package-lock-only --ignore-scripts --save-exact npm@VERSION
```

Before running that candidate, review the lock diff and update the exact
`candidate` version, archive URL and SHA-512 integrity in
`scripts/audit-publishing-tooling.mjs` from verified registry metadata. Update
the source reference in these notes too. Then install without lifecycle scripts
and let the guard compare the installed bundle with the reviewed lock and run
a fresh complete audit:

```bash
npm ci --prefix tooling/npm --ignore-scripts --no-audit --no-fund
audit_report="$(mktemp)"
node scripts/audit-publishing-tooling.mjs tooling/npm "$audit_report" &&
  node tooling/npm/node_modules/npm/bin/npm-cli.js --version &&
  node scripts/check-release.mjs &&
  node --test test/workflow-gates.test.mjs
```

Keep the raw audit and any adjacent `.failure.json` with the review evidence.
A nonzero guard result stops qualification; it is not a reason to remove a
package from the audit or change the threshold. Run the normal integrity checks
before merging. The release workflow and protected Environment identity remain
unchanged.

## Current npm bundle advisory review

### Review on 24 October 2026

**Publication remains blocked.** The latest registry distribution, npm 12.2.1,
and the selected 11.x distribution, npm 11.21.1, both contain these affected
bundled packages in their integrity-verified archives:

| Bundled package | Advisory | Severity | First patched version |
| --- | --- | --- | --- |
| `undici@6.29.0` | [GHSA-xjj6-f33q-929c](https://github.com/advisories/GHSA-xjj6-f33q-929c) | High | 6.29.1 |
| `undici@6.29.0` | [GHSA-4qv8-2p9j-2685](https://github.com/advisories/GHSA-4qv8-2p9j-2685) | Moderate | 6.29.1 |
| `ip-address@10.7.2` | [GHSA-rxp7-6hxx-x8q5](https://github.com/advisories/GHSA-rxp7-6hxx-x8q5) | Moderate | 10.7.4 |

The 23 October result below predates the newer Undici advisory data. It does
not establish that today's publisher is clear. A major CLI bump to the examined
12.2.1 archive, a root dependency upgrade, or a lockfile metadata edit cannot
replace the affected bundled code.

To qualify a replacement, inspect the actual upstream archive and update the
reviewed manifest, lock and guard metadata together. The installed inventory
must match that lock, and a fresh complete audit must pass the existing
high/critical threshold. The replacement must also satisfy the documented
trusted-publishing Node/npm requirements and the normal release checks. Keep
any remaining moderate findings visible; clearing the publication threshold
alone does not close every advisory in
[issue #234](https://github.com/Ponchia/bronto-ui/issues/234).

Do not push a release tag or seek protected-environment approval while the
candidate fails this guard. UI fixes and consumer updates to an already
published version can proceed independently. A successful ordinary CI run
proves the deterministic guard tests, not the live state of the publisher's
advisories. Keep the complete publisher audit and existing controls intact;
do not repack npm, suppress an advisory or relabel its embedded dependencies.

### Historical review on 23 October 2026

On 2026-10-23, the committed isolated publisher lock was updated to npm 11.21.1.
The complete lockfile audit reports **one moderate advisory** (exit 1), affecting
bundled `ip-address@10.7.2`. Reproduce the publisher audit separately from the
root development-tool audit:

```bash
npm audit --prefix tooling/npm --package-lock-only --json
npm audit --package-lock-only --json
```

[GHSA-rxp7-6hxx-x8q5](https://github.com/advisories/GHSA-rxp7-6hxx-x8q5)
affects `ip-address` through 10.7.3 and names 10.7.4 as patched. Both examined
upstream npm distributions, 11.21.1 and 12.2.1, still bundle 10.7.2. The 11.x
patch therefore captures the available improvements without an unrelated major
CLI migration. Keep [issue #234](https://github.com/Ponchia/bronto-ui/issues/234)
open until an upstream npm distribution ships a fixed bundle; an audit's generic
`fixAvailable` flag is not proof that updating
the installed CLI will replace its bundled files.

The reviewed npm 11.21.1 tarball also updates these previously affected bundles:

| Bundled package | Previous | Current | Audit result on 2026-10-23 |
| --- | --- | --- | --- |
| brace-expansion | 5.0.9 | 5.0.12 | No current matching advisory |
| http-cache-semantics | 4.2.0 | 4.3.0 | No current matching advisory |
| postcss-selector-parser | 7.1.4 | 7.1.6 | No current matching advisory |
| undici | 6.28.0 | 6.29.0 | No current matching advisory |

The `http-cache-semantics` advisory names no first patched version; its current
affected range and the audit no longer match 4.3.0. This records the observed
result, rather than inventing an upstream fix declaration. The newer
`ip-address` bundle clears the four older findings but retains the advisory above.

This is the release tool's complete dependency graph, including npm's bundled
packages. The separate full root lockfile audit, including development
dependencies, reported **zero vulnerabilities** (exit 0) on 2026-10-23.
`braces@3.0.3` remains locked, but GitHub withdrew
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
on that date because it is not practically exploitable. See
[the security policy](../SECURITY.md#lint-dependencies) for the lint context.
Neither tooling graph is included in the published UI package.

The npm release commit, registry tarball URL and SHA-512 integrity are reviewed
with the lock. Integrity locking does not remediate a vulnerability. Overrides
were previously verified not to replace npm's bundled files; do not retain
ineffective overrides or repack the upstream npm distribution. The existing
protected approval, short-lived OIDC, disabled lifecycle and cache controls
remain in force, without claiming every vulnerable path is unreachable.

## Semgrep

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
