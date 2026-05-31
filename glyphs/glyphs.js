/**
 * @ponchia/ui — display glyphs.
 *
 * Small, frozen bitmap registry rendered on the existing `.ui-dotmatrix`
 * primitive (see css/dots.css). CSS-first to the core: a glyph is just a
 * grid of dot cells, three tones — `.` off (the dim panel dot), `#` hot,
 * `*` accent — so it re-skins with the same `--field-dot*` tokens as every
 * other dot surface.
 *
 * Framework-agnostic, dependency-free, side-effect-free on import, SSR-safe
 * (`renderGlyph` returns a string; nothing touches the DOM here — the
 * optional `initDotGlyph` behavior lives in behaviors/index.js).
 *
 *   import { renderGlyph } from '@ponchia/ui/glyphs';
 *   el.innerHTML = renderGlyph('check', { label: 'Done' });
 *
 * The `GlyphName` union, helper signatures, and drift gate are generated +
 * checked from this file — see scripts/gen-glyphs.mjs / check-glyphs.mjs.
 */

/** The grid edge length: every glyph is GLYPH_SIZE rows of GLYPH_SIZE chars. */
export const GLYPH_SIZE = 16;

// Raw bitmaps. Each is GLYPH_SIZE rows of GLYPH_SIZE chars over [.#*]:
// `.` off · `#` hot · `*` accent. Only `spark` uses accent dots — it is the
// canonical two-tone demo; the gate in check-glyphs.mjs enforces the shape.
const RAW = {
  'arrow-right': [
    '................',
    '.......#........',
    '.......##.......',
    '.......###......',
    '.......####.....',
    '.......#####....',
    '.############...',
    '.##############.',
    '.##############.',
    '.############...',
    '.......#####....',
    '.......####.....',
    '.......###......',
    '.......##.......',
    '.......#........',
    '................',
  ],
  check: [
    '................',
    '................',
    '.............###',
    '............###.',
    '...........###..',
    '..........###...',
    '.........###....',
    '.##.....###.....',
    '.##....###......',
    '.###..###.......',
    '..######........',
    '...####.........',
    '...###..........',
    '................',
    '................',
    '................',
  ],
  cross: [
    '................',
    '................',
    '.###........###.',
    '..###......###..',
    '...###....###...',
    '....###..###....',
    '.....######.....',
    '......####......',
    '......####......',
    '.....######.....',
    '....###..###....',
    '...###....###...',
    '..###......###..',
    '.###........###.',
    '................',
    '................',
  ],
  heart: [
    '................',
    '...###....###...',
    '..#####..#####..',
    '.######..######.',
    '.##############.',
    '.##############.',
    '..############..',
    '..############..',
    '...##########...',
    '....########....',
    '.....######.....',
    '......####......',
    '.......##.......',
    '................',
    '................',
    '................',
  ],
  spark: [
    '................',
    '.......**.......',
    '.......**.......',
    '.......**.......',
    '.......**.......',
    '.......**.......',
    '......****......',
    '.******##******.',
    '.******##******.',
    '......****......',
    '.......**.......',
    '.......**.......',
    '.......**.......',
    '.......**.......',
    '.......**.......',
    '................',
  ],
};

/** The frozen name→bitmap registry (keys sorted, every row frozen). */
export const GLYPHS = Object.freeze(
  Object.fromEntries(
    Object.keys(RAW)
      .sort()
      .map((name) => [name, Object.freeze(RAW[name])]),
  ),
);

/** Every glyph name, frozen and sorted (mirrors GLYPHS keys). */
export const GLYPH_NAMES = Object.freeze(Object.keys(GLYPHS));

const TONE = { '#': 'hot', '*': 'accent' };

/** The raw bitmap rows for a glyph, or `undefined` if the name is unknown. */
export function glyph(name) {
  return GLYPHS[name];
}

/** GLYPH_SIZE² cell descriptors (row-major), or `[]` if the name is unknown. */
export function glyphCells(name) {
  const rows = GLYPHS[name];
  if (!rows) return [];
  const cells = [];
  for (const row of rows) {
    for (const ch of row) {
      if (ch === '.') cells.push({ on: false });
      else cells.push({ on: true, tone: TONE[ch] });
    }
  }
  return cells;
}

const CELL = 'ui-dotmatrix__cell';

function cellClass(cell) {
  if (!cell.on) return CELL;
  if (cell.tone === 'hot') return `${CELL} ${CELL}--hot`;
  if (cell.tone === 'accent') return `${CELL} ${CELL}--accent`;
  return CELL;
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// `dot`/`gap` land in an inline-CSS context (`style="--dotmatrix-dot:VALUE"`),
// where HTML-escaping a `"` stops attribute breakout but a `;` would still open
// a second CSS declaration (overlay/clickjacking, selector exfil). So restrict
// them to length/calc syntax — digits, units, %, whitespace and `()+-*/.,` for
// calc()/clamp()/var() — and drop anything else rather than emit it.
function cssLen(v) {
  return /^[\w.%+\-*/()\s,]+$/.test(v) ? v : '';
}

/**
 * A full `.ui-dotmatrix` HTML string for a glyph (`''` if the name is
 * unknown). Decorative by default (`aria-hidden`); pass `label` to expose it
 * as `role="img"`. Pins `--dotmatrix-cols` to GLYPH_SIZE so the square layout
 * holds regardless of the 12-col default; `dot`/`gap` set `--dotmatrix-dot` /
 * `--dotmatrix-gap` (sanitized to a CSS length/calc allowlist; a malformed
 * value is dropped). `grid: false` drops the unlit panel dots (glyph-only).
 */
export function renderGlyph(name, options = {}) {
  const cells = glyphCells(name);
  if (!cells.length) return '';
  const { grid = true, label, dot, gap } = options;

  const style = [`--dotmatrix-cols:${GLYPH_SIZE}`];
  const dotLen = dot && cssLen(dot);
  const gapLen = gap && cssLen(gap);
  if (dotLen) style.push(`--dotmatrix-dot:${dotLen}`);
  if (gapLen) style.push(`--dotmatrix-gap:${gapLen}`);

  const a11y = label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true"';

  // Off cells always keep the cell class (so they hold their grid track and
  // 1:1 aspect-ratio); `grid: false` only drops their lit background, for the
  // glyph-only look, without collapsing all-off rows.
  const inner = cells
    .map((c) => {
      if (c.on) return `<span class="${cellClass(c)}"></span>`;
      return grid
        ? '<span class="ui-dotmatrix__cell"></span>'
        : '<span class="ui-dotmatrix__cell" style="background:transparent"></span>';
    })
    .join('');

  return `<div class="ui-dotmatrix" style="${style.join(';')}" ${a11y}>${inner}</div>`;
}
