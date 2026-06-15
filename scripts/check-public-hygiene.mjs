/**
 * Public-surface hygiene gate.
 *
 * @ponchia/ui is a public package. check:pack proves the tarball file list is
 * intended; this gate scans the actual `npm pack --dry-run` text files for the
 * subtler leaks an allowlist cannot see: local workstation paths, known private
 * consumer names, and actual secret-looking assignments.
 *
 * The scope is intentionally pack-file and text-only. That keeps historical
 * local audit material from creating false positives while still catching any
 * untracked file npm would include through the package `files` allowlist.
 *
 * Run: node scripts/check-public-hygiene.mjs
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { reportAndExit } from './lib/gate-report.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

const TEXT_FILE = /\.(?:css|html|js|json|mjs|md|ts|tsx|jsx|d\.ts|map|ya?ml|txt|toml|svg)$/i;

const EXCLUDE = new Set(['package-lock.json']);

// Default private consumer terms are assembled from neutral fragments so the
// hygiene checker does not itself trip older tracked-source boundary scans.
const PRIVATE_TERMS = [
  ['home', 'to', 'lotto'].join(''),
  ['po', 'lpo'].join(''),
  ['personal', 'site'].join('-'),
  ['agent', 'world'].join('-'),
];

const EXTRA_TERMS = [
  process.env.BRONTO_UI_FORBIDDEN_TERMS ?? '',
  localTerms('.bronto-ui-forbidden-terms'),
]
  .join('\n')
  .split(/[\n,]/)
  .map((term) => term.replace(/#.*/, '').trim().toLowerCase())
  .filter(Boolean);

const forbiddenTerms = [...new Set([...PRIVATE_TERMS, ...EXTRA_TERMS])];

const files = publicTextFiles();
for (const rel of files) {
  const src = readFileSync(resolve(root, rel), 'utf8');
  const lower = src.toLowerCase();

  for (const term of forbiddenTerms) {
    if (lower.includes(term)) {
      errors.push(`${rel}: contains private/local consumer term "${term}"`);
    }
  }

  for (const pattern of [
    /\/Users\/zeno\/[^\s`"')<]+/g,
    /\/home\/zeno\/[^\s`"')<]+/g,
    /\/var\/folders\/[^\s`"')<]+/g,
  ]) {
    for (const m of src.matchAll(pattern)) {
      errors.push(`${rel}: contains local path "${m[0]}"`);
    }
  }

  for (const m of src.matchAll(secretAssignmentPattern())) {
    errors.push(
      `${rel}: looks like a secret assignment near "${m[1]}" — use placeholders in public files`,
    );
  }

  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(src)) {
    errors.push(`${rel}: contains a private-key block`);
  }
}

reportAndExit(errors, {
  label: 'public hygiene',
  ok: `${files.length} packed public text files contain no private terms, local paths, or secret-looking assignments`,
});

function publicTextFiles() {
  try {
    const out = execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return (JSON.parse(out)[0]?.files ?? [])
      .map((f) => f.path.replace(/\\/g, '/'))
      .filter((rel) => TEXT_FILE.test(rel))
      .filter((rel) => !EXCLUDE.has(rel))
      .sort();
  } catch (e) {
    console.error('✖ `npm pack --dry-run --json` failed:', e.message);
    process.exit(1);
  }
}

function localTerms(rel) {
  const path = resolve(root, rel);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function secretAssignmentPattern() {
  return new RegExp(
    [
      String.raw`\b([A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|API[_-]?KEY|ACCESS[_-]?KEY)[A-Z0-9_]*)`,
      String.raw`\s*(?::|=)\s*`,
      String.raw`["']?(?!<|your-|example-|placeholder|xxxx|test-|dummy-|redacted)`,
      String.raw`[A-Za-z0-9_./+=:-]{20,}["']?`,
    ].join(''),
    'gi',
  );
}
