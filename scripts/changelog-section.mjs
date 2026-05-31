/**
 * Print the CHANGELOG.md section for a version to stdout — so the GitHub
 * Release body is the curated, narrative changelog, not GitHub's auto-generated
 * PR list. Closes the "two competing changelogs" gap (release.yml previously
 * used generate_release_notes and ignored CHANGELOG.md entirely).
 *
 * Usage: node scripts/changelog-section.mjs <version>
 *   e.g. node scripts/changelog-section.mjs 0.4.0   (or v0.4.0)
 * The version may be a prerelease (0.4.0-rc.1); it maps to the base version's
 * section, mirroring scripts/check-release.mjs.
 *
 * Exit 0 with the section on stdout; exit 0 with a one-line fallback if no
 * matching section is found (never fail the release-notes step over prose).
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const raw = (process.argv[2] || '').replace(/^v/, '');
const base = raw.split('-')[0]; // prerelease → base version's section
const changelog = readFileSync(resolve(root, 'CHANGELOG.md'), 'utf8');
const lines = changelog.split('\n');

// Find the `## …<base>…` heading, then capture until the next `## ` heading.
let start = -1;
for (let i = 0; i < lines.length; i++) {
  if (/^##\s/.test(lines[i]) && base && lines[i].includes(base)) {
    start = i;
    break;
  }
}

if (start === -1) {
  process.stdout.write(
    `Release ${process.argv[2] || ''}. See [CHANGELOG.md](https://github.com/Ponchia/bronto-ui/blob/main/CHANGELOG.md).\n`,
  );
  process.exit(0);
}

let end = lines.length;
for (let i = start + 1; i < lines.length; i++) {
  if (/^##\s/.test(lines[i])) {
    end = i;
    break;
  }
}

// Drop the heading line itself (the GitHub Release already shows the tag) and
// trim surrounding blank lines.
const body = lines
  .slice(start + 1, end)
  .join('\n')
  .trim();
process.stdout.write(`${body}\n`);
