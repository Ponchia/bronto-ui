/** Reset only a disposable site output, never repository source or an unrelated folder. */
import { lstat, realpath, readdir, readFile, rm, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname, basename, join, sep } from 'node:path';

const marker = '.bronto-ui-site-output';
const identity = 'Bronto UI generated public site\n';
const within = (parent, child) =>
  child === parent || child.startsWith(parent.endsWith(sep) ? parent : parent + sep);

async function canonicalPath(path) {
  try {
    return await realpath(path);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return join(await canonicalPath(dirname(path)), basename(path));
  }
}

async function isMarked(path) {
  try {
    return (await readFile(join(path, marker), 'utf8')) === identity;
  } catch {
    return false;
  }
}

export async function prepareSiteOutput(repository, destination) {
  const requested = resolve(destination);
  const info = await lstat(requested).catch((error) => {
    if (error.code !== 'ENOENT') throw error;
    return null;
  });
  if (info && !info.isDirectory()) throw new Error('Site output must be a real directory');
  const repo = await realpath(repository);
  const output = await canonicalPath(requested);
  const defaultOutput = join(repo, '_site');
  if (
    output === dirname(output) ||
    within(output, repo) ||
    (within(repo, output) && output !== defaultOutput)
  ) {
    throw new Error('Refusing to replace repository source with public site output');
  }
  if (
    info &&
    output !== defaultOutput &&
    (await readdir(output)).length &&
    !(await isMarked(output))
  ) {
    throw new Error('Refusing to replace a nonempty directory not created by site:build');
  }
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  await writeFile(join(output, marker), identity);
}
