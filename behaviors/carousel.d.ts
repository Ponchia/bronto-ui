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
export function initCarousel({ root }?: import("./internal.js").DelegateOpts): import("./internal.js").Cleanup;
//# sourceMappingURL=carousel.d.ts.map