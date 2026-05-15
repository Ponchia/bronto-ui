/**
 * Zero-dependency integrity check for the published surface.
 *
 *  1. Every `exports` target in package.json resolves to a real file.
 *  2. Every `@import` in the bundle entrypoints resolves to a real file.
 *  3. Every file listed in `exports` is covered by the `files` allowlist,
 *     so it actually ships in the release tarball.
 *
 * Run: node scripts/check-exports.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const errors = [];

// Flatten conditional exports ({ types, default, ... }) to [key, target] leaves.
function exportTargets() {
  const out = [];
  for (const [key, val] of Object.entries(pkg.exports ?? {})) {
    if (typeof val === 'string') out.push([key, val]);
    else for (const [cond, t] of Object.entries(val)) out.push([`${key} (${cond})`, t]);
  }
  return out;
}

// 1. exports → real files (skip glob targets like ./fonts/*)
for (const [key, target] of exportTargets()) {
  if (target.includes('*')) continue;
  const abs = resolve(root, target);
  if (!existsSync(abs)) errors.push(`exports["${key}"] → missing file ${target}`);
}

// 2. @import graph of the entrypoints.
// Matches both `@import './x.css'` and `@import url('./x.css') layer(...)`.
const importRe = /@import\s+(?:url\(\s*)?['"]([^'"]+)['"]/g;
for (const entry of ['css/core.css', 'css/index.css']) {
  const abs = resolve(root, entry);
  if (!existsSync(abs)) {
    errors.push(`entrypoint ${entry} missing`);
    continue;
  }
  const src = readFileSync(abs, 'utf8');
  for (const m of src.matchAll(importRe)) {
    const dep = resolve(dirname(abs), m[1]);
    if (!existsSync(dep)) errors.push(`${entry} imports missing ${m[1]}`);
  }
}

// 3. exported files fall under the `files` allowlist
const allow = pkg.files ?? [];
for (const [key, target] of exportTargets()) {
  const rel = target.replace(/^\.\//, '').replace(/\*.*$/, '');
  if (!allow.some((f) => rel === f || rel.startsWith(`${f}/`))) {
    errors.push(`exports["${key}"] → ${target} not covered by "files" ${JSON.stringify(allow)}`);
  }
}

if (errors.length) {
  console.error(`✖ ${errors.length} integrity problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('✓ exports, import graph, and files allowlist are consistent');
