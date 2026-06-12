/**
 * Shared pass/fail footer for the check-*.mjs gates. Each gate collects its
 * domain errors into an array, then ends with the identical frame: print every
 * problem and exit 1, or print a single `✓` success line. That frame was copied
 * verbatim into ~18 gates; this owns it once so a change to the report format
 * lands everywhere. The per-gate logic stays in the gate. (code-quality audit Q8.)
 *
 * Sibling to assertFresh() in ./assert-fresh.mjs, which is the same idea
 * specialised to the pure freshness gates.
 *
 * @param {string[]} errors collected problems (empty = pass)
 * @param {{ label: string, ok: string }} opts
 *   `label` names the problem class for the failure header (e.g. "d2 theme-map"
 *   → "✖ N d2 theme-map problem(s):"); `ok` is the success line printed after
 *   `✓ ` when there are no errors.
 */
import { log } from './stdio.mjs';

export function reportAndExit(errors, { label, ok }) {
  if (errors.length) {
    console.error(`✖ ${errors.length} ${label} problem(s):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  log(`✓ ${ok}`);
}
