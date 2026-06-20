import { hasDom, resolveHost, noop, collectHosts } from './internal.js';
import { GLYPH_SIZE, glyphCells, glyphMask } from '../glyphs/glyphs.js';

const GLYPH_CLEANUP = Symbol('bronto-glyph-cleanup');

function restoreAttr(el, name, prev) {
  if (prev === null) el.removeAttribute(name);
  else el.setAttribute(name, prev);
}

function restoreStyleProp(el, name, prev) {
  if (prev) el.style.setProperty(name, prev);
  else el.style.removeProperty(name);
}

function cleanupEmptyClassAndStyle(el) {
  if (el.getAttribute('class') === '') el.removeAttribute('class');
  if (el.getAttribute('style') === '') el.removeAttribute('style');
}

function rememberCleanup(el, cleanups, cleanup) {
  let done = false;
  const wrapped = () => {
    if (done) return;
    done = true;
    cleanup();
    if (el[GLYPH_CLEANUP] === wrapped) delete el[GLYPH_CLEANUP];
  };
  el[GLYPH_CLEANUP] = wrapped;
  cleanups.push(wrapped);
}

// `dot`/`gap`/`size` land in inline CSS, so allow only length/calc syntax —
// drop anything with a `;`/`{` that could open a second declaration (mirrors
// glyphs.js cssLen). Used for the mask path's --icon-size.
function cssLen(v) {
  return v && /^[\w.%+\-*/()\s,]+$/.test(v) ? v : '';
}

function applyGlyphA11y(el, label) {
  if (label) {
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', label);
    el.removeAttribute('aria-hidden');
  } else {
    el.setAttribute('aria-hidden', 'true');
  }
}

function expandMaskGlyph(el, name, label, cleanups) {
  if (el.classList.contains('ui-icon') && el.style.getPropertyValue('--icon-mask')) return;
  const mask = glyphMask(name);
  if (!mask) return; // unknown glyph — leave the placeholder as-is

  const hadIcon = el.classList.contains('ui-icon');
  const hadMask = el.style.getPropertyValue('--icon-mask');
  const hadSize = el.style.getPropertyValue('--icon-size');
  const hadAriaHidden = el.getAttribute('aria-hidden');
  const hadRole = el.getAttribute('role');
  const hadAriaLabel = el.getAttribute('aria-label');
  const size = cssLen(el.getAttribute('data-bronto-glyph-size'));

  el.classList.add('ui-icon');
  el.style.setProperty('--icon-mask', mask);
  if (size) el.style.setProperty('--icon-size', size);
  applyGlyphA11y(el, label);

  rememberCleanup(el, cleanups, () => {
    if (!hadIcon) el.classList.remove('ui-icon');
    restoreStyleProp(el, '--icon-mask', hadMask);
    restoreStyleProp(el, '--icon-size', hadSize);
    restoreAttr(el, 'aria-hidden', hadAriaHidden);
    restoreAttr(el, 'role', hadRole);
    restoreAttr(el, 'aria-label', hadAriaLabel);
    cleanupEmptyClassAndStyle(el);
  });
}

function glyphAnimClass(animAttr) {
  if (animAttr === 'reveal') return 'ui-dotmatrix--reveal';
  if (animAttr === 'pulse') return 'ui-dotmatrix--pulse';
  return null;
}

function authoredDotSize(el) {
  return (
    el.style.getPropertyValue('--dotmatrix-dot') ||
    (typeof getComputedStyle === 'function'
      ? getComputedStyle(el).getPropertyValue('--dotmatrix-dot').trim()
      : '')
  );
}

function applyDefaultDotScale(el, solid, hadGap) {
  const setDefaultDot = !authoredDotSize(el);
  let setDefaultGap = false;
  if (setDefaultDot) {
    el.style.setProperty('--dotmatrix-dot', '0.08em');
    if (!solid && !hadGap) {
      el.style.setProperty('--dotmatrix-gap', '0.02em'); // tight, so it reads as one glyph
      setDefaultGap = true;
    }
  }
  return { setDefaultDot, setDefaultGap };
}

function dotCellClass(cell) {
  if (!cell.on) return 'ui-dotmatrix__cell';
  if (cell.tone === 'hot') return 'ui-dotmatrix__cell ui-dotmatrix__cell--hot';
  if (cell.tone === 'accent') return 'ui-dotmatrix__cell ui-dotmatrix__cell--accent';
  return 'ui-dotmatrix__cell';
}

function appendGlyphCells(el, cells, { solid, animAttr }) {
  const frag = document.createDocumentFragment();
  cells.forEach((cell, i) => {
    const span = document.createElement('span');
    span.className = dotCellClass(cell);
    if (!cell.on && solid) span.style.background = 'transparent'; // glyph-only
    if (animAttr === 'reveal') span.style.setProperty('--i', String(i)); // scan stagger
    frag.appendChild(span);
  });
  el.appendChild(frag);
}

