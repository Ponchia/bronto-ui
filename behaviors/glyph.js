import { hasDom, resolveHost, noop } from './internal.js';
import { GLYPH_SIZE, glyphCells } from '../glyphs/glyphs.js';

function restoreAttr(el, name, prev) {
  if (prev === null) el.removeAttribute(name);
  else el.setAttribute(name, prev);
}

/**
 * Expand `[data-bronto-glyph="name"]` placeholders into a `.ui-dotmatrix`
 * grid of GLYPH_SIZE² cells — the DOM counterpart to renderGlyph() from
 * `@ponchia/ui/glyphs`, for when you'd rather drop a placeholder than inline
 * the markup. Decorative by default (`aria-hidden`); add
 * `data-bronto-glyph-label` to expose it as `role="img"`. An unknown glyph
 * name is left untouched. Idempotent (skips an already-expanded host); the
 * returned cleanup removes the cells and restores the original attributes.
 */
export function initDotGlyph({ root } = {}) {
  if (!hasDom()) return noop;
  const host = resolveHost(root);
  if (!host) return noop;
  const els = [];
  if (host !== document && host.matches?.('[data-bronto-glyph]')) els.push(host);
  els.push(...(host.querySelectorAll?.('[data-bronto-glyph]') ?? []));
  const cleanups = [];

  for (const el of els) {
    // Scope to DIRECT-child cells (the ones we append) — so a placeholder that
    // legitimately nests its own .ui-dotmatrix is neither mis-read as already
    // expanded here nor have its inner cells removed by cleanup below.
    if (el.querySelector(':scope > .ui-dotmatrix__cell')) continue; // already expanded
    const cells = glyphCells(el.getAttribute('data-bronto-glyph'));
    if (!cells.length) continue; // unknown glyph — leave the placeholder as-is

    const label = el.getAttribute('data-bronto-glyph-label');
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
