/**
 * Name-parity gate for the optional framework bindings (react/, solid/, qwik/):
 * every export of index.js has a matching declaration in index.d.ts, and
 * vice versa. Like check-behaviors, but the binding modules import their
 * framework (react / solid-js) at the top, so we **source-parse** the export
 * names rather than importing them — the gate needs no framework installed.
 *
 * Run: node scripts/check-bindings.mjs
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const requiredHooks = [
  'useThemeToggle',
  'useDismissible',
  'useDisclosure',
  'useMenu',
  'useFormValidation',
  'useCombobox',
  'usePopover',
  'useTableSort',
  'useTabs',
  'useDialog',
  'useCarousel',
  'useDotGlyph',
  'useLegend',
  'useConnectors',
  'useSpotlight',
  'useCrosshair',
  'useToast',
  'useBrontoBehavior',
];
const convenienceExports = ['applyStoredTheme', 'cls', 'ui', 'cx'];

function exportedAlias(part) {
  const t = part.trim();
  if (!t || t.startsWith('type ')) return null;
  return (t.split(/\s+as\s+/)[1] || t).trim();
}

function addDeclarationExports(src, names) {
  const re = /export\s+(?:declare\s+)?(?:const|let|function|class)\s+(\w+)/g;
  for (const m of src.matchAll(re)) names.add(m[1]);
}

function addNamedExports(src, names) {
  for (const m of src.matchAll(/export\s*\{([^}]*)\}/g)) {
    m[1]
      .split(',')
      .map(exportedAlias)
      .filter(Boolean)
      .forEach((name) => names.add(name));
  }
}

/** Exported names from a JS/TS module source (no import). Handles
 *  `export (declare)? (const|let|function|class) NAME` and
 *  `export { a, b as c } from '…'` / `export { a, b }`. Ignores type-only
 *  `export type/interface`. */
function exportedNames(src) {
  const names = new Set();
  addDeclarationExports(src, names);
  addNamedExports(src, names);
  return names;
}

for (const mod of ['react', 'solid', 'qwik']) {
  const js = readFileSync(resolve(root, `${mod}/index.js`), 'utf8');
  const dts = readFileSync(resolve(root, `${mod}/index.d.ts`), 'utf8');
  const jsNames = exportedNames(js);
  const dtsNames = exportedNames(dts);
  for (const n of jsNames)
    if (!dtsNames.has(n))
      errors.push(`${mod}/index.js exports \`${n}\` but ${mod}/index.d.ts does not declare it`);
  for (const n of dtsNames)
    if (!jsNames.has(n))
      errors.push(`${mod}/index.d.ts declares \`${n}\` but ${mod}/index.js does not export it`);
  for (const n of requiredHooks)
    if (!jsNames.has(n)) errors.push(`${mod}/index.js is missing required behavior hook \`${n}\``);
  for (const n of convenienceExports)
    if (!jsNames.has(n)) errors.push(`${mod}/index.js is missing convenience export \`${n}\``);
  if (jsNames.size === 0)
    errors.push(`${mod}/index.js exports nothing — parser bug or empty module`);
}

if (errors.length) {
  console.error(`✖ ${errors.length} binding type-parity problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('✓ bindings: react/, solid/ and qwik/ exports ⇄ their .d.ts declarations match');
