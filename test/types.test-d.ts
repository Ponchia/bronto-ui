/**
 * Type-only gate (compiled by `npm run check:types`, never executed).
 * Proves the published .d.ts are sound *and* that the generated literal
 * `cls` / token types actually reject typos — the concrete payoff of
 * making the declarations generated-from-source. A regression here is a
 * consumer-facing break, so it blocks `npm run check`.
 */
import { cls, ui, cx, type ClassValue } from '../classes/index.js';
import tokens, { themeColor, cssVars, type ThemeName } from '../tokens/index.js';
import {
  initThemeToggle,
  initDialog,
  initDotGlyph,
  toast,
  type Cleanup,
} from '../behaviors/index.js';
import {
  renderGlyph,
  glyphCells,
  glyph,
  GLYPH_SIZE,
  GLYPH_NAMES,
  type GlyphName,
  type GlyphCell,
} from '../glyphs/glyphs.js';
import { skins, SKIN_NAMES, type SkinName } from '../tokens/skins.js';
import { charts, type ChartTokenName } from '../tokens/charts.js';
import {
  connectRects,
  connectorPath,
  arrowHead,
  anchorPoint,
  type ConnectRectsResult,
  type Side,
} from '../connectors/index.js';
import {
  annotationParts,
  annotationTransform,
  axisThresholdPath,
  declutterLabels,
  directLabels,
  bandSubjectPath,
  bracketSubjectPath,
  circleSubjectPath,
  comparisonBracePath,
  connectorEndArrow,
  connectorEndDot,
  connectorCurve,
  connectorElbow,
  connectorLine,
  evidenceMarkerPath,
  notePlacement,
  noteTransform,
  outlierClusterPath,
  rectSubjectPath,
  slopeSubjectPath,
  thresholdPath,
  timelineEventPath,
  type AnnotationPartsOptions,
  type ConnectorOptions,
} from '../annotations/index.js';

// cls values are literal, not widened to `string`.
const btn: 'ui-button' = cls.button;
const appShell: 'ui-app-shell' = cls.appShell;
const tt: 'ui-themetoggle__button' = cls.themetoggleButton;
const report: 'ui-report' = cls.report;
const reportSection: 'ui-report__section' = cls.reportSection;
const reportSectionUnnumbered: 'ui-report__section--unnumbered' = cls.reportSectionUnnumbered;
const chart: 'ui-chart' = cls.chart;
const chartPlot: 'ui-chart__plot' = cls.chartPlot;
const chartFill: 'ui-chart__fill' = cls.chartFill;
const annotation: 'ui-annotation' = cls.annotation;
const annotationConnector: 'ui-annotation__connector' = cls.annotationConnector;
const printOnly: 'ui-print-only' = cls.printOnly;

// @ts-expect-error — unknown cls key is now a compile error (was `string`).
cls.definitelyNotAKey;

// Recipes return strings; options are typed unions.
const a: string = ui.button({ variant: 'ghost' });
const b: string = ui.tab({ active: true });
const ann: string = ui.annotation({ variant: 'curve', tone: 'warning' });
const annMotion: string = ui.annotation({ variant: 'bracket', tone: 'info', motion: 'draw' });
// @ts-expect-error — invalid variant rejected.
ui.button({ variant: 'nope' });
// @ts-expect-error — invalid annotation tone rejected.
ui.annotation({ tone: 'loud' });
// @ts-expect-error — invalid annotation motion rejected.
ui.annotation({ motion: 'blink' });

const leg: string = ui.legend({ type: 'gradient', diverging: true });
const legItem: string = ui.legendItem({ inactive: true });
const legSwatch: string = ui.legendSwatch({ series: 3, shape: 'circle' });
// @ts-expect-error — invalid legend type rejected.
ui.legend({ type: 'pie' });
// @ts-expect-error — series is the 1–8 categorical union, not an arbitrary number.
ui.legendSwatch({ series: 9 });
// @ts-expect-error — invalid swatch shape rejected.
ui.legendSwatch({ shape: 'star' });

