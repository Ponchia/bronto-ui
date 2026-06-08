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
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generated } from './gen-glyphs.mjs';
import { GLYPHS, GLYPH_NAMES, GLYPH_SIZE, GLYPH_TAGS } from '../glyphs/glyphs.js';
import { freshnessErrors } from './lib/assert-fresh.mjs';
import { reportAndExit } from './lib/gate-report.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

// --- 1. drift ---
errors.push(...freshnessErrors(generated, 'npm run glyphs:build'));

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

// --- 3. legibility: no orphan lit cell ---
// A lit cell with NO lit neighbour in any of the 8 surrounding cells is a
// speck — it reads as dirt, not as part of a stroke (this is what the old
// `eye-off` slash had). 8-connectivity on purpose: a diagonal stroke (the
// check mark, the percent slash) has diagonal neighbours and is fine; only a
// truly isolated dot fails. Catches the lowest-quality hand-drawn bitmaps and
// stops new ones landing.
const lit = (rows, x, y) =>
  y >= 0 && x >= 0 && y < GLYPH_SIZE && x < GLYPH_SIZE && rows[y][x] !== '.';
for (const [name, rows] of Object.entries(GLYPHS)) {
  const orphans = [];
  for (let y = 0; y < GLYPH_SIZE; y++) {
    for (let x = 0; x < GLYPH_SIZE; x++) {
      if (rows[y][x] === '.') continue;
      let neighbour = false;
      for (let dy = -1; dy <= 1 && !neighbour; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          if ((dx || dy) && lit(rows, x + dx, y + dy)) {
            neighbour = true;
            break;
          }
        }
      if (!neighbour) orphans.push(`(${x},${y})`);
    }
  }
  if (orphans.length)
    errors.push(
      `${name}: ${orphans.length} orphan lit cell(s) with no 8-neighbour ${orphans.join(' ')} — ` +
        `reads as a speck, not a stroke`,
    );
}

// --- 4. GLYPH_TAGS shape: keys are real glyphs, values are non-empty terms ---
for (const [name, tags] of Object.entries(GLYPH_TAGS)) {
  if (!GLYPHS[name]) errors.push(`GLYPH_TAGS has "${name}" but it is not a glyph name`);
  if (!Array.isArray(tags) || tags.length === 0 || tags.some((t) => typeof t !== 'string' || !t))
    errors.push(`GLYPH_TAGS["${name}"] must be a non-empty array of non-empty strings`);
}

reportAndExit(errors, {
  label: 'glyph',
  ok:
    `${keys.length} glyphs are ${GLYPH_SIZE}×${GLYPH_SIZE}, sorted, speck-free, ` +
    `${Object.keys(GLYPH_TAGS).length} tagged, and glyphs/glyphs.d.ts is in sync`,
});
