/**
 * Prepare a version-only release without resolving dependencies or publishing.
 *
 *   node scripts/release-prep.mjs <new-version>
 *
 * Validate the changelog, locked root metadata, and every required input before
 * writing. Re-pin the same public docs/demo surfaces checked by check:versions.
 * Stable releases date a plain or versioned Unreleased heading; prereleases
 * name the base version's section and leave it undated. Existing release dates
 * stay intact. Package-lock dependency entries never change during preparation.
 *
 * It does NOT commit, tag, or publish. See docs/release.md for those gates.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { versionLiteralSurfaces } from './lib/version-surfaces.mjs';
import { log } from './lib/stdio.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EXACT = /@ponchia\/ui@\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?/g;
const VERSION =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

/** Re-pin every exact `@ponchia/ui@X.Y.Z[-prerelease]` literal. Pure for testability. */
export function repinVersionLiterals(text, version) {
  return text.replace(EXACT, `@ponchia/ui@${version}`);
}

/** Date a plain or matching versioned heading; keep existing dates unchanged. */
export function dateChangelogHeading(text, version, isoDate) {
  const targets = new Set(['## Unreleased', `## Unreleased — ${version}`]);
  return text
    .split('\n')
    .map((line) => (targets.has(line.trimEnd()) ? `## ${version} — ${isoDate}` : line))
    .join('\n');
}

function validateVersion(argv) {
  const value = argv[0];
  const match = typeof value === 'string' && value.length <= 128 && VERSION.exec(value);
  const leadingZero = match?.[4]?.split('.').some((id) => /^0\d+$/.test(id));
  if (argv.length !== 1 || !match || leadingZero) {
    throw new Error(
      'usage: node scripts/release-prep.mjs <new-version> (e.g. 0.16.2 or 0.17.0-rc.1)',
    );
  }
  return value;
}

function prepareChangelog(text, version, isoDate) {
  const prerelease = version.includes('-');
  const base = version.split('-')[0];
  const target = `## Unreleased — ${base}`;
  const datedPrefix = `## ${base} — `;
  const headings = text.split('\n').map((line) => line.trimEnd());
  const pending = headings.filter((line) => line === '## Unreleased' || line === target);
  const dated = headings.filter(
    (line) =>
      line.startsWith(datedPrefix) && /^\d{4}-\d{2}-\d{2}$/.test(line.slice(datedPrefix.length)),
  );
  if (pending.length + dated.length !== 1) {
    throw new Error(
      `CHANGELOG.md needs exactly one plain Unreleased or version ${base} section; found ${pending.length + dated.length}`,
    );
  }
  if (!prerelease) return dateChangelogHeading(text, base, isoDate);
  return text
    .split('\n')
    .map((line) => (line.trimEnd() === '## Unreleased' ? target : line))
    .join('\n');
}

function prepareLock(pkg, lock, version) {
  const entry = lock.packages?.[''];
  if (
    lock.lockfileVersion !== 3 ||
    lock.name !== pkg.name ||
    entry?.name !== pkg.name ||
    lock.version !== pkg.version ||
    entry.version !== pkg.version
  ) {
    throw new Error(
      'package-lock.json root must match package.json before a version-only release; regenerate and review the lockfile first',
    );
  }
  lock.version = version;
  entry.version = version;
  return `${JSON.stringify(lock, null, 2)}\n`;
}

function releasePlan(version, isoDate) {
  const read = (name) => readFileSync(resolve(root, name), 'utf8');
  const pkg = JSON.parse(read('package.json'));
  const from = pkg.version;
  const plan = new Map();
  plan.set('CHANGELOG.md', prepareChangelog(read('CHANGELOG.md'), version, isoDate));
  plan.set('package-lock.json', prepareLock(pkg, JSON.parse(read('package-lock.json')), version));
  pkg.version = version;
  plan.set('package.json', `${JSON.stringify(pkg, null, 2)}\n`);

  for (const name of versionLiteralSurfaces(pkg, root)) {
    plan.set(name, repinVersionLiterals(plan.get(name) ?? read(name), version));
  }
  const bugPath = '.github/ISSUE_TEMPLATE/bug_report.yml';
  plan.set(bugPath, read(bugPath).replace(`placeholder: '${from}'`, `placeholder: '${version}'`));
  const minorOf = (value) => value.split('-')[0].split('.').slice(0, 2).join('.');
  const stabilityPath = 'docs/stability.md';
  plan.set(
    stabilityPath,
    (plan.get(stabilityPath) ?? read(stabilityPath)).replace(
      `PATCH releases (\`${minorOf(from)}.x\`)`,
      `PATCH releases (\`${minorOf(version)}.x\`)`,
    ),
  );
  // Read every before-image now: missing inputs fail without leaving a partial
  // version bump. This is input validation, not a filesystem transaction.
  return [...plan].filter(([name, next]) => read(name) !== next);
}

function main(argv) {
  const version = validateVersion(argv);
  const plan = releasePlan(version, new Date().toISOString().slice(0, 10));
  for (const [name, next] of plan) {
    writeFileSync(resolve(root, name), next);
    log(`✓ prepared ${name}`);
  }
  log(
    plan.length
      ? `\nPrepared ${version} without changing locked dependencies.`
      : `No changes: ${version} is already prepared.`,
  );
  log('Next: review the diff, run `npm run check`, then follow docs/release.md.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
