/**
 * Verify the published artifact is exactly what we intend: only the
 * runtime surface ships, never tooling/docs/tests. Catches a too-broad
 * (or too-narrow) `files` allowlist before it reaches the registry.
 *
 * Runs `npm pack --dry-run --json` and asserts every shipped path is
 * under `files` (plus npm's always-included package.json/README/LICENSE)
 * and that known dev-only directories are absent.
 *
 * Run: node scripts/check-pack.mjs
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { reportAndExit } from './lib/gate-report.mjs';
import { cssLeaves } from './lib/css-leaves.mjs';
import { exportTargetFiles } from './lib/package-targets.mjs';
import {
  isAlwaysIncludedPackageFile,
  isUnderPackageFiles,
  npmPackFiles,
} from './lib/shipped-files.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const errors = [];

let files;
try {
  files = npmPackFiles(root);
} catch (e) {
  console.error('✖ `npm pack --dry-run --json` failed:', e.message);
  process.exit(1);
}

if (files.length === 0) errors.push('npm pack reported no files');

for (const p of files) {
  if (!isAlwaysIncludedPackageFile(p) && !isUnderPackageFiles(pkg, p)) {
    errors.push(`unexpected file shipped: ${p} (not under "files" ${JSON.stringify(pkg.files)})`);
  }
}

// Curated docs that intentionally ship for offline LLM/agent consumers (a
// deliberate, documented relaxation of the runtime-only stance — see llms.txt).
// DERIVED from `files` (every `.md` entry) rather than a hand-list, so the two
// can never drift; the lockstep loop this replaced existed only to catch that
// drift.
const shippedDocs = new Set((pkg.files ?? []).filter((f) => f.endsWith('.md')));

// Belt-and-braces: these must never ship (except the curated docs above).
const forbidden = [
  'scripts/',
  'docs/',
  'demo/',
  'test/',
  'examples/',
  '.github/',
  '.claude/',
  '.codeql/',
  '.semgrep/',
  '.scannerwork/',
  'code-quality-audits/',
  'node_modules/',
  'reports-lab/',
];
for (const p of files) {
  if (shippedDocs.has(p)) continue;
  if (forbidden.some((d) => p.startsWith(d)) || /^\./.test(p)) {
    errors.push(`dev-only path leaked into the package: ${p}`);
  }
}

// Sanity: every concrete export target must actually be present in the npm
// pack file list, including `types` targets. This is the tarball-level inverse
// of check:exports: that gate proves exported paths exist in the worktree and
// are under `files`; this one proves npm will actually include them.
const must = [
  ...exportTargetFiles(pkg),
  // `css/core.css` has no dist twin, but every other CSS leaf must ship both
  // its layered export target and its unlayered source escape hatch.
  ...cssLeaves(pkg).flatMap((leaf) => (leaf === 'core' ? [] : [`css/${leaf}.css`])),
];
for (const m of must) {
  if (!files.includes(m)) errors.push(`expected exported package file missing: ${m}`);
}

reportAndExit(errors, {
  label: 'pack-contents',
  ok: `package ships ${files.length} intended files; no dev-only paths leaked`,
});
