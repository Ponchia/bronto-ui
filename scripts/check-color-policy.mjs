/**
 * Color-policy gate — enforces the color constitution in
 * docs/adr/0001-color-system.md so the tiered model can't silently rot.
 *
 * It enforces three invariants:
 *
 *  1. TIER CLASSIFICATION. Every *color-defining* token across the whole
 *     token model (tokens/index.js → cssVars.global + .light + .dark) must be
 *     classified into a tier in the TIERS registry below. "Color-defining"
 *     means the value carries a color literal (a hex, an `rgb()/hsl()/oklch()/…`
 *     literal, or a `color-mix()`) — i.e. a token that can introduce a *hue*.
 *     Pure `var()` aliases (e.g. `--accent-text: var(--accent-strong)`) and
 *     non-colors (`--shadow: none`) inherit their tier and are not listed —
 *     they cannot smuggle in a new hue. Adding a new hue token *anywhere*
 *     (including the `global` block, where `--accent-1..4` live) without
 *     tiering it fails CI — exactly what would have caught the orphan
 *     `--orange`. The check is bidirectional (no stale registry entries).
 *
 *  2. RESERVED DATA-VIZ NAMESPACE. Tier-4 categorical/chart tokens
 *     (`--chart-*`, `--cat-*`, `--data-*`) are reserved: they must not appear
 *     in the token model, and (invariant 3) must never be referenced from core
 *     component CSS — they belong to an opt-in data-viz module, never UI
 *     chrome. A forward guard; there are none today.
 *
 *  3. NO RAW CHROMATIC COLOR in component CSS. Every color in a component must
 *     come from a token (rule 1 of the ADR). Allowed as neutral primitives /
 *     color-function endpoints / print + forced-colors overrides: pure grays
 *     (`#000`/`#fff`/`#999`, any hex with R==G==B, with or without an alpha
 *     nibble) and the neutral keywords (`transparent`, `currentColor`,
 *     `inherit`, …). Flagged: a chromatic hex, a *named* chromatic color
 *     (`red`, `crimson`, …), or ANY raw color *function* literal
 *     (`rgb()/hsl()/oklch()/oklab()/lab()/lch()/hwb()/color()`) — even when it
 *     sits inside a `color-mix()` endpoint. `color-mix()` itself is fine (it
 *     composes tokens + neutral endpoints); `url(#…)` is ignored.
 *
 * tokens.css is the tier-definition file, so it is exempt from the raw-color
 * scan (it is where the literals legitimately live); it is still covered by
 * invariant 1 via tokens/index.js. Future skin/data-viz definition files
 * (css/skins/*, css/dataviz.css) are exempt from the raw-color scan the same way.
 *
 * Run: node scripts/check-color-policy.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cssVars } from '../tokens/index.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

// --- 1. Tier registry -------------------------------------------------------
// Every color-defining token (see header) must live in exactly one tier.
// See docs/adr/0001-color-system.md for what each tier means and its rules.
const TIERS = {
  // Tier 0 — neutral canvas (grayscale surfaces, lines, text).
  0: [
    '--bg',
    '--bg-elevated',
    '--panel',
    '--panel-strong',
    '--panel-soft',
    '--line',
    '--line-strong',
    '--text',
    '--text-soft',
    '--text-dim',
    '--code-bg',
    '--button-text',
    '--field-dot',
    '--field-dot-hot',
  ],
  // Tier 1 — the single brand accent, its ramp, and accent-derived knobs.
  1: [
    '--accent',
    '--accent-ramp-end',
    '--accent-strong',
    '--accent-soft',
    '--bg-accent',
    '--field-dot-accent',
    '--accent-1',
    '--accent-2',
    '--accent-3',
    '--accent-4',
  ],
  // Tier 2 — locked functional status. Signal only, never decorative.
  2: [
    '--success',
    '--success-soft',
    '--warning',
    '--warning-soft',
    '--danger',
    '--danger-soft',
    '--info',
    '--info-soft',
  ],
  // Tier 3 (display expression: luminance/density/motion) lives in css/dots.css
  // as --dotmatrix-* knobs, not as palette color tokens — nothing to list here.
  // Tier 4 (categorical/data-viz) is reserved (see RESERVED below), not shipped.
};

// A value "defines color" if it can introduce a hue: a hex, a color function
// literal, or a color-mix(). A bare var() alias or a non-color (none, a
// shadow geometry) cannot, so it inherits its referent's tier and isn't listed.
const COLOR_LITERAL =
  /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color)\(|color-mix\(/i;

const classified = new Set(Object.values(TIERS).flat());
const colorDefining = new Set();
for (const block of ['global', 'light', 'dark']) {
  for (const [name, value] of Object.entries(cssVars[block] ?? {})) {
    if (COLOR_LITERAL.test(String(value))) colorDefining.add(name);
  }
}

for (const name of colorDefining) {
  if (!classified.has(name)) {
    errors.push(
      `untiered color token "${name}" — classify it in a tier in ` +
        `scripts/check-color-policy.mjs (per docs/adr/0001-color-system.md) or remove it`,
    );
  }
}
for (const name of classified) {
  if (!colorDefining.has(name)) {
    errors.push(
      `tier registry lists "${name}" but it defines no color (stale, or now a var() alias) — remove it from TIERS`,
    );
  }
}
// Light and dark must describe the same palette.
const lightKeys = Object.keys(cssVars.light);
const darkKeys = Object.keys(cssVars.dark);
const lightSet = new Set(lightKeys);
const darkSet = new Set(darkKeys);
for (const k of lightKeys)
  if (!darkSet.has(k)) errors.push(`token "${k}" is in light but not dark palette`);
for (const k of darkKeys)
  if (!lightSet.has(k)) errors.push(`token "${k}" is in dark but not light palette`);

// --- 2. Reserved data-viz namespace ----------------------------------------
const RESERVED = /^--(chart|cat|data)-/;
for (const block of ['global', 'light', 'dark']) {
  for (const name of Object.keys(cssVars[block] ?? {})) {
    if (RESERVED.test(name)) {
      errors.push(
        `token "${name}" uses the reserved data-viz namespace (--chart/--cat/--data-*) ` +
          `but data-viz tokens are a separate opt-in module — see ADR-0001 step 7`,
      );
    }
  }
}

// --- 3. No raw chromatic color in component CSS -----------------------------
const cssDir = resolve(root, 'css');
// Definition files where color literals legitimately live (tier sources).
const isDefinitionFile = (f) => f === 'tokens.css' || f === 'dataviz.css' || f.startsWith('skins');
// Files that legitimately CONSUME Tier-4 chart tokens because they ship chart
// helpers (legend.css's .ui-legend swatches/ramps — the data key). It is exempt
// from the charts-only leak check below, but stays under the raw-color scans —
// so a stray raw hex is still caught (unlike a blanket definition-file exempt).
const consumesChartTokens = (f) => f === 'legend.css';
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
const stripUrls = (s) => s.replace(/url\([^)]*\)/gi, 'url()');

// A hex is neutral iff R==G==B (ignoring any alpha). Handles #rgb, #rgba,
// #rrggbb, #rrggbbaa.
const isGrayHex = (hex) => {
  let h = hex.toLowerCase();
  if (h.length === 3 || h.length === 4) h = h.replace(/(.)/g, '$1$1'); // expand shorthand (incl. alpha)
  if (h.length < 6) return false;
  return h.slice(0, 2) === h.slice(2, 4) && h.slice(2, 4) === h.slice(4, 6);
};

const RAW_FN = /\b(rgba?|hsla?|oklch|oklab|lab|lch|hwb|color)\(/i;
// Chromatic CSS named colors (the full set minus neutrals: transparent /
// currentColor / the white–black grayscale, which are allowed primitives).
const NAMED_CHROMATIC = new RegExp(
  '(?<![\\w-])(' +
    [
      'aliceblue',
      'antiquewhite',
      'aqua',
      'aquamarine',
      'azure',
      'beige',
      'bisque',
      'blanchedalmond',
      'blue',
      'blueviolet',
      'brown',
      'burlywood',
      'cadetblue',
      'chartreuse',
      'chocolate',
      'coral',
      'cornflowerblue',
      'cornsilk',
      'crimson',
      'cyan',
      'darkblue',
      'darkcyan',
      'darkgoldenrod',
      'darkgreen',
      'darkkhaki',
      'darkmagenta',
      'darkolivegreen',
      'darkorange',
      'darkorchid',
      'darkred',
      'darksalmon',
      'darkseagreen',
      'darkslateblue',
      'darkturquoise',
      'darkviolet',
      'deeppink',
      'deepskyblue',
      'dodgerblue',
      'firebrick',
      'floralwhite',
      'forestgreen',
      'fuchsia',
      'gainsboro',
      'gold',
      'goldenrod',
      'green',
      'greenyellow',
      'honeydew',
      'hotpink',
      'indianred',
      'indigo',
      'ivory',
      'khaki',
      'lavender',
      'lavenderblush',
      'lawngreen',
      'lemonchiffon',
      'lightblue',
      'lightcoral',
      'lightcyan',
      'lightgoldenrodyellow',
      'lightgreen',
      'lightpink',
      'lightsalmon',
      'lightseagreen',
      'lightskyblue',
      'lightsteelblue',
      'lightyellow',
      'lime',
      'limegreen',
      'linen',
      'magenta',
      'maroon',
      'mediumaquamarine',
      'mediumblue',
      'mediumorchid',
      'mediumpurple',
      'mediumseagreen',
      'mediumslateblue',
      'mediumspringgreen',
      'mediumturquoise',
      'mediumvioletred',
      'midnightblue',
      'mintcream',
      'mistyrose',
      'moccasin',
      'navajowhite',
      'navy',
      'oldlace',
      'olive',
      'olivedrab',
      'orange',
      'orangered',
      'orchid',
      'palegoldenrod',
      'palegreen',
      'paleturquoise',
      'palevioletred',
      'papayawhip',
      'peachpuff',
      'peru',
      'pink',
      'plum',
      'powderblue',
      'purple',
      'rebeccapurple',
      'red',
      'rosybrown',
      'royalblue',
      'saddlebrown',
      'salmon',
      'sandybrown',
      'seagreen',
      'seashell',
      'sienna',
      'skyblue',
      'slateblue',
      'springgreen',
      'steelblue',
      'tan',
      'teal',
      'thistle',
      'tomato',
      'turquoise',
      'violet',
      'wheat',
      'yellow',
      'yellowgreen',
    ].join('|') +
    ')(?![\\w-])',
  'i',
);

// Scan assumes one declaration per line (Prettier guarantees this in-repo).
// Multi-line values (e.g. hand-formatted `color-mix()`) could evade the named-color
// arm because the `:` split only sees the first line of such a value.
for (const file of readdirSync(cssDir).filter((f) => f.endsWith('.css') && !isDefinitionFile(f))) {
  const lines = stripComments(readFileSync(resolve(cssDir, file), 'utf8')).split('\n');
  lines.forEach((raw, i) => {
    const line = stripUrls(raw);
    for (const m of line.matchAll(/#([0-9a-fA-F]{3,8})\b/g)) {
      if (!isGrayHex(m[1])) {
        errors.push(
          `css/${file}:${i + 1} raw chromatic color "#${m[1]}" — use a tiered token (ADR-0001 rule 1)`,
        );
      }
    }
    if (RAW_FN.test(line)) {
      errors.push(
        `css/${file}:${i + 1} raw color function "${line.match(RAW_FN)[1]}(…)" — use a tiered token (ADR-0001 rule 1)`,
      );
    }
    // Tier-4 data-viz tokens are charts-only — never UI chrome (ADR-0001 rule 4).
    // They live in the opt-in css/dataviz.css (a definition file, exempt here);
    // a reference from any core component CSS is leakage. Chart-helper files
    // (report.css) are allowed to consume them in their .ui-chart parts.
    const leak = line.match(/var\(\s*(--(?:chart|cat|data)-[\w-]*)/);
    if (leak && !consumesChartTokens(file)) {
      errors.push(
        `css/${file}:${i + 1} references "${leak[1]}" — Tier-4 data-viz tokens are charts-only, not UI chrome (ADR-0001)`,
      );
    }
    // Named colors only count on the value side of a declaration (avoid
    // matching selectors / at-rules / property fragments).
    const value = line.includes(':') ? line.slice(line.indexOf(':') + 1) : '';
    const named = value.match(NAMED_CHROMATIC);
    if (named) {
      errors.push(
        `css/${file}:${i + 1} raw named color "${named[1]}" — use a tiered token (ADR-0001 rule 1)`,
      );
    }
  });
}

if (errors.length) {
  console.error(`✖ ${errors.length} color-policy problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `✓ color policy: ${classified.size} color-defining tokens tiered (across global+light+dark), ` +
    `data-viz namespace reserved, no raw chromatic color in components`,
);
