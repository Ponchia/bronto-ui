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
 *
 * The public types below are JSDoc `@typedef`s; the shipped `index.d.ts` is
 * generated from them (and these signatures) by `tsc --emitDeclarationOnly`.
 *
 * @typedef {{ x: number, y: number }} Point
 * @typedef {{ x: number, y: number, width: number, height: number }} Rect
 * @typedef {'top' | 'right' | 'bottom' | 'left' | 'center'} Side
 * @typedef {'straight' | 'elbow' | 'curve'} ConnectorShape
 *
 * @typedef {object} ConnectorPathOptions
 * @property {Point} from
 * @property {Point} to
 * @property {ConnectorShape} [shape]
 * @property {number} [curvature] Curve control-point reach along the dominant axis (curve shape). Default 0.5.
 * @property {number} [mid] Turn position 0..1 along the span (elbow shape). Default 0.5.
 *
 * @typedef {object} ConnectRectsOptions
 * @property {Rect} fromRect
 * @property {Rect} toRect
 * @property {Side} [fromSide] Anchor edges. Omit both to auto-pick facing edges from the rects.
 * @property {Side} [toSide]
 * @property {ConnectorShape} [shape]
 * @property {number} [curvature]
 * @property {number} [mid]
 *
 * @typedef {object} ConnectRectsResult
 * @property {string} d SVG path data.
 * @property {Point} from
 * @property {Point} to
 * @property {number} angle The path's end-tangent at `to` in radians — the direction the path arrives, so rotating an arrowhead at `to` by this points it along the path. Equals the straight `from`→`to` angle for `shape: 'straight'`; axis-aligned for `elbow`/`curve`.
 */

// Shared scalar/geometry primitives. Exported so the annotations layer composes
// on the SAME kernel instead of copy-pasting it (the copies had silently
// diverged — see `clamp`). Low-level helpers; the documented API is the path
// builders below.
export const PRECISION = 1000;

export function finite(name, value, fallback) {
  const v = value ?? fallback;
  if (!Number.isFinite(v)) throw new TypeError(`${name} must be a finite number`);
  return v;
}

export function dimension(name, value, fallback) {
  const v = finite(name, value, fallback);
  if (v < 0) throw new RangeError(`${name} must be greater than or equal to 0`);
  return v;
}

export function fmt(value) {
  const rounded = Math.round((Object.is(value, -0) ? 0 : value) * PRECISION) / PRECISION;
  return String(Object.is(rounded, -0) ? 0 : rounded);
}

export function point(x, y) {
  return `${fmt(x)},${fmt(y)}`;
}

// Guarded form (returns min when the range is inverted) — the reconciled body;
// connectors only ever calls clamp(v, 0, 1) so this is output-identical here.
export function clamp(value, min, max) {
  if (max < min) return min;
  return Math.min(max, Math.max(min, value));
}

/**
 * A point on a rect's edge (or centre). `rect` is `{ x, y, width, height }`.
 * @param {Rect} rect
 * @param {Side} [side]
 * @returns {Point}
 */
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

/**
 * Angle (radians) from `from` to `to`.
 * @param {Point} from
 * @param {Point} to
 * @returns {number}
 */
export function angleBetween(from, to) {
  return Math.atan2(
    finite('to.y', to?.y) - finite('from.y', from?.y),
    finite('to.x', to?.x) - finite('from.x', from?.x),
  );
}

/**
 * Straight line from `from` to `to`.
 * @param {Point} from
 * @param {Point} to
 * @returns {string}
 */
export function straightPath(from, to) {
  return `M${point(finite('from.x', from?.x), finite('from.y', from?.y))}L${point(
    finite('to.x', to?.x),
    finite('to.y', to?.y),
  )}`;
}

/**
 * Right-angle dogleg. Turns on the dominant axis at `mid` (0..1) of the span.
 * @param {Point} from
 * @param {Point} to
 * @param {{ mid?: number }} [opts]
 * @returns {string}
 */
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

/**
 * Cubic curve; control points extend along the dominant axis by `curvature`.
 * @param {Point} from
 * @param {Point} to
 * @param {{ curvature?: number }} [opts]
 * @returns {string}
 */
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

/**
 * Build a path between two points by `shape` (`straight` | `elbow` | `curve`).
 * @param {ConnectorPathOptions} [opts]
 * @returns {string}
 */
export function connectorPath(opts = {}) {
  const { from, to, shape = 'straight' } = opts;
  if (shape === 'elbow') return elbowPath(from, to, opts);
  if (shape === 'curve') return curvePath(from, to, opts);
  return straightPath(from, to);
}

/**
 * A filled triangle arrowhead at `p`, pointing along `angle` (radians).
 * @param {Point} p
 * @param {number} angle
 * @param {number} [size]
 * @param {number} [spread] Half-angle of the head in radians (default 0.45).
 *   Smaller is crisper/sharper; must be in (0, π/2).
 * @returns {string}
 */
export function arrowHead(p, angle, size = 8, spread = 0.45) {
  const px = finite('p.x', p?.x);
  const py = finite('p.y', p?.y);
  const a = finite('angle', angle, 0);
  const s = dimension('size', size, 8);
  const sp = finite('spread', spread, 0.45);
  if (sp <= 0 || sp >= Math.PI / 2) throw new RangeError('spread must be in (0, π/2)');
  const back = a + Math.PI;
  const p1 = { x: px + Math.cos(back - sp) * s, y: py + Math.sin(back - sp) * s };
  const p2 = { x: px + Math.cos(back + sp) * s, y: py + Math.sin(back + sp) * s };
  return `M${point(px, py)}L${point(p1.x, p1.y)}L${point(p2.x, p2.y)}Z`;
}

/**
 * A filled dot at `p`.
 * @param {Point} p
 * @param {number} [radius]
 * @returns {string}
 */
export function dotMark(p, radius = 3) {
  const px = finite('p.x', p?.x);
  const py = finite('p.y', p?.y);
  const r = dimension('radius', radius, 3);
  if (r === 0) return '';
  return `M${point(px, py - r)}A${fmt(r)},${fmt(r)} 0 1 1 ${point(px, py + r)}A${fmt(r)},${fmt(
    r,
  )} 0 1 1 ${point(px, py - r)}Z`;
}

/**
 * Pick facing edges from the rects' relative centres.
 * @param {Rect} fromRect
 * @param {Rect} toRect
 * @returns {{ from: Side, to: Side }}
 */
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
 * Angle (radians) at which a `shape` path *arrives* at `to` — straight is the
 * chord; elbow/curve arrive axis-aligned along the dominant axis. Rotate an
 * end marker by this so it points along the path, not the chord.
 * @param {Point} from
 * @param {Point} to
 * @param {ConnectorShape} [shape]
 * @returns {number}
 */
export function endTangentAngle(from, to, shape = 'straight') {
  if (shape === 'straight') return angleBetween(from, to);
  const dx = finite('to.x', to?.x) - finite('from.x', from?.x);
  const dy = finite('to.y', to?.y) - finite('from.y', from?.y);
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 0 : Math.PI;
  return dy >= 0 ? Math.PI / 2 : -Math.PI / 2;
}

/**
 * Connect two rects. Resolves anchor points (explicit `fromSide`/`toSide`, else
 * auto), builds the path, and returns `{ d, from, to, angle }` so the caller can
 * place an arrowhead/dot at `to` rotated by `angle`.
 * @param {ConnectRectsOptions} [opts]
 * @returns {ConnectRectsResult}
 */
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
