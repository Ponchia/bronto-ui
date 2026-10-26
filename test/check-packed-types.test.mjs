import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { checkPackedTypes } from '../scripts/check-packed-types.mjs';

test('validation precedes packing, scripts stay off and ATTW inspects exactly that file', () => {
  const calls = [];
  let scratch;
  const answer = checkPackedTypes('/not-used-by-double', (command, args, options) => {
    calls.push({ command, args, options });
    if (args[0] === 'pack') {
      scratch = args.at(-1);
      writeFileSync(join(scratch, 'fixture.tgz'), 'fixture bytes');
      return JSON.stringify([{ filename: 'fixture.tgz', integrity: 'fixture-integrity' }]);
    }
    if (command === process.execPath) {
      assert.equal(readFileSync(args[1], 'utf8'), 'fixture bytes');
      assert.deepEqual(args.slice(2), ['--ignore-rules', 'no-resolution', 'cjs-resolves-to-esm']);
    }
    return '';
  });
  assert.deepEqual(calls[0].args, ['run', 'verify:artifacts']);
  assert.deepEqual(calls[1].args.slice(0, 4), [
    'pack',
    '--ignore-scripts',
    '--json',
    '--pack-destination',
  ]);
  assert.equal(calls.length, 3);
  assert.deepEqual(answer, { filename: 'fixture.tgz', integrity: 'fixture-integrity' });
  assert.equal(existsSync(scratch), false);
});

test('validation failure never packages and an ATTW failure is preserved after cleanup', () => {
  let calls = 0;
  const stale = new Error('stale declarations');
  assert.throws(
    () =>
      checkPackedTypes('/unused', () => {
        calls++;
        throw stale;
      }),
    (e) => e === stale,
  );
  assert.equal(calls, 1);
  let scratch;
  const failed = Object.assign(new Error('ATTW failure'), { exitCode: 7 });
  assert.throws(
    () =>
      checkPackedTypes('/unused', (command, args) => {
        if (args[0] === 'pack') {
          scratch = args.at(-1);
          writeFileSync(join(scratch, 'fixture.tgz'), 'bytes');
          return JSON.stringify([{ filename: 'fixture.tgz' }]);
        }
        if (command === process.execPath) throw failed;
        return '';
      }),
    (e) => e === failed && e.exitCode === 7,
  );
  assert.equal(existsSync(scratch), false);
});

test('ambiguous and out-of-directory pack responses never reach the analyzer', () => {
  for (const response of [
    [],
    [{ filename: '../outside.tgz' }],
    [{ filename: 'a.tgz' }, { filename: 'b.tgz' }],
    [{ filename: 'missing.tgz' }],
  ]) {
    let analyzer = false;
    assert.throws(() =>
      checkPackedTypes('/unused', (command, args) => {
        if (command === process.execPath) analyzer = true;
        return args[0] === 'pack' ? JSON.stringify(response) : '';
      }),
    );
    assert.equal(analyzer, false);
  }
});

test('a symlinked temporary directory accepts its owned regular tarball', () => {
  const root = mkdtempSync(join(tmpdir(), 'bronto-types-symlink-'));
  const temporaryVariable = process.platform === 'win32' ? 'TEMP' : 'TMPDIR';
  const previous = process.env[temporaryVariable];
  let scratch;
  try {
    const real = join(root, 'real');
    const linked = join(root, 'linked');
    mkdirSync(real);
    symlinkSync(real, linked, process.platform === 'win32' ? 'junction' : 'dir');
    process.env[temporaryVariable] = linked;
    const answer = checkPackedTypes('/unused', (_command, args) => {
      if (args[0] === 'pack') {
        scratch = args.at(-1);
        writeFileSync(join(scratch, 'fixture.tgz'), 'fixture bytes');
        return JSON.stringify([{ filename: 'fixture.tgz' }]);
      }
      return '';
    });
    assert.equal(answer.filename, 'fixture.tgz');
    assert.equal(existsSync(scratch), false);
  } finally {
    if (previous === undefined) delete process.env[temporaryVariable];
    else process.env[temporaryVariable] = previous;
    rmSync(root, { recursive: true, force: true });
  }
});

test('real npm packaging does not invoke prepack and stale artifacts fail without repair', () => {
  const root = mkdtempSync(join(tmpdir(), 'bronto-packed-types-test-'));
  try {
    writeFileSync(
      join(root, 'package.json'),
      JSON.stringify({
        name: 'bronto-packed-types-fixture',
        version: '1.0.0',
        type: 'module',
        exports: { '.': { types: './index.d.ts', default: './index.js' } },
        files: ['index.js', 'index.d.ts'],
        scripts: {
          'verify:artifacts': 'node verify.cjs',
          prepack: "node -e \"require('fs').writeFileSync('prepack-ran','bad')\"",
        },
      }),
    );
    writeFileSync(join(root, 'index.js'), 'export const value = 1;\n');
    writeFileSync(join(root, 'index.d.ts'), 'export declare const value: number;\n');
    writeFileSync(
      join(root, 'verify.cjs'),
      `require('node:assert/strict').equal(require('node:fs').readFileSync('index.d.ts','utf8'),'export declare const value: number;\\n');`,
    );
    const logs = [];
    const run = (command, args, options) => {
      const result = spawnSync(command, args, {
        ...options,
        stdio: 'pipe',
        encoding: 'utf8',
        timeout: 30000,
      });
      logs.push(String(result.stdout) + String(result.stderr));
      if (result.error || result.status !== 0)
        throw new Error(`fixture command failed: ${logs.at(-1)}`);
      return result.stdout;
    };
    checkPackedTypes(root, run);
    assert.equal(existsSync(join(root, 'prepack-ran')), false);
    writeFileSync(join(root, 'index.d.ts'), 'stale');
    assert.throws(() => checkPackedTypes(root, run), /fixture command failed/);
    assert.equal(readFileSync(join(root, 'index.d.ts'), 'utf8'), 'stale');
    assert.equal(existsSync(join(root, 'prepack-ran')), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
