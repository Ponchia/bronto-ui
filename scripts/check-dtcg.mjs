/**
 * Enforce: tokens/tokens.dtcg.json is the freshly generated artifact of
 * the canonical token model (same drift contract as tokens/index.json).
 *
 * Run: node scripts/check-dtcg.mjs
 */
import { dtcgJson } from './gen-dtcg.mjs';
import { assertFresh } from './lib/assert-fresh.mjs';

assertFresh(
  { 'tokens/tokens.dtcg.json': dtcgJson() },
  {
    label: 'tokens/tokens.dtcg.json is the fresh DTCG build of the token model',
    buildHint: 'npm run dtcg:build',
  },
);
