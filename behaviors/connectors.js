import { hasDom, resolveHost, noop, bindOnce, collectHosts } from './internal.js';
import { connectRects, arrowHead, dotMark } from '../connectors/index.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const NORMALIZED_PATH_LENGTH = '1';
const END_DOT_RADIUS = 3;
const END_ARROW_SIZE = 8;

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

const upsertConnectorPart = (svg, selector, className) => {
  let part = svg.querySelector(selector);
  if (part) return part;
  part = document.createElementNS(SVGNS, 'path');
  part.setAttribute('class', className);
  svg.appendChild(part);
  return part;
};

const syncDrawPathLength = (svg, path) => {
  // pathLength normalises the draw animation, but it would also reframe a
  // dashed line's user-unit dasharray — so only set it for draw connectors.
  if (svg.classList.contains('ui-connector--draw')) {
    path.setAttribute('pathLength', NORMALIZED_PATH_LENGTH);
  } else {
    path.removeAttribute('pathLength');
  }
};

const syncConnectorEnd = (svg, end, angle) => {
  const kind = svg.dataset.end || 'arrow';
  const cap = svg.querySelector('.ui-connector__end');
  if (kind === 'none') {
    cap?.remove();
    return;
  }
  const next = cap || upsertConnectorPart(svg, '.ui-connector__end', 'ui-connector__end');
  next.setAttribute(
    'd',
    kind === 'dot' ? dotMark(end, END_DOT_RADIUS) : arrowHead(end, angle, END_ARROW_SIZE),
  );
};

const CONNECTOR_SHAPES = ['straight', 'elbow', 'curve'];
const CONNECTOR_SIDES = ['top', 'right', 'bottom', 'left', 'center'];
const CONNECTOR_SHAPE_VALUES = new Set(CONNECTOR_SHAPES);
const CONNECTOR_SIDE_VALUES = new Set(CONNECTOR_SIDES);

const clearConnectorParts = (svg) => {
  svg.querySelector('.ui-connector__path')?.remove();
  svg.querySelector('.ui-connector__end')?.remove();
};

const invalidConnectorOptionDetails = (svg) => {
  const details = [];
  const shape = svg.dataset.shape;
  if (shape && !CONNECTOR_SHAPE_VALUES.has(shape)) {
    details.push(`data-shape="${shape}" (allowed: ${CONNECTOR_SHAPES.join('/')})`);
  }
  const fromSide = svg.dataset.fromSide;
  if (fromSide && !CONNECTOR_SIDE_VALUES.has(fromSide)) {
    details.push(`data-from-side="${fromSide}" (allowed: ${CONNECTOR_SIDES.join('/')})`);
  }
  const toSide = svg.dataset.toSide;
  if (toSide && !CONNECTOR_SIDE_VALUES.has(toSide)) {
    details.push(`data-to-side="${toSide}" (allowed: ${CONNECTOR_SIDES.join('/')})`);
  }
  return details;
};

const warnInvalidConnectorOptions = (svg, warnedInvalidOptions) => {
  const details = invalidConnectorOptionDetails(svg);
  if (!details.length || typeof console === 'undefined') return;
  const signature = details.join('|');
  if (warnedInvalidOptions.get(svg) === signature) return;
  warnedInvalidOptions.set(svg, signature);
  console.warn(
    `[bronto] initConnectors(): invalid connector option ${details.join(
      ', ',
    )} - skipping connector.`,
  );
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

  const warnedInvalidOptions = new WeakMap();
  const endpointInHost = (el) => host.nodeType === 9 || host.contains(el);
  const endpointStillInHost = (el) => host.contains?.(el) ?? endpointInHost(el);
  const cacheEndpoint = (endpoints, el) => {
    if (el?.id && !endpoints.has(el.id) && endpointInHost(el)) endpoints.set(el.id, el);
  };
  const endpointCache = () => {
    const endpoints = new Map();
    if (host.nodeType !== 9) cacheEndpoint(endpoints, host);
    for (const el of host.querySelectorAll?.('[id]') || []) cacheEndpoint(endpoints, el);
    return endpoints;
  };
  const endpointById = (endpoints, id) => {
    if (!id) return null;
    const el = endpoints.get(id) || null;
    return el && endpointStillInHost(el) ? el : null;
  };

  const measureConnector = (endpoints, svg) => {
    const from = endpointById(endpoints, svg.dataset.from);
    const to = endpointById(endpoints, svg.dataset.to);
    if (!from || !to) return { svg, skipped: true };
    try {
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
      return { svg, d, end, angle };
    } catch {
      return { svg, invalid: true };
    }
  };

  const draw = (endpoints, connectors) => {
    const measurements = connectors.map((svg) => measureConnector(endpoints, svg));
    for (const result of measurements) {
      const { svg } = result;
      if (result.skipped || result.invalid) {
        clearConnectorParts(svg);
        if (result.invalid) warnInvalidConnectorOptions(svg, warnedInvalidOptions);
        continue;
      }
      const path = upsertConnectorPart(svg, '.ui-connector__path', 'ui-connector__path');
      path.setAttribute('d', result.d);
      syncDrawPathLength(svg, path);
      syncConnectorEnd(svg, result.end, result.angle);
    }
  };

  const observeEndpoint = (ro, el) => {
    if (el && endpointStillInHost(el)) ro.observe(el);
  };

  return bindOnce(host, 'connectors', () => {
    const connectors = collectHosts(host, '[data-bronto-connector]');
    if (!connectors.length) return noop;
    const endpoints = endpointCache();
    const states = connectors.map((svg) => ({
      svg,
      path: snapshotPart(svg, '.ui-connector__path'),
      end: snapshotPart(svg, '.ui-connector__end'),
    }));
    const view = host.defaultView || host.ownerDocument?.defaultView || null;
    const raf =
      view?.requestAnimationFrame?.bind(view) || globalThis.requestAnimationFrame?.bind(globalThis);
    const caf =
      view?.cancelAnimationFrame?.bind(view) || globalThis.cancelAnimationFrame?.bind(globalThis);
    let frame = null;
    let framePending = false;
    let stopped = false;

    const drawNow = () => {
      if (!stopped) draw(endpoints, connectors);
    };
    const scheduleDraw = () => {
      if (stopped || framePending) return;
      if (!raf) {
        drawNow();
        return;
      }
      framePending = true;
      frame = raf(() => {
        framePending = false;
        frame = null;
        drawNow();
      });
    };
    const cancelScheduledDraw = () => {
      if (framePending && caf) caf(frame);
      framePending = false;
      frame = null;
    };

    drawNow();
    const RO = view?.ResizeObserver;
    const ro = RO ? new RO(scheduleDraw) : null;
    if (ro) {
      for (const svg of connectors) {
        if (svg.parentElement) ro.observe(svg.parentElement);
        observeEndpoint(ro, endpointById(endpoints, svg.dataset.from));
        observeEndpoint(ro, endpointById(endpoints, svg.dataset.to));
      }
    }
    view?.addEventListener('resize', scheduleDraw);
    view?.addEventListener('scroll', scheduleDraw, true);
    return () => {
      stopped = true;
      cancelScheduledDraw();
      ro?.disconnect();
      view?.removeEventListener('resize', scheduleDraw);
      view?.removeEventListener('scroll', scheduleDraw, true);
      for (const state of states) {
        restorePart(state.svg, '.ui-connector__path', state.path);
        restorePart(state.svg, '.ui-connector__end', state.end);
      }
    };
  });
}
