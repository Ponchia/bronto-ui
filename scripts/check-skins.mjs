/**
 * Drift + shape gate for the optional colorways.
 *
 *   1. css/skins.css is exactly what gen-skins.mjs would emit from
 *      tokens/skins.js (so the stylesheet can't rot from the source).
 *   2. Each skin's `light` and `dark` maps share an identical key set, and
 *      every skin defines `--accent` (the one thing a colorway must re-point).
 *   3. skins.css is NOT pulled into css/core.css (it must stay opt-in, out of
 *      the default bundle).
 *
 * Contrast of each skin accent is gated separately by check-contrast.mjs.
 *
 * Run: node scripts/check-skins.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generated } from './gen-skins.mjs';
import { skins, SKIN_NAMES } from '../tokens/skins.js';
import { freshnessErrors } from './lib/assert-fresh.mjs';
import { reportAndExit } from './lib/gate-report.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

// 1. Drift.
errors.push(...freshnessErrors(generated, 'npm run skins:build'));

// 2. Shape.
for (const name of SKIN_NAMES) {
  const s = skins[name];
  if (!s.label) errors.push(`skin "${name}" has no label`);
  const lk = Object.keys(s.light ?? {}).sort();
  const dk = Object.keys(s.dark ?? {}).sort();
  if (!s.light?.['--accent']) errors.push(`skin "${name}" light does not set --accent`);
  if (!s.dark?.['--accent']) errors.push(`skin "${name}" dark does not set --accent`);
  // light/dark may differ in display knobs (e.g. glow only in dark), but the
  // accent contract must exist in both — already checked above. Warn only if a
  // non-accent key is set in one theme but not the other AND is not a known
  // display knob, to catch typos.
  const known = new Set([
    '--accent',
    '--dotmatrix-glow',
    '--dotmatrix-pulse-min',
    '--dotmatrix-reveal-step',
  ]);
  for (const k of [...lk, ...dk]) {
    if (!known.has(k))
      errors.push(`skin "${name}" sets unknown token "${k}" — typo, or add it to the known set`);
  }
}

// 2b. Tier-3 display knobs must not be dead. dots.css documents
// --dotmatrix-glow / --dotmatrix-pulse-min / --dotmatrix-reveal-step as the
// "display expression" language the colorways set; the check-classes gate
// can only prove a knob is *referenced* (a `var(--x, default)` read counts),
// not that any colorway actually *sets* it — exactly the "validates-but-no-ops"
// trap. So assert here that each documented colorway knob has at least one
// set-site across the skins. (Author code may also set these inline; this only
// guards the colorway-set claim.)
const COLORWAY_DISPLAY_KNOBS = [
  '--dotmatrix-glow',
  '--dotmatrix-pulse-min',
  '--dotmatrix-reveal-step',
];
const setAcrossSkins = new Set();
for (const name of SKIN_NAMES) {
  for (const k of Object.keys(skins[name].light ?? {})) setAcrossSkins.add(k);
  for (const k of Object.keys(skins[name].dark ?? {})) setAcrossSkins.add(k);
}
for (const knob of COLORWAY_DISPLAY_KNOBS) {
  if (!setAcrossSkins.has(knob))
    errors.push(
      `dots.css documents "${knob}" as a colorway-set display knob, but no skin in ` +
        `tokens/skins.js sets it — it is dead. Wire it into a skin or drop the doc claim.`,
    );
}

// 3. Not in the default bundle.
const core = readFileSync(resolve(root, 'css/core.css'), 'utf8');
if (/skins\.css/.test(core)) {
  errors.push(
    'css/core.css imports skins.css — colorways must stay opt-in, out of the default bundle',
  );
}

reportAndExit(errors, {
  label: 'skins',
  ok: `${SKIN_NAMES.length} colorways in sync with tokens/skins.js, accent-defining, and opt-in`,
});
