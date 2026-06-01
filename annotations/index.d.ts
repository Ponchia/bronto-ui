/** @ponchia/ui — SVG annotation geometry helpers. */

export interface AnnotationPoint {
  x: number;
  y: number;
}

export interface AnnotationOffset {
  dx: number;
  dy: number;
}

export type AnnotationConnectorType = 'callout' | 'elbow' | 'curve';
export type AnnotationAlign = 'start' | 'middle' | 'end';
export type AnnotationValign = 'top' | 'middle' | 'bottom';
export type AxisOrientation = 'horizontal' | 'vertical';
export type TimelineDirection = 'up' | 'down' | 'left' | 'right';

export interface CircleSubject {
  type: 'circle';
  radius: number;
  radiusPadding?: number;
}

export interface RectSubject {
  type: 'rect';
  width: number;
  height: number;
  x?: number;
  y?: number;
  padding?: number;
}

export type ConnectorSubject = CircleSubject | RectSubject;

export interface ConnectorOptions extends AnnotationOffset {
  subject?: ConnectorSubject;
}

export interface CircleSubjectOptions {
  radius: number;
}

export interface RectSubjectOptions {
  width: number;
  height: number;
  x?: number;
  y?: number;
  padding?: number;
}

export interface ThresholdOptions {
  x1?: number;
  y1?: number;
  x2: number;
  y2: number;
}

export interface AxisThresholdOptions {
  orientation?: AxisOrientation;
  value?: number;
  start?: number;
  end: number;
}

export interface BracketSubjectOptions {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  depth?: number;
}

export interface BandSubjectOptions {
  x?: number;
  y?: number;
  width: number;
  height: number;
  padding?: number;
}

export interface SlopeSubjectOptions {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface ComparisonBraceOptions {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  depth?: number;
}

export interface OutlierClusterOptions {
  points: AnnotationPoint[];
  radius?: number;
}

export interface TimelineEventOptions {
  size?: number;
  direction?: TimelineDirection;
}

export interface EvidenceMarkerOptions {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  padding?: number;
}

export interface ConnectorEndDotOptions extends AnnotationPoint {
  radius?: number;
}

export interface ConnectorEndArrowOptions {
  x1?: number;
  y1?: number;
  x2: number;
  y2: number;
  size?: number;
}

export interface NoteTransformOptions {
  dx?: number;
  dy?: number;
  x?: number;
  y?: number;
  align?: AnnotationAlign;
  valign?: AnnotationValign;
  width?: number;
  height?: number;
}

export interface AnnotationBounds {
  x?: number;
  y?: number;
  width: number;
  height: number;
}

export interface NotePlacementOptions {
  x?: number;
  y?: number;
  width: number;
  height: number;
  bounds: AnnotationBounds;
  padding?: number;
  gap?: number;
  preferred?: 'right' | 'left' | 'top' | 'bottom';
}

export interface NotePlacement {
  dx: number;
  dy: number;
  align: AnnotationAlign;
  valign: AnnotationValign;
  transform: string;
}

export type AnnotationPartsSubject =
  | CircleSubject
  | RectSubject
  | ({ type: 'threshold' } & ThresholdOptions)
  | ({ type: 'bracket' } & BracketSubjectOptions)
  | ({ type: 'band' } & BandSubjectOptions)
  | ({ type: 'slope' } & SlopeSubjectOptions)
  | ({ type: 'compare' } & ComparisonBraceOptions)
  | ({ type: 'cluster' } & OutlierClusterOptions)
  | ({ type: 'axis' } & AxisThresholdOptions)
  | ({ type: 'timeline' } & TimelineEventOptions)
  | ({ type: 'evidence' } & EvidenceMarkerOptions);

export interface AnnotationPartsOptions {
  type?: AnnotationConnectorType;
  x?: number;
  y?: number;
  dx?: number;
  dy?: number;
  subject?: AnnotationPartsSubject;
}

export interface AnnotationParts {
  transform: string;
  subject: string;
  connector: string;
  note: string;
}

export declare function annotationTransform(point?: Partial<AnnotationPoint>): string;
export declare function noteTransform(options?: NoteTransformOptions): string;
export declare function notePlacement(options: NotePlacementOptions): NotePlacement;
export declare function circleSubjectPath(options: CircleSubjectOptions): string;
export declare function rectSubjectPath(options: RectSubjectOptions): string;
export declare function thresholdPath(options: ThresholdOptions): string;
export declare function axisThresholdPath(options: AxisThresholdOptions): string;
export declare function bracketSubjectPath(options: BracketSubjectOptions): string;
export declare function bandSubjectPath(options: BandSubjectOptions): string;
export declare function slopeSubjectPath(options: SlopeSubjectOptions): string;
export declare function comparisonBracePath(options: ComparisonBraceOptions): string;
export declare function outlierClusterPath(options: OutlierClusterOptions): string;
export declare function timelineEventPath(options?: TimelineEventOptions): string;
export declare function evidenceMarkerPath(options?: EvidenceMarkerOptions): string;
export declare function connectorEndDot(options: ConnectorEndDotOptions): string;
export declare function connectorEndArrow(options: ConnectorEndArrowOptions): string;
export declare function connectorLine(options: ConnectorOptions): string;
export declare function connectorElbow(options: ConnectorOptions): string;
export declare function connectorCurve(options: ConnectorOptions): string;
export declare function annotationParts(options?: AnnotationPartsOptions): AnnotationParts;

export interface DeclutterLabelItem {
  /** Desired centre coordinate along the axis. */
  pos: number;
  /** The label's extent along the axis. */
  size: number;
}
export interface DeclutterLabelsOptions {
  /** Minimum gap kept between adjacent labels. Default 0. */
  gap?: number;
  /** Lower bound of the axis. Default -Infinity. */
  min?: number;
  /** Upper bound of the axis. Default Infinity. */
  max?: number;
}
/**
 * 1-D label declutter: nudge overlapping labels apart, order-preserving and
 * deterministic. Returns the adjusted centre per input item (input order). Not
 * a general 2-D collision solver.
 */
export declare function declutterLabels(
  items: DeclutterLabelItem[],
  opts?: DeclutterLabelsOptions,
): number[];
