/**
 * Gate authored CSS variable references.
 *
 * Missing no-fallback `var(--*)` references silently invalidate the whole CSS
 * declaration. Token/contract gates catch generated examples; this scans the
 * real authored stylesheets so a typo like `var(--focus)` cannot ship.
 *
 * Run: node scripts/check-variables.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { reportAndExit } from './lib/gate-report.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cssDir = resolve(root, 'css');
const errors = [];

const INTENTIONAL_HOST_PROPS = new Set([
  // Required author-supplied mask URL for the one-node glyph renderer.
  '--icon-mask',
]);

const stripCommentsKeepLines = (css) =>
  css.replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' '));

const lineAt = (src, index) => src.slice(0, index).split('\n').length;

const files = [
  ...readdirSync(cssDir)
    .filter((file) => file.endsWith('.css'))
    .map((file) => `css/${file}`),
  // Public Tailwind bridge. It is not a Bronto component leaf, but its @theme
  // variables are copied into consumer utility names, so typoed var() refs here
  // are just as public as typoed component refs.
  'tailwind.css',
].sort();

const defined = new Set();
const sources = new Map();

for (const file of files) {
  const src = stripCommentsKeepLines(readFileSync(resolve(root, file), 'utf8'));
  sources.set(file, src);
  for (const match of src.matchAll(/(?:^|[;{\s])(--[\w-]+)\s*:/g)) {
    defined.add(match[1]);
  }
}

for (const [rel, src] of sources) {
  for (const match of src.matchAll(/var\(\s*(--[\w-]+)\s*(?:,([^)]*))?\)/g)) {
    const name = match[1];
    const hasFallback = match[2] !== undefined;
    if (defined.has(name) || hasFallback || INTENTIONAL_HOST_PROPS.has(name)) continue;
    errors.push(
      `${rel}:${lineAt(src, match.index)} references ${name} without a fallback, but css/ never defines it`,
    );
  }
}

reportAndExit(errors, {
  label: 'css variable reference',
  ok: `${files.length} authored CSS files, including tailwind.css, reference only defined variables, fallbacks, or intentional host props`,
});
