/**
 * Enforce: tokens/resolved.json is the freshly generated artifact of the
 * canonical token model (same drift contract as tokens.dtcg.json).
 *
 * Run: node scripts/check-resolved.mjs
 */
import { resolvedJson } from './gen-resolved.mjs';
import { assertFresh } from './lib/assert-fresh.mjs';

assertFresh(
  { 'tokens/resolved.json': resolvedJson() },
  {
    label: 'tokens/resolved.json is the fresh resolved build of the token model',
    buildHint: 'npm run resolved:build',
  },
);
