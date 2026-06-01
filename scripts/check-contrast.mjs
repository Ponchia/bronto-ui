/**
 * Two-in-one gate:
 *   1. docs/contrast.md is the freshly generated artifact (drift), same
 *      contract as check-reference.
 *   2. Every *gated* token pairing meets its declared WCAG floor — this
 *      is what turns the published table into a guarantee. A palette
 *      tweak that regresses contrast fails `npm run check`, so it can
 *      never reach npm (release.yml re-runs check before publish).
 *
 * Decorative (1.4.11-exempt) pairings are reported by gen-contrast but
 * intentionally not enforced here.
 *
 * Run: node scripts/check-contrast.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generated, audit } from './gen-contrast.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

// 1. Drift.
for (const [rel, expected] of Object.entries(generated)) {
  const abs = resolve(root, rel);
  if (!existsSync(abs)) errors.push(`${rel} missing — run: npm run contrast:build`);
  else if (readFileSync(abs, 'utf8') !== expected)
    errors.push(`${rel} is stale — run: npm run contrast:build`);
}

// 2. Floor enforcement — core palette AND every shipped colorway. A skin is
// part of the framework, so its accent is held to the same floors (this gate,
// not just the unit test, is what docs/architecture.md advertise as enforcing
// "every shipped colorway accent meets its WCAG floor").
const { light, dark, skins: skinAudits } = audit();
for (const [theme, rows] of [
  ['light', light],
  ['dark', dark],
  ...skinAudits.map((s) => [`skin ${s.name}/${s.theme}`, s.rows]),
]) {
  for (const x of rows) {
    if (!x.gated) continue;
    if (x.ratio == null || !Number.isFinite(x.ratio)) {
      errors.push(`${theme}: ${x.fg} on ${x.bg} did not resolve to a measurable colour`);
    } else if (x.ratio < x.floor) {
      errors.push(
        `${theme}: ${x.fg} on ${x.bg} (${x.role}) is ${x.ratio.toFixed(2)}:1, ` +
          `below the ${x.floor}:1 floor for ${x.level} — fix the palette, not the gate`,
      );
    }
  }
}

// 2b. APCA advisory (NOT gated, dark-theme text). WCAG 2.x over-rates dark-mode
// contrast — it saturates near black, so a pairing can read poorly yet "pass"
// 4.5:1 (the dark `--text-dim` regression was APCA Lc 36 at WCAG 4.7:1). APCA
// is perceptual and polarity-aware, so we track it on dark text and WARN (never
// fail) below the role target. Promoting this to a hard gate is an ADR-0001
// decision (APCA stays advisory while WCAG 3 is a Working Draft) — see
// docs/contrast.md. Accent-derived text (--accent-text/--button-text) is
// accent-constrained and WCAG-gated, so it is intentionally not tracked here.
const APCA_TARGET = { '--text': 60, '--text-soft': 60, '--text-dim': 45 };
const apcaWarnings = [];
for (const x of dark) {
  const target = APCA_TARGET[x.fg];
  if (target == null || x.apca == null) continue;
  if (x.apca < target) {
    apcaWarnings.push(
      `dark: ${x.fg} on ${x.bg} (${x.role}) is APCA Lc ${Math.round(x.apca)}, below the ` +
        `advisory Lc ${target} for readable ${x.fg === '--text-dim' ? 'dim/meta' : 'body'} text`,
    );
  }
}
if (apcaWarnings.length) {
  console.warn(`⚠ ${apcaWarnings.length} dark-theme APCA advisory shortfall(s) (not gated):`);
  for (const w of apcaWarnings) console.warn(`  - ${w}`);
}

if (errors.length) {
  console.error(`✖ ${errors.length} contrast problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  '✓ docs/contrast.md is fresh and every gated token pairing — core palette and every colorway — meets its WCAG floor',
);
