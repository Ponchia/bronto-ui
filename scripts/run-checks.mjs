// The manifest owns the complete gate list. Keep serial npm lifecycle execution;
// optional machine-readable timing helps identify expensive gates before changing it.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { isMain, repoRoot as root } from './lib/emit.mjs';
import { log } from './lib/stdio.mjs';

export function checkOptions(args) {
  const options = { bail: false, report: undefined };
  for (const argument of args) {
    if (argument === '--bail') options.bail = true;
    else if (argument.startsWith('--report=') && isAbsolute(argument.slice(9)))
      options.report = argument.slice(9);
    else throw new Error(`Unknown option: ${argument}. Use --bail or --report=/absolute/path.json`);
  }
  return options;
}

export function runChecks(scripts, { bail = false, execute, report = () => {} }) {
  const gates = ['lint', ...Object.keys(scripts).filter((name) => name.startsWith('check:'))];
  const results = gates.map((name) => ({ name, state: 'not-run' }));
  const started = performance.now();
  let state = 'running';
  const snapshot = () => ({
    version: 1,
    state,
    seconds: (performance.now() - started) / 1000,
    results: results.map((result) => ({ ...result })),
  });
  report(snapshot());
  for (const result of results) {
    const start = performance.now();
    const run = execute(result.name);
    Object.assign(result, {
      state: run.signal ? 'interrupted' : run.status === 0 ? 'passed' : 'failed',
      seconds: (performance.now() - start) / 1000,
      exitCode: run.status ?? null,
      signal: run.signal ?? null,
      ...(run.error ? { error: String(run.error.message ?? run.error) } : {}),
    });
    report(snapshot());
    if (run.signal || (bail && result.state === 'failed')) break;
  }
  state = results.some((result) => result.state === 'interrupted')
    ? 'interrupted'
    : results.every((result) => result.state === 'passed')
      ? 'passed'
      : 'failed';
  const answer = snapshot();
  report(answer);
  return answer;
}

function printResult(result) {
  const failures = result.results.filter((gate) => gate.state === 'failed');
  const skipped = result.results.filter((gate) => gate.state === 'not-run').length;
  const interrupted = result.results.find((gate) => gate.state === 'interrupted');
  if (interrupted) {
    console.error(`✖ check: interrupted by ${interrupted.signal} during ${interrupted.name}`);
    return 130;
  }
  if (failures.length) {
    console.error(
      `\n✖ check: ${failures.length} of ${result.results.length} gates failed: ${failures.map((gate) => gate.name).join(', ')}` +
        (skipped ? ` (${skipped} not run after --bail)` : ''),
    );
    return 1;
  }
  const slowest = [...result.results]
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, 3)
    .map((gate) => `${gate.name} ${gate.seconds.toFixed(1)}s`)
    .join(', ');
  log(
    `\n✓ check: all ${result.results.length} gates passed in ${result.seconds.toFixed(1)}s (slowest: ${slowest})`,
  );
  return 0;
}

if (isMain(import.meta.url)) {
  const options = checkOptions(process.argv.slice(2));
  const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  const result = runChecks(pkg.scripts, {
    bail: options.bail,
    execute: (gate) => spawnSync('npm', ['run', gate], { cwd: root, stdio: 'inherit' }),
    report: options.report
      ? (value) => writeFileSync(options.report, `${JSON.stringify(value, null, 2)}\n`)
      : undefined,
  });
  process.exitCode = printResult(result);
}
