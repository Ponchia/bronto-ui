/**
 * @ponchia/ui/connectors — dependency-free SVG geometry for leader lines.
 * Pure functions: points/rects in, SVG path strings (or coordinates) out.
 */

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type Side = 'top' | 'right' | 'bottom' | 'left' | 'center';
export type ConnectorShape = 'straight' | 'elbow' | 'curve';

export interface ConnectorPathOptions {
  from: Point;
  to: Point;
  shape?: ConnectorShape;
  /** Curve control-point reach along the dominant axis (curve shape). Default 0.5. */
  curvature?: number;
  /** Turn position 0..1 along the span (elbow shape). Default 0.5. */
  mid?: number;
}

export interface ConnectRectsOptions {
  fromRect: Rect;
  toRect: Rect;
  /** Anchor edges. Omit both to auto-pick facing edges from the rects. */
  fromSide?: Side;
  toSide?: Side;
  shape?: ConnectorShape;
  curvature?: number;
  mid?: number;
}

export interface ConnectRectsResult {
  /** SVG path data. */
  d: string;
  from: Point;
  to: Point;
  /**
   * The path's **end-tangent** at `to` in radians (`endTangentAngle(from, to,
   * shape)`) — the direction the path arrives, so rotating an arrowhead at `to`
   * by this points it along the path. Equals the straight `from`→`to` angle for
   * `shape: 'straight'`; axis-aligned for `elbow`/`curve`.
   */
  angle: number;
}

export declare function anchorPoint(rect: Rect, side?: Side): Point;
export declare function angleBetween(from: Point, to: Point): number;
export declare function straightPath(from: Point, to: Point): string;
export declare function elbowPath(from: Point, to: Point, opts?: { mid?: number }): string;
export declare function curvePath(from: Point, to: Point, opts?: { curvature?: number }): string;
export declare function connectorPath(opts: ConnectorPathOptions): string;
export declare function arrowHead(p: Point, angle: number, size?: number): string;
export declare function dotMark(p: Point, radius?: number): string;
export declare function autoSides(
  fromRect: Rect,
  toRect: Rect,
): { from: Side; to: Side };
/** Angle (radians) at which a `shape` path arrives at `to` — the chord for
 *  `straight`, axis-aligned for `elbow`/`curve`. Use it to rotate an end marker. */
export declare function endTangentAngle(from: Point, to: Point, shape?: ConnectorShape): number;
export declare function connectRects(opts: ConnectRectsOptions): ConnectRectsResult;
