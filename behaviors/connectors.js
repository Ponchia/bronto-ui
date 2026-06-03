import { hasDom, resolveHost, noop, bindOnce, byIdInHost, collectHosts } from './internal.js';
import { connectRects, arrowHead, dotMark } from '../connectors/index.js';

const SVGNS = 'http://www.w3.org/2000/svg';

/**
 * Draw + keep leader lines in sync. Each `[data-bronto-connector]` is an
 * `.ui-connector` SVG overlaying a positioned container; `data-from`/`data-to`
 * are the ids of the elements to connect. Optional `data-shape`
 * (`straight`|`elbow`|`curve`), `data-from-side`/`data-to-side`
 * (`top`|`right`|`bottom`|`left`|`center`), and `data-end` (`arrow`|`dot`|`none`).
 *
 * Bronto computes the geometry (the pure `@ponchia/ui/connectors` helpers) and
 * sets the path; it owns no layout. Redraws on resize/scroll via a
 * ResizeObserver + listeners. SSR-safe, idempotent per host; returns a cleanup
 * that disconnects everything. Re-run after adding/removing connectors.
 */
export function initConnectors({ root } = {}) {
  if (!hasDom()) return noop;
  const host = resolveHost(root);
  if (!host) return noop;
  const connectors = collectHosts(host, '[data-bronto-connector]');
  if (!connectors.length) return noop;

  const draw = () => {
    for (const svg of connectors) {
      const from = byIdInHost(host, svg.dataset.from);
      const to = byIdInHost(host, svg.dataset.to);
      if (!from || !to) continue;
      const o = svg.getBoundingClientRect();
      const rel = (el) => {
        const r = el.getBoundingClientRect();
        return { x: r.left - o.left, y: r.top - o.top, width: r.width, height: r.height };
      };
      const {
        d,
        to: end,
        angle,
      } = connectRects({
        fromRect: rel(from),
        toRect: rel(to),
        shape: svg.dataset.shape || 'straight',
        fromSide: svg.dataset.fromSide || undefined,
        toSide: svg.dataset.toSide || undefined,
      });
      let path = svg.querySelector('.ui-connector__path');
      if (!path) {
        path = document.createElementNS(SVGNS, 'path');
        path.setAttribute('class', 'ui-connector__path');
        svg.appendChild(path);
      }
      path.setAttribute('d', d);
      // pathLength="1" normalises the draw animation, but it would also reframe
      // a dashed line's user-unit dasharray — so only set it for draw connectors.
      if (svg.classList.contains('ui-connector--draw')) path.setAttribute('pathLength', '1');
      else path.removeAttribute('pathLength');

      const kind = svg.dataset.end || 'arrow';
      let cap = svg.querySelector('.ui-connector__end');
      if (kind === 'none') {
        cap?.remove();
        continue;
      }
      if (!cap) {
        cap = document.createElementNS(SVGNS, 'path');
        cap.setAttribute('class', 'ui-connector__end');
        svg.appendChild(cap);
      }
      cap.setAttribute('d', kind === 'dot' ? dotMark(end, 3) : arrowHead(end, angle, 8));
    }
  };

  return bindOnce(host, 'connectors', () => {
    draw();
    const view = host.defaultView || host.ownerDocument?.defaultView || null;
    const RO = view?.ResizeObserver;
    const ro = RO ? new RO(draw) : null;
    if (ro) {
      for (const svg of connectors) {
        if (svg.parentElement) ro.observe(svg.parentElement);
        const f = byIdInHost(host, svg.dataset.from);
        const t = byIdInHost(host, svg.dataset.to);
        if (f) ro.observe(f);
        if (t) ro.observe(t);
      }
    }
    view?.addEventListener('resize', draw);
    view?.addEventListener('scroll', draw, true);
    return () => {
      ro?.disconnect();
      view?.removeEventListener('resize', draw);
      view?.removeEventListener('scroll', draw, true);
    };
  });
}
