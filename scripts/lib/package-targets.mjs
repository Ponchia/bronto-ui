/**
 * Shared package.json `exports` helpers for surface and tarball gates.
 *
 * Keep export-target flattening in one place so checks that inspect source
 * files and checks that inspect the actual npm pack file list cannot drift.
 */

/**
 * Flatten conditional exports to `[label, target]` leaves.
 *
 * @param {{ exports?: Record<string, string | Record<string, unknown>> }} pkg
 * @returns {[string, string][]}
 */
export function exportTargets(pkg) {
  const out = [];
  const visit = (label, value, path = []) => {
    if (typeof value === 'string') {
      out.push([path.length ? `${label} (${path.join('.')})` : label, value]);
      return;
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) return;
    for (const [condition, target] of Object.entries(value)) {
      visit(label, target, [...path, condition]);
    }
  };

  for (const [key, value] of Object.entries(pkg.exports ?? {})) visit(key, value);
  return out;
}

/**
 * Every concrete repo-relative file targeted by the exports map.
 *
 * Glob targets such as `./fonts/*` are intentionally skipped because the pack
 * gate cannot prove a concrete member from the pattern alone.
 *
 * @param {{ exports?: Record<string, string | Record<string, unknown>> }} pkg
 * @returns {string[]}
 */
export function exportTargetFiles(pkg) {
  return [
    ...new Set(
      exportTargets(pkg)
        .map(([, target]) => target)
        .filter((target) => !target.includes('*'))
        .map((target) => target.replace(/^\.\//, '')),
    ),
  ].sort();
}
