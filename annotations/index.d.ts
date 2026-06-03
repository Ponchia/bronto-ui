/**
 * @param {Partial<AnnotationPoint>} [point]
 * @returns {string}
 */
export function annotationTransform({ x, y }?: Partial<AnnotationPoint>): string;
/**
 * @param {NoteTransformOptions} [options]
 * @returns {string}
 */
export function noteTransform({ dx, dy, x, y, align, valign, width, height, }?: NoteTransformOptions): string;
/**
 * @param {NotePlacementOptions} options
 * @returns {NotePlacement}
 */
export function notePlacement({ x, y, width, height, bounds, padding, gap, preferred, inset, }?: NotePlacementOptions): NotePlacement;
/**
 * @param {CircleSubjectOptions} options
 * @returns {string}
 */
export function circleSubjectPath({ radius }?: CircleSubjectOptions): string;
/**
 * @param {RectSubjectOptions} options
 * @returns {string}
 */
export function rectSubjectPath({ width, height, x, y, padding }?: RectSubjectOptions): string;
/**
 * @param {ThresholdOptions} options
 * @returns {string}
 */
export function thresholdPath({ x1, y1, x2, y2 }?: ThresholdOptions): string;
/**
 * @param {AxisThresholdOptions} options
 * @returns {string}
 */
export function axisThresholdPath({ orientation, value, start, end }?: AxisThresholdOptions): string;
/**
 * @param {BracketSubjectOptions} options
 * @returns {string}
 */
export function bracketSubjectPath({ x1, y1, x2, y2, depth }?: BracketSubjectOptions): string;
/**
 * @param {BandSubjectOptions} options
 * @returns {string}
 */
export function bandSubjectPath({ x, y, width, height, padding }?: BandSubjectOptions): string;
/**
 * @param {SlopeSubjectOptions} options
 * @returns {string}
 */
export function slopeSubjectPath({ x1, y1, x2, y2 }?: SlopeSubjectOptions): string;
/**
 * @param {ComparisonBraceOptions} options
 * @returns {string}
 */
export function comparisonBracePath({ x1, y1, x2, y2, depth }?: ComparisonBraceOptions): string;
/**
 * @param {OutlierClusterOptions} options
 * @returns {string}
 */
export function outlierClusterPath({ points, radius }?: OutlierClusterOptions): string;
/**
 * @param {TimelineEventOptions} [options]
 * @returns {string}
 */
export function timelineEventPath({ size, direction }?: TimelineEventOptions): string;
/**
 * @param {EvidenceMarkerOptions} [options]
 * @returns {string}
 */
export function evidenceMarkerPath({ x, y, width, height, padding }?: EvidenceMarkerOptions): string;
/**
 * @param {ConnectorEndDotOptions} options
 * @returns {string}
 */
export function connectorEndDot({ x, y, radius }?: ConnectorEndDotOptions): string;
/**
 * @param {ConnectorEndArrowOptions} options
 * @returns {string}
 */
export function connectorEndArrow({ x1, y1, x2, y2, size, spread }?: ConnectorEndArrowOptions): string;
/**
 * @param {ConnectorOptions} opts
 * @returns {string}
 */
export function connectorLine(opts?: ConnectorOptions): string;
/**
 * @param {ConnectorOptions} opts
 * @returns {string}
 */
export function connectorElbow(opts?: ConnectorOptions): string;
/**
 * @param {ConnectorOptions} opts
 * @returns {string}
 */
export function connectorCurve(opts?: ConnectorOptions): string;
/**
 * @param {AnnotationPartsOptions} [opts]
 * @returns {AnnotationParts}
 */
export function annotationParts(opts?: AnnotationPartsOptions): AnnotationParts;
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
 *
 * @param {DeclutterLabelItem[]} items
 * @param {DeclutterLabelsOptions} [opts]
 * @returns {number[]}
 */
export function declutterLabels(items: DeclutterLabelItem[], opts?: DeclutterLabelsOptions): number[];
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
 *
 * @param {DirectLabelItem[]} items
 * @param {DirectLabelsOptions} [opts]
 * @returns {DirectLabel[]}
 */
