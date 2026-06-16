/**
 * Enforce: dist/ is the freshly built, in-budget artifact of css/.
 *
 *  - Rebuilds the bundles in memory and byte-compares them to the
 *    committed files (so dist can't drift from source — same contract
 *    as check-fresh for the pure generated mirrors).
 *  - Asserts each bundle is within the raw + gzip size budget.
 *
 * Run: node scripts/check-dist.mjs
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildBundles, BUDGET, sizes, leafFiles, EXTRA_LEAVES } from './build-dist.mjs';
import { reportAndExit } from './lib/gate-report.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

const bundles = buildBundles();

// Source-coverage: every hand-authored css/<leaf>.css must ship via SOME path —
// bundled (core import graph), an opt-in layered leaf (EXTRA_LEAVES), or a
// roll-up entrypoint. A new leaf that is none of these produces no dist copy
// and no export: it ships *nothing* while reading as "covered". This is the
// inverse of the stale-dist check below and closes the silent-orphan hole.
const ROLLUPS = new Set(['core.css', 'analytical.css', 'report-kit.css']);
const coveredLeaves = new Set([...leafFiles(), ...EXTRA_LEAVES, ...ROLLUPS]);
for (const e of readdirSync(resolve(root, 'css'), { withFileTypes: true })) {
  if (!e.isFile() || !e.name.endsWith('.css')) continue;
  if (!coveredLeaves.has(e.name)) {
    errors.push(
      `css/${e.name} is an orphan leaf — not bundled, not in build-dist EXTRA_LEAVES, not a roll-up; it would ship nothing. Add it to EXTRA_LEAVES (plus an exports entry) or import it from core.css.`,
    );
  }
}

// `package.json` ships the WHOLE `dist/` dir, but the loop below only
// iterates the *expected* outputs — a stale extra .css (a renamed leaf,
// a removed module) would ship to consumers undetected. Assert the
// on-disk .css set is exactly the generated set.
const distDir = resolve(root, 'dist');
const onDisk = [];
const walk = (d) => {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = resolve(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.css'))
      onDisk.push(`dist/${relative(distDir, p).split(sep).join('/')}`);
  }
};
if (existsSync(distDir)) walk(distDir);
const expectedSet = new Set(Object.keys(bundles));
for (const rel of onDisk) {
  if (!expectedSet.has(rel)) {
    errors.push(`${rel} is a stale dist artifact (not produced by build-dist) — would ship to npm`);
  }
}

for (const [rel, expected] of Object.entries(bundles)) {
  const abs = resolve(root, rel);
  if (!existsSync(abs)) {
    errors.push(`${rel} missing — run: npm run dist:build`);
    continue;
  }
  if (readFileSync(abs, 'utf8') !== expected) {
    errors.push(`${rel} is stale — run: npm run dist:build`);
    continue;
  }
  if (!expected.startsWith('@layer bronto{') || !expected.endsWith('}\n')) {
    errors.push(`${rel} must be emitted as one @layer bronto block`);
  } else if (/@layer\b/.test(expected.slice('@layer bronto{'.length, -2))) {
    errors.push(`${rel} must not contain nested or stray @layer rules inside bronto`);
  }
  const s = sizes(expected);
  if (s.raw > BUDGET.raw) errors.push(`${rel} raw ${s.raw}B over budget ${BUDGET.raw}B`);
  if (s.gzip > BUDGET.gzip) errors.push(`${rel} gzip ${s.gzip}B over budget ${BUDGET.gzip}B`);

  // Every relative url(...) asset must resolve to a shipped file from
  // *this generated file's own location* — catches depth bugs like a
  // leaf at dist/css/ still pointing at ../fonts (would be dist/fonts).
  const here = dirname(abs);
  for (const m of expected.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
    const ref = m[1].trim();
    if (/^(data:|https?:|#|\/)/.test(ref)) continue;
    if (!existsSync(resolve(here, ref))) {
      errors.push(`${rel}: url(${ref}) does not resolve (→ ${resolve(here, ref)})`);
    }
  }
}

reportAndExit(errors, {
  label: 'dist',
  ok: 'dist/ is the fresh, single-layered, in-budget build of css/',
});
