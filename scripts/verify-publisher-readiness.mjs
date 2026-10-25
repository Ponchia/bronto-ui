/** Qualify the locked publisher in disposable storage; never tag, approve or publish. */
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { auditPublishingTooling, candidate } from './audit-publishing-tooling.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const execute = promisify(execFile);
const inputs = ['tooling/npm/package.json', 'tooling/npm/package-lock.json'];

async function recordInputs(projectRoot) {
  return Object.fromEntries(
    await Promise.all(
      [...inputs, 'scripts/audit-publishing-tooling.mjs', 'package.json'].map(async (path) => [
        path,
        createHash('sha256')
          .update(await readFile(join(projectRoot, path)))
          .digest('hex'),
      ]),
    ),
  );
}

async function checkAssembly(projectRoot, prefix, run, directory) {
  const cli = join(prefix, 'node_modules/npm/bin/npm-cli.js');
  const options = {
    cwd: projectRoot,
    encoding: 'utf8',
    timeout: 90_000,
    maxBuffer: 8 * 1024 * 1024,
  };
  const version = await run(process.execPath, [cli, '--version'], options);
  assert.equal(version.stdout.trim(), candidate.version, 'Installed CLI reported another version');
  const result = await run(
    process.execPath,
    [cli, 'pack', '--dry-run', '--ignore-scripts', '--json'],
    options,
  );
  await writeFile(join(directory, 'pack.json'), result.stdout);
  const packed = JSON.parse(result.stdout);
  const manifest = JSON.parse(await readFile(join(projectRoot, 'package.json'), 'utf8'));
  assert.ok(Array.isArray(packed) && packed.length === 1, 'Expected one package assembly report');
  assert.equal(packed[0].name, manifest.name, 'Unexpected package name in assembly report');
  assert.equal(packed[0].version, manifest.version, 'Unexpected version in assembly report');
  assert.ok(packed[0].files?.length > 0, 'Package assembly contains no files');
  return { name: manifest.name, version: manifest.version, files: packed[0].files.length };
}

/** The injected adapters are only for deterministic tests; CLI always uses the real guard. */
export async function verifyPublisherReadiness(
  { projectRoot = root, outputParent = tmpdir() } = {},
  { run = execute, audit = auditPublishingTooling } = {},
) {
  await mkdir(outputParent, { recursive: true });
  const directory = await mkdtemp(join(outputParent, 'publisher-readiness-'));
  const prefix = join(directory, 'tooling');
  const reportPath = join(directory, 'audit.json');
  const result = {
    status: 'blocked',
    phase: 'prepare',
    observedAt: new Date().toISOString(),
    candidate,
    directory,
    published: false,
    oidcVerified: false,
    releaseGatesRequired: true,
  };
  try {
    result.inputHashes = await recordInputs(projectRoot);
    await mkdir(prefix);
    for (const path of inputs)
      await copyFile(join(projectRoot, path), join(prefix, path.split('/').at(-1)));
    result.phase = 'install';
    const installation = await run(
      'npm',
      ['ci', '--prefix', prefix, '--ignore-scripts', '--no-audit', '--no-fund'],
      { encoding: 'utf8', timeout: 120_000, maxBuffer: 8 * 1024 * 1024 },
    );
    await writeFile(
      join(directory, 'install.log'),
      installation.stdout + (installation.stderr ?? ''),
    );
    result.phase = 'audit';
    // The existing complete-inventory/high-critical gate runs before ANY candidate CLI code.
    await audit(prefix, reportPath);
    result.auditCounts = JSON.parse(await readFile(reportPath, 'utf8')).metadata.vulnerabilities;
    result.phase = 'assembly';
    result.package = await checkAssembly(projectRoot, prefix, run, directory);
    assert.deepEqual(
      await recordInputs(projectRoot),
      result.inputHashes,
      'Qualification inputs changed',
    );
    result.phase = 'complete';
    result.status = 'publisher-qualified';
  } catch (error) {
    result.error = error.message;
    await writeFile(
      join(directory, 'failure.json'),
      JSON.stringify({ phase: result.phase, error: error.message }, null, 2) + '\n',
    );
    if (result.phase === 'install') {
      await writeFile(join(directory, 'install.log'), (error.stdout ?? '') + (error.stderr ?? ''));
    }
  } finally {
    // Keep manifests and evidence, but never leave an unqualified executable installed.
    await rm(join(prefix, 'node_modules'), { recursive: true, force: true });
    await writeFile(join(directory, 'readiness.json'), JSON.stringify(result, null, 2) + '\n');
  }
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv.length > 3 || process.argv[2]?.startsWith('--')) {
    console.error('Usage: node scripts/verify-publisher-readiness.mjs [OUTPUT_PARENT]');
    process.exitCode = 2;
  } else {
    try {
      const result = await verifyPublisherReadiness({
        outputParent: resolve(process.argv[2] ?? tmpdir()),
      });
      console.log(JSON.stringify(result, null, 2));
      process.exitCode = result.status === 'publisher-qualified' ? 0 : 1;
    } catch (error) {
      console.error(`Publisher readiness could not be recorded: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
