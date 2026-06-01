/**
 * Report-kit integrity checks.
 *
 * Keeps the LLM/static-report docs and fixtures honest:
 *  - every mentioned ui-* class is in the public cls registry
 *  - report.css / annotations.css stay opt-in, never imported by core.css
 *  - static report examples do not depend on remote executable/media assets
 *  - report examples do not use raw chromatic inline colors
 *
 * Run: node scripts/check-report.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cls } from '../classes/index.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const valid = new Set(Object.values(cls));

const read = (rel) => readFileSync(resolve(root, rel), 'utf8');

const classSources = [
  'docs/reporting.md',
  'docs/annotations.md',
  'docs/legends.md',
  'docs/marks.md',
  'docs/connectors.md',
  'docs/spotlight.md',
  'llms.txt',
  'demo/report.html',
  'demo/annotations.html',
  'demo/legends.html',
  'demo/marks.html',
  'demo/connectors.html',
  'demo/spotlight.html',
  ...walk('examples/report-static').filter((p) => /\.(html|js|css|md)$/.test(p)),
];

for (const rel of classSources) {
  const src = read(rel);
  for (const m of src.matchAll(/(?<![\w-])ui-[a-z][\w-]*/g)) {
    const name = m[0];
    if (!valid.has(name)) errors.push(`${rel}: unknown ui-* class "${name}"`);
  }
}

const core = read('css/core.css');
if (/report\.css/.test(core)) {
  errors.push('css/core.css imports report.css — report CSS must stay opt-in');
}
if (/annotations\.css/.test(core)) {
  errors.push('css/core.css imports annotations.css — annotation CSS must stay opt-in');
}
if (/legend\.css/.test(core)) {
  errors.push('css/core.css imports legend.css — legend CSS must stay opt-in');
}
if (/marks\.css/.test(core)) {
  errors.push('css/core.css imports marks.css — marks CSS must stay opt-in');
}
if (/connectors\.css/.test(core)) {
  errors.push('css/core.css imports connectors.css — connector CSS must stay opt-in');
}
if (/spotlight\.css/.test(core)) {
  errors.push('css/core.css imports spotlight.css — spotlight CSS must stay opt-in');
}

const htmlSources = [
  'demo/report.html',
  'demo/annotations.html',
  'demo/legends.html',
  'demo/marks.html',
  'demo/connectors.html',
  'demo/spotlight.html',
  ...walk('examples/report-static').filter((p) => /\.html$/.test(p)),
];
for (const rel of htmlSources) {
  const src = read(rel);
  const remoteAsset =
    /<(?:script|img|iframe|source)\b[^>]*(?:src|srcset)=["'][^"']*https?:/i.test(src) ||
    /<link\b[^>]*\bhref=["'][^"']*https?:/i.test(src);
  if (remoteAsset) {
    errors.push(`${rel}: report examples must not depend on remote scripts/styles/images/iframes`);
  }
  if (/<iframe\b/i.test(src)) errors.push(`${rel}: report examples must not embed iframes`);
}

const rawColor = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color)\(/i;
for (const rel of [
  'docs/reporting.md',
  'docs/annotations.md',
  'docs/legends.md',
  'docs/marks.md',
  'docs/connectors.md',
  'docs/spotlight.md',
  'demo/report.html',
  'demo/annotations.html',
  'demo/legends.html',
  'demo/marks.html',
  'demo/connectors.html',
  'demo/spotlight.html',
  ...walk('examples/report-static'),
]) {
  if (!/\.(md|html|css|js)$/.test(rel)) continue;
  const src = read(rel);
  const inlineStyles = [
    ...src.matchAll(/\bstyle=["']([\s\S]*?)["']/gi),
    ...src.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi),
  ];
  for (const m of inlineStyles) {
    if (rawColor.test(m[1])) {
      errors.push(`${rel}: raw chromatic color in inline report styling — use tokens or CSS vars`);
    }
  }
}

if (errors.length) {
  console.error(`✖ ${errors.length} report-kit problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`✓ report kit: ${classSources.length} docs/fixtures use valid ui-* classes`);

function walk(rel) {
  const abs = resolve(root, rel);
  const out = [];
  for (const name of readdirSync(abs)) {
    if (name === 'node_modules' || name === 'dist') continue;
    const childRel = join(rel, name).replaceAll('\\', '/');
    const childAbs = resolve(root, childRel);
    if (statSync(childAbs).isDirectory()) out.push(...walk(childRel));
    else out.push(childRel);
  }
  return out;
}
