/**
 * Enforce: classes/index.d.ts and tokens/index.d.ts are the freshly
 * generated artifacts (run scripts/gen-dts.mjs). Keeps the literal
 * public types from drifting away from the JS runtime.
 *
 * Run: node scripts/check-dts.mjs
 */
import { generated } from './gen-dts.mjs';
import { assertFresh } from './lib/assert-fresh.mjs';

assertFresh(generated, {
  label: 'classes/index.d.ts and tokens/index.d.ts are the generated, in-sync artifacts',
  buildHint: 'npm run dts:build',
});