function expandCellGlyph(el, name, label, cleanups) {
  // Scope to DIRECT-child cells (the ones we append) — so a placeholder that
  // legitimately nests its own .ui-dotmatrix is neither mis-read as already
  // expanded here nor have its inner cells removed by cleanup below.
  if (el.querySelector(':scope > .ui-dotmatrix__cell')) return; // already expanded
  const cells = glyphCells(name);
  if (!cells.length) return; // unknown glyph — leave the placeholder as-is

  // `data-bronto-glyph-solid` → square, gapless pixel glyph (legible small),
  // the DOM counterpart to renderGlyph's `solid` option. Implies glyph-only.
  const solid = el.hasAttribute('data-bronto-glyph-solid');
  // `data-bronto-glyph-anim="reveal|pulse"` → decorative animation (the DOM
  // counterpart to renderGlyph's `anim`; reduced-motion-safe via CSS).
  const animAttr = el.getAttribute('data-bronto-glyph-anim');
  const animClass = glyphAnimClass(animAttr);
  const hadAnimClass = animClass ? el.classList.contains(animClass) : false;
  const hadMatrix = el.classList.contains('ui-dotmatrix');
  const hadCols = el.style.getPropertyValue('--dotmatrix-cols');
  const hadRadius = el.style.getPropertyValue('--dotmatrix-dot-radius');
  const hadGap = el.style.getPropertyValue('--dotmatrix-gap');
  const hadAriaHidden = el.getAttribute('aria-hidden');
  const hadRole = el.getAttribute('role');
  const hadAriaLabel = el.getAttribute('aria-label');

  el.classList.add('ui-dotmatrix');
  if (animClass) el.classList.add(animClass);
  el.style.setProperty('--dotmatrix-cols', String(GLYPH_SIZE));
  if (solid) {
    el.style.setProperty('--dotmatrix-dot-radius', '0');
    el.style.setProperty('--dotmatrix-gap', '0');
  }

  // Without a track size the grid cells default to `1fr`, so the 16×16 matrix
  // balloons to fill its container (full-bleed) — asymmetric with the mask
  // path's safe 1em. If the author set no `--dotmatrix-dot` (inline OR via the
  // cascade), default it to an intrinsic icon scale so a forgotten size
  // degrades to ~icon, not full-bleed.
  const defaults = applyDefaultDotScale(el, solid, hadGap);
  applyGlyphA11y(el, label);
  appendGlyphCells(el, cells, { solid, animAttr });

  rememberCleanup(el, cleanups, () => {
    el.querySelectorAll(':scope > .ui-dotmatrix__cell').forEach((n) => n.remove());
    if (!hadMatrix) el.classList.remove('ui-dotmatrix');
    if (animClass && !hadAnimClass) el.classList.remove(animClass);
    if (solid) {
      restoreStyleProp(el, '--dotmatrix-dot-radius', hadRadius);
      restoreStyleProp(el, '--dotmatrix-gap', hadGap);
    }
    if (defaults.setDefaultDot) el.style.removeProperty('--dotmatrix-dot');
    if (defaults.setDefaultGap) el.style.removeProperty('--dotmatrix-gap');
    restoreStyleProp(el, '--dotmatrix-cols', hadCols);
    restoreAttr(el, 'aria-hidden', hadAriaHidden);
    restoreAttr(el, 'role', hadRole);
    restoreAttr(el, 'aria-label', hadAriaLabel);
    cleanupEmptyClassAndStyle(el);
  });
}

/**
 * Expand `[data-bronto-glyph="name"]` placeholders into a `.ui-dotmatrix`
 * grid of GLYPH_SIZE² cells — the DOM counterpart to renderGlyph() from
 * `@ponchia/ui/glyphs`, for when you'd rather drop a placeholder than inline
 * the markup. Decorative by default (`aria-hidden`); add
 * `data-bronto-glyph-label` to expose it as `role="img"`. An unknown glyph
 * name is left untouched. Idempotent (skips an already-expanded host); the
 * returned cleanup removes the cells and restores the original attributes.
 *
 * `data-bronto-glyph-render="mask"` takes the cheap one-node path instead:
 * the host becomes a single `.ui-icon` masked by the glyph (no GLYPH_SIZE²
 * cells), inheriting `currentColor` and scaling with the text — the DOM
 * counterpart to renderGlyph's `render: 'mask'`, for an icon in every table
 * row where 256 cells per glyph is too heavy. `data-bronto-glyph-size` sets
 * `--icon-size`. The cell-mode attributes (solid/anim) don't apply.
 *
 * @param {import('./internal.js').DelegateOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function initDotGlyph({ root } = {}) {
  if (!hasDom()) return noop;
  const host = resolveHost(root);
  if (!host) return noop;
  const els = collectHosts(host, '[data-bronto-glyph]');
  const cleanups = [];

  for (const el of els) {
    el[GLYPH_CLEANUP]?.();
    const name = el.getAttribute('data-bronto-glyph');
    const label = el.getAttribute('data-bronto-glyph-label');

    // One-node mask path — the icon-at-scale counterpart to the 256-cell grid.
    if (el.getAttribute('data-bronto-glyph-render') === 'mask') {
      expandMaskGlyph(el, name, label, cleanups);
      continue;
    }

    expandCellGlyph(el, name, label, cleanups);
  }

  return () => cleanups.forEach((fn) => fn());
}
