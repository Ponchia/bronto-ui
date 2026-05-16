/**
 * Enforce: tokens/resolved.json is the freshly generated artifact of the
 * canonical token model (same drift contract as tokens.dtcg.json).
 *
 * Run: node scripts/check-resolved.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { RESOLVED_PATH, resolvedJson } from './gen-resolved.mjs';

const errors = [];
if (!existsSync(RESOLVED_PATH)) {
  errors.push('tokens/resolved.json missing — run: npm run resolved:build');
} else if (readFileSync(RESOLVED_PATH, 'utf8') !== resolvedJson()) {
  errors.push('tokens/resolved.json is stale — run: npm run resolved:build');
}

if (errors.length) {
  console.error(`✖ ${errors.length} resolved-token problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('✓ tokens/resolved.json is the fresh resolved build of the token model');
