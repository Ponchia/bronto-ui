import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { verifyDependencies, verifySource } from '../scripts/source-publisher.mjs';

async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'source-publisher-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const files = {
    'package.json': JSON.stringify({ name: 'npm', version: '11.21.1' }),
    'bin/npm-cli.js': '// reviewed source\n',
  };
  const policy = { version: '11.21.1', files: {} };
  for (const [path, contents] of Object.entries(files)) {
    await mkdir(join(dir, 'source', path, '..'), { recursive: true });
    await writeFile(join(dir, 'source', path), contents);
    policy.files[path] = createHash('sha256').update(contents).digest('hex');
  }
  return { dir, policy };
}

test('unmodified upstream source is completely inventoried', async (t) => {
  const f = await fixture(t);
  assert.equal((await verifySource(join(f.dir, 'source'), f.policy)).version, '11.21.1');
});
for (const mutation of ['tamper', 'extra', 'missing', 'symlink']) {
  test(`source verification refuses ${mutation}`, async (t) => {
    const f = await fixture(t);
    const path = join(f.dir, 'source/bin/npm-cli.js');
    if (mutation === 'tamper') await writeFile(path, '// changed\n');
    if (mutation === 'extra') await writeFile(join(f.dir, 'source/extra.js'), '// not reviewed\n');
    if (mutation === 'missing' || mutation === 'symlink') await rm(path);
    if (mutation === 'symlink') await symlink(join(f.dir, 'source/package.json'), path);
    await assert.rejects(verifySource(join(f.dir, 'source'), f.policy));
  });
}

async function graph(t) {
  const { dir } = await fixture(t);
  const manifest = { dependencies: { example: '1.0.0' } };
  const lock = {
    lockfileVersion: 3,
    packages: {
      '': manifest,
      'node_modules/example': {
        version: '1.0.0',
        resolved: 'https://registry.npmjs.org/example/-/example-1.0.0.tgz',
        integrity: 'sha512-' + Buffer.alloc(64).toString('base64'),
      },
    },
  };
  await mkdir(join(dir, 'node_modules/example'), { recursive: true });
  await writeFile(
    join(dir, 'node_modules/example/package.json'),
    JSON.stringify({ name: 'example', version: '1.0.0' }),
  );
  return { dir, manifest, lock };
}
test('separate dependency inventory retains every installed package', async (t) => {
  const f = await graph(t);
  assert.equal((await verifyDependencies(f.dir, f.manifest, f.lock)).size, 1);
});
for (const field of ['version', 'resolved', 'integrity', 'inBundle', 'dependencies']) {
  test(`dependency verification refuses changed ${field}`, async (t) => {
    const f = await graph(t);
    const entry = f.lock.packages['node_modules/example'];
    entry[field] = {
      version: '9.0.0',
      resolved: 'https://unreviewed.invalid/pkg.tgz',
      integrity: 'sha512-unpinned',
      inBundle: true,
      dependencies: { hidden: '1.0.0' },
    }[field];
    await assert.rejects(verifyDependencies(f.dir, f.manifest, f.lock));
  });
}
test('metadata cannot hide an installed vulnerable package', async (t) => {
  const f = await graph(t);
  delete f.lock.packages['node_modules/example'];
  await assert.rejects(verifyDependencies(f.dir, f.manifest, f.lock));
});
test('missing declared dependencies cannot pass', async (t) => {
  const f = await graph(t);
  f.lock.packages['node_modules/missing'] = { version: '1.0.0' };
  await assert.rejects(verifyDependencies(f.dir, f.manifest, f.lock));
});
test('a linked dependency cannot redirect the checked runtime', async (t) => {
  const f = await graph(t);
  await symlink(f.dir, join(f.dir, 'node_modules/linked'));
  await assert.rejects(verifyDependencies(f.dir, f.manifest, f.lock));
});
test('the reviewed policy retains original npm identity and patched dependency versions', async () => {
  const manifest = JSON.parse(await readFile('tooling/publisher/package.json'));
  const policy = JSON.parse(await readFile('tooling/publisher/source.json'));
  assert.equal(manifest.private, true);
  assert.equal(policy.version, '11.21.1');
  assert.match(policy.commit, /^[a-f0-9]{40}$/);
  assert.equal(policy.url, `https://codeload.github.com/npm/cli/tar.gz/${policy.commit}`);
  assert.deepEqual(manifest.overrides, { undici: '6.29.1', 'ip-address': '10.7.4' });
  assert.deepEqual(manifest.overrides, policy.overrides);
  for (const path of ['bin/npm-cli.js', 'lib/commands/publish.js', 'lib/utils/oidc.js', 'LICENSE'])
    assert.ok(policy.files[path]);
});

