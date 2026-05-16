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

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const changelog = readFileSync(resolve(root, 'CHANGELOG.md'), 'utf8');
const errors = [];

const version = pkg.version;
const headings = [...changelog.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1].trim());

// A heading "owns" the package version if the version string appears in it.
const owning = headings.filter((h) => h.includes(version));

if (owning.length === 0) {
  errors.push(
    `package.json version ${version} has no CHANGELOG section ` +
      `(expected a "## ${version} — <date>" heading)`,
  );
} else {
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

if (errors.length) {
  console.error(`✖ ${errors.length} release-hygiene problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`✓ release hygiene: v${version} maps to a dated CHANGELOG section`);
