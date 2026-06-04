/**
 * Regenerate tokens/index.json from the canonical tokens/index.js.
 * The JSON is a build artifact for non-JS tooling (Style Dictionary,
 * Figma, other languages). index.js is the single source of truth.
 *
 * Run: node scripts/gen-tokens-json.mjs   (or: npm run tokens:build)
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cssVars, tokens } from '../tokens/index.js';

import { repoRoot as root, isMain } from './lib/emit.mjs';

// A self-describing banner so the file can't be mistaken for hand-authored
// source. The $comment key is data (ignored by JSON consumers) and is part of
// the byte-exact drift contract enforced by check-fresh.mjs (via the registry).
const $comment =
  'GENERATED from tokens/index.js — do not edit by hand. Run `npm run tokens:build`; drift-checked by check:fresh. A build artifact for non-JS tooling (Style Dictionary, Figma, other languages).';

export const TOKENS_JSON_PATH = resolve(root, 'tokens/index.json');
export const tokensJson = JSON.stringify({ $comment, cssVars, tokens }, null, 2) + '\n';

if (isMain(import.meta.url)) {
  writeFileSync(TOKENS_JSON_PATH, tokensJson);
  console.log('✓ wrote tokens/index.json');
}
