import { hasDom, resolveHost, noop, bindOnce, byIdInHost, collectHosts } from './internal.js';
import { connectRects, arrowHead, dotMark } from '../connectors/index.js';

const SVGNS = 'http://www.w3.org/2000/svg';

const snapshotAttrs = (el) =>
  Array.from(el.attributes, ({ name, value }) => ({
    name,
    value,
  }));

const restoreAttrs = (el, attrs) => {
  for (const { name } of Array.from(el.attributes)) el.removeAttribute(name);
  for (const { name, value } of attrs) el.setAttribute(name, value);
};

const snapshotPart = (svg, selector) => {
  const node = svg.querySelector(selector);
  if (!node) return { node: null };
  return {
    node,
    attrs: snapshotAttrs(node),
    parent: node.parentNode,
    nextSibling: node.nextSibling,
    textContent: node.textContent,
  };
};

const restorePart = (svg, selector, state) => {
  if (!state.node) {
    svg.querySelector(selector)?.remove();
    return;
  }

  const parent = state.parent || svg;
  if (state.node.parentNode !== parent) {
    const before = state.nextSibling?.parentNode === parent ? state.nextSibling : null;
    parent.insertBefore(state.node, before);
  }
  restoreAttrs(state.node, state.attrs);
  state.node.textContent = state.textContent;
};

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
 *
 * @param {import('./internal.js').DelegateOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function initConnectors({ root } = {}) {
  if (!hasDom()) return noop;
  const host = resolveHost(root);
  if (!host) return noop;

  const fallbackRect = (svg, el) => {
    const origin = svg.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const scaleX = origin.width ? (svg.clientWidth || origin.width) / origin.width : 1;
    const scaleY = origin.height ? (svg.clientHeight || origin.height) / origin.height : 1;
    return {
      x: (r.left - origin.left) * scaleX,
      y: (r.top - origin.top) * scaleY,
      width: r.width * scaleX,
      height: r.height * scaleY,
    };
  };

  const rectInSvg = (svg, el) => {
    const r = el.getBoundingClientRect();
    const matrix = svg.getScreenCTM?.();
    const view = svg.ownerDocument?.defaultView;
    const Point = view?.DOMPoint;
    if (!matrix || !Point) return fallbackRect(svg, el);

    try {
      const inverse = matrix.inverse();
      const corners = [
        new Point(r.left, r.top),
        new Point(r.right, r.top),
        new Point(r.right, r.bottom),
        new Point(r.left, r.bottom),
      ].map((point) => point.matrixTransform(inverse));
      const xs = corners.map((point) => point.x);
      const ys = corners.map((point) => point.y);
      const left = Math.min(...xs);
      const right = Math.max(...xs);
      const top = Math.min(...ys);
      const bottom = Math.max(...ys);
      return { x: left, y: top, width: right - left, height: bottom - top };
    } catch {
      return fallbackRect(svg, el);
    }
  };

  const draw = () => {
    const connectors = collectHosts(host, '[data-bronto-connector]');
    for (const svg of connectors) {
      const from = byIdInHost(host, svg.dataset.from);
      const to = byIdInHost(host, svg.dataset.to);
      if (!from || !to) continue;
      const {
        d,
        to: end,
        angle,
      } = connectRects({
        fromRect: rectInSvg(svg, from),
        toRect: rectInSvg(svg, to),
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
    const connectors = collectHosts(host, '[data-bronto-connector]');
    if (!connectors.length) return noop;
    const states = connectors.map((svg) => ({
      svg,
      path: snapshotPart(svg, '.ui-connector__path'),
      end: snapshotPart(svg, '.ui-connector__end'),
    }));
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
      for (const state of states) {
        restorePart(state.svg, '.ui-connector__path', state.path);
        restorePart(state.svg, '.ui-connector__end', state.end);
      }
    };
  });
}
