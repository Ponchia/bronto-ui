/**
 * Zero-dependency integrity check for the published surface.
 *
 *  1. Every `exports` target in package.json resolves to a real file.
 *  2. Every `@import` in the bundle entrypoints resolves to a real file.
 *  3. Every file listed in `exports` is covered by the `files` allowlist,
 *     so it actually ships in the release tarball.
 *  4. Every shippable CSS leaf has BOTH exact public targets:
 *     `./css/<leaf>` → layered `./dist/css/<leaf>` and
 *     `./css/unlayered/<leaf>` → raw authored `./css/<leaf>`. This is the
 *     inverse of (1), plus target-shape validation, so a new leaf cannot be
 *     unreachable and a target swap cannot silently invert the cascade contract.
 *  5. Consumer metadata (`style`, CSS `sideEffects`) still points at the
 *     shipped root stylesheet instead of drifting away from the exports map.
 *  6. The package keeps the promised zero-runtime-dependency contract: no
 *     runtime/optional/bundled dependencies, only the documented optional
 *     framework peers for thin adapters, and no shipped code/declaration file
 *     in the packed artifact imports the sibling annotation engine.
 *  7. The Tailwind bridge stays a bridge: exported at both public subpaths,
 *     CSS-only, no component imports, and the documented Bronto variants remain
 *     present.
 *
 * Run: node scripts/check-exports.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { reportAndExit } from './lib/gate-report.mjs';
import { leafFiles, EXTRA_LEAVES } from './build-dist.mjs';
import { exportTargets } from './lib/package-targets.mjs';
import { OPTIONAL_FRAMEWORK_PEERS, optionalFrameworkPeerNames } from './lib/framework-peers.mjs';
import { cssImports, stripCssComments } from './lib/patterns.mjs';
import { importsAnnotationEngine, isJavaScriptOrDeclarationFile } from './lib/import-policy.mjs';
import { isUnderPackageFiles, npmPackFiles } from './lib/shipped-files.mjs';

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
for (const entry of ['css/core.css', 'css/analytical.css', 'css/report-kit.css']) {
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
  for (const match of src.matchAll(/@import\b[^;]*;/g)) {
    if (!/\blayer\(\s*bronto\s*\)/.test(match[0])) {
      errors.push(`${entry} import must be layer(bronto): ${match[0]}`);
    }
  }
}

// 3. exported files fall under the `files` allowlist
for (const [key, target] of exportTargets(pkg)) {
  const rel = target.replace(/^\.\//, '').replace(/\*.*$/, '');
  if (!isUnderPackageFiles(pkg, rel)) {
    errors.push(
      `exports["${key}"] → ${target} not covered by "files" ${JSON.stringify(pkg.files ?? [])}`,
    );
  }
}

// 4. exports ⊇ build (inverse of 1): every shippable leaf is subpath-importable
// in both layered and unlayered form, and the public keys point at the correct
// side of the contract. `./css/<leaf>.css` is always the safe layered direct
// import; `./css/unlayered/<leaf>.css` is always the raw authored escape hatch.
// Roll-ups (`analytical.css`, `report-kit.css`) and source fan-out
// (`./css/core.css`) deliberately have no unlayered twin.
const exportKeys = new Set(Object.keys(pkg.exports ?? {}));
const cssLeaves = new Set([...leafFiles(), ...EXTRA_LEAVES]);
const cssRollups = new Map([
  ['./css/analytical.css', './dist/css/analytical.css'],
  ['./css/report-kit.css', './dist/css/report-kit.css'],
]);
const cssFanout = new Map([
  ['./css', './css/core.css'],
  ['./css/core.css', './css/core.css'],
]);

for (const [key, expected] of [...cssFanout, ...cssRollups]) {
  if (pkg.exports?.[key] !== expected) {
    errors.push(`exports["${key}"] must point at ${expected} (got ${pkg.exports?.[key]})`);
  }
}

for (const leaf of cssLeaves) {
  const layeredKey = `./css/${leaf}`;
  const layeredTarget = `./dist/css/${leaf}`;
  const unlayeredKey = `./css/unlayered/${leaf}`;
  const unlayeredTarget = `./css/${leaf}`;

  if (pkg.exports?.[layeredKey] !== layeredTarget) {
    errors.push(
      `leaf ${leaf} must export layered target ${layeredKey} → ${layeredTarget} (got ${pkg.exports?.[layeredKey]})`,
    );
  }
  if (pkg.exports?.[unlayeredKey] !== unlayeredTarget) {
    errors.push(
      `leaf ${leaf} must export raw escape hatch ${unlayeredKey} → ${unlayeredTarget} (got ${pkg.exports?.[unlayeredKey]})`,
    );
  }
}

for (const key of exportKeys) {
  if (key === './css' || key === './css/core.css') continue;
  if (!key.startsWith('./css/')) continue;

  if (key.startsWith('./css/unlayered/')) {
    const leaf = key.slice('./css/unlayered/'.length);
    if (!cssLeaves.has(leaf)) {
      errors.push(`exports["${key}"] is an unlayered CSS export for a non-leaf`);
    }
    continue;
  }

  const leaf = key.slice('./css/'.length);
  if (!cssLeaves.has(leaf) && !cssRollups.has(key)) {
    errors.push(`exports["${key}"] is not a known layered CSS leaf or roll-up`);
  }
}

// 5. package metadata that bundlers/tools trust must agree with the root CSS
// export. `check:pack` proves dist/bronto.css ships because it is exported;
// this proves the independent top-level metadata did not drift to a missing or
// stale target.
if (pkg.style !== './dist/bronto.css') {
  errors.push(
    `package.json "style" must be "./dist/bronto.css" (got ${JSON.stringify(pkg.style)})`,
  );
} else if (!existsSync(resolve(root, pkg.style))) {
  errors.push(`package.json "style" points at missing file ${pkg.style}`);
}
if (pkg.exports?.['.']?.style !== pkg.style) {
  errors.push(`exports["."].style must match package.json "style" (${pkg.style})`);
}
if (pkg.exports?.['.']?.default !== pkg.style) {
  errors.push(`exports["."].default must match package.json "style" (${pkg.style})`);
}
if (!Array.isArray(pkg.sideEffects) || !pkg.sideEffects.includes('**/*.css')) {
  errors.push('package.json "sideEffects" must include "**/*.css" so CSS imports are preserved');
}

