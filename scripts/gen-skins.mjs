/**
 * Generate css/skins.css — the opt-in `data-bronto-skin` colorways — from the
 * single source tokens/skins.js, so the stylesheet can't drift from the data
 * the contrast gate audits.
 *
 *   css/skins.css ← tokens/skins.js
 *
 * A colorway is a ROOT-LEVEL choice, exactly like `data-theme`: apply
 * `data-bronto-skin` on `:root` / `<html>`. It must live there because the
 * accent's derived family (`--accent-strong`/`-text`/`-soft`, `--bg-accent`,
 * `--field-dot-accent`, `--accent-1..6`) is declared on `:root` as
 * `color-mix(… var(--accent) …)`; those re-evaluate against the new accent
 * only on the element that carries them. So every selector is anchored at
 * `:root` (compound, same element as `data-theme`) — a skin set on a subtree
 * simply no-ops rather than half-applying. Light/base on
 * `:root[data-bronto-skin='x']`; dark under both explicit
 * `:root[data-theme='dark'][data-bronto-skin='x']` and
 * `prefers-color-scheme: dark` (scoped `:not([data-theme='light'])` so an
 * explicit light theme still wins).
 *
 * Generated, committed, and drift-checked by scripts/check-skins.mjs (wired
 * into `npm run check`). Same model as gen-tokens-json / gen-glyphs.
 *
 * Run: node scripts/gen-skins.mjs   (or: npm run skins:build)
 */
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { skins, SKIN_NAMES } from '../tokens/skins.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const decls = (obj, indent) =>
  Object.entries(obj)
    .map(([k, v]) => `${indent}${k}: ${v};`)
    .join('\n');

export function buildSkinsCss() {
  const banner =
    `/* @ponchia/ui — GENERATED from tokens/skins.js by scripts/gen-skins.mjs.\n` +
    ` *  Do not edit by hand; run \`npm run skins:build\`. Drift-checked in CI.\n` +
    ` *\n` +
    ` *  Optional display colorways (ADR-0001). OPT-IN: imported on demand via\n` +
    ` *  \`@ponchia/ui/css/skins.css\`, never part of the default bundle. Apply with\n` +
    ` *  \`data-bronto-skin="${SKIN_NAMES.join(' | ')}"\` on :root / <html> (a\n` +
    ` *  root-level choice like data-theme), re-pointing the one accent. The accent's\n` +
    ` *  derived family recomputes from the live var(--accent); status colours + the\n` +
    ` *  neutral canvas are untouched. Every accent below is gated by check-contrast.mjs. */\n`;

  const blocks = [];
  for (const name of SKIN_NAMES) {
    const s = skins[name];
    blocks.push(
      `/* ${s.label} */\n` +
        `:root[data-bronto-skin='${name}'] {\n${decls(s.light, '  ')}\n}\n\n` +
        `:root[data-theme='dark'][data-bronto-skin='${name}'] {\n${decls(s.dark, '  ')}\n}`,
    );
  }

  const darkMedia =
    `@media (prefers-color-scheme: dark) {\n` +
    SKIN_NAMES.map(
      (name) =>
        `  :root:not([data-theme='light'])[data-bronto-skin='${name}'] {\n` +
        `${decls(skins[name].dark, '    ')}\n  }`,
    ).join('\n\n') +
    `\n}`;

  return `${banner}\n${blocks.join('\n\n')}\n\n${darkMedia}\n`;
}

export function buildSkinsDts() {
  const banner =
    `/** @ponchia/ui — GENERATED from tokens/skins.js by scripts/gen-skins.mjs.\n` +
    ` *  Do not edit by hand; run \`npm run skins:build\`. Drift-checked in CI. */\n`;
  const union = SKIN_NAMES.map((n) => `'${n}'`).join('\n  | ');
  return `${banner}
/** Every display-colorway name @ponchia/ui ships (literal union). Use as a
 *  type for a \`data-bronto-skin\` value (\`const s: SkinName = 'amber-crt'\`). */
export type SkinName =
  | ${union};

/** A colorway: a display label + per-theme custom-property overrides (CSS
 *  value strings). \`light\`/\`dark\` always set \`--accent\`; \`dark\` may add a
 *  display knob such as \`--dotmatrix-glow\`. */
export interface Skin {
  label: string;
  light: Record<string, string>;
  dark: Record<string, string>;
}

/** The frozen name→colorway registry. */
export declare const skins: Record<SkinName, Skin>;

/** Every colorway name, frozen and sorted. */
export declare const SKIN_NAMES: readonly SkinName[];

declare const _default: Record<SkinName, Skin>;
export default _default;
`;
}

export const generated = {
  'css/skins.css': buildSkinsCss(),
  'tokens/skins.d.ts': buildSkinsDts(),
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const [rel, content] of Object.entries(generated)) {
    writeFileSync(resolve(root, rel), content);
    console.log(`✓ wrote ${rel}`);
  }
}
