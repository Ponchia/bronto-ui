/**
 * Generate the palette region of css/tokens.css from the canonical token
 * model in tokens/index.js (`cssVars`). This makes the JS model the SINGLE
 * source of truth for token VALUES: the four :root blocks (global scales,
 * light, and the two dark blocks) are emitted from `cssVars`, so the dark
 * palette is authored ONCE in tokens/index.js instead of the former
 * three-way edit (the `@media` block + the `[data-theme='dark']` block +
 * the JS mirror). The two dark blocks are now identical by construction.
 *
 * Everything from the HAND-AUTHORED marker down — the CSS-only presets
 * (density / contrast / OLED) and the theming-contract notes, which are
 * intentionally NOT part of the JS token model — is preserved verbatim from
 * the committed file, so this generator never clobbers them.
 *
 * check-fresh.mjs asserts css/tokens.css === this output (drift gate);
 * prepack runs it before the dist build. Because build-dist strips comments
 * and collapses whitespace, only the declarations/selectors/values reach
 * dist — so reformatting the source here cannot move the bundle.
 *
 * Run: node scripts/gen-tokens-css.mjs   (or: npm run tokens:css:build)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cssVars } from '../tokens/index.js';

import { repoRoot as root, isMain } from './lib/emit.mjs';
export const TOKENS_CSS_PATH = resolve(root, 'css/tokens.css');

/** Stable boundary: everything from this line down is hand-authored and
 *  preserved across regeneration. Must match the committed file exactly. */
export const HANDOFF_MARKER =
  '/* ==========================================================================\n' +
  '   HAND-AUTHORED BELOW';

/** Section comments injected before specific keys of the global :root block,
 *  so the generated source stays self-documenting (comments never reach dist). */
const GLOBAL_SECTIONS = {
  '--radius-xl': 'Sharp, near-zero radii — Nothing surfaces are crisp, not pill-soft.',
  '--space-2xs': 'Spacing scale.',
  '--mono': 'Type — Doto is the dot-matrix display face; body stays mono-grotesque.',
  '--ease-standard': 'Motion — restrained, spring-tipped.',
  '--dot-size': 'Dot-matrix motif sizing.',
  '--z-base': 'Stacking-context scale (values match the prior literals — pure refactor).',
  '--accent-1':
    'Accent ramp — a stepped family for charts / data-viz, derived from the single --accent knob via OKLCH color-mix against a per-theme white/black endpoint.',
  '--surface-1': 'Neutral surface ramp (low → high contrast against --bg).',
  '--bronto-color-bg':
    'Semantic --bronto-color-* tier — stable, prefixed aliases over the primitives.',
  '--surface': 'Aliases kept for back-compat with existing semantic classes.',
};

const decls = (obj, indent) =>
  Object.entries(obj)
    .map(([k, v]) => `${indent}${k}: ${v};`)
    .join('\n');

function globalBlock() {
  const lines = [];
  for (const [k, v] of Object.entries(cssVars.global)) {
    if (GLOBAL_SECTIONS[k]) {
      if (lines.length) lines.push('');
      lines.push(`  /* ${GLOBAL_SECTIONS[k]} */`);
    }
    lines.push(`  ${k}: ${v};`);
  }
  return lines.join('\n');
}

/** The generated palette region (blocks emitted from cssVars), ending with a
 *  blank line before the hand-authored marker. */
function paletteRegion() {
  return `/* ==========================================================================
   @ponchia/ui — design tokens   ⟨generated⟩
   Single source of truth: tokens/index.js (\`cssVars\`). Edit token VALUES
   there, then run \`npm run tokens:css:build\`. The four :root blocks below are
   emitted from cssVars — the dark palette is authored ONCE (not the former two
   CSS blocks + the JS mirror). Drift-checked by \`npm run check:fresh\` (scripts/check-fresh.mjs).
   The Doto @font-face lives in fonts.css; override --display / --dot-font to
   self-host. CSS-only presets (density / contrast / OLED) are hand-authored
   below the marker — they are intentionally not part of the JS token model.
   ========================================================================== */

:root {
${globalBlock()}
}

/* --------------------------------------------------------------------------
   Light — paper white / ink. Color is rationed: red accent only.
   -------------------------------------------------------------------------- */
:root,
:root[data-theme='light'] {
  color-scheme: light;

${decls(cssVars.light, '  ')}
}

/* --------------------------------------------------------------------------
   Dark — emitted from cssVars.dark under BOTH the system preference and the
   explicit [data-theme='dark'] opt-in. Authored once in tokens/index.js, so
   the two blocks below can no longer drift from each other.
   -------------------------------------------------------------------------- */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    color-scheme: dark;

${decls(cssVars.dark, '    ')}
  }
}

:root[data-theme='dark'] {
  color-scheme: dark;

${decls(cssVars.dark, '  ')}
}

`;
}

/** The hand-authored tail (marker + presets), read from the committed file. */
function handAuthoredTail() {
  const current = readFileSync(TOKENS_CSS_PATH, 'utf8');
  const idx = current.indexOf(HANDOFF_MARKER);
  if (idx === -1)
    throw new Error(
      `css/tokens.css is missing the HAND-AUTHORED marker — cannot preserve the presets. Expected a line beginning:\n${HANDOFF_MARKER}`,
    );
  return current.slice(idx);
}

/** Full css/tokens.css: generated palette + preserved hand-authored tail. */
export function tokensCss() {
  return paletteRegion() + handAuthoredTail();
}

if (isMain(import.meta.url)) {
  writeFileSync(TOKENS_CSS_PATH, tokensCss());
  console.log('✓ wrote css/tokens.css (palette generated from tokens/index.js cssVars)');
}
