/**
 * Two-in-one gate:
 *   1. docs/contrast.md is the freshly generated artifact (drift), same
 *      freshness contract as check-fresh (kept here because it is paired
 *      with the semantic WCAG-floor assertion below).
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
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generated, audit } from './gen-contrast.mjs';
import { freshnessErrors } from './lib/assert-fresh.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

// 1. Drift.
errors.push(...freshnessErrors(generated, 'npm run contrast:build'));

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
// 4.5:1 (the dark `--text-dim` regression was APCA Lc 36 at WCAG 4.7:1). APCA is
// perceptual and polarity-aware, so we track it on dark text and WARN (never
// fail) below the role target — across the core dark palette AND every shipped
// colorway, so a low-contrast accent in a colorway is caught early too.
// Promoting this to a hard gate is an ADR-0001 decision (APCA stays advisory
// while WCAG 3 is a Working Draft) — see docs/contrast.md. `--accent-text` is
// accent-constrained and stays WCAG-gated, but we cross-check it perceptually
// here at the large/emphasis-text bar (Lc 45): the core red accent-as-text is
// the lowest (~Lc 44), the brighter colorways clear it comfortably.
const APCA_TARGET = { '--text': 60, '--text-soft': 60, '--text-dim': 45, '--accent-text': 45 };
const apcaScopes = [
  ['dark', dark],
  ...skinAudits.filter((s) => s.theme === 'dark').map((s) => [`skin ${s.name}/dark`, s.rows]),
];
const apcaWarnings = [];
for (const [scope, rows] of apcaScopes) {
  for (const x of rows) {
    // Skip advisory (translucent-tint) rows: the ratio/APCA model flattens a
    // translucent bg over white, which misreads the dark theme — a spurious
    // warning, not a real shortfall (component-audit C34).
    if (x.level === 'advisory') continue;
    const target = APCA_TARGET[x.fg];
    if (target == null || x.apca == null) continue;
    if (x.apca < target) {
      apcaWarnings.push(
        `${scope}: ${x.fg} on ${x.bg} (${x.role}) is APCA Lc ${x.apca.toFixed(1)}, below the ` +
          `advisory Lc ${target}`,
      );
    }
  }
}
if (apcaWarnings.length) {
  console.warn(`⚠ ${apcaWarnings.length} APCA advisory shortfall(s) (not gated):`);
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
