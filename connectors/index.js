/**
 * @ponchia/ui/connectors — dependency-free SVG geometry for connecting two
 * elements (or two points) with a leader line.
 *
 * Pure functions only: they take points/rects and return SVG path strings (or
 * resolved coordinates). They own no DOM, no scales, and no live tracking —
 * that optional glue lives in `@ponchia/ui/behaviors` (`initConnectors`). This
 * is the page-coordinate, element-to-element cousin of the figure-coordinate
 * `@ponchia/ui/annotations` helpers.
 *
 *   import { connectRects } from '@ponchia/ui/connectors';
 *   const { d } = connectRects({ fromRect: a, toRect: b, shape: 'elbow' });
 */

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

function point(x, y) {
  return `${fmt(x)},${fmt(y)}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/** A point on a rect's edge (or centre). `rect` is `{ x, y, width, height }`. */
export function anchorPoint(rect, side = 'center') {
  const x = finite('rect.x', rect?.x, 0);
  const y = finite('rect.y', rect?.y, 0);
  const w = dimension('rect.width', rect?.width, 0);
  const h = dimension('rect.height', rect?.height, 0);
  switch (side) {
    case 'top':
      return { x: x + w / 2, y };
    case 'bottom':
      return { x: x + w / 2, y: y + h };
    case 'left':
      return { x, y: y + h / 2 };
    case 'right':
      return { x: x + w, y: y + h / 2 };
    case 'center':
    default:
      return { x: x + w / 2, y: y + h / 2 };
  }
}

/** Angle (radians) from `from` to `to`. */
export function angleBetween(from, to) {
  return Math.atan2(
    finite('to.y', to?.y) - finite('from.y', from?.y),
    finite('to.x', to?.x) - finite('from.x', from?.x),
  );
}

export function straightPath(from, to) {
  return `M${point(finite('from.x', from?.x), finite('from.y', from?.y))}L${point(
    finite('to.x', to?.x),
    finite('to.y', to?.y),
  )}`;
}

/** Right-angle dogleg. Turns on the dominant axis at `mid` (0..1) of the span. */
export function elbowPath(from, to, opts = {}) {
  const fx = finite('from.x', from?.x);
  const fy = finite('from.y', from?.y);
  const tx = finite('to.x', to?.x);
  const ty = finite('to.y', to?.y);
  const mid = clamp(finite('mid', opts.mid, 0.5), 0, 1);
  const dx = tx - fx;
  const dy = ty - fy;
  if (Math.abs(dx) >= Math.abs(dy)) {
    const mx = fx + dx * mid;
    return `M${point(fx, fy)}H${fmt(mx)}V${fmt(ty)}H${fmt(tx)}`;
  }
  const my = fy + dy * mid;
  return `M${point(fx, fy)}V${fmt(my)}H${fmt(tx)}V${fmt(ty)}`;
}

/** Cubic curve; control points extend along the dominant axis by `curvature`. */
export function curvePath(from, to, opts = {}) {
  const fx = finite('from.x', from?.x);
  const fy = finite('from.y', from?.y);
  const tx = finite('to.x', to?.x);
  const ty = finite('to.y', to?.y);
  const k = finite('curvature', opts.curvature, 0.5);
  const dx = tx - fx;
  const dy = ty - fy;
  const horizontal = Math.abs(dx) >= Math.abs(dy);
  const c1 = horizontal ? { x: fx + dx * k, y: fy } : { x: fx, y: fy + dy * k };
  const c2 = horizontal ? { x: tx - dx * k, y: ty } : { x: tx, y: ty - dy * k };
  return `M${point(fx, fy)}C${point(c1.x, c1.y)} ${point(c2.x, c2.y)} ${point(tx, ty)}`;
}

/** Build a path between two points by `shape` (`straight` | `elbow` | `curve`). */
export function connectorPath(opts = {}) {
  const { from, to, shape = 'straight' } = opts;
  if (shape === 'elbow') return elbowPath(from, to, opts);
  if (shape === 'curve') return curvePath(from, to, opts);
  return straightPath(from, to);
}

/** A filled triangle arrowhead at `p`, pointing along `angle` (radians). */
export function arrowHead(p, angle, size = 8) {
  const px = finite('p.x', p?.x);
  const py = finite('p.y', p?.y);
  const a = finite('angle', angle, 0);
  const s = dimension('size', size, 8);
  const back = a + Math.PI;
  const spread = 0.45;
  const p1 = { x: px + Math.cos(back - spread) * s, y: py + Math.sin(back - spread) * s };
  const p2 = { x: px + Math.cos(back + spread) * s, y: py + Math.sin(back + spread) * s };
  return `M${point(px, py)}L${point(p1.x, p1.y)}L${point(p2.x, p2.y)}Z`;
}

/** A filled dot at `p`. */
export function dotMark(p, radius = 3) {
  const px = finite('p.x', p?.x);
  const py = finite('p.y', p?.y);
  const r = dimension('radius', radius, 3);
  if (r === 0) return '';
  return `M${point(px, py - r)}A${fmt(r)},${fmt(r)} 0 1 1 ${point(px, py + r)}A${fmt(r)},${fmt(
    r,
  )} 0 1 1 ${point(px, py - r)}Z`;
}

/** Pick facing edges from the rects' relative centres. */
export function autoSides(fromRect, toRect) {
  const fc = anchorPoint(fromRect, 'center');
  const tc = anchorPoint(toRect, 'center');
  const dx = tc.x - fc.x;
  const dy = tc.y - fc.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? { from: 'right', to: 'left' } : { from: 'left', to: 'right' };
  }
  return dy >= 0 ? { from: 'bottom', to: 'top' } : { from: 'top', to: 'bottom' };
}

/**
 * Connect two rects. Resolves anchor points (explicit `fromSide`/`toSide`, else
 * auto), builds the path, and returns `{ d, from, to, angle }` so the caller can
 * place an arrowhead/dot at `to` rotated by `angle`.
 */
/** Angle (radians) at which a `shape` path *arrives* at `to` — straight is the
 *  chord; elbow/curve arrive axis-aligned along the dominant axis. Rotate an
 *  end marker by this so it points along the path, not the chord. */
export function endTangentAngle(from, to, shape = 'straight') {
  if (shape === 'straight') return angleBetween(from, to);
  const dx = finite('to.x', to?.x) - finite('from.x', from?.x);
  const dy = finite('to.y', to?.y) - finite('from.y', from?.y);
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 0 : Math.PI;
  return dy >= 0 ? Math.PI / 2 : -Math.PI / 2;
}

export function connectRects(opts = {}) {
  const { fromRect, toRect, shape = 'straight', curvature, mid } = opts;
  // Honor each side override independently; auto-pick whichever is unset.
  const auto = autoSides(fromRect, toRect);
  const sides = { from: opts.fromSide || auto.from, to: opts.toSide || auto.to };
  const from = anchorPoint(fromRect, sides.from);
  const to = anchorPoint(toRect, sides.to);
  const d = connectorPath({ from, to, shape, curvature, mid });
  return { d, from, to, angle: endTangentAngle(from, to, shape) };
}