const mk: string = ui.mark({ style: 'underline', tone: 'accent', motion: 'draw' });
const bn: string = ui.bracketNote({ tone: 'warning' });
// @ts-expect-error — invalid mark style rejected.
ui.mark({ style: 'wavy' });
// @ts-expect-error — the old 'evidence' tone was renamed to 'accent' (0.5.0).
ui.mark({ tone: 'evidence' });
// @ts-expect-error — bracket-note tone is a closed union (no 'success').
ui.bracketNote({ tone: 'success' });

const conn: string = ui.connector({ tone: 'accent', dashed: true, motion: 'draw' });
const spot: string = ui.spotlight({ ring: true });
// @ts-expect-error — connector motion is only 'draw'.
ui.connector({ motion: 'pulse' });

const xh: string = ui.crosshair({ muted: true });
const selOn: string = ui.sel({ state: 'on' });
void [xh, selOn];
// @ts-expect-error — selection state is a closed union.
ui.sel({ state: 'highlighted' });

const cite: string = ui.citation({ chip: true, state: 'verified' });
const src: string = ui.source({ state: 'generated' });
const prov: string = ui.provenance({ state: 'reviewed' });
void [cite, src, prov];
// @ts-expect-error — trust state is a closed union.
ui.source({ state: 'trustworthy' });

// Connectors geometry: object-shaped options, string/coordinate returns.
const connOut: ConnectRectsResult = connectRects({
  fromRect: { x: 0, y: 0, width: 20, height: 20 },
  toRect: { x: 80, y: 40, width: 20, height: 20 },
  shape: 'curve',
});
const connD: string = connOut.d;
const connAngle: number = connOut.angle;
const head: string = arrowHead(connOut.to, connOut.angle);
const pathStr: string = connectorPath({
  from: { x: 0, y: 0 },
  to: { x: 10, y: 10 },
  shape: 'elbow',
});
const side: Side = 'right';
const anchor = anchorPoint({ x: 0, y: 0, width: 10, height: 10 }, side);
const anchorX: number = anchor.x;
// @ts-expect-error — shape is a closed union.
connectorPath({ from: { x: 0, y: 0 }, to: { x: 1, y: 1 }, shape: 'zigzag' });
void [connD, connAngle, head, pathStr, anchorX];

const labelPositions: number[] = declutterLabels(
  [
    { pos: 10, size: 8 },
    { pos: 12, size: 8 },
  ],
  { gap: 2, min: 0, max: 100 },
);
void labelPositions;

const directLabeled = directLabels(
  [
    { anchor: { x: 10, y: 50 }, size: 20, key: 'a' },
    { anchor: { x: 30, y: 55 }, size: 20 },
  ],
  { axis: 'y', cross: 100, gap: 4, shape: 'curve' },
);
const leaderPath: string = directLabeled[0].d;
const placedY: number = directLabeled[0].y;
void leaderPath;
void placedY;

const parts: ClassValue = ['a', false, ['b'], null];
const joined: string = cx(parts, 'extra', undefined);

// themeColor is ThemeName-typed; keys stay kebab-case.
const dark = themeColor('dark');
const soft: string = dark['accent-soft'];
const th: ThemeName = 'light';
// @ts-expect-error — arbitrary string is not a ThemeName.
themeColor('drak');

const accentVar: string = cssVars.light['--accent'];
// @ts-expect-error — unknown token name rejected by the literal union.
cssVars.light['--not-a-token'];
const scaleMd: string = tokens.scale['space-md'];

