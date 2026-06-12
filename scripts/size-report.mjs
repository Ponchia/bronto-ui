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
const bundle = buildBundles()['dist/bronto.css'];
const bundleSize = cssSizes(bundle);
rows.push(['dist/bronto.css', bundleSize.raw, bundleSize.gzip]);

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

const reportCss = buildBundles()['dist/css/report.css'];
const reportSize = cssSizes(reportCss);
rows.push(['dist/css/report.css', reportSize.raw, reportSize.gzip]);

const fonts = readdirSync(resolve(root, 'fonts'))
  .filter((name) => /\.(ttf|woff2?)$/i.test(name))
  .map((name) => `fonts/${name}`);
rows.push(['fonts/*', fonts.reduce((n, rel) => n + fileSize(rel), 0), null]);

const pack = JSON.parse(
  execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }),
)[0];

log('| Surface | Raw | Gzip |');
log('| --- | ---: | ---: |');
for (const [name, raw, gzip] of rows) {
  log(`| ${name} | ${bytes(raw)} | ${gzip == null ? 'n/a' : bytes(gzip)} |`);
}
log(
  `| npm tarball (${pack.entryCount} files) | ${bytes(pack.unpackedSize)} unpacked | ${bytes(pack.size)} packed |`,
);
