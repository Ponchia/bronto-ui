/**
 * Gate: public metadata that readers copy or trust must match the package.
 *
 * This catches the small, high-trust drift that is easy to miss because it is
 * not generated: README size claims, issue-template browser floor/version
 * hints, and the supported-minor security table.
 *
 * Run: node scripts/check-public-metadata.mjs
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildBundles, sizes } from './build-dist.mjs';
import { reportAndExit } from './lib/gate-report.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(resolve(root, rel), 'utf8');
const pkg = JSON.parse(read('package.json'));
const [major, minor] = pkg.version.split('.');
const currentMinor = `${major}.${minor}`;
const errors = [];

const bundleSize = sizes(buildBundles()['dist/bronto.css']);
const rawKb = Math.round(bundleSize.raw / 1024);
const gzipKb = Math.round(bundleSize.gzip / 1024);

const readme = read('README.md');
const expectedBadge = `dist-~${rawKb}kB%20%2F%20~${gzipKb}kB%20gzip`;
const expectedSizeText = `(~${rawKb} kB raw / ~${gzipKb} kB gzip)`;
if (!readme.includes(expectedBadge)) {
  errors.push(`README dist badge must advertise ~${rawKb}kB / ~${gzipKb}kB gzip`);
}
if (!readme.includes(expectedSizeText)) {
  errors.push(`README quick-start size text must say ${expectedSizeText}`);
}

const floor = readme.match(/Floor: \*\*([^*]+)\*\*/)?.[1];
if (!floor) {
  errors.push('README browser-support section must contain a bold "Floor: **...**" string');
}

const bugTemplate = read('.github/ISSUE_TEMPLATE/bug_report.yml');
if (!bugTemplate.includes(`placeholder: '${pkg.version}'`)) {
  errors.push(`bug report version placeholder must match package.json (${pkg.version})`);
}
if (floor && !bugTemplate.includes(`The floor is ${floor}.`)) {
  errors.push(`bug report browser floor must match README (${floor})`);
}

const security = read('.github/SECURITY.md');
if (!new RegExp(`\\|\\s*${currentMinor.replace('.', '\\.')}\\.x\\s*\\|\\s*✅`).test(security)) {
  errors.push(`SECURITY.md supported table must mark ${currentMinor}.x as supported`);
}
if (!new RegExp(`\\|\\s*< ${currentMinor.replace('.', '\\.')}\\s*\\|\\s*❌`).test(security)) {
  errors.push(`SECURITY.md supported table must mark < ${currentMinor} as unsupported`);
}

const stability = read('docs/stability.md');
if (!stability.includes(`PATCH releases (\`${currentMinor}.x\`)`)) {
  errors.push(`docs/stability.md patch-release example must use ${currentMinor}.x`);
}

if (!pkg.files?.includes('docs/frontier-primitives.md')) {
  errors.push('package.json files must ship docs/frontier-primitives.md');
}
if (pkg.exports?.['./docs/frontier-primitives.md'] !== './docs/frontier-primitives.md') {
  errors.push('package.json exports must expose ./docs/frontier-primitives.md');
}

reportAndExit(errors, {
  label: 'public-metadata',
  ok:
    `public metadata matches ${pkg.version}: README ~${rawKb}kB/~${gzipKb}kB, ` +
    `${floor ?? 'browser floor'}, and ${currentMinor}.x support`,
});
