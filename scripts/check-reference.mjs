/**
 * Enforce: docs/reference.md is the freshly generated artifact (run
 * scripts/gen-reference.mjs). Keeps the browsable reference from
 * drifting away from the class/token registries.
 *
 * Run: node scripts/check-reference.mjs
 */
import { generated } from './gen-reference.mjs';
import { assertFresh } from './lib/assert-fresh.mjs';

assertFresh(generated, {
  label: 'docs/reference.md is the generated, in-sync class+token reference',
  buildHint: 'npm run reference:build',
});
