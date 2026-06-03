export function finite(name: any, value: any, fallback: any): any;
export function dimension(name: any, value: any, fallback: any): any;
export function fmt(value: any): string;
export function point(x: any, y: any): string;
export function clamp(value: any, min: any, max: any): any;
/**
 * A point on a rect's edge (or centre). `rect` is `{ x, y, width, height }`.
 * @param {Rect} rect
 * @param {Side} [side]
 * @returns {Point}
 */
export function anchorPoint(rect: Rect, side?: Side): Point;
/**
 * Angle (radians) from `from` to `to`.
 * @param {Point} from
 * @param {Point} to
 * @returns {number}
 */
export function angleBetween(from: Point, to: Point): number;
/**
 * Straight line from `from` to `to`.
 * @param {Point} from
 * @param {Point} to
 * @returns {string}
 */
export function straightPath(from: Point, to: Point): string;
/**
 * Right-angle dogleg. Turns on the dominant axis at `mid` (0..1) of the span.
 * @param {Point} from
 * @param {Point} to
 * @param {{ mid?: number }} [opts]
 * @returns {string}
 */
export function elbowPath(from: Point, to: Point, opts?: {
    mid?: number;
}): string;
/**
 * Cubic curve; control points extend along the dominant axis by `curvature`.
 * @param {Point} from
 * @param {Point} to
 * @param {{ curvature?: number }} [opts]
 * @returns {string}
 */
export function curvePath(from: Point, to: Point, opts?: {
    curvature?: number;
}): string;
/**
 * Build a path between two points by `shape` (`straight` | `elbow` | `curve`).
 * @param {ConnectorPathOptions} [opts]
 * @returns {string}
 */
export function connectorPath(opts?: ConnectorPathOptions): string;
/**
 * A filled triangle arrowhead at `p`, pointing along `angle` (radians).
 * @param {Point} p
 * @param {number} angle
 * @param {number} [size]
 * @param {number} [spread] Half-angle of the head in radians (default 0.45).
 *   Smaller is crisper/sharper; must be in (0, π/2).
 * @returns {string}
 */
export function arrowHead(p: Point, angle: number, size?: number, spread?: number): string;
/**
 * A filled dot at `p`.
 * @param {Point} p
 * @param {number} [radius]
 * @returns {string}
 */
export function dotMark(p: Point, radius?: number): string;
/**
 * Pick facing edges from the rects' relative centres.
 * @param {Rect} fromRect
 * @param {Rect} toRect
 * @returns {{ from: Side, to: Side }}
 */
export function autoSides(fromRect: Rect, toRect: Rect): {
    from: Side;
    to: Side;
};
/**
 * Angle (radians) at which a `shape` path *arrives* at `to` — straight is the
 * chord; elbow/curve arrive axis-aligned along the dominant axis. Rotate an
 * end marker by this so it points along the path, not the chord.
 * @param {Point} from
 * @param {Point} to
 * @param {ConnectorShape} [shape]
 * @returns {number}
 */
export function endTangentAngle(from: Point, to: Point, shape?: ConnectorShape): number;
/**
 * Connect two rects. Resolves anchor points (explicit `fromSide`/`toSide`, else
 * auto), builds the path, and returns `{ d, from, to, angle }` so the caller can
 * place an arrowhead/dot at `to` rotated by `angle`.
 * @param {ConnectRectsOptions} [opts]
 * @returns {ConnectRectsResult}
 */
export function connectRects(opts?: ConnectRectsOptions): ConnectRectsResult;
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
export const PRECISION: 1000;
export type Point = {
    x: number;
    y: number;
};
export type Rect = {
    x: number;
    y: number;
    width: number;
    height: number;
};
export type Side = "top" | "right" | "bottom" | "left" | "center";
export type ConnectorShape = "straight" | "elbow" | "curve";
export type ConnectorPathOptions = {
    from: Point;
    to: Point;
    shape?: ConnectorShape | undefined;
    /**
     * Curve control-point reach along the dominant axis (curve shape). Default 0.5.
     */
    curvature?: number | undefined;
    /**
     * Turn position 0..1 along the span (elbow shape). Default 0.5.
     */
    mid?: number | undefined;
};
export type ConnectRectsOptions = {
    fromRect: Rect;
    toRect: Rect;
    /**
     * Anchor edges. Omit both to auto-pick facing edges from the rects.
     */
    fromSide?: Side | undefined;
    toSide?: Side | undefined;
    shape?: ConnectorShape | undefined;
    curvature?: number | undefined;
    mid?: number | undefined;
};
export type ConnectRectsResult = {
    /**
     * SVG path data.
     */
    d: string;
    from: Point;
    to: Point;
    /**
     * The path's end-tangent at `to` in radians — the direction the path arrives, so rotating an arrowhead at `to` by this points it along the path. Equals the straight `from`→`to` angle for `shape: 'straight'`; axis-aligned for `elbow`/`curve`.
     */
    angle: number;
};
//# sourceMappingURL=index.d.ts.map