# CI tooling inputs

These files are maintainer tooling. They are excluded from the published UI
package, which continues to have zero runtime dependencies.

## Protected npm publisher

`npm/package.json` and `npm/package-lock.json` lock the release CLI separately
from the framework's development dependencies. The selected npm version is
11.21.1; its registry metadata points to the upstream
[npm/cli release commit](https://github.com/npm/cli/commit/8834421d14085fdf6e871e6f3a20f6ae1b3de599).
The lock records the registry tarball URL and SHA-512 integrity. npm bundles its
own dependencies inside that integrity-checked tarball, so the bundled package
entries inherit the tarball's byte-level pin.

The protected `publish-npm` job uses the runner's npm only to execute:

```bash
npm ci --prefix .github/tooling/npm --ignore-scripts --no-audit --no-fund
```

CI and release validation prove the installed CLI's version and run a package
assembly dry run before protected approval. The preflight manifest is produced
by this same CLI. For local verification:

```bash
node .github/tooling/npm/node_modules/npm/bin/npm-cli.js --version
node .github/tooling/npm/node_modules/npm/bin/npm-cli.js pack --dry-run --ignore-scripts --json
```

The actual publish remains inside `release.yml`, after all release gates and
the `npm-publish` Environment approval. The job disables automatic npm caching,
does not retain the checkout credential, and passes `--ignore-scripts` when
publishing. This tooling project must stay private and separate from the root
manifest. Trusted publishing requires a supported GitHub-hosted runner,
[Node.js 22.14.0+ and npm 11.5.1+](https://docs.npmjs.com/trusted-publishers/);
the repository's development toolchain uses Node.js 22.23.4 or later in the
Node.js 22 line.

### Updating the CLI

Dependabot proposes updates for this isolated directory. Review the exact npm
release, its Node engine range, registry metadata, and upstream changes. To
prepare an update manually, substitute the reviewed version below:

```bash
npm install --prefix .github/tooling/npm --package-lock-only --ignore-scripts --save-exact npm@VERSION
npm ci --prefix .github/tooling/npm --ignore-scripts --no-audit --no-fund
node .github/tooling/npm/node_modules/npm/bin/npm-cli.js --version
node scripts/check-release.mjs
node --test test/workflow-gates.test.mjs
```

Update the version and source reference in these notes too. Review the lock
diff and run the normal integrity checks before merging; the release workflow
and protected Environment identity remain unchanged.

## Current npm bundle advisory review

### Review on 24 October 2026

The result below is historical. The newer reviewed advisory data also flags
bundled `undici@6.29.0`: GHSA-4qv8-2p9j-2685 (moderate) and
GHSA-xjj6-f33q-929c (high), both fixed in Undici 6.29.1. The existing
`ip-address@10.7.2` moderate finding remains. Integrity-verified npm 11.21.1 and
12.2.1 archives both contain these affected versions, so neither a major CLI
upgrade nor a lockfile metadata edit resolves the bundled code.

Track all three advisories in
[issue #234](https://github.com/Ponchia/bronto-ui/issues/234). Keep the complete
publisher audit and existing security gates intact. The root development graph
is patched independently; it does not replace npm's embedded packages.

### Historical review on 23 October 2026

On 2026-10-23, the committed isolated publisher lock was updated to npm 11.21.1.
The complete lockfile audit reports **one moderate advisory** (exit 1), affecting
bundled `ip-address@10.7.2`. Reproduce the publisher audit separately from the
root development-tool audit:

```bash
npm audit --prefix .github/tooling/npm --package-lock-only --json
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
apply. Findings remain advisory; invalid configuration, download failures, and
other scanner execution errors fail the job. `ci-gate` requires successful SAST
execution, including on docs-only changes; advisory findings do not bypass or
weaken any of the other required jobs.

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
