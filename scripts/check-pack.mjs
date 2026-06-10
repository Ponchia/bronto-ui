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
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { reportAndExit } from './lib/gate-report.mjs';
import { cssLeaves } from './lib/css-leaves.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const errors = [];

let out;
try {
  // --ignore-scripts: skip prepack so stdout is pure JSON (and the check
  // stays hermetic — it inspects the `files` set, not a regenerated build).
  out = execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
} catch (e) {
  console.error('✖ `npm pack --dry-run --json` failed:', e.message);
  process.exit(1);
}

const files = (JSON.parse(out)[0]?.files ?? []).map((f) => f.path.replace(/\\/g, '/'));
if (files.length === 0) errors.push('npm pack reported no files');

// npm always includes these regardless of `files`.
const alwaysOk = (p) =>
  p === 'package.json' || /^(readme|license|licence|changelog)(\.|$)/i.test(p);

const underAllowlist = (p) => (pkg.files ?? []).some((f) => p === f || p.startsWith(`${f}/`));

for (const p of files) {
  if (!alwaysOk(p) && !underAllowlist(p)) {
    errors.push(`unexpected file shipped: ${p} (not under "files" ${JSON.stringify(pkg.files)})`);
  }
}

// Curated docs that intentionally ship for offline LLM/agent consumers (a
// deliberate, documented relaxation of the runtime-only stance — see llms.txt).
// DERIVED from `files` (every `.md` entry) rather than a hand-list, so the two
// can never drift; the lockstep loop this replaced existed only to catch that
// drift. (code-quality audit Q4.)
const shippedDocs = new Set((pkg.files ?? []).filter((f) => f.endsWith('.md')));

// Belt-and-braces: these must never ship (except the curated docs above).
const forbidden = ['scripts/', 'docs/', 'demo/', 'test/', '.github/', 'node_modules/'];
for (const p of files) {
  if (shippedDocs.has(p)) continue;
  if (forbidden.some((d) => p.startsWith(d)) || /^\./.test(p)) {
    errors.push(`dev-only path leaked into the package: ${p}`);
  }
}

// Sanity: the runtime entrypoints must actually be present. The CSS set is
// DERIVED from package.json exports (every `./css/<leaf>.css` key must ship
// its source leaf AND its built dist twin) — the old hand list had already
// drifted behind the post-0.6.0 leaves (spark/bullet/diff/code/sidenote/
// textref/term/toc/tree were exported but never asserted here).
const must = [
  'dist/bronto.css', // core's built twin (there is no dist/css/core.css)
  ...cssLeaves(pkg).flatMap((leaf) =>
    leaf === 'core' ? ['css/core.css'] : [`css/${leaf}.css`, `dist/css/${leaf}.css`],
  ),
  'docs/reporting.md',
  'docs/annotations.md',
  'docs/package-contract.md',
  'tokens/index.js',
  'classes/index.js',
  'behaviors/index.js',
  'glyphs/glyphs.js',
  'annotations/index.js',
  'connectors/index.js',
  'react/index.js',
  'solid/index.js',
  'qwik/index.js',
];
for (const m of must) {
  if (!files.includes(m)) errors.push(`expected entrypoint missing from package: ${m}`);
}

reportAndExit(errors, {
  label: 'pack-contents',
  ok: `package ships ${files.length} intended files; no dev-only paths leaked`,
});
