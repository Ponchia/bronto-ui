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
const VAR_FUNCTION = 'var(';

function matchingParenIndex(src, openIndex, end = src.length) {
  let depth = 0;
  let quote = null;
  for (let i = openIndex; i < end; i += 1) {
    const char = src[i];
    if (quote) {
      if (char === '\\') {
        i += 1;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
    } else if (char === '(') {
      depth += 1;
    } else if (char === ')') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function firstTopLevelComma(value) {
  let depth = 0;
  let quote = null;
  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];
    if (quote) {
      if (char === '\\') {
        i += 1;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
    } else if (char === '(') {
      depth += 1;
    } else if (char === ')') {
      depth -= 1;
    } else if (char === ',' && depth === 0) {
      return i;
    }
  }
  return -1;
}

function validateVarReference(rel, src, functionIndex, bodyStart, closeIndex) {
  const body = src.slice(bodyStart, closeIndex);
  const commaIndex = firstTopLevelComma(body);
  const nameText = (commaIndex === -1 ? body : body.slice(0, commaIndex)).trim();
  const name = /^--[\w-]+$/.test(nameText) ? nameText : null;
  const hasFallback = commaIndex !== -1;

  if (name && !defined.has(name) && !hasFallback && !INTENTIONAL_HOST_PROPS.has(name)) {
    errors.push(
      `${rel}:${lineAt(src, functionIndex)} references ${name} without a fallback, but css/ never defines it`,
    );
  }
  if (hasFallback) validateVarReferences(rel, src, bodyStart + commaIndex + 1, closeIndex);
}

function validateVarReferences(rel, src, start = 0, end = src.length) {
  let cursor = start;
  while (cursor < end) {
    const functionIndex = src.indexOf(VAR_FUNCTION, cursor);
    if (functionIndex === -1 || functionIndex >= end) return;

    const openIndex = functionIndex + VAR_FUNCTION.length - 1;
    const closeIndex = matchingParenIndex(src, openIndex, end);
    if (closeIndex === -1) {
      cursor = functionIndex + VAR_FUNCTION.length;
      continue;
    }

    validateVarReference(rel, src, functionIndex, openIndex + 1, closeIndex);
    cursor = closeIndex + 1;
  }
}

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
  validateVarReferences(rel, src);
}

reportAndExit(errors, {
  label: 'css variable reference',
  ok: `${files.length} authored CSS files, including tailwind.css, reference only defined variables, fallbacks, or intentional host props`,
});
