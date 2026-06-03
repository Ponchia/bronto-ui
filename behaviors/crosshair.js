import { hasDom, resolveHost, noop, bindOnce, collectHosts } from './internal.js';

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
    if (!overlay) continue;
    const onMove = (e) => {
      const r = plot.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      overlay.style.setProperty('--crosshair-x', `${x}px`);
      overlay.style.setProperty('--crosshair-y', `${y}px`);
      overlay.classList.add('is-active');
      plot.dispatchEvent(
        new CustomEvent('bronto:crosshair:move', {
          bubbles: true,
          detail: { x, y, fx: x / r.width, fy: y / r.height },
        }),
      );
    };
    const onLeave = () => {
      overlay.classList.remove('is-active');
      plot.dispatchEvent(new CustomEvent('bronto:crosshair:leave', { bubbles: true }));
    };
    cleanups.push(
      bindOnce(plot, 'crosshair', () => {
        plot.addEventListener('pointermove', onMove);
        plot.addEventListener('pointerleave', onLeave);
        return () => {
          plot.removeEventListener('pointermove', onMove);
          plot.removeEventListener('pointerleave', onLeave);
        };
      }),
    );
  }
  return () => cleanups.forEach((fn) => fn());
}
