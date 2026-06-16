import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { shippedDocs } from './shipped-docs.mjs';

function dirFiles(root, dir, predicate) {
  const abs = resolve(root, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs)
    .filter(predicate)
    .sort()
    .map((name) => `${dir}/${name}`);
}

/**
 * Files whose exact `@ponchia/ui@X.Y.Z` literals must track package.json.
 *
 * This includes shipped docs, GitHub-only getting-started docs linked from the
 * README/docs index, and demo pages exposed through GitHub Pages.
 *
 * @param {{ files?: string[] }} pkg the parsed package.json
 * @param {string} root repo root
 * @returns {string[]} repo-relative paths
 */
export function versionLiteralSurfaces(pkg, root) {
  return [
    ...new Set([
      ...shippedDocs(pkg),
      'docs/README.md',
      'docs/integration.md',
      ...dirFiles(root, 'docs/getting-started', (name) => name.endsWith('.md')),
      ...dirFiles(root, 'demo', (name) => name.endsWith('.html')),
    ]),
  ];
}
