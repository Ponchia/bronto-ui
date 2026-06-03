import {
  hasDom,
  resolveHost,
  noop,
  bindOnce,
  scrollIntoViewSafe,
  collectHosts,
} from './internal.js';

/**
 * Image carousel / gallery, built on CSS scroll-snap so touch + trackpad
 * swipe (and momentum) are the browser's, not hand-rolled. This wires the
 * parts scroll-snap can't do alone: prev/next buttons, keyboard nav, a
 * thumbnail strip, the position counter, and ARIA — keeping a JS index in
 * sync with the scroll position both ways.
 *
 * Markup: `[data-bronto-carousel]` containing a `.ui-carousel__viewport`
 * of `.ui-carousel__slide` children; optionally
 * `[data-bronto-carousel-prev]` / `[data-bronto-carousel-next]` controls,
 * a `.ui-carousel__thumbs` list of `.ui-carousel__thumb` buttons, and a
 * `.ui-carousel__status` counter slot. Add `data-bronto-carousel-loop` to
 * wrap at the ends, `data-bronto-carousel-label` to name the region.
 *
 * A full-screen **lightbox** is the same markup inside a native
 * `<dialog class="ui-lightbox">` opened by {@link initDialog}: the
 * `<dialog>` provides the top layer, focus-trap, Escape and focus-return,
 * so this behavior never touches focus management.
 *
 * Emits `bronto:change` ({ detail: { index } }) on every index change
 * (button, key, thumbnail, or swipe). SSR-safe, idempotent per carousel;
 * returns a cleanup function.
 *
 * @param {import('./internal.js').DelegateOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function initCarousel({ root } = {}) {
  if (!hasDom()) return noop;
  const host = resolveHost(root);
  if (!host) return noop;
  const boxes = collectHosts(host, '[data-bronto-carousel]');
  const cleanups = [];

  for (const box of boxes) {
    const viewport = box.querySelector('.ui-carousel__viewport');
    if (!viewport) continue;
    const slides = [...viewport.children].filter((el) =>
      el.classList.contains('ui-carousel__slide'),
    );
    if (!slides.length) continue;
    const n = slides.length;
    const thumbs = [...box.querySelectorAll('.ui-carousel__thumb')];
    const status = box.querySelector('.ui-carousel__status');
    const prevBtn = box.querySelector('[data-bronto-carousel-prev]');
    const nextBtn = box.querySelector('[data-bronto-carousel-next]');
    const loop = box.hasAttribute('data-bronto-carousel-loop');

    // ARIA scaffolding — pragmatic carousel semantics (not the full APG
    // tablist), the same restraint initMenu takes.
    viewport.setAttribute('role', 'group');
    viewport.setAttribute('aria-roledescription', 'carousel');
    if (!viewport.hasAttribute('aria-label'))
      viewport.setAttribute(
        'aria-label',
        box.getAttribute('data-bronto-carousel-label') || 'Carousel',
      );
    if (!viewport.hasAttribute('tabindex')) viewport.tabIndex = 0;
    slides.forEach((s, i) => {
      s.setAttribute('role', 'group');
      s.setAttribute('aria-roledescription', 'slide');
      if (!s.hasAttribute('aria-label')) s.setAttribute('aria-label', `${i + 1} of ${n}`);
    });
    if (status) status.setAttribute('aria-live', 'polite');
    for (const b of [prevBtn, nextBtn]) {
      if (!b) continue;
      if (b.tagName === 'BUTTON' && !b.hasAttribute('type')) b.type = 'button';
    }
    if (prevBtn && !prevBtn.hasAttribute('aria-label'))
      prevBtn.setAttribute('aria-label', 'Previous');
    if (nextBtn && !nextBtn.hasAttribute('aria-label')) nextBtn.setAttribute('aria-label', 'Next');

    let index = Math.max(
      0,
      slides.findIndex((s) => s.hasAttribute('data-bronto-carousel-current')),
    );

    // While a button/keyboard nav is smooth-scrolling, the IntersectionObserver
    // would observe the intermediate slides crossing its threshold and re-fire
    // `bronto:change` for each — a feedback burst on a single Home→End jump.
    // This flag makes the IO drive the index on *user* swipes only; a timeout
    // (not the patchy `scrollend` event) releases it once the scroll settles.
    let programmatic = false;
    let progTimer = null;
    const holdProgrammatic = () => {
      programmatic = true;
      if (progTimer) clearTimeout(progTimer);
      progTimer = setTimeout(() => {
        programmatic = false;
      }, 500);
      progTimer?.unref?.(); // don't keep a Node test process alive
    };

    const render = () => {
      if (status) status.textContent = `${index + 1} / ${n}`;
      thumbs.forEach((t, i) => {
        if (i === index) t.setAttribute('aria-current', 'true');
        else t.removeAttribute('aria-current');
      });
      if (prevBtn && !loop) prevBtn.disabled = index === 0;
      if (nextBtn && !loop) nextBtn.disabled = index === n - 1;
    };

    const emit = () =>
      box.dispatchEvent(new CustomEvent('bronto:change', { detail: { index }, bubbles: true }));

    const reveal = (el) => scrollIntoViewSafe(el, { block: 'nearest', inline: 'center' });

    const goTo = (i, { emitChange = true } = {}) => {
      const next = loop ? (i + n) % n : Math.max(0, Math.min(n - 1, i));
      const changed = next !== index;
      index = next;
      holdProgrammatic(); // suppress IO echo from the smooth-scroll this triggers
      reveal(slides[index]);
      reveal(thumbs[index]);
      render();
      if (changed && emitChange) emit();
    };

    const onKey = (e) => {
      let target = null;
      if (e.key === 'ArrowRight') target = index + 1;
      else if (e.key === 'ArrowLeft') target = index - 1;
      else if (e.key === 'Home') target = 0;
      else if (e.key === 'End') target = n - 1;
      else return;
      e.preventDefault();
      goTo(target);
    };
    const onClick = (e) => {
      if (prevBtn && e.target.closest('[data-bronto-carousel-prev]')) {
        goTo(index - 1);
        return;
      }
      if (nextBtn && e.target.closest('[data-bronto-carousel-next]')) {
        goTo(index + 1);
        return;
      }
      const thumb = e.target.closest('.ui-carousel__thumb');
      if (thumb) {
        const i = thumbs.indexOf(thumb);
        if (i >= 0) goTo(i);
      }
    };

    // Swipe sync (enhancement): when the user scrolls the viewport, snap
    // the JS index to the slide that's settled into view. Feature-detected
    // so the buttons/keyboard still work where IntersectionObserver is
    // absent (jsdom, older engines).
    let io = null;
    if (typeof IntersectionObserver === 'function') {
      io = new IntersectionObserver(
        (entries) => {
          if (programmatic) return; // ignore the echo of a button/key-driven scroll
          let best = null;
          for (const ent of entries) {
            if (ent.isIntersecting && (!best || ent.intersectionRatio > best.intersectionRatio))
              best = ent;
          }
          if (!best) return;
          const i = slides.indexOf(best.target);
          if (i >= 0 && i !== index) {
            index = i;
            render();
            reveal(thumbs[index]);
            emit();
          }
        },
        { root: viewport, threshold: 0.6 },
      );
    }

    render();
    const bound = bindOnce(box, 'carousel', () => {
      viewport.addEventListener('keydown', onKey);
      box.addEventListener('click', onClick);
      // Observe inside the add callback so observe/disconnect pair with the
      // binding lifecycle: a re-init tears down the prior binding (which
      // disconnects the old observer) before this starts, so two observers
      // never watch the same slides — even for one tick.
      slides.forEach((s) => io?.observe(s));
      return () => {
        viewport.removeEventListener('keydown', onKey);
        box.removeEventListener('click', onClick);
        io?.disconnect();
        if (progTimer) clearTimeout(progTimer);
      };
    });
    cleanups.push(bound);
  }

  return () => cleanups.forEach((fn) => fn());
}
