import { hasDom, resolveHost, noop, bindOnce, collectHosts } from './internal.js';

const rectRight = (rect) => rect.right ?? rect.left + rect.width;

/**
 * @typedef {object} CrosshairMoveDetail
 * @property {number} x Pointer x within the plot, in pixels.
 * @property {number} y Pointer y within the plot, in pixels.
 * @property {number} fx Pointer x as a 0..1 fraction of the plot width.
 * @property {number} fy Pointer y as a 0..1 fraction of the plot height.
 */

/**
 * Track the pointer over a plot and drive a crosshair. Each
 * `[data-bronto-crosshair]` is the plot; it contains a `.ui-crosshair` overlay.
 * On pointer move the behavior sets `--crosshair-x/y` (pixels within the plot)
 * on the overlay, marks it `.is-active`, and dispatches
 * `bronto:crosshair:move` with `{ x, y, fx, fy }` (px + 0..1 fractions);
 * `bronto:crosshair:leave` on exit.
 *
 * Bronto reports WHERE the pointer is — it does not find the nearest datum or
 * map pixels to data values (that needs the host's scales). SSR-safe,
 * idempotent per plot; returns a cleanup function.
 *
 * @param {import('./internal.js').DelegateOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function initCrosshair({ root } = {}) {
  if (!hasDom()) return noop;
  const host = resolveHost(root);
  if (!host) return noop;
  const plots = collectHosts(host, '[data-bronto-crosshair]');
  if (!plots.length) return noop;

  const cleanups = [];
  for (const plot of plots) {
    const overlay = plot.querySelector('.ui-crosshair');
    let overlayState = null;
    let geometry = null;
    let active = overlay?.classList.contains('is-active') ?? false;
    let writtenX = null;
    let writtenY = null;
    let writtenInline = overlay?.dataset.readoutInline ?? null;
    let writtenBlock = overlay?.dataset.readoutBlock ?? null;
    const view = plot.ownerDocument?.defaultView || null;
    const invalidateGeometry = () => {
      geometry = null;
    };
    const readGeometry = () => {
      const overlayRect = overlay.getBoundingClientRect();
      const r =
        overlayRect.width && overlayRect.height ? overlayRect : plot.getBoundingClientRect();
      if (!r.width || !r.height) return null;
      geometry = {
        left: r.left,
        right: rectRight(r),
        top: r.top,
        width: r.width,
        height: r.height,
        rtl: view?.getComputedStyle?.(overlay).direction === 'rtl',
      };
      return geometry;
    };
    const currentGeometry = () => geometry || readGeometry();
    const writeOverlay = (y, logicalX, inline, block) => {
      const xValue = `${logicalX}px`;
      const yValue = `${y}px`;
      if (writtenX !== xValue) {
        overlay.style.setProperty('--crosshair-x', xValue);
        writtenX = xValue;
      }
      if (writtenY !== yValue) {
        overlay.style.setProperty('--crosshair-y', yValue);
        writtenY = yValue;
      }
      if (writtenInline !== inline) {
        overlay.dataset.readoutInline = inline;
        writtenInline = inline;
      }
      if (writtenBlock !== block) {
        overlay.dataset.readoutBlock = block;
        writtenBlock = block;
      }
      if (!active) {
        overlay.classList.add('is-active');
        active = true;
      }
    };
    const rememberOverlay = () => {
      if (!overlay || overlayState) return;
      overlayState = {
        active: overlay.classList.contains('is-active'),
        x: {
          value: overlay.style.getPropertyValue('--crosshair-x'),
          priority: overlay.style.getPropertyPriority('--crosshair-x'),
        },
        y: {
          value: overlay.style.getPropertyValue('--crosshair-y'),
          priority: overlay.style.getPropertyPriority('--crosshair-y'),
        },
        inline: {
          had: overlay.hasAttribute('data-readout-inline'),
          value: overlay.getAttribute('data-readout-inline'),
        },
        block: {
          had: overlay.hasAttribute('data-readout-block'),
          value: overlay.getAttribute('data-readout-block'),
        },
      };
    };
    const restoreData = (name, state) => {
      if (state.had) overlay.setAttribute(name, state.value);
      else overlay.removeAttribute(name);
    };
    const restoreOverlay = () => {
      if (!overlay || !overlayState) return;
      overlay.classList.toggle('is-active', overlayState.active);
      if (overlayState.x.value)
        overlay.style.setProperty('--crosshair-x', overlayState.x.value, overlayState.x.priority);
      else overlay.style.removeProperty('--crosshair-x');
      if (overlayState.y.value)
        overlay.style.setProperty('--crosshair-y', overlayState.y.value, overlayState.y.priority);
      else overlay.style.removeProperty('--crosshair-y');
      restoreData('data-readout-inline', overlayState.inline);
      restoreData('data-readout-block', overlayState.block);
      active = overlayState.active;
      writtenX = overlayState.x.value || null;
      writtenY = overlayState.y.value || null;
      writtenInline = overlayState.inline.had ? overlayState.inline.value : null;
      writtenBlock = overlayState.block.had ? overlayState.block.value : null;
      invalidateGeometry();
      overlayState = null;
    };
    const onMove = (e) => {
      if (!overlay) return;
      rememberOverlay();
      const r = currentGeometry();
      if (!r) return;
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      // The CSS positions the vertical rule / readout with a *logical* inset
      // (inset-inline-start), so --crosshair-x must be the distance from the
      // inline-start edge — the physical left in LTR, the physical right in RTL.
      // Emitting the physical x instead made the RTL rule land off-plot. The
      // public `detail.x`/`fx` stay physical-from-left so host scale-mapping
      // keeps one stable coordinate space regardless of direction.
      writeOverlay(
        y,
        r.rtl ? r.right - e.clientX : x,
        x / r.width > 0.5 ? 'before' : 'after',
        y / r.height > 0.5 ? 'above' : 'below',
      );
      plot.dispatchEvent(
        new CustomEvent('bronto:crosshair:move', {
          bubbles: true,
          detail: { x, y, fx: x / r.width, fy: y / r.height },
        }),
      );
    };
    const onLeave = () => {
      if (!overlay) return;
      overlay.classList.remove('is-active');
      active = false;
      plot.dispatchEvent(new CustomEvent('bronto:crosshair:leave', { bubbles: true }));
    };
    cleanups.push(
      bindOnce(plot, 'crosshair', () => {
        if (!overlay) return noop;
        plot.addEventListener('pointermove', onMove);
        plot.addEventListener('pointerleave', onLeave);
        view?.addEventListener('resize', invalidateGeometry);
        view?.addEventListener('scroll', invalidateGeometry, true);
        return () => {
          plot.removeEventListener('pointermove', onMove);
          plot.removeEventListener('pointerleave', onLeave);
          view?.removeEventListener('resize', invalidateGeometry);
          view?.removeEventListener('scroll', invalidateGeometry, true);
          restoreOverlay();
        };
      }),
    );
  }
  return () => cleanups.forEach((fn) => fn());
}
