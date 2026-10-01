// The aggregate gate behind `npm run check`: `lint`, then every `check:*` script
// in package.json order, each through `npm run` so its output reads as before.
// Every gate runs and the summary names each one that failed, so one broken
// gate does not hide the next (a toolchain bump that failed check:exports used
// to stop the run before anything after it was measured). The list is the
// scripts themselves: a new `check:*` gate runs the day it is added.
//
// Run: npm run check            every gate, then exit 1 if any failed
//      npm run check -- --bail  stop at the first failure
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { repoRoot as root } from './lib/emit.mjs';
import { log } from './lib/stdio.mjs';

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const gates = ['lint', ...Object.keys(pkg.scripts).filter((key) => key.startsWith('check:'))];
const bail = process.argv.includes('--bail');

const failed = [];
const seconds = new Map();
const started = performance.now();
for (const gate of gates) {
  const start = performance.now();
  const run = spawnSync('npm', ['run', gate], { cwd: root, stdio: 'inherit' });
  seconds.set(gate, (performance.now() - start) / 1000);
  if (run.signal) {
    console.error(`✖ check: interrupted by ${run.signal} during ${gate}`);
    process.exit(130);
  }
  if (run.status !== 0) {
    failed.push(gate);
    if (bail) break;
  }
}

const total = ((performance.now() - started) / 1000).toFixed(1);
const slowest = [...seconds]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 3)
  .map(([gate, s]) => `${gate} ${s.toFixed(1)}s`)
  .join(', ');
if (failed.length) {
  const skipped = gates.length - seconds.size;
  console.error(
    `\n✖ check: ${failed.length} of ${gates.length} gates failed: ${failed.join(', ')}` +
      (skipped ? ` (${skipped} not run after --bail)` : ''),
  );
  process.exit(1);
}
log(`\n✓ check: all ${gates.length} gates passed in ${total}s (slowest: ${slowest})`);
