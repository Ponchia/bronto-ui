/**
 * Enforce: tokens/tokens.dtcg.json is the freshly generated artifact of
 * the canonical token model (same drift contract as tokens/index.json).
 *
 * Run: node scripts/check-dtcg.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { DTCG_PATH, dtcgJson } from './gen-dtcg.mjs';

const errors = [];
if (!existsSync(DTCG_PATH)) {
  errors.push('tokens/tokens.dtcg.json missing — run: npm run dtcg:build');
} else if (readFileSync(DTCG_PATH, 'utf8') !== dtcgJson()) {
  errors.push('tokens/tokens.dtcg.json is stale — run: npm run dtcg:build');
}

if (errors.length) {
  console.error(`✖ ${errors.length} DTCG problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('✓ tokens/tokens.dtcg.json is the fresh DTCG build of the token model');
