import { hasDom, resolveHost, noop, collectHosts } from './internal.js';
import { GLYPH_SIZE, glyphCells, glyphMask } from '../glyphs/glyphs.js';

function restoreAttr(el, name, prev) {
  if (prev === null) el.removeAttribute(name);
  else el.setAttribute(name, prev);
}

// `dot`/`gap`/`size` land in inline CSS, so allow only length/calc syntax —
// drop anything with a `;`/`{` that could open a second declaration (mirrors
// glyphs.js cssLen). Used for the mask path's --icon-size.
function cssLen(v) {
  return v && /^[\w.%+\-*/()\s,]+$/.test(v) ? v : '';
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
    const name = el.getAttribute('data-bronto-glyph');
    const label = el.getAttribute('data-bronto-glyph-label');

    // One-node mask path — the icon-at-scale counterpart to the 256-cell grid.
    if (el.getAttribute('data-bronto-glyph-render') === 'mask') {
      if (el.classList.contains('ui-icon') && el.style.getPropertyValue('--icon-mask')) continue;
      const mask = glyphMask(name);
      if (!mask) continue; // unknown glyph — leave the placeholder as-is
      const hadIcon = el.classList.contains('ui-icon');
      const hadMask = el.style.getPropertyValue('--icon-mask');
      const hadSize = el.style.getPropertyValue('--icon-size');
      const hadAriaHiddenM = el.getAttribute('aria-hidden');
      const hadRoleM = el.getAttribute('role');
      const hadAriaLabelM = el.getAttribute('aria-label');
      const sizeM = cssLen(el.getAttribute('data-bronto-glyph-size'));

      el.classList.add('ui-icon');
      el.style.setProperty('--icon-mask', mask);
      if (sizeM) el.style.setProperty('--icon-size', sizeM);
      if (label) {
        el.setAttribute('role', 'img');
        el.setAttribute('aria-label', label);
        el.removeAttribute('aria-hidden');
      } else {
        el.setAttribute('aria-hidden', 'true');
      }

      cleanups.push(() => {
        if (!hadIcon) el.classList.remove('ui-icon');
        if (hadMask) el.style.setProperty('--icon-mask', hadMask);
        else el.style.removeProperty('--icon-mask');
        if (sizeM && !hadSize) el.style.removeProperty('--icon-size');
        else if (hadSize) el.style.setProperty('--icon-size', hadSize);
        restoreAttr(el, 'aria-hidden', hadAriaHiddenM);
        restoreAttr(el, 'role', hadRoleM);
        restoreAttr(el, 'aria-label', hadAriaLabelM);
        if (el.getAttribute('class') === '') el.removeAttribute('class');
        if (el.getAttribute('style') === '') el.removeAttribute('style');
      });
      continue;
    }

    // Scope to DIRECT-child cells (the ones we append) — so a placeholder that
    // legitimately nests its own .ui-dotmatrix is neither mis-read as already
    // expanded here nor have its inner cells removed by cleanup below.
    if (el.querySelector(':scope > .ui-dotmatrix__cell')) continue; // already expanded
    const cells = glyphCells(name);
    if (!cells.length) continue; // unknown glyph — leave the placeholder as-is
    // `data-bronto-glyph-solid` → square, gapless pixel glyph (legible small),
    // the DOM counterpart to renderGlyph's `solid` option. Implies glyph-only.
    const solid = el.hasAttribute('data-bronto-glyph-solid');
    // `data-bronto-glyph-anim="reveal|pulse"` → decorative animation (the DOM
    // counterpart to renderGlyph's `anim`; reduced-motion-safe via CSS).
    const animAttr = el.getAttribute('data-bronto-glyph-anim');
    const animClass =
      animAttr === 'reveal'
        ? 'ui-dotmatrix--reveal'
        : animAttr === 'pulse'
          ? 'ui-dotmatrix--pulse'
          : null;
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
    // degrades to ~icon, not full-bleed. (component audit C9.)
    const authoredDot =
      el.style.getPropertyValue('--dotmatrix-dot') ||
      (typeof getComputedStyle === 'function'
        ? getComputedStyle(el).getPropertyValue('--dotmatrix-dot').trim()
        : '');
    const setDefaultDot = !authoredDot;
    let setDefaultGap = false;
    if (setDefaultDot) {
      el.style.setProperty('--dotmatrix-dot', '0.08em');
      if (!solid && !hadGap) {
        el.style.setProperty('--dotmatrix-gap', '0.02em'); // tight, so it reads as one glyph
        setDefaultGap = true;
      }
    }
    if (label) {
      el.setAttribute('role', 'img');
      el.setAttribute('aria-label', label);
      el.removeAttribute('aria-hidden'); // a labelled img must not also be hidden
    } else {
      el.setAttribute('aria-hidden', 'true');
    }

    const frag = document.createDocumentFragment();
    cells.forEach((c, i) => {
      const span = document.createElement('span');
      span.className = !c.on
        ? 'ui-dotmatrix__cell'
        : c.tone === 'hot'
          ? 'ui-dotmatrix__cell ui-dotmatrix__cell--hot'
          : c.tone === 'accent'
            ? 'ui-dotmatrix__cell ui-dotmatrix__cell--accent'
            : 'ui-dotmatrix__cell';
      if (!c.on && solid) span.style.background = 'transparent'; // glyph-only
      if (animAttr === 'reveal') span.style.setProperty('--i', String(i)); // scan stagger
      frag.appendChild(span);
    });
    el.appendChild(frag);

    cleanups.push(() => {
      el.querySelectorAll(':scope > .ui-dotmatrix__cell').forEach((n) => n.remove());
      if (!hadMatrix) el.classList.remove('ui-dotmatrix');
      if (animClass && !hadAnimClass) el.classList.remove(animClass);
      if (solid) {
        if (hadRadius) el.style.setProperty('--dotmatrix-dot-radius', hadRadius);
        else el.style.removeProperty('--dotmatrix-dot-radius');
        if (hadGap) el.style.setProperty('--dotmatrix-gap', hadGap);
        else el.style.removeProperty('--dotmatrix-gap');
      }
      if (setDefaultDot) el.style.removeProperty('--dotmatrix-dot');
      if (setDefaultGap) el.style.removeProperty('--dotmatrix-gap');
      if (hadCols) el.style.setProperty('--dotmatrix-cols', hadCols);
      else el.style.removeProperty('--dotmatrix-cols');
      restoreAttr(el, 'aria-hidden', hadAriaHidden);
      restoreAttr(el, 'role', hadRole);
      restoreAttr(el, 'aria-label', hadAriaLabel);
      // Don't leave behind empty class=""/style="" we ourselves created.
      if (el.getAttribute('class') === '') el.removeAttribute('class');
      if (el.getAttribute('style') === '') el.removeAttribute('style');
    });
  }

  return () => cleanups.forEach((fn) => fn());
}
