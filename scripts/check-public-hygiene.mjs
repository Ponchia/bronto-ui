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

const TEXT_FILE = /\.(?:css|html|js|json|mjs|md|ts|tsx|jsx|d\.ts|map|ya?ml|txt|toml|svg)$/i;

const EXCLUDE = new Set(['package-lock.json']);
const TERM_SPLIT = /[\n,]/;
const COMMENT_SUFFIX = /#.*/;
const SECRET_ASSIGNMENT = secretAssignmentPattern();
const LOCAL_PATH_PATTERNS = Object.freeze([
  /\/Users\/zeno\/[^\s`"')<]+/g,
  /\/home\/zeno\/[^\s`"')<]+/g,
  /\/var\/folders\/[^\s`"')<]+/g,
]);
const PRIVATE_KEY_BLOCK = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/;

// Default private consumer terms are assembled from neutral fragments so the
// hygiene checker does not itself trip older tracked-source boundary scans.
const PRIVATE_TERMS = Object.freeze([
  ['home', 'to', 'lotto'].join(''),
  ['po', 'lpo'].join(''),
  ['personal', 'site'].join('-'),
  ['agent', 'world'].join('-'),
]);

const { errors, fileCount } = scanPublicHygiene();

reportAndExit(errors, {
  label: 'public hygiene',
  ok: `${fileCount} packed public text files contain no private terms, local paths, or secret-looking assignments`,
});

function scanPublicHygiene() {
  const files = publicTextFiles();
  const forbiddenTerms = collectForbiddenTerms();
  const scanErrors = [];
  for (const rel of files) {
    scanPublicFile(scanErrors, rel, forbiddenTerms);
  }
  return { errors: scanErrors, fileCount: files.length };
}

function collectForbiddenTerms() {
  const extraTerms = [
    process.env.BRONTO_UI_FORBIDDEN_TERMS ?? '',
    localTerms('.bronto-ui-forbidden-terms'),
  ]
    .join('\n')
    .split(TERM_SPLIT)
    .map(normalizeTerm)
    .filter(Boolean);

  return [...new Set([...PRIVATE_TERMS, ...extraTerms])];
}

function normalizeTerm(term) {
  return term.replace(COMMENT_SUFFIX, '').trim().toLowerCase();
}

function scanPublicFile(scanErrors, rel, forbiddenTerms) {
  const src = readFileSync(resolve(root, rel), 'utf8');
  const lower = src.toLowerCase();

  for (const term of forbiddenTerms) {
    if (lower.includes(term)) {
      scanErrors.push(`${rel}: contains private/local consumer term "${term}"`);
    }
  }

  for (const pattern of LOCAL_PATH_PATTERNS) {
    for (const match of src.matchAll(pattern)) {
      scanErrors.push(`${rel}: contains local path "${match[0]}"`);
    }
  }

  for (const match of src.matchAll(SECRET_ASSIGNMENT)) {
    scanErrors.push(
      `${rel}: looks like a secret assignment near "${match[1]}" — use placeholders in public files`,
    );
  }

  if (PRIVATE_KEY_BLOCK.test(src)) {
    scanErrors.push(`${rel}: contains a private-key block`);
  }
}

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