// 6. Zero runtime dependencies. Dev dependencies are allowed for the repo's
// build/test toolchain. The framework adapter peers are optional by contract:
// consumers installing the CSS/core package must not receive React/Solid/Qwik
// unless their app already chose that framework.
for (const field of [
  'dependencies',
  'optionalDependencies',
  'bundledDependencies',
  'bundleDependencies',
]) {
  const value = pkg[field];
  const entries = Array.isArray(value) ? value : Object.keys(value ?? {});
  if (entries.length) {
    errors.push(
      `package.json "${field}" must stay empty/absent for the zero-runtime-dependency contract (found ${entries.join(', ')})`,
    );
  }
}

const optionalPeerDeps = optionalFrameworkPeerNames();
const peerDeps = Object.keys(pkg.peerDependencies ?? {}).sort((a, b) => a.localeCompare(b));
if (JSON.stringify(peerDeps) !== JSON.stringify(optionalPeerDeps)) {
  errors.push(
    `package.json peerDependencies must be exactly the documented optional framework peers [${optionalPeerDeps.join(', ')}] (got [${peerDeps.join(', ')}])`,
  );
}
for (const peer of optionalPeerDeps) {
  if (pkg.peerDependenciesMeta?.[peer]?.optional !== true) {
    errors.push(`package.json peer "${peer}" must be marked optional in peerDependenciesMeta`);
  }
}
for (const peer of Object.keys(pkg.peerDependenciesMeta ?? {})) {
  if (!optionalPeerDeps.includes(peer)) {
    errors.push(`package.json peerDependenciesMeta contains undocumented peer "${peer}"`);
  }
}
for (const { peer, subpath, target } of OPTIONAL_FRAMEWORK_PEERS) {
  if (pkg.exports?.[subpath]?.default !== target) {
    errors.push(
      `optional framework peer "${peer}" must map ${subpath} default export to ${target}`,
    );
  }
}

for (const file of npmPackFiles(root).filter(isJavaScriptOrDeclarationFile)) {
  const source = readFileSync(resolve(root, file), 'utf8');
  if (importsAnnotationEngine(source, file)) {
    errors.push(
      `${file} must not import or type-reference @ponchia/annotations; keep @ponchia/ui dependency-free and use the sibling package directly in consumers`,
    );
  }
}

// 7. Tailwind bridge contract. The packed Tailwind example proves Tailwind can
// consume this file; this local gate prevents subtler drift in the public
// contract text: the bridge maps tokens/variants only and must never pull in
// Bronto component CSS by import side effect.
const tailwindSource = stripCssComments(readFileSync(resolve(root, 'tailwind.css'), 'utf8'));
for (const key of ['./tailwind', './tailwind.css']) {
  if (pkg.exports?.[key] !== './tailwind.css') {
    errors.push(`exports["${key}"] must point directly at ./tailwind.css`);
  }
}
if (!tailwindSource.includes('@theme inline')) {
  errors.push('tailwind.css must expose Bronto tokens through Tailwind v4 @theme inline');
}
if (/@import\b/.test(tailwindSource)) {
  errors.push('tailwind.css must not @import @ponchia/ui component CSS');
}
if (/@layer\s+bronto\b/.test(tailwindSource)) {
  errors.push('tailwind.css must not define or populate the bronto component layer');
}
if (/\.ui-[\w-]+/.test(tailwindSource)) {
  errors.push('tailwind.css must not contain Bronto component selectors');
}
for (const variant of [
  'bronto-light',
  'bronto-dark',
  'bronto-oled',
  'bronto-contrast-more',
  'bronto-compact',
  'bronto-comfortable',
  'bronto-active',
  'bronto-open',
  'bronto-selected',
  'bronto-invalid',
  'bronto-busy',
]) {
  if (!tailwindSource.includes(`@custom-variant ${variant} `)) {
    errors.push(`tailwind.css is missing documented ${variant}:* custom variant`);
  }
}

reportAndExit(errors, {
  label: 'integrity',
  ok: 'exports, layered source import graph, CSS target map, files allowlist, metadata, dependency contract, and Tailwind bridge are consistent',
});