test('audit graph includes unchanged CLI identity plus every dependency', async (t) => {
  const { createAuditGraph } = await import('../scripts/source-publisher.mjs');
  const f = await graph(t);
  const policy = {
    url: 'https://codeload.github.com/npm/cli/tar.gz/' + 'a'.repeat(40),
    integrity: 'sha512-review',
  };
  const source = { version: '11.21.1', dependencies: f.manifest.dependencies };
  const g = createAuditGraph(f.manifest, f.lock, source, policy);
  assert.deepEqual(
    g.lock.packages['node_modules/example'],
    f.lock.packages['node_modules/example'],
  );
  assert.deepEqual(g.lock.packages['node_modules/npm'].dependencies, source.dependencies);
  assert.equal(g.lock.packages['node_modules/npm'].version, source.version);
  assert.equal(g.manifest.dependencies.npm, policy.url);
  assert.equal(Object.keys(g.lock.packages).length, Object.keys(f.lock.packages).length + 1);
  assert.equal(f.lock.packages['node_modules/npm'], undefined);
});

for (const failure of [undefined, 'install', 'audit', 'version', 'assembly']) {
  test(`source readiness ${failure ?? 'success'} retains evidence and never publishes`, async (t) => {
    const { qualifySourcePublisher } = await import('../scripts/source-publisher.mjs');
    const parent = await mkdtemp(join(tmpdir(), 'source-readiness-'));
    t.after(() => rm(parent, { recursive: true, force: true }));
    const calls = [];
    const prepare = async (prefix) => {
      calls.push('install');
      await mkdir(join(prefix, 'node_modules'), { recursive: true });
      await mkdir(join(prefix, 'source'), { recursive: true });
      if (failure === 'install') throw Error('Installation unavailable');
    };
    const audit = async (prefix, path) => {
      calls.push('audit');
      await writeFile(path, '{}');
      if (failure === 'audit') throw Error('High advisory');
      return { version: '11.21.1', packages: 147, counts: {} };
    };
    const execute = async (command, args) => {
      assert.ok(calls.includes('audit'), 'Candidate executed before audit');
      assert.equal(command, process.execPath);
      if (args.includes('--version')) {
        calls.push('version');
        return { stdout: failure === 'version' ? 'bad' : '11.21.1' };
      }
      calls.push('assembly');
      assert.deepEqual(args.slice(1), ['pack', '--dry-run', '--ignore-scripts', '--json']);
      if (failure === 'assembly') throw Error('Invalid package');
      const pkg = JSON.parse(await readFile('package.json'));
      return {
        stdout: JSON.stringify([
          { name: pkg.name, version: pkg.version, files: [{ path: 'package.json' }] },
        ]),
      };
    };
    const result = await qualifySourcePublisher(parent, { prepare, audit, run: execute });
    assert.equal(result.status, failure ? 'blocked' : 'publisher-qualified');
    assert.equal(result.published, false);
    assert.equal(result.oidcVerified, false);
    assert.equal(result.releaseGatesRequired, true);
    assert.equal(
      JSON.parse(await readFile(join(result.directory, 'readiness.json'))).status,
      result.status,
    );
    await assert.rejects(readFile(join(result.directory, 'runtime/source/package.json')));
    if (failure === 'audit') assert.deepEqual(calls, ['install', 'audit']);
    if (failure === 'install') assert.deepEqual(calls, ['install']);
  });
}

test('archive extraction rejects unsafe or incomplete source members', async (t) => {
  const { execFileSync } = await import('node:child_process');
  const directory = await mkdtemp(join(tmpdir(), 'publisher-extraction-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const code = `
import hashlib, io, json, pathlib, subprocess, sys, tarfile
root=pathlib.Path(sys.argv[1]); script=sys.argv[2]
commit='a'*40; body=b'reviewed source\\n'
policy={'commit':commit,'files':{'bin/npm-cli.js':hashlib.sha256(body).hexdigest()}}
policy_path=root/'policy.json'; policy_path.write_text(json.dumps(policy))
for case in ['valid','tamper','symlink','duplicate','missing','wrong-root']:
    archive_path=root/(case+'.tgz')
    with tarfile.open(archive_path,'w:gz') as archive:
        if case != 'missing':
            payload=b'changed' if case=='tamper' else body
            name=('wrong' if case=='wrong-root' else 'cli-'+commit)+'/bin/npm-cli.js'
            member=tarfile.TarInfo(name); member.size=len(payload)
            if case=='symlink': member.type=tarfile.SYMTYPE; member.linkname='/tmp/outside'; member.size=0
            archive.addfile(member,io.BytesIO(payload) if member.isfile() else None)
            if case=='duplicate': archive.addfile(member,io.BytesIO(payload))
    result=subprocess.run([sys.executable,script,str(archive_path),str(policy_path),str(root/case)],capture_output=True)
    assert (result.returncode==0)==(case=='valid'),case
    if case=='valid': assert (root/case/'bin/npm-cli.js').read_bytes()==body
print('six archive cases passed')
`;
  const output = execFileSync(
    'python3',
    ['-B', '-c', code, directory, 'scripts/extract-publisher-source.py'],
    { encoding: 'utf8' },
  );
  assert.match(output, /six archive cases passed/);
});
