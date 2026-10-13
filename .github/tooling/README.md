# CI tooling inputs

These files are maintainer tooling. They are excluded from the published UI
package, which continues to have zero runtime dependencies.

## Protected npm publisher

`npm/package.json` and `npm/package-lock.json` lock the release CLI separately
from the framework's development dependencies. The selected npm version is
11.21.0; its registry metadata points to the upstream
[npm/cli release commit](https://github.com/npm/cli/commit/5fd1e17e468d58e7f14dc6cbb5390029ff49a41d).
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
the repository's development toolchain uses Node.js 22.22.2 or later in the
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

On 2026-10-12, the normal npm audit of this isolated project's committed lock
reported **five affected bundled packages: three high and two moderate**, across
12 advisory records. Reproduce it with:

```bash
node .github/tooling/npm/node_modules/npm/bin/npm-cli.js audit --prefix .github/tooling/npm --package-lock-only --json
```

This is the release tool's complete dependency graph, including npm's bundled
packages. It is separate from the root project's development-dependency audit
and from the published UI package's empty runtime dependency graph. The audit
exits 1 for the known findings; integrity locking does not remediate them.

- **brace-expansion 5.0.9 — high aggregate severity.**
  [GHSA-6j4f-fj2g-mc7p](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p)
  affects this major below 5.0.10 (high);
  [GHSA-qhr7-859c-m2p7](https://github.com/advisories/GHSA-qhr7-859c-m2p7)
  below 5.0.11 (high); and
  [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr)
  below 5.0.12 (moderate). Version 5.0.12 addresses all three listed ranges.
- **http-cache-semantics 4.2.0 — high.**
  [GHSA-ch52-4w7c-c8xp](https://github.com/advisories/GHSA-ch52-4w7c-c8xp)
  covers versions through 4.2.0. The advisory currently names no first patched
  version; do not infer remediation merely from a later version number.
- **ip-address 10.5.0 — moderate.**
  [GHSA-rpw4-54j3-4h4q](https://github.com/advisories/GHSA-rpw4-54j3-4h4q)
  and [GHSA-2vr4-cq9g-pvrc](https://github.com/advisories/GHSA-2vr4-cq9g-pvrc)
  cover 10.5.0 and name 10.5.1 as patched.
  [GHSA-j6r3-76f7-8jcv](https://github.com/advisories/GHSA-j6r3-76f7-8jcv)
  and [GHSA-h3mg-xc3c-68pw](https://github.com/advisories/GHSA-h3mg-xc3c-68pw)
  cover versions through 10.7.0 and name 10.7.1 as patched.
- **postcss-selector-parser 7.1.4 — moderate.**
  [GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf)
  affects versions below 7.1.6; 7.1.6 is the listed patch.
- **undici 6.28.0 — high aggregate severity.**
  [GHSA-rfgv-xxqx-mfg5](https://github.com/advisories/GHSA-rfgv-xxqx-mfg5)
  is high,
  [GHSA-3wwx-pv8p-q78v](https://github.com/advisories/GHSA-3wwx-pv8p-q78v)
  moderate, and
  [GHSA-r53p-7pc4-xj5r](https://github.com/advisories/GHSA-r53p-7pc4-xj5r)
  low. For the installed 6.x line, all three are patched in 6.28.1.

The examined upstream npm 12.2.0 distribution bundles the same affected set, so
a major CLI upgrade did not improve this audit. A disposable install also
verified that npm overrides left these bundled files unchanged; no ineffective
overrides or repacked npm distribution are kept here. Review a future upstream
CLI release that updates its bundle. The existing approval, short-lived OIDC,
disabled lifecycle, and cache controls remain in force; these are not a claim
that every advisory's vulnerable path is unreachable.

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