// Behaviors: every initializer returns a Cleanup.
const stop: Cleanup = initThemeToggle();
const stopDlg: Cleanup = initDialog({ root: document });
const dismiss: Cleanup = toast('hi', { tone: 'success', title: 'OK', duration: 0 });
// Runtime-public options must be type-public too (regression: ToastOpts
// previously stopped at tone/title/duration while the runtime accepted
// these and the behavior tests exercised them).
const dismiss2: Cleanup = toast('err', { tone: 'danger', assertive: true, closable: true });
// @ts-expect-error — message is required.
toast();
// @ts-expect-error — assertive is a boolean.
toast('x', { assertive: 'yes' });

// Glyphs: the subpath types are sound and the GlyphName union rejects typos.
const stopGlyph: Cleanup = initDotGlyph({ root: document });
const glyphHtml: string = renderGlyph('check', {
  label: 'Done',
  grid: false,
  solid: true,
  anim: 'reveal',
  dot: '0.5rem',
});
// @ts-expect-error — anim is a closed union.
renderGlyph('check', { anim: 'spin' });
const cells: GlyphCell[] = glyphCells('spark');
const cellOn: boolean = cells[0].on;
const gname: GlyphName = 'heart';
const rows = glyph(gname); // readonly string[] | undefined
const size: 16 = GLYPH_SIZE; // narrows to the literal
const firstName: GlyphName = GLYPH_NAMES[0];
// Dynamic dispatch: an arbitrary string is accepted (returns the '' fallback),
// so a CMS/config-supplied name needs no cast.
const dyn: string = renderGlyph('icon-from-config');
// …but the GlyphName union itself still rejects typo'd literals.
// @ts-expect-error — not a registered glyph name.
const bad: GlyphName = 'definitely-not-a-glyph';
void [dyn, bad];

// Colorways: the ./skins subpath types are sound and SkinName rejects typos.
const skinName: SkinName = 'phosphor-green';
const firstSkin: SkinName = SKIN_NAMES[0];
const skinLabel: string = skins[skinName].label;
// @ts-expect-error — not a registered colorway name.
const badSkin: SkinName = 'neon-pink';
void [skinName, firstSkin, skinLabel, badSkin];

// Data-viz: the ./charts subpath types are sound and ChartTokenName is literal.
const chartTok: ChartTokenName = '--chart-1';
const series1: string = charts.light.categorical[0];
// @ts-expect-error — not a categorical chart token.
const badChart: ChartTokenName = '--chart-99';
void [chartTok, series1, badChart];

