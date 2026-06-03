/**
 * Release-hygiene gate. Enforce: the version in package.json must NOT
 * map to a CHANGELOG heading still marked "unreleased". A published
 * version that is still labelled unreleased (the 0.3.0 defect) is now a
 * hard CI failure. The in-development next version may live under an
 * "## Unreleased — x.y.z" heading; that is allowed *until* package.json
 * is bumped to that version, at which point the heading must be dated.
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

reportAndExit(errors, {
  label: 'release-hygiene',
  ok: prerelease
    ? `release hygiene: prerelease v${version} maps to the "${target}" CHANGELOG section`
    : `release hygiene: v${version} maps to a dated CHANGELOG section`,
});
