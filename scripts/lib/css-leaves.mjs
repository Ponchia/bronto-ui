/**
 * The CSS leaf registry, derived from package.json `exports` — the single
 * place a leaf must be declared to be consumable at all (check:exports
 * enforces the ./css + ./css/unlayered key pair per leaf). check:report and
 * check:pack used to keep hand-copied leaf lists that silently drifted
 * behind the shipped set (the post-0.6.0 scout leaves were in none of them);
 * deriving from the exports map makes a new leaf impossible to under-scan.
 */

/** Every exported `./css/<name>.css` leaf name (no path, no extension). */
export function cssLeaves(pkg) {
  return Object.keys(pkg.exports ?? {})
    .map((k) => /^\.\/css\/([a-z-]+)\.css$/.exec(k)?.[1])
    .filter(Boolean);
}

/**
 * The modules css/core.css is ALLOWED to @import — the default bundle.
 * Everything else in the exports map is opt-in by contract and must never be
 * pulled into core. Adding an import to core.css requires a deliberate entry
 * here, so the default-bundle surface cannot grow by accident.
 */
export const CORE_BUNDLE = new Set([
  'tokens',
  'fonts',
  'base',
  'motion',
  'dots',
  'navigation',
  'site',
  'content',
  'primitives',
  'forms',
  'feedback',
  'overlay',
  'disclosure',
  'table',
  'app',
]);

/** The opt-in leaves: exported, not part of the default bundle, not core itself. */
export function optInLeaves(pkg) {
  return cssLeaves(pkg).filter((leaf) => leaf !== 'core' && !CORE_BUNDLE.has(leaf));
}
