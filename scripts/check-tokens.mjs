/**
 * Enforce: css/tokens.css ⇄ tokens/index.js ⇄ tokens/index.json.
 *
 *  - Parses the four :root blocks in tokens.css (global scales, light,
 *    the prefers-color-scheme dark block, and the [data-theme='dark']
 *    block) into name→value maps.
 *  - Asserts each matches the corresponding `cssVars` group in
 *    tokens/index.js. The two dark blocks are both checked against the
 *    same data, so this also guards the intentional dark duplication.
 *  - Asserts tokens/index.json is the up-to-date generated artifact.
 *
 * Run: node scripts/check-tokens.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cssVars, tokens } from '../tokens/index.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(resolve(root, 'css/tokens.css'), 'utf8');
const errors = [];

/** Body of the first `{ … }` (no nested braces in these blocks) after `header`. */
function blockBody(header) {
  const m = header.exec(css);
  if (!m) return null;
  const open = css.indexOf('{', m.index + m[0].length - 1);
  const close = css.indexOf('}', open);
  return open === -1 || close === -1 ? null : css.slice(open + 1, close);
}

function decls(body) {
  const out = {};
  if (body == null) return out;
  for (const m of body.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
    out[`--${m[1]}`] = m[2].replace(/\s+/g, ' ').trim();
  }
  return out;
}

const parsed = {
  global: decls(blockBody(/:root\s*\{/)),
  light: decls(blockBody(/:root,\s*:root\[data-theme='light']\s*\{/)),
  darkMedia: decls(
    blockBody(/@media \(prefers-color-scheme: dark\)\s*\{\s*:root:not\(\[data-theme='light']\)\s*\{/)
  ),
  darkExplicit: decls(blockBody(/(?:^|\})\s*:root\[data-theme='dark']\s*\{/m)),
};

function diff(label, expected, actual) {
  const keys = new Set([...Object.keys(expected), ...Object.keys(actual)]);
  for (const k of keys) {
    if (expected[k] === undefined) errors.push(`${label}: ${k} in CSS but not in tokens/index.js`);
    else if (actual[k] === undefined) errors.push(`${label}: ${k} in tokens/index.js but not in CSS`);
    else if (expected[k] !== actual[k])
      errors.push(`${label}: ${k} = "${actual[k]}" (CSS) vs "${expected[k]}" (index.js)`);
  }
}

diff('global', cssVars.global, parsed.global);
diff('light', cssVars.light, parsed.light);
diff('dark @media', cssVars.dark, parsed.darkMedia);
diff('dark [data-theme]', cssVars.dark, parsed.darkExplicit);

// tokens/index.json must be the freshly generated artifact.
const jsonPath = resolve(root, 'tokens/index.json');
const expectedJson = JSON.stringify({ cssVars, tokens }, null, 2) + '\n';
if (!existsSync(jsonPath)) errors.push('tokens/index.json missing — run: npm run tokens:build');
else if (readFileSync(jsonPath, 'utf8') !== expectedJson)
  errors.push('tokens/index.json is stale — run: npm run tokens:build');

if (errors.length) {
  console.error(`✖ ${errors.length} token problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('✓ tokens.css ⇄ tokens/index.js ⇄ tokens/index.json are consistent');
