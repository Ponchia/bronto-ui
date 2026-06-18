import {
  hasDom,
  resolveHost,
  noop,
  bindOnce,
  scrollIntoViewSafe,
  collectHosts,
  closestSafe,
} from './internal.js';

const snapshotAttrs = (el) =>
  Array.from(el.attributes, ({ name, value }) => ({
    name,
    value,
  }));

const restoreAttrs = (el, attrs) => {
  for (const { name } of Array.from(el.attributes)) el.removeAttribute(name);
  for (const { name, value } of attrs) el.setAttribute(name, value);
};

const snapshotNode = (el, { html = false } = {}) =>
  el
    ? {
        el,
        attrs: snapshotAttrs(el),
        ...(html ? { innerHTML: el.innerHTML } : {}),
      }
    : null;

const restoreNode = (state) => {
  if (!state) return;
  restoreAttrs(state.el, state.attrs);
  if ('innerHTML' in state) state.el.innerHTML = state.innerHTML;
};

const clampIndex = (value, max) => Math.max(0, Math.min(max, value));

const renderedStatusIndex = (status) => {
  const match = /^(\d+)\s*\/\s*\d+$/.exec(status?.textContent?.trim() ?? '');
  if (!match) return -1;
  const value = Number(match[1]);
  return Number.isInteger(value) ? value - 1 : -1;
};

const snapshotCarouselState = ({ viewport, slides, status, prevBtn, nextBtn, thumbs }) => ({
  viewport: snapshotNode(viewport),
  slides: slides.map((slide) => snapshotNode(slide)),
  status: snapshotNode(status, { html: true }),
  controls: [prevBtn, nextBtn, ...thumbs].filter(Boolean).map((control) => snapshotNode(control)),
});

function restoreCarouselState(state) {
  restoreNode(state.viewport);
  state.slides.forEach(restoreNode);
  restoreNode(state.status);
  state.controls.forEach(restoreNode);
}

function setDefaultButtonType(button) {
  if (button?.tagName === 'BUTTON' && !button.hasAttribute('type')) button.type = 'button';
}

function applyCarouselA11y({ box, viewport, slides, status, prevBtn, nextBtn, thumbs, n }) {
  // ARIA scaffolding — pragmatic carousel semantics (not the full APG
  // tablist), the same restraint initMenu takes.
  viewport.setAttribute('role', 'group');
  viewport.setAttribute('aria-roledescription', 'carousel');
  if (!viewport.hasAttribute('aria-label')) {
    viewport.setAttribute(
      'aria-label',
      box.getAttribute('data-bronto-carousel-label') || 'Carousel',
    );
  }
  if (!viewport.hasAttribute('tabindex')) viewport.tabIndex = 0;
  slides.forEach((slide, i) => {
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    if (!slide.hasAttribute('aria-label')) slide.setAttribute('aria-label', `${i + 1} of ${n}`);
  });
  if (status) status.setAttribute('aria-live', 'polite');
  [prevBtn, nextBtn, ...thumbs].forEach(setDefaultButtonType);
  if (prevBtn && !prevBtn.hasAttribute('aria-label'))
    prevBtn.setAttribute('aria-label', 'Previous');
  if (nextBtn && !nextBtn.hasAttribute('aria-label')) nextBtn.setAttribute('aria-label', 'Next');
}

function bindCarouselLifecycle({
  box,
  viewport,
  slides,
  status,
  prevBtn,
  nextBtn,
  thumbs,
  n,
  render,
  onKey,
  onClick,
  io,
  holdProgrammatic,
  clearProgrammaticTimer,
}) {
  const state = snapshotCarouselState({ viewport, slides, status, prevBtn, nextBtn, thumbs });
  applyCarouselA11y({ box, viewport, slides, status, prevBtn, nextBtn, thumbs, n });
  render();
  viewport.addEventListener('keydown', onKey);
  box.addEventListener('click', onClick);
  // Observe inside the add callback so observe/disconnect pair with the
  // binding lifecycle: a re-init tears down the prior binding (which
  // disconnects the old observer) before this starts, so two observers
  // never watch the same slides — even for one tick.
  if (io) {
    holdProgrammatic();
    slides.forEach((slide) => io.observe(slide));
  }
  return () => {
    viewport.removeEventListener('keydown', onKey);
    box.removeEventListener('click', onClick);
    io?.disconnect();
    clearProgrammaticTimer();
    restoreCarouselState(state);
  };
}

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

    const authoredIndex = slides.findIndex((s) => s.hasAttribute('data-bronto-carousel-current'));
    const renderedThumbIndex = thumbs.findIndex((t) => t.getAttribute('aria-current') === 'true');
    const statusIndex = renderedStatusIndex(status);
    let index = clampIndex(
      renderedThumbIndex >= 0 ? renderedThumbIndex : statusIndex >= 0 ? statusIndex : authoredIndex,
      n - 1,
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
      if (prevBtn && closestSafe(e.target, '[data-bronto-carousel-prev]')) {
        goTo(index - 1);
        return;
      }
      if (nextBtn && closestSafe(e.target, '[data-bronto-carousel-next]')) {
        goTo(index + 1);
        return;
      }
      const thumb = closestSafe(e.target, '.ui-carousel__thumb');
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

    const bound = bindOnce(box, 'carousel', () =>
      bindCarouselLifecycle({
        box,
        viewport,
        slides,
        status,
        prevBtn,
        nextBtn,
        thumbs,
        n,
        render,
        onKey,
        onClick,
        io,
        holdProgrammatic,
        clearProgrammaticTimer: () => {
          if (progTimer) clearTimeout(progTimer);
        },
      }),
    );
    cleanups.push(bound);
  }

  return () => cleanups.forEach((fn) => fn());
}
