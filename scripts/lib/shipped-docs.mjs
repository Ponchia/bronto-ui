/**
 * The shipped documentation surface: npm's always-included `README.md`,
 * `llms.txt`, plus every `.md` listed in package.json `files` (docs ride along
 * in the tarball). check:versions (stale version literals) and
 * check:doc-recipes (CDN <script src> recipes) both scan exactly this set, so
 * they share one definition rather than keeping two copies in sync by comment.
 *
 *
 * @param {{ files?: string[] }} pkg the parsed package.json
 * @returns {string[]} repo-relative doc paths
 */
export function shippedDocs(pkg) {
  return [
    ...new Set(['README.md', 'llms.txt', ...(pkg.files ?? []).filter((f) => f.endsWith('.md'))]),
  ];
}
