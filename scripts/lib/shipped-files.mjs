import { execFileSync } from 'node:child_process';

const posixPath = (path) => path.replace(/\\/g, '/');
const packagePath = (path) => posixPath(path).replace(/^\.\//, '').replace(/\/+$/, '');
const packageEntryIsFile = (entry) => /\/[^/]+\.[^/]+$|^[^/]+\.[^/]+$/.test(packagePath(entry));

export const isAlwaysIncludedPackageFile = (path) =>
  packagePath(path) === 'package.json' ||
  /^(readme|license|licence|changelog)(\.|$)/i.test(packagePath(path));

export const isUnderPackageFiles = (pkg, path) =>
  (pkg.files ?? []).some((entry) => {
    const allow = packagePath(entry);
    const rel = packagePath(path);
    if (allow === '') return false;
    if (rel === allow) return true;
    return !packageEntryIsFile(entry) && rel.startsWith(`${allow}/`);
  });

/**
 * File paths npm would include in the package tarball.
 *
 * @param {string} root absolute package root
 * @returns {string[]} repo-relative POSIX paths
 */
export function npmPackFiles(root) {
  const out = execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  return (JSON.parse(out)[0]?.files ?? []).map((file) => file.path.replace(/\\/g, '/'));
}
