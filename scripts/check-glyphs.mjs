/**
 * Gate the display-glyph set on two axes:
 *
 *  1. Drift — glyphs/glyphs.d.ts must byte-match what gen-glyphs.mjs would
 *     produce from the runtime data (same freshness model as check-fresh).
 *  2. Shape — every bitmap must be exactly GLYPH_SIZE×GLYPH_SIZE, use only
 *     the `.#*` alphabet, and the name registry must be unique + sorted so
 *     the generated `GlyphName` union is stable.
 *
 * Wired into `npm run check`. Exit 1 on any problem.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generated } from './gen-glyphs.mjs';
import { GLYPHS, GLYPH_NAMES, GLYPH_SIZE } from '../glyphs/glyphs.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

// --- 1. drift ---
for (const [rel, expected] of Object.entries(generated)) {
  const abs = resolve(root, rel);
  if (!existsSync(abs)) errors.push(`${rel} missing — run: npm run glyphs:build`);
  else if (readFileSync(abs, 'utf8') !== expected)
    errors.push(`${rel} is stale — run: npm run glyphs:build`);
}

// --- 2. shape ---
const keys = Object.keys(GLYPHS);
const sorted = [...keys].sort();
if (keys.join(',') !== sorted.join(',')) {
  const at = keys.findIndex((k, i) => k !== sorted[i]);
  errors.push(
    `GLYPHS keys are not sorted (first out-of-order: \`${keys[at]}\`, expected \`${sorted[at]}\`)`,
  );
}

if (GLYPH_NAMES.join(',') !== sorted.join(','))
  errors.push('GLYPH_NAMES must equal the sorted GLYPHS keys');

if (new Set(keys).size !== keys.length) errors.push('GLYPHS has duplicate names');

const ALPHABET = /^[.#*]+$/;
for (const [name, rows] of Object.entries(GLYPHS)) {
  if (!Array.isArray(rows) || rows.length !== GLYPH_SIZE) {
    errors.push(`${name}: must have exactly ${GLYPH_SIZE} rows (has ${rows?.length})`);
    continue;
  }
  rows.forEach((row, i) => {
    if (typeof row !== 'string' || row.length !== GLYPH_SIZE)
      errors.push(`${name}: row ${i} must be ${GLYPH_SIZE} chars (is ${row?.length})`);
    else if (!ALPHABET.test(row)) errors.push(`${name}: row ${i} has chars outside [.#*]`);
  });
}

if (errors.length) {
  console.error(`✖ ${errors.length} glyph problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `✓ ${keys.length} glyphs are ${GLYPH_SIZE}×${GLYPH_SIZE}, sorted, and glyphs/glyphs.d.ts is in sync`,
);
