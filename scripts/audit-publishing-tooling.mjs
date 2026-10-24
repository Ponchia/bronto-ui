import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { constants } from 'node:fs';
import { lstat, open, readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

// An audit candidate, not an assertion that this bundle is safe. The live
// advisory check currently refuses this version; see .github/tooling/README.md.
export const candidate = {
  version: '11.21.1',
  tarball: 'https://registry.npmjs.org/npm/-/npm-11.21.1.tgz',
  integrity:
    'sha512-YTzL6QBEJXyHcTu0JiUc7RKMp+mzlJtl7rGLmERaXUQeFHIMc9atdr6G9M9C8vDWbv40epoTQAzNL2/PtZVDhQ==',
};

const exec = promisify(execFile);
const levels = ['info', 'low', 'moderate', 'high', 'critical'];

async function readJsonFile(path) {
  const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    assert.ok((await file.stat()).isFile(), 'Package manifests and lock must be regular files');
    return JSON.parse(await file.readFile('utf8'));
  } finally {
    await file.close();
  }
}

export async function verifyBundle(prefix) {
  const lock = await readJsonFile(join(prefix, 'package-lock.json'));
  assert.equal(lock.lockfileVersion, 3, 'Expected complete v3 tooling lock');
  assert.deepEqual(
    lock.packages?.['']?.dependencies,
    { npm: candidate.version },
    'Audit root must reach the exact publisher',
  );
  const npm = lock.packages?.['node_modules/npm'];
  assert.equal(npm?.version, candidate.version, 'Unexpected publisher version');
  assert.equal(npm.resolved, candidate.tarball, 'Unexpected publisher registry URL');
  assert.equal(npm.integrity, candidate.integrity, 'Unexpected publisher SHA-512');
  const installed = new Map();

  async function visitModules(directory, relative) {
    assert.ok((await lstat(directory)).isDirectory(), 'Dependency directory must be regular');
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.name === '.bin') continue;
      if (entry.name === '.package-lock.json') {
        assert.ok(entry.isFile(), 'Hidden npm lock must be regular');
        continue;
      }
      assert.ok(entry.isDirectory(), 'Dependency packages and scopes must be regular directories');
      if (entry.name.startsWith('@')) {
        for (const scoped of await readdir(join(directory, entry.name), { withFileTypes: true })) {
          assert.ok(scoped.isDirectory(), 'Scoped package must be regular');
          await visitPackage(`${entry.name}/${scoped.name}`, directory, relative);
        }
      } else {
        await visitPackage(entry.name, directory, relative);
      }
    }
  }

  async function visitPackage(name, directory, relative) {
    const path = `${relative}/${name}`;
    const manifestPath = join(directory, name, 'package.json');
    const manifest = await readJsonFile(manifestPath);
    assert.equal(manifest.name, name, `${path}: package name mismatch`);
    assert.equal(typeof manifest.version, 'string', `${path}: missing version`);
    assert.equal(
      lock.packages[path]?.version,
      manifest.version,
      `${path}: lock differs from installed bytes`,
    );
    for (const field of ['dependencies', 'optionalDependencies', 'peerDependencies']) {
      assert.deepEqual(
        lock.packages[path][field] ?? {},
        manifest[field] ?? {},
        `${path}: lock dependency edges differ from installed manifest`,
      );
    }
    if (path !== 'node_modules/npm') {
      assert.ok(
        path.startsWith('node_modules/npm/node_modules/'),
        'Unexpected external dependency',
      );
      assert.equal(
        lock.packages[path].inBundle,
        true,
        `${path}: dependency must inherit npm archive integrity`,
      );
    }
    installed.set(path, { name, version: manifest.version });
    const nested = join(directory, name, 'node_modules');
    const stat = await lstat(nested).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
      return null;
    });
    if (stat) await visitModules(nested, `${path}/node_modules`);
  }

  await visitModules(join(prefix, 'node_modules'), 'node_modules');
  assert.deepEqual(
    [...installed.keys()].sort(),
    Object.keys(lock.packages)
      .filter((path) => path !== '')
      .sort(),
    'Installed bundle and audited lock must have exactly the same packages',
  );
  return installed;
}

export function verifyAudit(report, exitCode, installed) {
  assert.equal(report?.auditReportVersion, 2, 'Unsupported or malformed audit report');
  assert.equal(report.error, undefined, 'Audit service returned an error');
  assert.ok(
    report.vulnerabilities &&
      typeof report.vulnerabilities === 'object' &&
      !Array.isArray(report.vulnerabilities),
    'Missing audit findings',
  );
  const counts = Object.fromEntries(levels.map((level) => [level, 0]));
  for (const [name, finding] of Object.entries(report.vulnerabilities)) {
    assert.equal(finding?.name, name, 'Malformed audit finding');
    assert.ok(levels.includes(finding.severity), 'Unknown finding severity');
    assert.ok(
      Array.isArray(finding.nodes) && finding.nodes.length > 0,
      'Missing affected package paths',
    );
    for (const node of finding.nodes)
      assert.equal(installed.get(node)?.name, name, 'Audit finding outside installed inventory');
    counts[finding.severity]++;
  }
  const summary = report.metadata?.vulnerabilities;
  for (const level of levels) {
    assert.ok(
      Number.isInteger(summary?.[level]) && summary[level] >= 0,
      'Missing or invalid audit counts',
    );
    assert.equal(summary[level], counts[level], 'Audit counts differ from findings');
  }
  assert.equal(
    summary.total,
    Object.values(counts).reduce((sum, count) => sum + count, 0),
    'Invalid audit total',
  );
  assert.ok(exitCode === 0 || exitCode === 1, 'Audit command failed');
  assert.equal(
    counts.high + counts.critical,
    0,
    'Publishing tooling has high/critical vulnerabilities',
  );
  assert.equal(exitCode, 0, 'Audit command did not succeed');
  return counts;
}

export async function auditPublishingTooling(prefix, reportPath, execute = exec) {
  const installed = await verifyBundle(prefix);
  let result;
  try {
    result = {
      ...(await execute(
        'npm',
        [
          'audit',
          '--prefix',
          prefix,
          '--package-lock-only',
          '--ignore-scripts',
          '--include=dev',
          '--audit-level=high',
          '--registry=https://registry.npmjs.org',
          '--json',
        ],
        { encoding: 'utf8', timeout: 90_000, maxBuffer: 8 * 1024 * 1024 },
      )),
      code: 0,
    };
  } catch (error) {
    result = error;
  }
  // Preserve the raw response even for a registry outage, malformed JSON or
  // nonzero CLI exit. Never convert an unavailable audit into a clean report.
  await writeFile(reportPath, result.stdout ?? '');
  const counts = verifyAudit(JSON.parse(result.stdout ?? ''), result.code, installed);
  console.log(
    `Publisher npm ${candidate.version}: ${installed.size} installed packages audited; ${JSON.stringify(counts)}`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [prefix, reportPath] = process.argv.slice(2);
  assert.ok(
    prefix && reportPath,
    'Usage: node scripts/audit-publishing-tooling.mjs PREFIX REPORT.json',
  );
  try {
    await auditPublishingTooling(resolve(prefix), resolve(reportPath));
  } catch (error) {
    await writeFile(
      `${resolve(reportPath)}.failure.json`,
      JSON.stringify({ status: 'blocked', error: error.message, candidate }, null, 2),
    );
    throw error;
  }
}
