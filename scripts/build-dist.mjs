/**
 * Flatten the runtime @import graph into one prebuilt single-file bundle
 * so consumers don't pay an @import waterfall at load time.
 *
 *   dist/bronto.css  ← css/core.css  (the single bundle)
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
    // Dedupe: a leaf reachable from two entrypoints must be emitted
    // once, or the published bundle ships its rules (and the layered
    // per-leaf file) twice.
    else if (!acc.includes(dep)) acc.push(dep);
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

/** One self-layered file per leaf, so a *direct* leaf import is layered
 *  by default (safe to mix with the bundle). The raw, unlayered source
 *  stays the explicit escape hatch, exported under `./css/unlayered/*`.
 *
 *  Depth fix: source leaves live at `css/` and reference assets as
 *  `../fonts/*` (→ package root). These generated copies live one level
 *  deeper at `dist/css/`, so the relative asset path must gain one `../`
 *  or it 404s (`dist/css/../fonts` = `dist/fonts`, which is not shipped).
 *  The flattened bundle is exempt — it sits at `dist/`, where the
 *  original `../fonts/*` already resolves to the package root. */
function layeredLeaf(f) {
  const css = minify(readFileSync(resolve(cssDir, f), 'utf8')).replace(
    /url\((['"]?)\.\.\/fonts\//g,
    'url($1../../fonts/',
  );
  return `@layer bronto{${css}}\n`;
}

/** The leaves a direct import can target (core.css's import order). */
export function leafFiles() {
  return leaves('core.css');
}

/** Opt-in leaves that ship as their own layered entrypoint but are
 *  deliberately NOT in the default bundle (ADR-0001: colorways + data-viz are
 *  opt-in). They still get a `dist/css/*` layered file so a direct import is safe. */
export const EXTRA_LEAVES = [
  'skins.css',
  'dataviz.css',
  'report.css',
  'annotations.css',
  'legend.css',
  'marks.css',
];

export function buildBundles() {
  const out = { 'dist/bronto.css': bundle('core.css') };
  for (const f of leafFiles()) out[`dist/css/${f}`] = layeredLeaf(f);
  for (const f of EXTRA_LEAVES) out[`dist/css/${f}`] = layeredLeaf(f);
  return out;
}

/** Raw + gzip ceiling, enforced by check-dist on *every* emitted file
 *  (the bundle and each layered leaf — leaves are far smaller, so the
 *  bundle is the binding one). Recalibrated at 0.3.5 to the then-bundle
 *  (~68.1 kB raw / ~11.9 kB gzip) after the six-primitive adoption pass,
 *  keeping ~10% raw / ~7% gzip headroom for ordinary growth: a few new
 *  components is fine, a runaway @import or an inlined asset trips it.
 *  Bump deliberately (and note it in the CHANGELOG) when real growth
 *  justifies it — this is the consumer-facing payload contract. The gzip
 *  ceiling was nudged 13.0→13.5 kB at 0.4.1 for the native-`<dialog>`
 *  enter+exit motion (`@starting-style` + `allow-discrete`); the raw ceiling
 *  was then nudged 76→77 kB for the popover/toast/accordion motion plus the
 *  scroll-driven + view-transition enhancements, then 77→78 kB for the
 *  `data-surface="oled"` dark-surface preset (ADR-0003). Gzip held — these are
 *  repetitive grayscale tokens that compress well, sitting ~13.2 kB. */
export const BUDGET = { raw: 78_000, gzip: 13_500 };

export function sizes(content) {
  return { raw: Buffer.byteLength(content), gzip: gzipSync(content).length };
}

const isMain = resolve(process.argv[1] || '') === fileURLToPath(import.meta.url);
if (isMain) {
  mkdirSync(resolve(root, 'dist/css'), { recursive: true });
  for (const [rel, content] of Object.entries(buildBundles())) {
    writeFileSync(resolve(root, rel), content);
    const s = sizes(content);
    console.log(
      `✓ ${rel} — ${(s.raw / 1024).toFixed(1)}kB raw, ${(s.gzip / 1024).toFixed(1)}kB gzip`,
    );
  }
}
