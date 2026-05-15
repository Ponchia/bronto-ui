/**
 * Regenerate tokens/index.json from the canonical tokens/index.js.
 * The JSON is a build artifact for non-JS tooling (Style Dictionary,
 * Figma, other languages). index.js is the single source of truth.
 *
 * Run: node scripts/gen-tokens-json.mjs   (or: npm run tokens:build)
 */
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cssVars, tokens } from '../tokens/index.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const json = JSON.stringify({ cssVars, tokens }, null, 2) + '\n';
writeFileSync(resolve(root, 'tokens/index.json'), json);
console.log('✓ wrote tokens/index.json');
