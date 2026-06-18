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
import { optInLeaves } from './lib/css-leaves.mjs';

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
const stabilityRows = stability.split('\n').filter((line) => line.startsWith('|'));
for (const leaf of optInLeaves(pkg)) {
  const route = `css/${leaf}.css`;
  const row = stabilityRows.find((line) => line.includes(route));
  if (!row) {
    errors.push(`docs/stability.md public-surface matrix must include exported opt-in ${route}`);
  } else if (!/\bopt-in\b/i.test(row)) {
    errors.push(`docs/stability.md public-surface row for ${route} must say it is opt-in`);
  }
}
const requiredSubpathMentions = [
  '@ponchia/ui/tailwind',
  '@ponchia/ui/tailwind.css',
  '@ponchia/ui/vscode.css-custom-data.json',
  'tokens/figma.variables.json',
  'schemas/report-claims.v1.schema.json',
  '@ponchia/ui/mermaid',
  '@ponchia/ui/mermaid.json',
  '@ponchia/ui/d2',
  '@ponchia/ui/d2.json',
  '@ponchia/ui/vega',
  '@ponchia/ui/vega.json',
  '@ponchia/ui/shiki/nothing.json',
  'llms.txt',
  'MIGRATIONS.json',
];
for (const mention of requiredSubpathMentions) {
  if (!stability.includes(mention)) {
    errors.push(`docs/stability.md public-surface matrix must mention ${mention}`);
  }
}
const ledgerStart = stability.indexOf('### 1.0 Readiness Ledger');
const ledgerEnd = stability.indexOf('After 1.0, breaking changes move to majors.', ledgerStart);
if (ledgerStart === -1 || ledgerEnd === -1) {
  errors.push('docs/stability.md must keep the 1.0 readiness ledger before the public matrix');
} else {
  const ledger = stability.slice(ledgerStart, ledgerEnd);
  const requiredLedgerRows = [
    ['Core boundary settled', ['check:exports', 'check:dist', 'check:component-matrix']],
    ['Refusal list enforced by review', ['check:contract', 'check:behavior-matrix']],
    ['Consumer proof is routine', ['check:pack', 'check:consumer-surface', 'check:examples']],
    [
      'Generated contracts stay registry-backed',
      ['check:fresh', 'check:classes', 'check:dts-emit'],
    ],
    ['Bundle budget has headroom', ['check:dist', 'check:public-metadata', 'check:pack']],
    ['Deprecation history is clean', ['check:migrations', 'check:release', 'check:versions']],
  ];
  for (const [label, gates] of requiredLedgerRows) {
    if (!ledger.includes(label)) {
      errors.push(`docs/stability.md 1.0 readiness ledger must include "${label}"`);
    }
    for (const gate of gates) {
      if (!ledger.includes(`\`${gate}\``)) {
        errors.push(`docs/stability.md 1.0 readiness ledger row "${label}" must cite ${gate}`);
      }
    }
  }
  for (const match of ledger.matchAll(/`(check:[^`]+)`/g)) {
    if (!pkg.scripts?.[match[1]]) {
      errors.push(`docs/stability.md 1.0 readiness ledger cites unknown npm script ${match[1]}`);
    }
  }
}

if (!pkg.files?.includes('docs/frontier-primitives.md')) {
  errors.push('package.json files must ship docs/frontier-primitives.md');
}
if (pkg.exports?.['./docs/frontier-primitives.md'] !== './docs/frontier-primitives.md') {
  errors.push('package.json exports must expose ./docs/frontier-primitives.md');
}

const contributing = read('CONTRIBUTING.md');
const releaseEvidencePatterns = [
  ['Release evidence', /Release\s+evidence/],
  ['check:consumer-surface', /check:consumer-surface/],
  ['check:consumer-types', /check:consumer-types/],
  ['check:examples', /check:examples/],
  ['downstream proof', /downstream proof/],
  ['public-safe terms', /public-safe terms/],
  ['not 1.0-ready', /not 1\.0-ready/],
];
for (const [label, pattern] of releaseEvidencePatterns) {
  if (!pattern.test(contributing)) {
    errors.push(`CONTRIBUTING.md release evidence policy must mention "${label}"`);
  }
}
if (!stability.includes('public-safe Release evidence note')) {
  errors.push('docs/stability.md 1.0 ledger must require a public-safe Release evidence note');
}
if (!stability.includes('without leaking private repo or product names')) {
  errors.push('docs/stability.md 1.0 ledger must protect private downstream names');
}

const changelog = read('CHANGELOG.md');
const downstreamEvidencePatterns = [
  ['Downstream proof', /Downstream proof/],
  ['React/Vite app consumer', /React\/Vite app consumer/],
  ['@ponchia/ui/classes', /@ponchia\/ui\/classes/],
  ['@ponchia/ui/behaviors', /@ponchia\/ui\/behaviors/],
  ['@ponchia/ui/tokens/resolved.json', /@ponchia\/ui\/tokens\/resolved\.json/],
  ['@ponchia/ui/vega', /@ponchia\/ui\/vega/],
  ['typecheck', /typecheck/],
  ['production build', /production `build`/],
];
for (const [label, pattern] of downstreamEvidencePatterns) {
  if (!pattern.test(changelog)) {
    errors.push(`CHANGELOG.md release evidence must mention "${label}"`);
  }
}

reportAndExit(errors, {
  label: 'public-metadata',
  ok:
    `public metadata matches ${pkg.version}: README ~${rawKb}kB/~${gzipKb}kB, ` +
    `${floor ?? 'browser floor'}, and ${currentMinor}.x support`,
});
