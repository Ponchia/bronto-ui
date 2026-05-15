/**
 * Flatten the runtime @import graph into prebuilt, single-file bundles
 * so consumers don't pay a 17-deep @import waterfall at load time.
 *
 *   dist/bronto.css       ← css/index.css  (full: core + responsive)
 *   dist/bronto-core.css  ← css/core.css   (no breakpoint overrides)
 *
 * Each leaf's contents are concatenated in @import order and wrapped in
 * a single `@layer bronto { … }`, reproducing the cascade-layer
 * behaviour the entrypoints get from `@import … layer(bronto)`.
 *
 * The minifier is deliberately conservative — strip comments, collapse
 * whitespace, tidy around `{ } ; ,` only. It never touches combinators,
 * `:` or parens, so it cannot change selector meaning; gzip (which every
 * server does) reclaims the rest. Correctness over a few extra bytes.
 *
 * `buildBundles()` is pure (returns name → content) so check-dist can
 * diff it against the committed files without writing. Run directly to
 * (re)write dist/.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cssDir = resolve(root, 'css');

const IMPORT_RE = /@import\s+url\(\s*['"]([^'"]+)['"]\s*\)/g;

/** Ordered list of leaf css files an entrypoint pulls in (recursing
 *  through nested entrypoints like core.css). */
function leaves(entry, acc = []) {
  const src = readFileSync(resolve(cssDir, entry), 'utf8');
  for (const m of src.matchAll(IMPORT_RE)) {
    const dep = m[1].replace(/^\.\//, '');
    if (/(?:^|\/)(core|index)\.css$/.test(dep)) leaves(dep, acc);
    else acc.push(dep);
  }
  return acc;
}

function minify(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // comments
    .replace(/\s+/g, ' ') // collapse whitespace (keeps combinator spaces)
    .replace(/\s*([{};,])\s*/g, '$1') // tidy only around structural chars
    .replace(/;}/g, '}') // drop redundant final semicolons
    .trim();
}

function bundle(entry) {
  const body = leaves(entry)
    .map((f) => readFileSync(resolve(cssDir, f), 'utf8'))
    .join('\n');
  return `@layer bronto{${minify(body)}}\n`;
}

export function buildBundles() {
  return {
    'dist/bronto.css': bundle('index.css'),
    'dist/bronto-core.css': bundle('core.css'),
  };
}

/** Raw + gzip size budgets. Generous headroom; trip only on a real
 *  blowout (a runaway import or an accidental asset inlined). */
export const BUDGET = { raw: 90_000, gzip: 16_000 };

export function sizes(content) {
  return { raw: Buffer.byteLength(content), gzip: gzipSync(content).length };
}

const isMain = resolve(process.argv[1] || '') === fileURLToPath(import.meta.url);
if (isMain) {
  mkdirSync(resolve(root, 'dist'), { recursive: true });
  for (const [rel, content] of Object.entries(buildBundles())) {
    writeFileSync(resolve(root, rel), content);
    const s = sizes(content);
    console.log(`✓ ${rel} — ${(s.raw / 1024).toFixed(1)}kB raw, ${(s.gzip / 1024).toFixed(1)}kB gzip`);
  }
}
