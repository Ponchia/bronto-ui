/** Unmodified upstream npm source + separately locked dependencies; no repacked npm archive. */
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import {
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  open,
  readdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { verifyAudit } from './audit-publishing-tooling.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const template = join(root, 'tooling/publisher');
const run = promisify(execFile);
const settings = { encoding: 'utf8', timeout: 120_000, maxBuffer: 8 * 1024 * 1024 };
const hash = (data, algorithm = 'sha256') =>
  createHash(algorithm)
    .update(data)
    .digest(algorithm === 'sha512' ? 'base64' : 'hex');

async function regularBytes(path) {
  const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    assert.ok((await file.stat()).isFile(), 'Expected regular file');
    return await file.readFile();
  } finally {
    await file.close();
  }
}
const json = async (path) => JSON.parse(await regularBytes(path));

export async function verifySource(source, policy) {
  const actual = [];
  async function visit(directory, relative = '') {
    assert.ok((await lstat(directory)).isDirectory(), 'Source directory must be regular');
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        await visit(join(directory, entry.name), path);
        continue;
      }
      assert.ok(entry.isFile(), 'Source links and special files are refused');
      assert.equal(
        hash(await regularBytes(join(directory, entry.name))),
        policy.files[path],
        `Unreviewed source bytes: ${path}`,
      );
      actual.push(path);
    }
  }
  await visit(source);
  assert.deepEqual(actual.sort(), Object.keys(policy.files).sort(), 'Source inventory differs');
  const manifest = await json(join(source, 'package.json'));
  assert.equal(manifest.name, 'npm');
  assert.equal(manifest.version, policy.version);
  return manifest;
}

export async function verifyDependencies(prefix, manifest, lock) {
  assert.equal(lock.lockfileVersion, 3, 'Expected complete v3 dependency lock');
  assert.deepEqual(
    lock.packages?.['']?.dependencies,
    manifest.dependencies,
    'Root dependency edges differ',
  );
  const installed = new Map();
  async function visitModules(directory, relative = 'node_modules') {
    assert.ok((await lstat(directory)).isDirectory(), 'Module directory must be regular');
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.name === '.bin') continue;
      if (entry.name === '.package-lock.json') {
        assert.ok(entry.isFile());
        continue;
      }
      assert.ok(entry.isDirectory(), 'Dependency packages/scopes must be regular directories');
      if (entry.name.startsWith('@')) {
        const scope = join(directory, entry.name);
        for (const child of await readdir(scope, { withFileTypes: true })) {
          assert.ok(child.isDirectory(), 'Scoped dependency must be regular');
          await visitPackage(`${entry.name}/${child.name}`, directory, relative);
        }
      } else await visitPackage(entry.name, directory, relative);
    }
  }
  async function visitPackage(name, directory, relative) {
    const path = `${relative}/${name}`;
    const entry = lock.packages[path];
    assert.ok(entry && !entry.inBundle && !entry.link, `Unpinned/bundled dependency: ${path}`);
    assert.ok(/^sha512-[A-Za-z0-9+/]{86}==$/.test(entry.integrity), `Missing integrity: ${path}`);
    const url = new URL(entry.resolved);
    assert.equal(
      url.origin,
      'https://registry.npmjs.org',
      'Dependencies must use the public registry',
    );
    assert.equal(
      url.username + url.password + url.search + url.hash,
      '',
      'Unexpected registry URL',
    );
    const item = await json(join(directory, name, 'package.json'));
    assert.equal(item.name, name, `Package name differs: ${path}`);
    assert.equal(item.version, entry.version, `Installed version differs: ${path}`);
    for (const field of ['dependencies', 'optionalDependencies', 'peerDependencies'])
      assert.deepEqual(
        item[field] ?? {},
        entry[field] ?? {},
        `Installed dependency edges differ: ${path}`,
      );
    installed.set(path, { name, version: item.version });
    const nested = join(directory, name, 'node_modules');
    const state = await lstat(nested).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
      return null;
    });
    if (state) await visitModules(nested, `${path}/node_modules`);
  }
  await visitModules(join(prefix, 'node_modules'));
  assert.deepEqual(
    [...installed.keys()].sort(),
    Object.keys(lock.packages).filter(Boolean).sort(),
    'Installed graph differs from complete lock',
  );
  return installed;
}

