/**
 * Enforce the token source-of-truth contract. tokens/index.js (`cssVars`) is
 * the single source for token VALUES:
 *
 *  - css/tokens.css must be the freshly generated artifact of `cssVars`
 *    (scripts/gen-tokens-css.mjs). Its four :root palette blocks cannot drift
 *    from the JS model, and the two dark blocks are identical by construction
 *    (both emitted from cssVars.dark). The hand-authored presets below the
 *    HAND-AUTHORED marker are preserved by the generator, not re-checked here.
 *  - tokens/index.json must be the up-to-date generated artifact
 *    (scripts/gen-tokens-json.mjs).
 *
 * Run: node scripts/check-tokens.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cssVars, tokens } from '../tokens/index.js';
import { tokensCss, TOKENS_CSS_PATH } from './gen-tokens-css.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

if (!existsSync(TOKENS_CSS_PATH))
  errors.push('css/tokens.css missing — run: npm run tokens:css:build');
else if (readFileSync(TOKENS_CSS_PATH, 'utf8') !== tokensCss())
  errors.push('css/tokens.css palette is stale vs tokens/index.js — run: npm run tokens:css:build');

const jsonPath = resolve(root, 'tokens/index.json');
const expectedJson = JSON.stringify({ cssVars, tokens }, null, 2) + '\n';
if (!existsSync(jsonPath)) errors.push('tokens/index.json missing — run: npm run tokens:build');
else if (readFileSync(jsonPath, 'utf8') !== expectedJson)
  errors.push('tokens/index.json is stale — run: npm run tokens:build');

if (errors.length) {
  console.error(`✖ ${errors.length} token problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  '✓ css/tokens.css palette is generated from tokens/index.js cssVars; tokens/index.json is fresh',
);