export function directLabels(items: DirectLabelItem[], opts?: DirectLabelsOptions): DirectLabel[];
export type AnnotationPoint = {
    x: number;
    y: number;
};
export type AnnotationOffset = {
    dx: number;
    dy: number;
};
export type AnnotationConnectorType = "callout" | "elbow" | "curve";
export type AnnotationAlign = "start" | "middle" | "end";
export type AnnotationValign = "top" | "middle" | "bottom";
export type AxisOrientation = "horizontal" | "vertical";
export type TimelineDirection = "up" | "down" | "left" | "right";
export type CircleSubject = {
    type: "circle";
    radius: number;
    radiusPadding?: number | undefined;
};
export type RectSubject = {
    type: "rect";
    width: number;
    height: number;
    x?: number | undefined;
    y?: number | undefined;
    padding?: number | undefined;
};
export type ConnectorSubject = CircleSubject | RectSubject;
export type ConnectorOptions = AnnotationOffset & {
    subject?: ConnectorSubject;
    mid?: number;
};
export type CircleSubjectOptions = {
    radius: number;
};
export type RectSubjectOptions = {
    width: number;
    height: number;
    x?: number | undefined;
    y?: number | undefined;
    padding?: number | undefined;
};
export type ThresholdOptions = {
    x1?: number | undefined;
    y1?: number | undefined;
    x2: number;
    y2: number;
};
export type AxisThresholdOptions = {
    orientation?: AxisOrientation | undefined;
    value?: number | undefined;
    start?: number | undefined;
    end: number;
};
export type BracketSubjectOptions = {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    depth?: number | undefined;
};
export type BandSubjectOptions = {
    x?: number | undefined;
    y?: number | undefined;
    width: number;
    height: number;
    padding?: number | undefined;
};
export type SlopeSubjectOptions = {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
};
export type ComparisonBraceOptions = {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    depth?: number | undefined;
};
export type OutlierClusterOptions = {
    points: AnnotationPoint[];
    radius?: number | undefined;
};
export type TimelineEventOptions = {
    size?: number | undefined;
    direction?: TimelineDirection | undefined;
};
export type EvidenceMarkerOptions = {
    x?: number | undefined;
    y?: number | undefined;
    width?: number | undefined;
    height?: number | undefined;
    padding?: number | undefined;
};
export type ConnectorEndDotOptions = AnnotationPoint & {
    radius?: number;
};
export type ConnectorEndArrowOptions = {
    x1?: number | undefined;
    y1?: number | undefined;
    x2: number;
    y2: number;
    size?: number | undefined;
    /**
     * Half-angle of the arrowhead in radians (default
     * 0.32 ≈ a crisp 37° included angle). Larger = blunter.
     */
    spread?: number | undefined;
};
export type NoteTransformOptions = {
    dx?: number | undefined;
    dy?: number | undefined;
    x?: number | undefined;
    y?: number | undefined;
    align?: AnnotationAlign | undefined;
    valign?: AnnotationValign | undefined;
    width?: number | undefined;
    height?: number | undefined;
};
export type AnnotationBounds = {
    x?: number | undefined;
    y?: number | undefined;
    width: number;
    height: number;
};
export type NotePlacementOptions = {
    x?: number | undefined;
    y?: number | undefined;
    width: number;
    height: number;
    bounds: AnnotationBounds;
    padding?: number | undefined;
    gap?: number | undefined;
    preferred?: "top" | "right" | "bottom" | "left" | undefined;
    /**
     * Extra margin (user units) the note must keep from
     * the bounds edge, on top of `padding`. Reserve the note's title stroke-halo
     * (~3) or a leader stub so a placement that "fits" doesn't clip. Default 0.
     */
    inset?: number | undefined;
};
export type NotePlacement = {
    dx: number;
    dy: number;
    align: AnnotationAlign;
    valign: AnnotationValign;
    transform: string;
};
export type AnnotationPartsSubject = (CircleSubject | RectSubject | ({
    type: "threshold";
} & ThresholdOptions) | ({
    type: "bracket";
} & BracketSubjectOptions) | ({
    type: "band";
} & BandSubjectOptions) | ({
    type: "slope";
} & SlopeSubjectOptions) | ({
    type: "compare";
} & ComparisonBraceOptions) | ({
    type: "cluster";
} & OutlierClusterOptions) | ({
    type: "axis";
} & AxisThresholdOptions) | ({
    type: "timeline";
} & TimelineEventOptions) | ({
    type: "evidence";
} & EvidenceMarkerOptions));
export type AnnotationPartsOptions = {
    type?: AnnotationConnectorType | undefined;
    x?: number | undefined;
    y?: number | undefined;
    dx?: number | undefined;
    dy?: number | undefined;
    subject?: AnnotationPartsSubject | undefined;
};
export type AnnotationParts = {
    transform: string;
    subject: string;
    connector: string;
    note: string;
};
export type DeclutterLabelItem = {
    /**
     * Desired centre coordinate along the axis.
     */
    pos: number;
    /**
     * The label's extent along the axis.
     */
    size: number;
};
export type DeclutterLabelsOptions = {
    /**
     * Minimum gap kept between adjacent labels. Default 0.
     */
    gap?: number | undefined;
    /**
     * Lower bound of the axis. Default -Infinity.
     */
    min?: number | undefined;
    /**
     * Upper bound of the axis. Default Infinity.
     */
    max?: number | undefined;
};
export type DirectLabelItem = {
    /**
     * The true data point the label refers to (figure coordinates).
     */
    anchor: AnnotationPoint;
    /**
     * The label's extent along the layout axis.
     */
    size: number;
    /**
     * Optional identifier, echoed back on the matching output (input order).
     */
    key?: string | number | undefined;
};
export type DirectLabelsOptions = {
    /**
     * Axis the labels declutter along. 'y' = a vertical column. Default 'y'.
     */
    axis?: "x" | "y" | undefined;
    /**
     * Fixed coordinate on the other axis where the label column/row sits. Default 0.
     */
    cross?: number | undefined;
    /**
     * Minimum gap kept between adjacent labels. Default 0.
     */
    gap?: number | undefined;
    /**
     * Lower bound of the layout axis. Default -Infinity.
     */
    min?: number | undefined;
    /**
     * Upper bound of the layout axis. Default Infinity.
     */
    max?: number | undefined;
    /**
     * Leader-line shape. Default 'straight'.
     */
    shape?: "straight" | "elbow" | "curve" | undefined;
};
export type DirectLabel = {
    /**
     * Placed label point — the leader's label-side end.
     */
    x: number;
    y: number;
    /**
     * The echoed input anchor.
     */
    anchor: AnnotationPoint;
    /**
     * The echoed input key, if any.
     */
    key?: string | number | undefined;
    /**
     * SVG path for the leader (anchor → label point); '' if they coincide.
     */
    d: string;
};
//# sourceMappingURL=index.d.ts.map