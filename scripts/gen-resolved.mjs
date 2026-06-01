/**
 * Emit tokens/resolved.json — every colour token resolved to a concrete
 * value, per theme, for render targets that cannot evaluate CSS:
 * MapLibre GPU paint, <canvas>, WebGL, SVG, server-side image gen.
 *
 * The token model is CSS-first: the accent family is `color-mix()`-
 * derived and most aliases are `var()` chains, so `@ponchia/ui/tokens`
 * (which mirrors the raw CSS strings) can't help a non-CSS consumer —
 * they hand-eyeball hexes and drift. This resolves `var()` + sRGB/OKLCH
 * `color-mix()` at build time into static `#rrggbb` / `rgba(...)`,
 * separately for the light and dark palettes.
 *
 * Pure (`buildResolved()` returns the object) so check-resolved can diff
 * it without writing. Same generate-commit-drift-check contract as
 * tokens.dtcg.json. No new colours are introduced — this is a faithful
 * projection of the existing tokens, so check:shiki stays green.
 *
 * Run: node scripts/gen-resolved.mjs   (or: npm run resolved:build)
 */
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cssVars } from '../tokens/index.js';
import { mixOklch } from './lib/oklch.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const r255 = (n) => clamp(Math.round(n), 0, 255);

/** Split on top-level commas only (ignore commas nested in parens). */
function splitTop(s) {
  const out = [];
  let depth = 0;
  let buf = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      out.push(buf.trim());
      buf = '';
    } else buf += ch;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

/** Parse a literal colour → [r, g, b, a] (0-255, 0-1), or null. */
function parseLiteral(v) {
  const s = v.trim();
  if (s === 'transparent') return [0, 0, 0, 0];
  let m = s.match(/^#([0-9a-f]{3,8})$/i);
  if (m) {
    const h = m[1];
    // Expand 3/4-digit shorthand to 6/8 ("abc" → "aabbcc").
    const hex = h.length <= 4 ? [...h].map((c) => c + c).join('') : h;
    if (hex.length !== 6 && hex.length !== 8) return null;
    const byte = (i) => parseInt(hex.substr(i * 2, 2), 16);
    return [byte(0), byte(1), byte(2), hex.length === 8 ? byte(3) / 255 : 1];
  }
  m = s.match(/^rgba?\(([^)]+)\)$/i);
  if (m) {
    const p = m[1]
      .split(/[\s,/]+/)
      .filter(Boolean)
      .map((x) => x.trim());
    if (p.length < 3) return null;
    const ch = (x) => (x.endsWith('%') ? (parseFloat(x) / 100) * 255 : parseFloat(x));
    const a = p[3] != null ? (p[3].endsWith('%') ? parseFloat(p[3]) / 100 : parseFloat(p[3])) : 1;
    return [ch(p[0]), ch(p[1]), ch(p[2]), a];
  }
  return null;
}

/**
 * color-mix(in <srgb|oklch>, C1 p1?, C2 p2?) per CSS Color 4/5. `srgb` is
 * gamma-encoded + alpha-premultiplied; `oklch` interpolates L/C/H (shorter-arc
 * hue, powerless-achromatic) via the shared lib. Percentages default so the
 * pair sums to 100%; a sum < 100% scales the result alpha.
 */
function mix(args, scope, seen) {
  const parts = splitTop(args);
  const space = /^in\s+(srgb|oklch)$/i.exec(parts[0])?.[1]?.toLowerCase();
  if (!space) return null; // only srgb / oklch are understood
  const stop = (raw) => {
    const pm = raw.match(/\s([0-9.]+)%\s*$/);
    const pct = pm ? parseFloat(pm[1]) : null;
    const color = (pm ? raw.slice(0, pm.index) : raw).trim();
    return { rgba: resolve_(color, scope, seen), pct };
  };
  const a = stop(parts[1]);
  const b = stop(parts[2]);
  if (!a.rgba || !b.rgba) return null;
  let p1 = a.pct;
  let p2 = b.pct;
  if (p1 == null && p2 == null) ((p1 = 50), (p2 = 50));
  else if (p1 == null) p1 = 100 - p2;
  else if (p2 == null) p2 = 100 - p1;
  const sum = p1 + p2;
  if (sum === 0) return [0, 0, 0, 0];
  const w1 = p1 / sum;
  const w2 = p2 / sum;
  const [r1, g1, b1, al1] = a.rgba;
  const [r2, g2, b2, al2] = b.rgba;
  const alphaMul = sum < 100 ? sum / 100 : 1;
  if (space === 'oklch') {
    // The accent ramp mixes opaque colours; interpolate in OKLCH.
    const [r, g, bl] = mixOklch([r1, g1, b1], [r2, g2, b2], w1, w2);
    return [r, g, bl, (al1 * w1 + al2 * w2) * alphaMul];
  }
  const oa = al1 * w1 + al2 * w2;
  const un = (c1, c2) => (oa === 0 ? 0 : (c1 * al1 * w1 + c2 * al2 * w2) / oa);
  return [un(r1, r2), un(g1, g2), un(b1, b2), oa * alphaMul];
}

/** Resolve any token value (var / color-mix / literal) → rgba or null. */
function resolve_(v, scope, seen = new Set()) {
  const s = v.trim();
  let m = s.match(/^var\(\s*(--[\w-]+)\s*\)$/);
  if (m) {
    if (seen.has(m[1]) || !(m[1] in scope)) return null;
    return resolve_(scope[m[1]], scope, new Set(seen).add(m[1]));
  }
  m = s.match(/^color-mix\((.*)\)$/is);
  if (m) return mix(m[1], scope, seen);
  return parseLiteral(s);
}

const fmt = ([r, g, b, a]) => {
  const R = r255(r);
  const G = r255(g);
  const B = r255(b);
  if (a >= 1) return `#${[R, G, B].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
  return `rgba(${R}, ${G}, ${B}, ${Number(a.toFixed(4))})`;
};

/** Resolved colour map for one theme (global aliases included — they are
 *  theme-dependent via the accent/bg they reference). Non-colour tokens
 *  (scales, easings, shadows) resolve to null and are dropped. */
function paletteFor(themeKey) {
  const scope = { ...cssVars.global, ...cssVars[themeKey] };
  const out = {};
  for (const name of Object.keys(scope)) {
    const rgba = resolve_(scope[name], scope);
    if (rgba) out[name] = fmt(rgba);
  }
  return out;
}

export function buildResolved() {
  return {
    $comment:
      '@ponchia/ui colour tokens resolved to static values per theme (var() + sRGB/OKLCH color-mix() evaluated at build). For non-CSS render targets: MapLibre/canvas/WebGL/SVG. Generated from tokens/index.js — do not edit by hand; run `npm run resolved:build`. Drift-checked in CI.',
    light: paletteFor('light'),
    dark: paletteFor('dark'),
  };
}

export const RESOLVED_PATH = resolve(root, 'tokens/resolved.json');
export const resolvedJson = () => JSON.stringify(buildResolved(), null, 2) + '\n';

const isMain = resolve(process.argv[1] || '') === fileURLToPath(import.meta.url);
if (isMain) {
  writeFileSync(RESOLVED_PATH, resolvedJson());
  console.log('✓ wrote tokens/resolved.json');
}
