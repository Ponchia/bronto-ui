/**
 * Enforce: shiki/nothing.json is valid and its single accent stays the
 * brand accent (dark `--accent`). The Nothing rule is rationed colour —
 * exactly one hue — so the theme must not drift from the token model.
 *
 * Run: node scripts/check-shiki.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cssVars } from '../tokens/index.js';
import { reportAndExit } from './lib/gate-report.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const path = resolve(root, 'shiki/nothing.json');
const errors = [];

if (!existsSync(path)) {
  errors.push('shiki/nothing.json missing');
} else {
  let theme;
  try {
    theme = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    errors.push(`shiki/nothing.json is not valid JSON: ${e.message}`);
  }
  if (theme) {
    const accent = cssVars.dark['--accent'].toLowerCase(); // #ff3b41
    if (theme.type !== 'dark') errors.push(`theme.type must be "dark", got ${theme.type}`);
    if ((theme.colors?.['editorCursor.foreground'] || '').toLowerCase() !== accent)
      errors.push(`editorCursor.foreground must be the brand accent ${accent}`);
    const kw = (theme.tokenColors || []).find((t) =>
      (Array.isArray(t.scope) ? t.scope : [t.scope]).includes('keyword'),
    );
    if (!kw || (kw.settings?.foreground || '').toLowerCase() !== accent)
      errors.push(`keyword scope must use the brand accent ${accent}`);
    // Rationed colour: every foreground must be brand accent, a grey, or
    // the danger red (invalid). No stray hues.
    const allowed = new Set([
      accent,
      '#ff4d54',
      '#f2f2f2',
      '#c4c4c4',
      '#858585',
      '#444444',
      '#2a2a2a',
    ]);
    for (const t of theme.tokenColors || []) {
      const fg = (t.settings?.foreground || '').toLowerCase();
      if (fg && !allowed.has(fg)) errors.push(`unrationed colour in theme: ${fg}`);
    }
  }
}

reportAndExit(errors, {
  label: 'shiki theme',
  ok: 'shiki/nothing.json is valid and on-palette (rationed, brand accent)',
});
