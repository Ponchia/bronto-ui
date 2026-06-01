// Shared SVG geometry primitives live in the connectors kernel; annotations
// (figure callouts) build on them so a line/curve/arrow/dot is drawn one way.
import {
  straightPath,
  curvePath,
  connectorPath,
  arrowHead,
  dotMark,
  angleBetween,
} from '../connectors/index.js';

const PRECISION = 1000;

function finite(name, value, fallback) {
  const v = value ?? fallback;
  if (!Number.isFinite(v)) throw new TypeError(`${name} must be a finite number`);
  return v;
}

function dimension(name, value, fallback) {
  const v = finite(name, value, fallback);
  if (v < 0) throw new RangeError(`${name} must be greater than or equal to 0`);
  return v;
}

function fmt(value) {
  const rounded = Math.round((Object.is(value, -0) ? 0 : value) * PRECISION) / PRECISION;
  return String(Object.is(rounded, -0) ? 0 : rounded);
}

function roundedNumber(value) {
  const rounded = Math.round((Object.is(value, -0) ? 0 : value) * PRECISION) / PRECISION;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function point(x, y) {
  return `${fmt(x)},${fmt(y)}`;
}

function clamp(value, min, max) {
  if (max < min) return min;
  return Math.min(max, Math.max(min, value));
}

function circlePathAt(x, y, radius) {
  const r = dimension('radius', radius);
  if (r === 0) return '';
  return `M${point(x, y - r)}A${fmt(r)},${fmt(r)} 0 1 1 ${point(x, y + r)}A${fmt(r)},${fmt(
    r,
  )} 0 1 1 ${point(x, y - r)}Z`;
}

function samePoint(a, b) {
  return fmt(a.x) === fmt(b.x) && fmt(a.y) === fmt(b.y);
}

function validateOffset(opts) {
  return {
    dx: finite('dx', opts?.dx),
    dy: finite('dy', opts?.dy),
  };
}

function trimForCircle(dx, dy, subject) {
  const len = Math.hypot(dx, dy);
  const radius = dimension('subject.radius', subject.radius);
  const padding = dimension('subject.radiusPadding', subject.radiusPadding, 0);
  const trim = radius + padding;
  if (trim <= 0) return { x: 0, y: 0 };
  if (trim >= len) return null;
  return { x: (dx / len) * trim, y: (dy / len) * trim };
}

function trimForRect(dx, dy, subject) {
  const width = dimension('subject.width', subject.width);
  const height = dimension('subject.height', subject.height);
  const padding = dimension('subject.padding', subject.padding, 0);
  const x = finite('subject.x', subject.x, -width / 2);
  const y = finite('subject.y', subject.y, -height / 2);
  const minX = x - padding;
  const minY = y - padding;
  const maxX = x + width + padding;
  const maxY = y + height + padding;
  const candidates = [];

  if (dx > 0) candidates.push(maxX / dx);
  if (dx < 0) candidates.push(minX / dx);
  if (dy > 0) candidates.push(maxY / dy);
  if (dy < 0) candidates.push(minY / dy);

  const t = Math.min(...candidates.filter((v) => Number.isFinite(v) && v > 0));
  if (!Number.isFinite(t) || t <= 0) return { x: 0, y: 0 };
  if (t >= 1) return null;
  return { x: dx * t, y: dy * t };
}

function connectorStart(dx, dy, subject) {
  if (!subject) return { x: 0, y: 0 };
  if (subject.type === 'circle') return trimForCircle(dx, dy, subject);
  if (subject.type === 'rect') return trimForRect(dx, dy, subject);
  throw new TypeError('subject.type must be "circle" or "rect"');
}

function linePath(start, end) {
  if (samePoint(start, end)) return '';
  return `M${point(start.x, start.y)}L${point(end.x, end.y)}`;
}

export function annotationTransform({ x = 0, y = 0 } = {}) {
  return `translate(${fmt(finite('x', x))}, ${fmt(finite('y', y))})`;
}

export function noteTransform({
  dx,
  dy,
  x,
  y,
  align = 'start',
  valign = 'top',
  width = 0,
  height = 0,
} = {}) {
  let nx = finite('dx', dx, x ?? 0);
  let ny = finite('dy', dy, y ?? 0);
  const w = dimension('width', width);
  const h = dimension('height', height);

  if (align === 'middle') nx -= w / 2;
  else if (align === 'end') nx -= w;
  else if (align !== 'start') throw new TypeError('align must be "start", "middle" or "end"');

  if (valign === 'middle') ny -= h / 2;
  else if (valign === 'bottom') ny -= h;
  else if (valign !== 'top') throw new TypeError('valign must be "top", "middle" or "bottom"');

  return `translate(${fmt(nx)}, ${fmt(ny)})`;
}

function candidatePlacement(side, gap) {
  if (side === 'right') return { dx: gap, dy: 0, align: 'start', valign: 'middle' };
  if (side === 'left') return { dx: -gap, dy: 0, align: 'end', valign: 'middle' };
  if (side === 'top') return { dx: 0, dy: -gap, align: 'middle', valign: 'bottom' };
  if (side === 'bottom') return { dx: 0, dy: gap, align: 'middle', valign: 'top' };
  throw new TypeError('preferred must be "right", "left", "top" or "bottom"');
}

function placementOrder(preferred) {
  if (preferred === 'right') return ['right', 'top', 'bottom', 'left'];
  if (preferred === 'left') return ['left', 'top', 'bottom', 'right'];
  if (preferred === 'top') return ['top', 'right', 'left', 'bottom'];
  if (preferred === 'bottom') return ['bottom', 'right', 'left', 'top'];
  throw new TypeError('preferred must be "right", "left", "top" or "bottom"');
}

function noteRect(x, y, width, height, placement) {
  const anchorX = x + placement.dx;
  const anchorY = y + placement.dy;
  let left = anchorX;
  let top = anchorY;

  if (placement.align === 'middle') left -= width / 2;
  else if (placement.align === 'end') left -= width;

  if (placement.valign === 'middle') top -= height / 2;
  else if (placement.valign === 'bottom') top -= height;

  return {
    left,
    top,
    right: left + width,
    bottom: top + height,
  };
}

export function notePlacement({
  x = 0,
  y = 0,
  width,
  height,
  bounds,
  padding = 8,
  gap = 32,
  preferred = 'right',
} = {}) {
  const anchorX = finite('x', x);
  const anchorY = finite('y', y);
  const w = dimension('width', width);
  const h = dimension('height', height);
  const p = dimension('padding', padding);
  const g = dimension('gap', gap);
  const bx = finite('bounds.x', bounds?.x, 0);
  const by = finite('bounds.y', bounds?.y, 0);
  const bw = dimension('bounds.width', bounds?.width);
  const bh = dimension('bounds.height', bounds?.height);
  const minX = bx + p;
  const minY = by + p;
  const maxX = bx + bw - p;
  const maxY = by + bh - p;

  for (const side of placementOrder(preferred)) {
    const placement = candidatePlacement(side, g);
    const rect = noteRect(anchorX, anchorY, w, h, placement);
    if (rect.left >= minX && rect.top >= minY && rect.right <= maxX && rect.bottom <= maxY) {
      return {
        dx: roundedNumber(placement.dx),
        dy: roundedNumber(placement.dy),
        align: placement.align,
        valign: placement.valign,
        transform: noteTransform({ ...placement, width: w, height: h }),
      };
    }
  }

  const fallback = candidatePlacement(preferred, g);
  const rect = noteRect(anchorX, anchorY, w, h, fallback);
  const left = clamp(rect.left, minX, maxX - w);
  const top = clamp(rect.top, minY, maxY - h);
  const dx = roundedNumber(left - anchorX);
  const dy = roundedNumber(top - anchorY);
  return {
    dx,
    dy,
    align: 'start',
    valign: 'top',
    transform: noteTransform({ dx, dy }),
  };
}

export function circleSubjectPath({ radius } = {}) {
  return circlePathAt(0, 0, radius);
}

export function rectSubjectPath({ width, height, x, y, padding = 0 } = {}) {
  const w = dimension('width', width);
  const h = dimension('height', height);
  const p = dimension('padding', padding);
  if (w === 0 || h === 0) return '';
  const left = finite('x', x, -w / 2) - p;
  const top = finite('y', y, -h / 2) - p;
  const right = left + w + p * 2;
  const bottom = top + h + p * 2;
  return `M${point(left, top)}H${fmt(right)}V${fmt(bottom)}H${fmt(left)}Z`;
}

export function thresholdPath({ x1 = 0, y1 = 0, x2, y2 } = {}) {
  const start = { x: finite('x1', x1), y: finite('y1', y1) };
  const end = { x: finite('x2', x2), y: finite('y2', y2) };
  return linePath(start, end);
}

export function axisThresholdPath({ orientation = 'horizontal', value = 0, start = 0, end } = {}) {
  const v = finite('value', value);
  const s = finite('start', start);
  const e = finite('end', end);
  if (orientation === 'horizontal') return thresholdPath({ x1: s, y1: v, x2: e, y2: v });
  if (orientation === 'vertical') return thresholdPath({ x1: v, y1: s, x2: v, y2: e });
  throw new TypeError('orientation must be "horizontal" or "vertical"');
}

export function bracketSubjectPath({ x1, y1, x2, y2, depth = 12 } = {}) {
  const start = { x: finite('x1', x1), y: finite('y1', y1) };
  const end = { x: finite('x2', x2), y: finite('y2', y2) };
  const d = finite('depth', depth);
  if (samePoint(start, end) || d === 0) return linePath(start, end);
  if (Math.abs(end.x - start.x) >= Math.abs(end.y - start.y)) {
    return `M${point(start.x, start.y)}V${fmt(start.y + d)}H${fmt(end.x)}V${fmt(end.y)}`;
  }
  return `M${point(start.x, start.y)}H${fmt(start.x + d)}V${fmt(end.y)}H${fmt(end.x)}`;
}

export function bandSubjectPath({ x = 0, y = 0, width, height, padding = 0 } = {}) {
  return rectSubjectPath({ x, y, width, height, padding });
}

export function slopeSubjectPath({ x1, y1, x2, y2 } = {}) {
  return thresholdPath({ x1, y1, x2, y2 });
}

export function comparisonBracePath({ x1, y1, x2, y2, depth = 14 } = {}) {
  const start = { x: finite('x1', x1), y: finite('y1', y1) };
  const end = { x: finite('x2', x2), y: finite('y2', y2) };
  const d = finite('depth', depth);
  if (samePoint(start, end) || d === 0) return linePath(start, end);

  if (Math.abs(end.x - start.x) >= Math.abs(end.y - start.y)) {
    const y = start.y;
    const mid = (start.x + end.x) / 2;
    const q = (end.x - start.x) / 4;
    return `M${point(start.x, y)}C${point(start.x + q, y)} ${point(start.x + q, y + d)} ${point(
      mid,
      y + d,
    )}C${point(mid, y + d)} ${point(mid, y + d * 2)} ${point(mid, y + d * 2)}C${point(
      mid,
      y + d,
    )} ${point(end.x - q, y + d)} ${point(end.x - q, y)}C${point(end.x - q, y)} ${point(
      end.x - q,
      y,
    )} ${point(end.x, y)}`;
  }

  const x = start.x;
  const mid = (start.y + end.y) / 2;
  const q = (end.y - start.y) / 4;
  return `M${point(x, start.y)}C${point(x, start.y + q)} ${point(x + d, start.y + q)} ${point(
    x + d,
    mid,
  )}C${point(x + d, mid)} ${point(x + d * 2, mid)} ${point(x + d * 2, mid)}C${point(
    x + d,
    mid,
  )} ${point(x + d, end.y - q)} ${point(x, end.y - q)}C${point(x, end.y - q)} ${point(
    x,
    end.y - q,
  )} ${point(x, end.y)}`;
}

export function outlierClusterPath({ points, radius = 6 } = {}) {
  if (!Array.isArray(points)) throw new TypeError('points must be an array');
  return points
    .map((p, i) =>
      circlePathAt(finite(`points[${i}].x`, p?.x), finite(`points[${i}].y`, p?.y), radius),
    )
    .filter(Boolean)
    .join('');
}

export function timelineEventPath({ size = 10, direction = 'down' } = {}) {
  const s = dimension('size', size);
  if (s === 0) return '';
  if (direction === 'down') return `M0,0L${point(s / 2, s)}H${fmt(-s / 2)}Z`;
  if (direction === 'up') return `M0,0L${point(s / 2, -s)}H${fmt(-s / 2)}Z`;
  if (direction === 'right') return `M0,0L${point(s, s / 2)}V${fmt(-s / 2)}Z`;
  if (direction === 'left') return `M0,0L${point(-s, s / 2)}V${fmt(-s / 2)}Z`;
  throw new TypeError('direction must be "up", "down", "left" or "right"');
}

export function evidenceMarkerPath({ x = 0, y = 0, width = 36, height = 36, padding = 0 } = {}) {
  const w = dimension('width', width);
  const h = dimension('height', height);
  const p = dimension('padding', padding);
  if (w === 0 || h === 0) return '';
  const cx = finite('x', x);
  const cy = finite('y', y);
  const left = cx - w / 2 - p;
  const top = cy - h / 2 - p;
  const right = left + w + p * 2;
  const bottom = top + h + p * 2;
  return `M${point(left, top)}H${fmt(right)}V${fmt(bottom)}H${fmt(left)}Z`;
}

export function connectorEndDot({ x, y, radius = 3 } = {}) {
  return dotMark({ x: finite('x', x), y: finite('y', y) }, radius);
}

export function connectorEndArrow({ x1 = 0, y1 = 0, x2, y2, size = 7 } = {}) {
  const start = { x: finite('x1', x1), y: finite('y1', y1) };
  const end = { x: finite('x2', x2), y: finite('y2', y2) };
  const s = dimension('size', size);
  if (s === 0 || (end.x === start.x && end.y === start.y)) return '';
  return arrowHead(end, angleBetween(start, end), s);
}

export function connectorLine(opts = {}) {
  const { dx, dy } = validateOffset(opts);
  if (dx === 0 && dy === 0) return '';
  const start = connectorStart(dx, dy, opts.subject);
  if (!start) return '';
  const end = { x: dx, y: dy };
  // Guard a trim that rounds onto the note anchor (straightPath has no guard).
  if (samePoint(start, end)) return '';
  return straightPath(start, end);
}

export function connectorElbow(opts = {}) {
  const { dx, dy } = validateOffset(opts);
  if (dx === 0 && dy === 0) return '';
  const start = connectorStart(dx, dy, opts.subject);
  if (!start) return '';
  const end = { x: dx, y: dy };
  const vx = end.x - start.x;
  const vy = end.y - start.y;
  if (vx === 0 || vy === 0) return linePath(start, end);

  const elbow =
    Math.abs(vx) >= Math.abs(vy)
      ? { x: start.x + Math.sign(vx) * Math.abs(vy), y: end.y }
      : { x: end.x, y: start.y + Math.sign(vy) * Math.abs(vx) };

  if (samePoint(start, elbow) || samePoint(elbow, end)) return linePath(start, end);
  return `M${point(start.x, start.y)}L${point(elbow.x, elbow.y)}L${point(end.x, end.y)}`;
}

export function connectorCurve(opts = {}) {
  const { dx, dy } = validateOffset(opts);
  if (dx === 0 && dy === 0) return '';
  const start = connectorStart(dx, dy, opts.subject);
  if (!start) return '';
  const end = { x: dx, y: dy };
  if (samePoint(start, end)) return '';
  // Annotation callouts use a gentler curve than the connectors default.
  return curvePath(start, end, { curvature: 0.35 });
}

export function annotationParts(opts = {}) {
  const type = opts.type ?? 'callout';
  const transform = annotationTransform({ x: opts.x ?? 0, y: opts.y ?? 0 });
  const dx = finite('dx', opts.dx, 0);
  const dy = finite('dy', opts.dy, 0);
  const connectorSubject =
    opts.subject?.type === 'circle' || opts.subject?.type === 'rect' ? opts.subject : undefined;
  const connector =
    type === 'curve'
      ? connectorCurve({ dx, dy, subject: connectorSubject })
      : type === 'elbow'
        ? connectorElbow({ dx, dy, subject: connectorSubject })
        : connectorLine({ dx, dy, subject: connectorSubject });
  const note = noteTransform({ dx, dy });
  let subject = '';

  if (opts.subject?.type === 'circle') subject = circleSubjectPath(opts.subject);
  else if (opts.subject?.type === 'rect') subject = rectSubjectPath(opts.subject);
  else if (opts.subject?.type === 'threshold') subject = thresholdPath(opts.subject);
  else if (opts.subject?.type === 'bracket') subject = bracketSubjectPath(opts.subject);
  else if (opts.subject?.type === 'band') subject = bandSubjectPath(opts.subject);
  else if (opts.subject?.type === 'slope') subject = slopeSubjectPath(opts.subject);
  else if (opts.subject?.type === 'compare') subject = comparisonBracePath(opts.subject);
  else if (opts.subject?.type === 'cluster') subject = outlierClusterPath(opts.subject);
  else if (opts.subject?.type === 'axis') subject = axisThresholdPath(opts.subject);
  else if (opts.subject?.type === 'timeline') subject = timelineEventPath(opts.subject);
  else if (opts.subject?.type === 'evidence') subject = evidenceMarkerPath(opts.subject);
  else if (opts.subject != null) throw new TypeError('unsupported subject.type');

  return { transform, subject, connector, note };
}

/**
 * Declutter labels along ONE axis: nudge overlapping labels apart so each keeps
 * `gap` from its neighbours, sweeping up from `min`; if the run overflows `max`
 * it slides up to fit. Deterministic and order-preserving — NOT a general 2-D
 * collision solver (with more labels than the range holds, the overflow past
 * `min` is the caller's to resolve: fewer labels, a longer axis, or rotation).
 *
 * `items`: `[{ pos, size }]` — `pos` is the desired centre coordinate along the
 * axis, `size` the label's extent along it. Returns the adjusted centre per
 * input item, in the original order.
 */
export function declutterLabels(items, opts = {}) {
  if (!Array.isArray(items)) throw new TypeError('items must be an array');
  const gap = dimension('gap', opts.gap, 0);
  const min = opts.min == null ? -Infinity : finite('min', opts.min);
  const max = opts.max == null ? Infinity : finite('max', opts.max);
  if (max < min) throw new RangeError('max must be greater than or equal to min');

  const nodes = items.map((it, index) => ({
    index,
    half: dimension('size', it?.size) / 2,
    pos: finite('pos', it?.pos),
  }));
  const order = [...nodes].sort((a, b) => a.pos - b.pos);

  let floor = min;
  for (const n of order) {
    const center = Math.max(n.pos, floor + n.half);
    n.pos = center;
    floor = center + n.half + gap;
  }
  if (max !== Infinity && order.length) {
    const last = order[order.length - 1];
    const overflow = last.pos + last.half - max;
    if (overflow > 0) for (const n of order) n.pos -= overflow;
  }

  const out = new Array(nodes.length);
  for (const n of nodes) out[n.index] = roundedNumber(n.pos);
  return out;
}

/**
 * Direct labeling: declutter labels along one axis and draw a leader line from
 * each true anchor to its placed label. This is the 1-D core of Labella,
 * completed with leaders via the shared connector kernel — deterministic and
 * pure. It owns no scales (map data → figure coords first), no DOM, no
 * nearest-anchor matching, and no 2-D placement; those stay the host's job.
 *
 * Each `items[i]` is `{ anchor: {x, y}, size, key? }`: `anchor` is the true
 * data point in figure coordinates, `size` is the label's extent along the
 * layout `axis`. Labels declutter along `axis` ('y' = a vertical column,
 * default) and sit at the fixed `cross` coordinate on the other axis. Returns,
 * in input order, the placed label point `{x, y}`, the echoed `anchor` and
 * `key`, and the leader path `d` (anchor → label; `''` if they coincide) ready
 * for a `<path class="ui-annotation__connector">`.
 */
export function directLabels(items, opts = {}) {
  if (!Array.isArray(items)) throw new TypeError('items must be an array');
  const axis = opts.axis === 'x' ? 'x' : 'y';
  const cross = finite('cross', opts.cross, 0);
  const shape = opts.shape === 'elbow' || opts.shape === 'curve' ? opts.shape : 'straight';

  const anchors = items.map((it) => ({
    anchor: { x: finite('anchor.x', it?.anchor?.x), y: finite('anchor.y', it?.anchor?.y) },
    size: dimension('size', it?.size),
    key: it?.key,
  }));

  const placed = declutterLabels(
    anchors.map((a) => ({ pos: a.anchor[axis], size: a.size })),
    { gap: opts.gap, min: opts.min, max: opts.max },
  );

  return anchors.map((a, i) => {
    const labelPoint = axis === 'y' ? { x: cross, y: placed[i] } : { x: placed[i], y: cross };
    const d = samePoint(a.anchor, labelPoint)
      ? ''
      : connectorPath({ from: a.anchor, to: labelPoint, shape });
    return {
      x: roundedNumber(labelPoint.x),
      y: roundedNumber(labelPoint.y),
      anchor: { x: roundedNumber(a.anchor.x), y: roundedNumber(a.anchor.y) },
      key: a.key,
      d,
    };
  });
}
