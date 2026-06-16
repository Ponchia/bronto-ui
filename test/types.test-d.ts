/**
 * Type-only gate (compiled by `npm run check:types`, never executed).
 * Proves the published .d.ts are sound *and* that the generated literal
 * `cls` / token types actually reject typos — the concrete payoff of
 * making the declarations generated-from-source. A regression here is a
 * consumer-facing break, so it blocks `npm run check`.
 */
import { attrs, cls, ui, cx, type ClassValue } from '../classes/index.js';
import tokens, { themeColor, cssVars, type ThemeName } from '../tokens/index.js';
import {
  initThemeToggle,
  initDialog,
  initDotGlyph,
  toast,
  type Cleanup,
} from '../behaviors/index.js';
import {
  GLYPHS,
  renderGlyph,
  renderReadout,
  glyphCells,
  glyphMask,
  glyph,
  findGlyphs,
  GLYPH_SIZE,
  GLYPH_NAMES,
  GLYPH_TAGS,
  type GlyphName,
  type GlyphCell,
} from '../glyphs/glyphs.js';
import { skins, SKIN_NAMES, type SkinName } from '../tokens/skins.js';
import chartPalette, {
  ACCENT,
  charts,
  CHART_CATEGORICAL,
  CHART_PATTERN_COUNT,
  type ChartTheme,
  type ChartTokenName,
} from '../tokens/charts.js';
import mermaidTheme, {
  brontoMermaidTheme,
  mermaid,
  type MermaidThemeVariables,
} from '../tokens/mermaid.js';
import d2Vars, {
  brontoD2Overrides,
  brontoD2Vars,
  d2,
  type D2ThemeOverrides,
} from '../tokens/d2.js';
import vegaConfig, {
  brontoVegaAccent,
  brontoVegaConfig,
  brontoVegaNeutral,
  vega,
  type VegaConfig,
} from '../tokens/vega.js';
import {
  PRECISION,
  connectRects,
  connectorPath,
  straightPath,
  elbowPath,
  curvePath,
  arrowHead,
  dotMark,
  anchorPoint,
  angleBetween,
  endTangentAngle,
  autoSides,
  finite,
  dimension,
  roundNumber,
  fmt,
  point,
  clamp,
  rectPath as connectorRectPath,
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
const compare: 'ui-compare' = cls.compare;
const legend: 'ui-legend' = cls.legend;
const legendSwatch: 'ui-legend__swatch' = cls.legendSwatch;
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
// 'success' IS a valid bracket-note tone — the factory emits ui-bracket-note--success
// (added 0.6.0; the union now matches, gated by check:recipe-types).
const bnSuccess: string = ui.bracketNote({ tone: 'success' });
const mtInfo: string = ui.meter({ tone: 'info' });

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

const lifecycle: string = ui.state({ state: 'saving', busy: true });
void lifecycle;
// @ts-expect-error — lifecycle state is a closed union.
ui.state({ state: 'thinking' });

const origin: string = ui.originLabel({ ai: true });
void origin;

// Connectors geometry: object-shaped options, string/coordinate returns.
const connectorPrecision: 1000 = PRECISION;
const finiteNumber: number = finite('x', undefined, 2);
const dimensionNumber: number = dimension('width', null, 3);
const roundedNumber: number = roundNumber(1.23456);
const formattedNumber: string = fmt(1.23456);
const svgPoint: string = point(1, 2);
const clampedNumber: number = clamp(4, 0, 1);
const connectorRectD: string = connectorRectPath(0, 1, 10, 11);
// @ts-expect-error — finite returns number, not string; catches an `any` return leak.
const finiteNotString: string = finite('x', 1);
// @ts-expect-error — scalar helper values are numeric/nullish, not strings.
finite('x', '1');
// @ts-expect-error — point coordinates are numeric.
point('x', 1);
const connOut: ConnectRectsResult = connectRects({
  fromRect: { x: 0, y: 0, width: 20, height: 20 },
  toRect: { x: 80, y: 40, width: 20, height: 20 },
  shape: 'curve',
});
const connD: string = connOut.d;
const connAngle: number = connOut.angle;
const head: string = arrowHead(connOut.to, connOut.angle);
const dot: string = dotMark(connOut.to, 2);
const angle: number = angleBetween(connOut.from, connOut.to);
const tangent: number = endTangentAngle(connOut.from, connOut.to, 'curve');
const straightD: string = straightPath(connOut.from, connOut.to);
const elbowD: string = elbowPath(connOut.from, connOut.to, { mid: 0.25 });
const curveD: string = curvePath(connOut.from, connOut.to, { curvature: 0.25 });
const pathStr: string = connectorPath({
  from: { x: 0, y: 0 },
  to: { x: 10, y: 10 },
  shape: 'elbow',
});
const side: Side = 'right';
const anchor = anchorPoint({ x: 0, y: 0, width: 10, height: 10 }, side);
const anchorX: number = anchor.x;
const sides: { from: Side; to: Side } = autoSides(
  { x: 0, y: 0, width: 10, height: 10 },
  { x: 100, y: 0, width: 10, height: 10 },
);
// @ts-expect-error — shape is a closed union.
connectorPath({ from: { x: 0, y: 0 }, to: { x: 1, y: 1 }, shape: 'zigzag' });
void [
  connectorPrecision,
  finiteNumber,
  dimensionNumber,
  roundedNumber,
  formattedNumber,
  svgPoint,
  clampedNumber,
  connectorRectD,
  finiteNotString,
  connD,
  connAngle,
  head,
  dot,
  angle,
  tangent,
  straightD,
  elbowD,
  curveD,
  pathStr,
  anchorX,
  sides,
];

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
const meterAttrs = attrs.meter(72, { min: 0, max: 100 });
const meterRole: 'meter' = meterAttrs.role;
const progressAttrs = attrs.progress(64);
const progressRole: 'progressbar' = progressAttrs.role;
const progressNow: number = progressAttrs['aria-valuenow'];
const indeterminateProgress = attrs.progress();
const progressBusy: 'true' = indeterminateProgress['aria-busy'];
// @ts-expect-error — indeterminate progress omits aria-valuenow.
indeterminateProgress['aria-valuenow'];
const dotbarAttrs = attrs.dotbar(4, { min: 0, max: 8 });
const dotbarRole: 'progressbar' = dotbarAttrs.role;
const indeterminateDotbar = attrs.dotbar();
const dotbarBusy: 'true' = indeterminateDotbar['aria-busy'];
void [
  meterRole,
  progressRole,
  progressNow,
  progressBusy,
  dotbarRole,
  dotbarBusy,
  meterAttrs,
  dotbarAttrs,
];

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
const registryRows = GLYPHS[gname];
const tags = GLYPH_TAGS.trash;
const matches: GlyphName[] = findGlyphs('delete');
const mask: string = glyphMask('check');
const readout: string = renderReadout('12:48', { label: 'Time', render: 'mask', size: '1em' });
// Dynamic dispatch: an arbitrary string is accepted (returns the '' fallback),
// so a CMS/config-supplied name needs no cast.
const dyn: string = renderGlyph('icon-from-config');
// …but the GlyphName union itself still rejects typo'd literals.
// @ts-expect-error — not a registered glyph name.
const bad: GlyphName = 'definitely-not-a-glyph';
void [
  dyn,
  bad,
  registryRows,
  tags,
  matches,
  mask,
  readout,
  stopGlyph,
  glyphHtml,
  cellOn,
  rows,
  size,
  firstName,
];

// Colorways: the ./skins subpath types are sound and SkinName rejects typos.
const skinName: SkinName = 'phosphor-green';
const firstSkin: SkinName = SKIN_NAMES[0];
const skinLabel: string = skins[skinName].label;
// @ts-expect-error — not a registered colorway name.
const badSkin: SkinName = 'neon-pink';
void [skinName, firstSkin, skinLabel, badSkin];

// Data-viz: the ./charts subpath types are sound; constants/default exports
// keep literal types, and ChartTokenName is literal.
const chartTok: ChartTokenName = '--chart-1';
const series1: string = charts.light.categorical[0];
const chartLight: ChartTheme = charts.light;
const chartDark: ChartTheme = chartPalette.dark;
const chartAccent: 'var(--accent)' = ACCENT;
const chartCount: 8 = CHART_CATEGORICAL;
const chartPatternCount: 8 = CHART_PATTERN_COUNT;
// @ts-expect-error — not a categorical chart token.
const badChart: ChartTokenName = '--chart-99';
void [
  chartTok,
  series1,
  chartLight,
  chartDark,
  chartAccent,
  chartCount,
  chartPatternCount,
  badChart,
];

// Renderer themes: Mermaid/D2/Vega helpers expose typed light/dark selectors,
// named maps, and default helpers for package consumers.
const mermaidVars: MermaidThemeVariables = mermaid.dark;
const mermaidCfg = brontoMermaidTheme('dark');
const mermaidBaseTheme: 'base' = mermaidCfg.theme;
const mermaidCfgDefault = mermaidTheme('light');
// @ts-expect-error — theme is 'light' | 'dark', not arbitrary.
brontoMermaidTheme('midnight');
const d2Light: D2ThemeOverrides = d2.light;
const d2Source: string = brontoD2Vars();
const d2SourceDefault: string = d2Vars();
const d2Dark: D2ThemeOverrides = brontoD2Overrides('dark');
// @ts-expect-error — theme is 'light' | 'dark', not arbitrary.
brontoD2Overrides('midnight');
void [
  mermaidVars,
  mermaidCfg,
  mermaidBaseTheme,
  mermaidCfgDefault,
  d2Light,
  d2Source,
  d2SourceDefault,
  d2Dark,
];

// Vega: the ./vega subpath types are sound — VegaConfig has the range ramps,
// brontoVegaConfig takes the theme literal, and an unknown theme is rejected.
const vegaNamed: VegaConfig = vega.dark;
const vegaCfg: VegaConfig = brontoVegaConfig('dark');
const vegaDefault: VegaConfig = vegaConfig('light');
const vegaCat: string[] = vegaCfg.range.category;
const vegaBg: string = vegaCfg.background;
const vegaAccent: string = brontoVegaAccent('dark');
const vegaNeutral: string = brontoVegaNeutral('light');
// @ts-expect-error — theme is 'light' | 'dark', not arbitrary.
brontoVegaConfig('midnight');
// @ts-expect-error — theme is 'light' | 'dark', not arbitrary.
brontoVegaAccent('midnight');
// @ts-expect-error — theme is 'light' | 'dark', not arbitrary.
brontoVegaNeutral('midnight');
void [vegaNamed, vegaCfg, vegaDefault, vegaCat, vegaBg, vegaAccent, vegaNeutral];

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
import {
  useDialog as useDialogR,
  useThemeToggle as useThemeToggleR,
  useToast as useToastR,
} from '../react/index.js';
import { useTabs as useTabsS, useThemeToggle as useThemeToggleS } from '../solid/index.js';
const rDialog: void = useDialogR({ root: document });
const rDialogRef: void = useDialogR({ root: { current: document } });
const rDialogResolver: void = useDialogR(() => ({ root: document }));
const rTheme: void = useThemeToggleR({ root: document, storageKey: 'react-theme' });
const rToast = useToastR();
const rDismiss = rToast('hi', { tone: 'success' }); // Cleanup
const sTabs: void = useTabsS({ root: () => document });
const sTheme: void = useThemeToggleS(() => ({ root: document, storageKey: 'solid-theme' }));
// @ts-expect-error — theme storage keys are strings.
useThemeToggleR({ storageKey: 123 });
void [rDialog, rDialogRef, rDialogResolver, rTheme, rDismiss, sTabs, sTheme];

// Qwik bindings: same opts surface, and the root additionally accepts a Qwik
// signal ({ value }) — a shape the React/Solid bindings deliberately don't.
import {
  useDialog as useDialogQ,
  useThemeToggle as useThemeToggleQ,
  useToast as useToastQ,
} from '../qwik/index.js';
const qDialog: void = useDialogQ({ root: document });
const qDialogSignal: void = useDialogQ({ root: { value: document } }); // Qwik useSignal()
const qDialogResolver: void = useDialogQ(() => ({ root: { current: document } }));
const qTheme: void = useThemeToggleQ({ root: { value: document }, storageKey: 'qwik-theme' });
const qToast = useToastQ();
const qDismiss = qToast('hi', { tone: 'success' }); // Cleanup
// @ts-expect-error — the React binding root does not accept a Qwik signal ({ value }) shape.
const rRejectsSignal: void = useDialogR({ root: { value: document } });
void [qDialog, qDialogSignal, qDialogResolver, qTheme, qToast, qDismiss, rRejectsSignal];

// Svelte actions: action functions take an Element and return the action
// lifecycle object; they deliberately use element roots, not React/Solid ref
// objects or Qwik signals.
import {
  disclosure as sDisclosure,
  themeToggle as sThemeToggle,
  createBrontoAction,
  useToast as useToastSv,
  type SvelteActionReturn,
} from '../svelte/index.js';
const sAction: SvelteActionReturn = sDisclosure(document.body, { root: document });
sThemeToggle(document.body, { root: document, storageKey: 'svelte-theme' });
sAction.update?.({ root: document.body });
sAction.destroy();
const sCustomAction = createBrontoAction((opts) => {
  const maybeRoot: Document | Element | null | undefined = opts?.root;
  void maybeRoot;
  return () => {};
});
const sCustomReturn: SvelteActionReturn = sCustomAction(document.body);
const sToast = useToastSv();
const sDismiss = sToast('hi', { tone: 'success' });
// @ts-expect-error — Svelte action roots are nodes, not React-style refs.
sDisclosure(document.body, { root: { current: document } });
// @ts-expect-error — Svelte theme storage keys are strings.
sThemeToggle(document.body, { storageKey: 123 });
void [sCustomReturn, sDismiss];

// Vue directives: directive objects and registry entries are directly usable
// without importing Vue, and the plugin shape can register kebab/camel aliases.
import {
  vDisclosure,
  vThemeToggle,
  directives as vueDirectives,
  brontoVue,
  useToast as useToastV,
  type BrontoDirective,
  type BrontoVueApp,
  type BrontoVuePlugin,
} from '../vue/index.js';
const vueDirective: BrontoDirective = vDisclosure;
vueDirective.mounted(document.body, { value: { root: document } });
vThemeToggle.mounted(document.body, { value: { root: document, storageKey: 'vue-theme' } });
vueDirective.updated(document.body, {
  value: { root: document.body },
  oldValue: { root: document },
});
vueDirective.beforeUnmount(document.body);
vueDirectives.disclosure.mounted(document.body);
const registeredVueDirectives: string[] = [];
const vuePlugin: BrontoVuePlugin = brontoVue;
const vueApp: BrontoVueApp = {
  directive(name: string, directive: BrontoDirective) {
    registeredVueDirectives.push(name);
    void directive;
  },
};
brontoVue.install(vueApp);
vuePlugin.install(vueApp);
const vToast = useToastV();
const vDismiss = vToast('hi', { tone: 'info' });
// @ts-expect-error — Vue plugin install requires a directive registrar, not any object.
brontoVue.install({});
// @ts-expect-error — Vue directive roots are nodes, not Qwik signals.
vDisclosure.mounted(document.body, { value: { root: { value: document } } });
// @ts-expect-error — Vue theme storage keys are strings.
vThemeToggle.mounted(document.body, { value: { storageKey: 123 } });
void [registeredVueDirectives, vuePlugin, vDismiss];

void [
  btn,
  appShell,
  tt,
  report,
  reportSection,
  reportSectionUnnumbered,
  compare,
  legend,
  legendSwatch,
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
