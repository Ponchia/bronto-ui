import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareSiteOutput } from '../scripts/lib/site-output.mjs';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'bronto-site-output-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const repo = join(root, 'repository');
  await mkdir(join(repo, 'docs'), { recursive: true });
  await writeFile(join(repo, 'docs', 'guide.md'), 'maintained source');
  return { root, repo };
}

test('site output refuses repository source, ancestors and symlink aliases', async (t) => {
  const { root, repo } = await fixture(t);
  await symlink(join(repo, 'docs'), join(root, 'docs-alias'));
  for (const output of [repo, root, join(repo, 'docs'), join(root, 'docs-alias')]) {
    await assert.rejects(prepareSiteOutput(repo, output), /Refusing|real directory/);
  }
  assert.equal(await readFile(join(repo, 'docs', 'guide.md'), 'utf8'), 'maintained source');
});

test('site output refuses an unrelated nonempty folder', async (t) => {
  const { root, repo } = await fixture(t);
  const output = join(root, 'notes');
  await mkdir(output);
  await writeFile(join(output, 'keep.txt'), 'keep');
  await assert.rejects(prepareSiteOutput(repo, output), /nonempty directory/);
  assert.equal(await readFile(join(output, 'keep.txt'), 'utf8'), 'keep');
});

test('site output rebuilds default and marked custom destinations', async (t) => {
  const { root, repo } = await fixture(t);
  for (const output of [join(repo, '_site'), join(root, 'public')]) {
    await prepareSiteOutput(repo, output);
    await writeFile(join(output, 'stale.html'), 'old route');
    await prepareSiteOutput(repo, output);
    await assert.rejects(readFile(join(output, 'stale.html')), { code: 'ENOENT' });
    assert.match(await readFile(join(output, '.bronto-ui-site-output'), 'utf8'), /Bronto UI/);
  }
});
