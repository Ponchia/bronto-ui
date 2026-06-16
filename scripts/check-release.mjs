/**
 * Release-hygiene gate. Enforce both halves of the release contract:
 *
 * 1. The version in package.json must NOT map to a CHANGELOG heading still
 *    marked "unreleased". A published version that is still labelled
 *    unreleased (the 0.3.0 defect) is now a hard CI failure.
 * 2. .github/workflows/release.yml must keep publishing gated on the checks
 *    the release documentation promises: tag ancestry/version validation,
 *    e2e, packed examples, preflight, protected npm publish, and release notes
 *    only after npm succeeds.
 *
 * The in-development next version may live under an "## Unreleased — x.y.z"
 * heading; that is allowed *until* package.json is bumped to that version, at
 * which point the heading must be dated.
 *
 * Run: node scripts/check-release.mjs
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { reportAndExit } from './lib/gate-report.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const changelog = readFileSync(resolve(root, 'CHANGELOG.md'), 'utf8');
const releaseWorkflow = readFileSync(resolve(root, '.github/workflows/release.yml'), 'utf8');
const errors = [];

const version = pkg.version;
// A prerelease (e.g. 0.4.0-rc.1 — any SemVer prerelease identifier) is
// cut against the in-development stable target (0.4.0) and maps to that
// base version's CHANGELOG section, which is allowed to still be
// "## Unreleased — 0.4.0". Only the final stable release must carry a
// dated heading. So for a prerelease we require the base section to
// exist but do NOT demand it be dated/non-"unreleased".
const prerelease = version.includes('-');
const target = prerelease ? version.split('-')[0] : version;
const headings = [...changelog.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1].trim());

// A heading "owns" the version if the (base) version string appears in it.
const owning = headings.filter((h) => h.includes(target));

if (owning.length === 0) {
  errors.push(
    `package.json version ${version} has no CHANGELOG section ` +
      (prerelease
        ? `(expected "## ${target} — <date>" or "## Unreleased — ${target}" for the prerelease's base version)`
        : `(expected a "## ${target} — <date>" heading)`),
  );
} else if (!prerelease) {
  for (const h of owning) {
    if (/unreleased/i.test(h)) {
      errors.push(
        `CHANGELOG heading "## ${h}" still says "unreleased" but ` +
          `package.json is already at ${version} — date it before release`,
      );
    } else if (!/\d{4}-\d{2}-\d{2}/.test(h)) {
      errors.push(
        `CHANGELOG heading "## ${h}" for the released version ${version} ` +
          `must carry an ISO date (## ${version} — YYYY-MM-DD)`,
      );
    }
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function jobBlock(name) {
  const match = new RegExp(
    `\\n  ${escapeRegExp(name)}:\\n([\\s\\S]*?)(?=\\n  [a-zA-Z0-9_-]+:\\n|\\n*$)`,
  ).exec(`\n${releaseWorkflow}`);
  if (!match) errors.push(`release workflow is missing ${name} job`);
  return match?.[1] ?? '';
}

function requireWorkflowMatch(label, regex) {
  if (!regex.test(releaseWorkflow)) errors.push(`release workflow ${label}`);
}

function requireWorkflowNotIncludes(label, needle) {
  if (releaseWorkflow.includes(needle)) errors.push(`release workflow ${label}`);
}

function requireJobIncludes(jobName, job, label, needle) {
  if (!job.includes(needle)) errors.push(`release workflow ${jobName} job ${label}`);
}

function requireJobNotIncludes(jobName, job, label, needle) {
  if (job.includes(needle)) errors.push(`release workflow ${jobName} job ${label}`);
}

function requireJobMatch(jobName, job, label, regex) {
  if (!regex.test(job)) errors.push(`release workflow ${jobName} job ${label}`);
}

requireWorkflowMatch(
  'must trigger only from pushed v* tags',
  /^on:\s*\n\s+push:\s*\n\s+tags:\s*\[\s*['"]v\*['"]\s*\]/m,
);
requireWorkflowNotIncludes('must not add a pull_request trigger', 'pull_request:');
requireWorkflowNotIncludes('must not add a manual workflow_dispatch trigger', 'workflow_dispatch:');
requireWorkflowNotIncludes('must not add branch push triggers', 'branches:');
requireWorkflowMatch(
  'must default to read-only contents permissions',
  /\npermissions:\s*\n\s+contents:\s*read\b/,
);

const validateJob = jobBlock('validate');
requireJobIncludes('validate', validateJob, 'must check out full history', 'fetch-depth: 0');
requireJobIncludes(
  'validate',
  validateJob,
  'must verify the tag commit is reachable from origin/main',
  'git merge-base --is-ancestor "$GITHUB_SHA" refs/remotes/origin/main',
);
requireJobIncludes(
  'validate',
  validateJob,
  'must run npm run check, which includes check:unit',
  '- run: npm run check',
);
if (!(pkg.scripts?.check ?? '').includes('npm run check:unit')) {
  errors.push(
    'package.json check script must include check:unit because release validate relies on it',
  );
}
requireJobNotIncludes(
  'validate',
  validateJob,
  'must not duplicate npm test outside npm run check',
  '- run: npm test',
);
requireJobIncludes(
  'validate',
  validateJob,
  'must derive the package version from the v-prefixed tag',
  'tag="${GITHUB_REF_NAME#v}"',
);
requireJobIncludes(
  'validate',
  validateJob,
  'must compare the tag to package.json version',
  `require('./package.json').version`,
);

const e2eJob = jobBlock('e2e');
requireJobIncludes('e2e', e2eJob, 'must wait for validate', 'needs: validate');
requireJobIncludes(
  'e2e',
  e2eJob,
  'must reuse the shared e2e workflow',
  'uses: ./.github/workflows/e2e.yml',
);
requireJobMatch('e2e', e2eJob, 'must enable cross-engine coverage', /cross_engine:\s*true/);

const examplesJob = jobBlock('examples');
requireJobIncludes('examples', examplesJob, 'must wait for validate', 'needs: validate');
requireJobIncludes(
  'examples',
  examplesJob,
  'must reuse the shared examples workflow',
  'uses: ./.github/workflows/examples.yml',
);
requireJobMatch(
  'examples',
  examplesJob,
  'must enable cross-browser packed-example smoke',
  /cross_browser:\s*true/,
);
requireJobMatch(
  'examples',
  examplesJob,
  'must enable desktop and mobile packed-example visual smoke',
  /visual_smoke:\s*true/,
);

const preflightJob = jobBlock('publish-preflight');
requireJobIncludes(
  'publish-preflight',
  preflightJob,
  'must wait for validate, e2e, and examples',
  'needs: [validate, e2e, examples]',
);
requireJobIncludes(
  'publish-preflight',
  preflightJob,
  'must install without lifecycle scripts',
  'npm ci --ignore-scripts',
);
requireJobIncludes(
  'publish-preflight',
  preflightJob,
  'must dry-run the exact package without lifecycle scripts',
  'npm pack --dry-run --json --ignore-scripts',
);
requireJobIncludes(
  'publish-preflight',
  preflightJob,
  'must record the package size report',
  'npm run size:report',
);

const publishJob = jobBlock('publish-npm');
requireJobIncludes(
  'publish-npm',
  publishJob,
  'must wait for publish-preflight',
  'needs: publish-preflight',
);
requireJobIncludes(
  'publish-npm',
  publishJob,
  'must use the protected npm-publish environment',
  'environment: npm-publish',
);
requireJobIncludes(
  'publish-npm',
  publishJob,
  'must keep npm provenance id-token permission',
  'id-token: write',
);
requireJobIncludes(
  'publish-npm',
  publishJob,
  'must publish with scripts disabled and an explicit dist-tag',
  'npm publish --ignore-scripts --tag "$dist_tag"',
);
requireJobIncludes(
  'publish-npm',
  publishJob,
  'must derive the npm version from the v-prefixed tag',
  'version="${GITHUB_REF_NAME#v}"',
);
requireJobIncludes(
  'publish-npm',
  publishJob,
  'must route prereleases to the next dist-tag',
  'dist_tag=next',
);
requireJobIncludes(
  'publish-npm',
  publishJob,
  'must route stable releases to the latest dist-tag',
  'dist_tag=latest',
);
requireJobIncludes(
  'publish-npm',
  publishJob,
  'must use the npm environment secret only in the publish job',
  'NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}',
);

const releaseNotesJob = jobBlock('release-notes');
requireJobIncludes(
  'release-notes',
  releaseNotesJob,
  'must wait for successful npm publish',
  'needs: publish-npm',
);
requireJobIncludes(
  'release-notes',
  releaseNotesJob,
  'must use the curated CHANGELOG section',
  'node scripts/changelog-section.mjs "$REF_NAME"',
);
requireJobIncludes(
  'release-notes',
  releaseNotesJob,
  'must publish GitHub Release notes',
  'softprops/action-gh-release',
);
requireJobIncludes(
  'release-notes',
  releaseNotesJob,
  'must flag hyphenated SemVer tags as prereleases',
  "prerelease: ${{ contains(github.ref_name, '-') }}",
);

reportAndExit(errors, {
  label: 'release-hygiene',
  ok: prerelease
    ? `release hygiene: prerelease v${version} maps to the "${target}" CHANGELOG section and release workflow gates are intact`
    : `release hygiene: v${version} maps to a dated CHANGELOG section and release workflow gates are intact`,
});
