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

const underAllowlist = (p) =>
  (pkg.files ?? []).some((f) => p === f || p.startsWith(`${f}/`));

for (const p of files) {
  if (!alwaysOk(p) && !underAllowlist(p)) {
    errors.push(`unexpected file shipped: ${p} (not under "files" ${JSON.stringify(pkg.files)})`);
  }
}

// Belt-and-braces: these must never ship.
const forbidden = ['scripts/', 'docs/', 'demo/', 'test/', '.github/', 'node_modules/'];
for (const p of files) {
  if (forbidden.some((d) => p.startsWith(d)) || /^\./.test(p)) {
    errors.push(`dev-only path leaked into the package: ${p}`);
  }
}

// Sanity: the runtime entrypoints must actually be present.
for (const must of ['css/index.css', 'tokens/index.js', 'classes/index.js', 'behaviors/index.js']) {
  if (!files.includes(must)) errors.push(`expected entrypoint missing from package: ${must}`);
}

if (errors.length) {
  console.error(`✖ ${errors.length} pack-contents problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`✓ package ships ${files.length} intended files; no dev-only paths leaked`);
