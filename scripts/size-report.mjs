/**
 * Print the consumer-facing payload budget: CSS bundle, JS entrypoints, fonts,
 * and npm tarball size. This is informational; `check-dist` remains the hard
 * CSS budget gate.
 *
 * Run: node scripts/size-report.mjs
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { buildBundles, sizes as cssSizes } from './build-dist.mjs';
import { log } from './lib/stdio.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const bytes = (n) => `${(n / 1024).toFixed(1)} kB`;
const fileSize = (rel) => statSync(resolve(root, rel)).size;
const gzipSize = (rel) => gzipSync(readFileSync(resolve(root, rel))).length;

const rows = [];
const bundles = buildBundles();
const cssSizeByRel = new Map(
  Object.entries(bundles).map(([rel, content]) => [rel, cssSizes(content)]),
);
const cssRollups = new Set(['dist/css/analytical.css', 'dist/css/report-kit.css']);
const addCssRow = (label, rel) => {
  const size = cssSizeByRel.get(rel);
  if (!size) throw new Error(`missing generated CSS bundle ${rel}`);
  rows.push([`${label} (${rel})`, size.raw, size.gzip]);
};

addCssRow('root CSS bundle', 'dist/bronto.css');
addCssRow('base CSS leaf', 'dist/css/base.css');
addCssRow('analytical CSS roll-up', 'dist/css/analytical.css');
addCssRow('report CSS leaf', 'dist/css/report.css');
addCssRow('report kit CSS roll-up', 'dist/css/report-kit.css');

const cssLeaves = [...cssSizeByRel.entries()].filter(
  ([rel]) => rel.startsWith('dist/css/') && !cssRollups.has(rel),
);
const [largestCssLeafRel, largestCssLeafSize] = cssLeaves.reduce((largest, entry) =>
  entry[1].raw > largest[1].raw ? entry : largest,
);
rows.push([
  `largest CSS leaf (${largestCssLeafRel})`,
  largestCssLeafSize.raw,
  largestCssLeafSize.gzip,
]);

const totalGeneratedCss = [...cssSizeByRel.values()].reduce(
  (total, size) => ({ raw: total.raw + size.raw, gzip: total.gzip + size.gzip }),
  { raw: 0, gzip: 0 },
);
rows.push(['total generated CSS', totalGeneratedCss.raw, totalGeneratedCss.gzip]);

for (const rel of [
  'behaviors/index.js',
  'glyphs/glyphs.js',
  'react/index.js',
  'solid/index.js',
  'qwik/index.js',
  'tokens/index.js',
  'tokens/skins.js',
  'tokens/charts.js',
]) {
  rows.push([rel, fileSize(rel), gzipSize(rel)]);
}

const fonts = readdirSync(resolve(root, 'fonts'))
  .filter((name) => /\.(ttf|woff2?)$/i.test(name))
  .map((name) => `fonts/${name}`);
rows.push([
  'fonts/*',
  fonts.reduce((n, rel) => n + fileSize(rel), 0),
  fonts.reduce((n, rel) => n + gzipSize(rel), 0),
]);

const pack = JSON.parse(
  execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }),
)[0];

log('| Surface | Raw / unpacked | Gzip / packed |');
log('| --- | ---: | ---: |');
for (const [name, raw, gzip] of rows) {
  log(`| ${name} | ${bytes(raw)} | ${gzip == null ? 'n/a' : bytes(gzip)} |`);
}
log(
  `| npm tarball (${pack.entryCount} files) | ${bytes(pack.unpackedSize)} unpacked | ${bytes(pack.size)} packed |`,
);
