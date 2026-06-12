/**
 * Zero-dependency integrity check for the published surface.
 *
 *  1. Every `exports` target in package.json resolves to a real file.
 *  2. Every `@import` in the bundle entrypoints resolves to a real file.
 *  3. Every file listed in `exports` is covered by the `files` allowlist,
 *     so it actually ships in the release tarball.
 *  4. Every shippable CSS leaf has BOTH a `./css/<leaf>` (layered) and a
 *     `./css/unlayered/<leaf>` export key — the inverse of (1), so a leaf
 *     added to the build but forgotten in `exports` is unreachable via subpath
 *     import even though its dist file ships and every other gate passes.
 *
 * Run: node scripts/check-exports.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { reportAndExit } from './lib/gate-report.mjs';
import { leafFiles, EXTRA_LEAVES } from './build-dist.mjs';
import { exportTargets } from './lib/package-targets.mjs';
import { cssImports, stripCssComments } from './lib/patterns.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const errors = [];

// 1. exports → real files (skip glob targets like ./fonts/*)
for (const [key, target] of exportTargets(pkg)) {
  if (target.includes('*')) continue;
  const abs = resolve(root, target);
  if (!existsSync(abs)) errors.push(`exports["${key}"] → missing file ${target}`);
}

// 2. @import graph of the entrypoints. Use the same parser as build-dist so a
// valid import form cannot build differently from what this gate checks.
for (const entry of ['css/core.css', 'css/analytical.css']) {
  const abs = resolve(root, entry);
  if (!existsSync(abs)) {
    errors.push(`entrypoint ${entry} missing`);
    continue;
  }
  const src = stripCssComments(readFileSync(abs, 'utf8'));
  for (const href of cssImports(src)) {
    const dep = resolve(dirname(abs), href);
    if (!existsSync(dep)) errors.push(`${entry} imports missing ${href}`);
  }
}

// 3. exported files fall under the `files` allowlist
const allow = pkg.files ?? [];
for (const [key, target] of exportTargets(pkg)) {
  const rel = target.replace(/^\.\//, '').replace(/\*.*$/, '');
  if (!allow.some((f) => rel === f || rel.startsWith(`${f}/`))) {
    errors.push(`exports["${key}"] → ${target} not covered by "files" ${JSON.stringify(allow)}`);
  }
}

// 4. exports ⊇ build (inverse of 1): every shippable leaf is subpath-importable
// in both layered and unlayered form. `analytical.css` (a rollup) and the
// `bronto.css` bundle ship without an unlayered twin by design, so they are not
// in this set — `leafFiles()` + EXTRA_LEAVES are the canonical individual leaves.
const exportKeys = new Set(Object.keys(pkg.exports ?? {}));
for (const leaf of [...leafFiles(), ...EXTRA_LEAVES]) {
  for (const key of [`./css/${leaf}`, `./css/unlayered/${leaf}`]) {
    if (!exportKeys.has(key)) {
      errors.push(`leaf ${leaf} ships in dist but exports["${key}"] is missing`);
    }
  }
}

reportAndExit(errors, {
  label: 'integrity',
  ok: 'exports, import graph, and files allowlist are consistent',
});
