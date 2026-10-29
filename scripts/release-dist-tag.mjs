/**
 * Choose the npm dist-tag for a release, so `latest` only ever moves forward.
 *
 * Usage: node scripts/release-dist-tag.mjs <version> <current-latest>
 *   e.g. node scripts/release-dist-tag.mjs 0.17.2 0.18.1   → maint-0.17
 *
 * - A SemVer prerelease (0.4.0-rc.1) goes to `next`.
 * - A stable version at or above the registry's current `latest` goes to
 *   `latest`.
 * - A stable version BELOW the current `latest` (a backport, or an older
 *   release re-run after a newer one published) goes to `maint-<major>.<minor>`.
 *   npm's dist-tags are last-writer-wins, so without this an older stable run
 *   that finishes last silently regresses `npm i @ponchia/ui`.
 *
 * Both arguments must be valid SemVer; the workflow fails closed when the
 * registry lookup for the current `latest` cannot be made. Prints the tag on
 * stdout; exits 2 on invalid input. No dependencies: the publish job installs
 * none.
 */
import { fileURLToPath } from 'node:url';

const SEMVER =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

function parse(value, label) {
  const match = SEMVER.exec(String(value ?? '').replace(/^v/, ''));
  if (!match) throw new Error(`${label} is not a SemVer version: ${JSON.stringify(value)}`);
  return {
    core: [Number(match[1]), Number(match[2]), Number(match[3])],
    prerelease: match[4] !== undefined,
  };
}

function compareCore(a, b) {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  return 0;
}

export function distTagFor(version, currentLatest) {
  const release = parse(version, 'release version');
  if (release.prerelease) return 'next';
  const latest = parse(currentLatest, 'current latest');
  if (latest.prerelease) throw new Error(`current latest is a prerelease: ${currentLatest}`);
  if (compareCore(release.core, latest.core) >= 0) return 'latest';
  return `maint-${release.core[0]}.${release.core[1]}`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    process.stdout.write(`${distTagFor(process.argv[2], process.argv[3])}\n`);
  } catch (error) {
    process.stderr.write(`release-dist-tag: ${error.message}\n`);
    process.exit(2);
  }
}
