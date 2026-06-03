/**
 * Emit tokens/tokens.dtcg.json in the W3C Design Tokens Community Group
 * format (https://tr.designtokens.org/format/) so Style Dictionary,
 * Figma plugins, etc. can consume the design tokens directly.
 *
 * Derived from the canonical tokens/index.js (single source of truth).
 * `buildDtcg()` is pure so check-fresh (via the registry) can diff it without writing.
 *
 * Note: tokens whose value is a CSS runtime expression (`var()`,
 * `color-mix()` — the `--accent`-derived family and aliases) cannot be
 * a static DTCG value. They are emitted with their `$type` and the raw
 * CSS in `$extensions["com.ponchia.css"]`, flagged `$value: null`, so
 * the file stays spec-shaped and honest rather than fabricating numbers.
 * Static theme knobs such as `color.<theme>.accent` and
 * `color.<theme>.accent.ramp-end` keep their literal values.
 *
 * Run: node scripts/gen-dtcg.mjs   (or: npm run dtcg:build)
 */
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cssVars } from '../tokens/index.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const isHex = (v) => /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v);
const isRgb = (v) => /^rgba?\(/i.test(v);
const isCssExpr = (v) => v.includes('var(') || v.includes('color-mix(');
const fontFamilyTokens = new Set(['mono', 'sans', 'display', 'dot-font']);
const dimensionPrefixes = ['radius', 'space', 'text', 'tracking', 'dot'];

const startsWithAny = (name, prefixes) => prefixes.some((prefix) => name.startsWith(prefix));
const hasDimensionUnit = (v) => /(rem|px|em)$/.test(v);
const hasColorName = (name) =>
  /color|accent|bg|panel|line|text|surface|border|focus|field/.test(name);
const typeRules = [
  ['cubicBezier', (name) => name.startsWith('ease')],
  ['duration', (name) => name.startsWith('duration')],
  ['fontFamily', (name) => fontFamilyTokens.has(name)],
  ['shadow', (name) => /shadow/.test(name)],
  ['color', (_name, v) => isHex(v) || isRgb(v)],
  ['dimension', (name, v) => hasDimensionUnit(v) || startsWithAny(name, dimensionPrefixes)],
  ['color', (name) => hasColorName(name)],
  ['fontWeight', (name) => /weight/.test(name)],
  ['number', (_name, v) => /^[0-9.]+$/.test(v)],
];

/** Best-effort DTCG $type from a token name + value. */
function typeOf(name, v) {
  const rule = typeRules.find(([, matches]) => matches(name, v));
  return rule ? rule[0] : 'string';
}

function token(name, v) {
  const $type = typeOf(name, v);
  if (isCssExpr(v)) {
    return { $type, $value: null, $extensions: { 'com.ponchia.css': v } };
  }
  if ($type === 'fontFamily') {
    return { $type, $value: v.split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')) };
  }
  if ($type === 'cubicBezier') {
    const n = v.match(/cubic-bezier\(([^)]+)\)/);
    return { $type, $value: n ? n[1].split(',').map((x) => Number(x.trim())) : v };
  }
  if ($type === 'duration') return { $type, $value: { value: parseFloat(v), unit: 'ms' } };
  return { $type, $value: v };
}

/** Group a flat var map into nested DTCG groups by the name's first
 *  hyphen segment (radius-lg → radius.lg; accent-soft → accent.soft). */
function group(map) {
  const out = {};
  for (const [k, v] of Object.entries(map)) {
    const name = k.replace(/^--/, '');
    const seg = name.includes('-') ? name.slice(0, name.indexOf('-')) : name;
    const leaf = name === seg ? 'DEFAULT' : name.slice(seg.length + 1);
    (out[seg] ||= {})[leaf] = token(name, v);
  }
  return out;
}

export function buildDtcg() {
  return {
    $description:
      '@ponchia/ui design tokens (W3C DTCG). Generated from tokens/index.js — do not edit by hand. CSS-runtime-derived tokens carry $value:null + $extensions.com.ponchia.css.',
    scale: group(cssVars.global),
    color: { light: group(cssVars.light), dark: group(cssVars.dark) },
  };
}

export const DTCG_PATH = resolve(root, 'tokens/tokens.dtcg.json');
export const dtcgJson = () => JSON.stringify(buildDtcg(), null, 2) + '\n';

const isMain = resolve(process.argv[1] || '') === fileURLToPath(import.meta.url);
if (isMain) {
  writeFileSync(DTCG_PATH, dtcgJson());
  console.log('✓ wrote tokens/tokens.dtcg.json');
}