// Annotations: helper subpath types are object-shaped and finite geometry stays
// a runtime concern.
const annTransform: string = annotationTransform({ x: 10, y: 20 });
const noteTx: string = noteTransform({ x: 80, y: 30, align: 'middle', valign: 'bottom' });
const notePlaced = notePlacement({
  x: 100,
  y: 60,
  width: 80,
  height: 30,
  bounds: { width: 240, height: 140 },
  preferred: 'right',
});
const notePlacedTransform: string = notePlaced.transform;
const notePlacedDx: number = notePlaced.dx;
const circlePath: string = circleSubjectPath({ radius: 12 });
const rectPath: string = rectSubjectPath({ width: 40, height: 20, padding: 2 });
const threshold: string = thresholdPath({ x2: 100, y2: 0 });
const axisThreshold: string = axisThresholdPath({ orientation: 'vertical', value: 20, end: 120 });
const bracket: string = bracketSubjectPath({ x1: 0, y1: 0, x2: 100, y2: 0, depth: 12 });
const band: string = bandSubjectPath({ x: 0, y: 10, width: 80, height: 24, padding: 2 });
const slope: string = slopeSubjectPath({ x1: 0, y1: 80, x2: 80, y2: 20 });
const brace: string = comparisonBracePath({ x1: 0, y1: 0, x2: 80, y2: 0 });
const clusterPath: string = outlierClusterPath({ points: [{ x: 0, y: 0 }], radius: 4 });
const eventPath: string = timelineEventPath({ size: 10, direction: 'up' });
const evidencePath: string = evidenceMarkerPath({ width: 20, height: 10 });
const endDot: string = connectorEndDot({ x: 80, y: 20, radius: 3 });
const endArrow: string = connectorEndArrow({ x1: 0, y1: 0, x2: 80, y2: 20, size: 7 });
const connectorOpts: ConnectorOptions = {
  dx: 80,
  dy: -30,
  subject: { type: 'circle', radius: 16, radiusPadding: 4 },
};
const line: string = connectorLine(connectorOpts);
const elbow: string = connectorElbow({
  dx: 80,
  dy: 30,
  subject: { type: 'rect', width: 20, height: 10 },
});
const curve: string = connectorCurve({ dx: 80, dy: 30 });
const partsOpts: AnnotationPartsOptions = {
  type: 'elbow',
  dx: 70,
  dy: -24,
  subject: { type: 'evidence', width: 20, height: 10 },
};
const partsOut: string = annotationParts(partsOpts).connector;
// @ts-expect-error — radius is required for circle subject paths.
circleSubjectPath({});
// @ts-expect-error — subject type is a closed union.
connectorLine({ dx: 1, dy: 1, subject: { type: 'point' } });
// @ts-expect-error — annotation parts subject type is a closed union.
annotationParts({ subject: { type: 'point' } });
// @ts-expect-error — note alignment is a closed union.
noteTransform({ align: 'left' });
notePlacement({
  width: 80,
  height: 30,
  bounds: { width: 240, height: 140 },
  // @ts-expect-error — note placement side is a closed union.
  preferred: 'diagonal',
});
void [
  annTransform,
  noteTx,
  notePlacedTransform,
  notePlacedDx,
  circlePath,
  rectPath,
  threshold,
  axisThreshold,
  bracket,
  band,
  slope,
  brace,
  clusterPath,
  eventPath,
  evidencePath,
  endDot,
  endArrow,
  line,
  elbow,
  curve,
  partsOut,
];

// Framework bindings: the ./react + ./solid hook types resolve from the .d.ts
// (no react/solid-js needed to type-check), take the behaviors' opts, and the
// toast hook returns the imperative.
import { useDialog as useDialogR, useToast as useToastR } from '../react/index.js';
import { useTabs as useTabsS } from '../solid/index.js';
const rDialog: void = useDialogR({ root: document });
const rDialogRef: void = useDialogR({ root: { current: document } });
const rDialogResolver: void = useDialogR(() => ({ root: document }));
const rToast = useToastR();
const rDismiss = rToast('hi', { tone: 'success' }); // Cleanup
const sTabs: void = useTabsS({ root: () => document });
void [rDialog, rDialogRef, rDialogResolver, rDismiss, sTabs];

// Qwik bindings: same opts surface, and the root additionally accepts a Qwik
// signal ({ value }) — a shape the React/Solid bindings deliberately don't.
import { useDialog as useDialogQ, useToast as useToastQ } from '../qwik/index.js';
const qDialog: void = useDialogQ({ root: document });
const qDialogSignal: void = useDialogQ({ root: { value: document } }); // Qwik useSignal()
const qDialogResolver: void = useDialogQ(() => ({ root: { current: document } }));
const qToast = useToastQ();
const qDismiss = qToast('hi', { tone: 'success' }); // Cleanup
// @ts-expect-error — the React binding root does not accept a Qwik signal ({ value }) shape.
const rRejectsSignal: void = useDialogR({ root: { value: document } });
void [qDialog, qDialogSignal, qDialogResolver, qToast, qDismiss, rRejectsSignal];

void [
  btn,
  appShell,
  tt,
  report,
  reportSection,
  reportSectionUnnumbered,
  chart,
  chartPlot,
  chartFill,
  annotation,
  annotationConnector,
  printOnly,
  a,
  b,
  ann,
  annMotion,
  joined,
  soft,
  th,
  accentVar,
  scaleMd,
  stop,
  stopDlg,
  dismiss,
  dismiss2,
  stopGlyph,
  glyphHtml,
  cells,
  cellOn,
  rows,
  size,
  firstName,
];