export function createAuditGraph(manifest, lock, source, policy) {
  assert.equal(lock.packages['node_modules/npm'], undefined, 'Unexpected second CLI');
  const auditManifest = {
    ...manifest,
    dependencies: { ...manifest.dependencies, npm: policy.url },
  };
  const packages = structuredClone(lock.packages);
  packages[''] = { ...packages[''], dependencies: auditManifest.dependencies };
  packages['node_modules/npm'] = {
    version: source.version,
    resolved: policy.url,
    integrity: policy.integrity,
    dependencies: source.dependencies,
  };
  return { manifest: auditManifest, lock: { ...lock, packages } };
}

export async function auditSourcePublisher(prefix, reportPath) {
  const policy = await json(join(template, 'source.json'));
  const source = await verifySource(join(prefix, 'source'), policy);
  const manifest = await json(join(prefix, 'package.json'));
  assert.equal(manifest.private, true, 'Publisher tooling must remain private');
  assert.deepEqual(
    manifest.dependencies,
    source.dependencies,
    'Runtime must include every upstream dependency',
  );
  assert.deepEqual(manifest.overrides, policy.overrides, 'Unexpected dependency substitutions');
  const installed = await verifyDependencies(
    prefix,
    manifest,
    await json(join(prefix, 'package-lock.json')),
  );
  // The CLI source is outside node_modules, but is still a component in the
  // complete audit. Normalize that source node into an audit-only lock; retain
  // every installed dependency, version and edge without omitting any finding.
  const graph = createAuditGraph(
    manifest,
    await json(join(prefix, 'package-lock.json')),
    source,
    policy,
  );
  const auditDirectory = await mkdtemp(join(prefix, '.audit-'));
  let result;
  try {
    await writeFile(join(auditDirectory, 'package.json'), JSON.stringify(graph.manifest));
    await writeFile(join(auditDirectory, 'package-lock.json'), JSON.stringify(graph.lock));
    try {
      result = {
        ...(await run(
          'npm',
          [
            'audit',
            '--prefix',
            auditDirectory,
            '--package-lock-only',
            '--include=dev',
            '--ignore-scripts',
            '--audit-level=high',
            '--registry=https://registry.npmjs.org',
            '--json',
          ],
          settings,
        )),
        code: 0,
      };
    } catch (error) {
      result = error;
    }
    await writeFile(reportPath, result.stdout ?? '');
    installed.set('node_modules/npm', { name: 'npm', version: source.version });
    const counts = verifyAudit(JSON.parse(result.stdout ?? ''), result.code, installed);
    return {
      version: policy.version,
      sourceCommit: policy.commit,
      packages: installed.size,
      counts,
    };
  } finally {
    await rm(auditDirectory, { recursive: true, force: true });
  }
}

