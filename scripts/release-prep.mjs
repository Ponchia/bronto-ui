/**
 * One-shot release preparation — the toil that used to be done by hand (and
 * drifted: demo/report-standalone.html shipped a release behind because the
 * manual re-pin only covered the gated docs).
 *
 *   node scripts/release-prep.mjs <new-version>
 *
 * Does, in order:
 *   1. package.json `version` → <new-version>, and syncs package-lock.json
 *      (`npm install --package-lock-only`).
 *   2. CHANGELOG.md: rewrites `## Unreleased — <new-version>` to the dated
 *      `## <new-version> — YYYY-MM-DD` heading check:release requires.
 *      (Prereleases keep the undated base heading; nothing to rewrite.)
 *   3. Re-pins every exact `@ponchia/ui@X.Y.Z[-prerelease]` literal to
 *      <new-version> in ALL surfaces that carry them: the README/shipped docs
 *      check:versions gates AND the ungated demo/*.html pages (GH-Pages copies).
 *
 * It does NOT commit, tag, or publish — see docs/release.md for the runbook.
 * Run `npm run check` afterwards; check:release + check:versions verify the
 * result.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { shippedDocs } from './lib/shipped-docs.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const EXACT = /@ponchia\/ui@\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?/g;

/** Re-pin every exact `@ponchia/ui@X.Y.Z[-prerelease]` literal. Pure for testability. */
export function repinVersionLiterals(text, version) {
  return text.replace(EXACT, `@ponchia/ui@${version}`);
}

/**
 * Date the `## Unreleased — <version>` heading. Returns the unchanged text
 * when the heading is absent (already dated, or a prerelease whose base
 * section stays undated — check:release allows both). Plain line comparison,
 * no regex — the version comes from argv and must never reach a RegExp
 * constructor (CodeQL js/regex-injection).
 */
export function dateChangelogHeading(text, version, isoDate) {
  const target = `## Unreleased — ${version}`;
  return text
    .split('\n')
    .map((line) => (line.trimEnd() === target ? `## ${version} — ${isoDate}` : line))
    .join('\n');
}

function main(argv) {
  const version = argv[0];
  if (!version || !/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) {
    console.error('usage: node scripts/release-prep.mjs <new-version>   (e.g. 0.7.0)');
    process.exit(1);
  }
  const isPrerelease = version.includes('-');

  // 1. package.json + lock
  const pkgPath = resolve(root, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  const from = pkg.version;
  pkg.version = version;
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  execFileSync('npm', ['install', '--package-lock-only', '--ignore-scripts'], {
    cwd: root,
    stdio: 'inherit',
  });
  console.log(`✓ package.json + lock: ${from} → ${version}`);

  // 2. CHANGELOG heading (stable releases only)
  const clPath = resolve(root, 'CHANGELOG.md');
  const cl = readFileSync(clPath, 'utf8');
  const isoDate = new Date().toISOString().slice(0, 10);
  const dated = isPrerelease ? cl : dateChangelogHeading(cl, version, isoDate);
  if (dated !== cl) {
    writeFileSync(clPath, dated);
    console.log(`✓ CHANGELOG.md: "## Unreleased — ${version}" → "## ${version} — ${isoDate}"`);
  } else {
    console.log(
      isPrerelease
        ? '· CHANGELOG.md: prerelease — base heading left undated (check:release allows it)'
        : `· CHANGELOG.md: no "## Unreleased — ${version}" heading found — verify it is already dated`,
    );
  }

  // 3. Version literals: gated README/shipped docs + UNGATED demo pages.
  const demoPages = readdirSync(resolve(root, 'demo'))
    .filter((f) => f.endsWith('.html'))
    .map((f) => `demo/${f}`);
  const targets = [...new Set([...shippedDocs(pkg), ...demoPages])];
  let repinned = 0;
  for (const rel of targets) {
    let text;
    try {
      text = readFileSync(resolve(root, rel), 'utf8');
    } catch {
      continue; // missing listed doc is check:pack's concern
    }
    const next = repinVersionLiterals(text, version);
    if (next !== text) {
      writeFileSync(resolve(root, rel), next);
      repinned++;
      console.log(`✓ re-pinned literals in ${rel}`);
    }
  }
  if (!repinned) console.log('· no stale @ponchia/ui@X.Y.Z literals found');

  // 4. Issue-template version placeholder (check:public-metadata gates it).
  const bugPath = resolve(root, '.github/ISSUE_TEMPLATE/bug_report.yml');
  const bug = readFileSync(bugPath, 'utf8');
  const bumped = bug.replace(`placeholder: '${from}'`, `placeholder: '${version}'`);
  if (bumped !== bug) {
    writeFileSync(bugPath, bumped);
    console.log('✓ bumped the bug-report version placeholder');
  }

  console.log(
    '\nNext: review the diff, run `npm run check && npm test`, then follow docs/release.md.',
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}