export async function prepareSourcePublisher(prefix) {
  await mkdir(prefix, { recursive: true, mode: 0o700 });
  assert.ok((await lstat(prefix)).isDirectory(), 'Publisher prefix must be regular');
  for (const file of ['package.json', 'package-lock.json']) {
    if (resolve(prefix) !== template) await copyFile(join(template, file), join(prefix, file));
  }
  const policy = await json(join(template, 'source.json'));
  assert.equal(policy.url, `https://codeload.github.com/npm/cli/tar.gz/${policy.commit}`);
  const archive = await fetch(policy.url, {
    redirect: 'error',
    signal: AbortSignal.timeout(60_000),
  });
  assert.equal(archive.status, 200, 'Official source archive unavailable');
  const chunks = [];
  let received = 0;
  for await (const chunk of archive.body) {
    received += chunk.length;
    assert.ok(received <= policy.bytes, 'Source archive exceeds reviewed size');
    chunks.push(chunk);
  }
  const bytes = Buffer.concat(chunks);
  assert.equal(bytes.length, policy.bytes, 'Official source archive size differs');
  assert.equal(
    `sha512-${hash(bytes, 'sha512')}`,
    policy.integrity,
    'Official source archive integrity differs',
  );
  const staging = await mkdtemp(join(prefix, '.source-'));
  try {
    await writeFile(join(staging, 'npm-source.tgz'), bytes, { mode: 0o600 });
    await run(
      'python3',
      [
        join(root, 'scripts/extract-publisher-source.py'),
        join(staging, 'npm-source.tgz'),
        join(template, 'source.json'),
        join(prefix, 'source'),
      ],
      settings,
    );
    await run(
      'npm',
      [
        'ci',
        '--prefix',
        prefix,
        '--ignore-scripts',
        '--no-audit',
        '--no-fund',
        '--registry=https://registry.npmjs.org',
      ],
      settings,
    );
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

async function inputHashes() {
  const paths = [
    'tooling/publisher/source.json',
    'tooling/publisher/package.json',
    'tooling/publisher/package-lock.json',
    'scripts/source-publisher.mjs',
    'scripts/extract-publisher-source.py',
    'scripts/audit-publishing-tooling.mjs',
    'package.json',
  ];
  return Object.fromEntries(
    await Promise.all(
      paths.map(async (path) => [path, hash(await regularBytes(join(root, path)))]),
    ),
  );
}

export async function qualifySourcePublisher(parent, adapters = {}) {
  const prepare = adapters.prepare ?? prepareSourcePublisher;
  const audit = adapters.audit ?? auditSourcePublisher;
  const execute = adapters.run ?? run;
  await mkdir(parent, { recursive: true, mode: 0o700 });
  const directory = await mkdtemp(join(parent, 'publisher-source-readiness-'));
  const prefix = join(directory, 'runtime');
  const verdict = {
    status: 'blocked',
    phase: 'install',
    directory,
    published: false,
    oidcVerified: false,
    releaseGatesRequired: true,
  };
  try {
    verdict.inputHashes = await inputHashes();
    verdict.observedAt = new Date().toISOString();
    await prepare(prefix);
    verdict.phase = 'audit';
    verdict.audit = await audit(prefix, join(directory, 'audit.json'));
    verdict.phase = 'assembly';
    const cli = join(prefix, 'source/bin/npm-cli.js');
    const version = await execute(process.execPath, [cli, '--version'], settings);
    assert.equal(version.stdout.trim(), verdict.audit.version);
    const pack = await execute(
      process.execPath,
      [cli, 'pack', '--dry-run', '--ignore-scripts', '--json'],
      { ...settings, cwd: root },
    );
    await writeFile(join(directory, 'pack.json'), pack.stdout);
    const item = JSON.parse(pack.stdout)[0];
    const project = await json(join(root, 'package.json'));
    assert.equal(item.name, project.name);
    assert.equal(item.version, project.version);
    assert.ok(item.files.length > 0);
    assert.deepEqual(await inputHashes(), verdict.inputHashes, 'Qualification inputs changed');
    verdict.package = { name: item.name, version: item.version, files: item.files.length };
    verdict.status = 'publisher-qualified';
    verdict.phase = 'complete';
  } catch (error) {
    verdict.error = error.message;
    await writeFile(
      join(directory, 'failure.json'),
      JSON.stringify({ phase: verdict.phase, error: error.message }) + '\n',
    );
  } finally {
    await rm(join(prefix, 'node_modules'), { recursive: true, force: true });
    await rm(join(prefix, 'source'), { recursive: true, force: true });
    await writeFile(join(directory, 'readiness.json'), JSON.stringify(verdict, null, 2) + '\n');
  }
  return verdict;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [command, prefix, report] = process.argv.slice(2);
  try {
    if (command === 'prepare' && prefix && !report) await prepareSourcePublisher(resolve(prefix));
    else if (command === 'audit' && prefix && report)
      console.log(JSON.stringify(await auditSourcePublisher(resolve(prefix), resolve(report))));
    else if (command === 'readiness' && !report) {
      const verdict = await qualifySourcePublisher(resolve(prefix ?? tmpdir()));
      console.log(JSON.stringify(verdict, null, 2));
      if (verdict.status !== 'publisher-qualified') process.exitCode = 1;
    } else
      throw new Error(
        'Usage: source-publisher.mjs prepare PREFIX | audit PREFIX REPORT | readiness [OUTPUT_PARENT]',
      );
  } catch (error) {
    console.error(`Source publisher blocked: ${error.message}`);
    process.exitCode = 1;
  }
}
