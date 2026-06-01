/** @ponchia/ui — GENERATED from classes/index.js by scripts/gen-dts.mjs.
 *  Do not edit by hand; run `npm run dts:build`. Drift-checked in CI. */

// Mirrors clsx's permissive input: `number`/`boolean` accepted so the
// idiomatic React `reactNode && 'cls'` guard (where the node may be 0 or
// '') type-checks. The runtime `cx` skips every falsy value regardless.
export type ClassValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ClassValue[];

/** The flat registry of every class @ponchia/ui defines (literal). */
export declare const cls: {
  readonly button: 'ui-button';
  readonly buttonGhost: 'ui-button--ghost';
  readonly buttonSubtle: 'ui-button--subtle';
  readonly buttonDanger: 'ui-button--danger';
  readonly buttonIcon: 'ui-button--icon';
  readonly buttonSm: 'ui-button--sm';
  readonly buttonLg: 'ui-button--lg';
  readonly card: 'ui-card';
  readonly cardHead: 'ui-card__head';
  readonly cardAccent: 'ui-card--accent';
  readonly cardInteractive: 'ui-card--interactive';
  readonly stat: 'ui-stat';
  readonly statgrid: 'ui-statgrid';
  readonly statLabel: 'ui-stat__label';
  readonly statValue: 'ui-stat__value';
  readonly statDelta: 'ui-stat__delta';
  readonly num: 'ui-num';
  readonly numPos: 'ui-num--pos';
  readonly numNeg: 'ui-num--neg';
  readonly numMuted: 'ui-num--muted';
  readonly badge: 'ui-badge';
  readonly badgeAccent: 'ui-badge--accent';
  readonly badgeSuccess: 'ui-badge--success';
  readonly badgeWarning: 'ui-badge--warning';
  readonly badgeDanger: 'ui-badge--danger';
  readonly badgeInfo: 'ui-badge--info';
  readonly badgeMuted: 'ui-badge--muted';
  readonly badgeDot: 'ui-badge--dot';
  readonly chip: 'ui-chip';
  readonly chipAccent: 'ui-chip--accent';
  readonly link: 'ui-link';
  readonly linkArrow: 'ui-link--arrow';
  readonly linkCta: 'ui-link--cta';
  readonly keyValue: 'ui-key-value';
  readonly emptyState: 'ui-empty-state';
  readonly dot: 'ui-dot';
  readonly dotAccent: 'ui-dot--accent';
  readonly dotSuccess: 'ui-dot--success';
  readonly dotWarning: 'ui-dot--warning';
  readonly dotDanger: 'ui-dot--danger';
  readonly dotInfo: 'ui-dot--info';
  readonly dotLive: 'ui-dot--live';
  readonly dotgrid: 'ui-dotgrid';
  readonly dotgridAccent: 'ui-dotgrid--accent';
  readonly dotgridDense: 'ui-dotgrid--dense';
  readonly dotmatrix: 'ui-dotmatrix';
  readonly dotmatrixCell: 'ui-dotmatrix__cell';
  readonly dotmatrixCellHot: 'ui-dotmatrix__cell--hot';
  readonly dotmatrixCellAccent: 'ui-dotmatrix__cell--accent';
  readonly dotmatrixReveal: 'ui-dotmatrix--reveal';
  readonly dotmatrixPulse: 'ui-dotmatrix--pulse';
  readonly icon: 'ui-icon';
  readonly dotfield: 'ui-dotfield';
  readonly dotrule: 'ui-dotrule';
  readonly dotbar: 'ui-dotbar';
  readonly dotbarIndeterminate: 'ui-dotbar--indeterminate';
  readonly dotloader: 'ui-dotloader';
  readonly dotspinner: 'ui-dotspinner';
  readonly dotspinnerSm: 'ui-dotspinner--sm';
  readonly dotspinnerLg: 'ui-dotspinner--lg';
  readonly field: 'ui-field';
  readonly label: 'ui-label';
  readonly input: 'ui-input';
  readonly select: 'ui-select';
  readonly textarea: 'ui-textarea';
  readonly search: 'ui-search';
  readonly check: 'ui-check';
  readonly switch: 'ui-switch';
  readonly switchTrack: 'ui-switch__track';
  readonly switchThumb: 'ui-switch__thumb';
  readonly hint: 'ui-hint';
  readonly hintError: 'ui-hint--error';
  readonly inputGroup: 'ui-input-group';
  readonly inputGroupAddon: 'ui-input-group__addon';
  readonly inputIcon: 'ui-input-icon';
  readonly inputIconSlot: 'ui-input-icon__icon';
  readonly inputIconEnd: 'ui-input-icon--end';
  readonly file: 'ui-file';
  readonly range: 'ui-range';
  readonly errorSummary: 'ui-error-summary';
  readonly errorSummaryTitle: 'ui-error-summary__title';
  readonly errorSummaryList: 'ui-error-summary__list';
  readonly alert: 'ui-alert';
  readonly alertTitle: 'ui-alert__title';
  readonly alertBody: 'ui-alert__body';
  readonly alertDismiss: 'ui-alert__dismiss';
  readonly alertAccent: 'ui-alert--accent';
  readonly alertSuccess: 'ui-alert--success';
  readonly alertWarning: 'ui-alert--warning';
  readonly alertDanger: 'ui-alert--danger';
  readonly alertInfo: 'ui-alert--info';
  readonly toastStack: 'ui-toast-stack';
  readonly toastStackAssertive: 'ui-toast-stack--assertive';
  readonly toast: 'ui-toast';
  readonly toastTitle: 'ui-toast__title';
  readonly toastClose: 'ui-toast__close';
  readonly toastAccent: 'ui-toast--accent';
  readonly toastSuccess: 'ui-toast--success';
  readonly toastWarning: 'ui-toast--warning';
  readonly toastDanger: 'ui-toast--danger';
  readonly toastInfo: 'ui-toast--info';
  readonly tooltip: 'ui-tooltip';
  readonly tooltipBubble: 'ui-tooltip__bubble';
  readonly popover: 'ui-popover';
  readonly progress: 'ui-progress';
  readonly progressBar: 'ui-progress__bar';
  readonly progressIndeterminate: 'ui-progress--indeterminate';
  readonly meter: 'ui-meter';
  readonly meterFill: 'ui-meter__fill';
  readonly meterAccent: 'ui-meter--accent';
  readonly meterSuccess: 'ui-meter--success';
  readonly meterWarning: 'ui-meter--warning';
  readonly meterDanger: 'ui-meter--danger';
  readonly steps: 'ui-steps';
  readonly stepsItem: 'ui-steps__item';
  readonly stepsItemDone: 'ui-steps__item--done';
  readonly modal: 'ui-modal';
  readonly modalHead: 'ui-modal__head';
  readonly modalTitle: 'ui-modal__title';
  readonly modalBody: 'ui-modal__body';
  readonly modalFoot: 'ui-modal__foot';
  readonly modalClose: 'ui-modal__close';
  readonly modalDrawer: 'ui-modal--drawer';
  readonly menuHost: 'ui-menu-host';
  readonly menu: 'ui-menu';
  readonly menuLabel: 'ui-menu__label';
  readonly menuItem: 'ui-menu__item';
  readonly menuSep: 'ui-menu__sep';
  readonly combobox: 'ui-combobox';
  readonly comboboxInput: 'ui-combobox__input';
  readonly comboboxList: 'ui-combobox__list';
  readonly comboboxOption: 'ui-combobox__option';
  readonly comboboxEmpty: 'ui-combobox__empty';
  readonly lightbox: 'ui-lightbox';
  readonly lightboxClose: 'ui-lightbox__close';
  readonly tabs: 'ui-tabs';
  readonly tabsList: 'ui-tabs__list';
  readonly tab: 'ui-tab';
  readonly tabsPanel: 'ui-tabs__panel';
  readonly accordion: 'ui-accordion';
  readonly accordionItem: 'ui-accordion__item';
  readonly accordionSummary: 'ui-accordion__summary';
  readonly accordionBody: 'ui-accordion__body';
  readonly segmented: 'ui-segmented';
  readonly segmentedOption: 'ui-segmented__option';
  readonly breadcrumb: 'ui-breadcrumb';
  readonly breadcrumbItem: 'ui-breadcrumb__item';
  readonly pagination: 'ui-pagination';
  readonly paginationItem: 'ui-pagination__item';
  readonly avatar: 'ui-avatar';
  readonly avatarSm: 'ui-avatar--sm';
  readonly avatarLg: 'ui-avatar--lg';
  readonly avatarGroup: 'ui-avatar-group';
  readonly carousel: 'ui-carousel';
  readonly carouselStage: 'ui-carousel__stage';
  readonly carouselViewport: 'ui-carousel__viewport';
  readonly carouselSlide: 'ui-carousel__slide';
  readonly carouselPrev: 'ui-carousel__prev';
  readonly carouselNext: 'ui-carousel__next';
  readonly carouselStatus: 'ui-carousel__status';
  readonly carouselThumbs: 'ui-carousel__thumbs';
  readonly carouselThumb: 'ui-carousel__thumb';
  readonly table: 'ui-table';
  readonly tableDense: 'ui-table--dense';
  readonly tableComfortable: 'ui-table--comfortable';
  readonly tableLined: 'ui-table--lined';
  readonly tableWrap: 'ui-table-wrap';
  readonly tableEmpty: 'ui-table__empty';
  readonly tableSort: 'ui-table__sort';
  readonly tableSelect: 'ui-table__select';
  readonly tableToolbar: 'ui-table__toolbar';
  readonly tableSelectable: 'ui-table--selectable';
  readonly tableLoading: 'ui-table--loading';
  readonly panel: 'ui-panel';
  readonly panelHead: 'ui-panel__head';
  readonly surface: 'ui-surface';
  readonly stack: 'ui-stack';
  readonly cluster: 'ui-cluster';
  readonly clusterBetween: 'ui-cluster--between';
  readonly grid: 'ui-grid';
  readonly sidebar: 'ui-sidebar';
  readonly switcher: 'ui-switcher';
  readonly center: 'ui-center';
  readonly ratio: 'ui-ratio';
  readonly cq: 'ui-cq';
  readonly divider: 'ui-divider';
  readonly status: 'ui-status';
  readonly eyebrow: 'ui-eyebrow';
  readonly eyebrowMuted: 'ui-eyebrow--muted';
  readonly eyebrowSm: 'ui-eyebrow--sm';
  readonly prose: 'ui-prose';
  readonly proseCompact: 'ui-prose--compact';
  readonly quote: 'ui-quote';
  readonly quoteCite: 'ui-quote__cite';
  readonly container: 'ui-container';
  readonly containerNarrow: 'ui-container--narrow';
  readonly containerWide: 'ui-container--wide';
  readonly skiplink: 'ui-skiplink';
  readonly siteheader: 'ui-siteheader';
  readonly siteheaderSticky: 'ui-siteheader--sticky';
  readonly siteheaderBrand: 'ui-siteheader__brand';
  readonly siteheaderActions: 'ui-siteheader__actions';
  readonly pagehead: 'ui-pagehead';
  readonly pageheadTitle: 'ui-pagehead__title';
  readonly pageheadActions: 'ui-pagehead__actions';
  readonly sitenav: 'ui-sitenav';
  readonly sitemenu: 'ui-sitemenu';
  readonly sitemenuPanel: 'ui-sitemenu__panel';
  readonly sitefooter: 'ui-sitefooter';
  readonly sitefooterLinks: 'ui-sitefooter__links';
  readonly tags: 'ui-tags';
  readonly tag: 'ui-tag';
  readonly tagAccent: 'ui-tag--accent';
  readonly meta: 'ui-meta';
  readonly metaItem: 'ui-meta__item';
  readonly timeline: 'ui-timeline';
  readonly timelineItem: 'ui-timeline__item';
  readonly timelineTime: 'ui-timeline__time';
  readonly report: 'ui-report';
  readonly reportCompact: 'ui-report--compact';
  readonly reportNumbered: 'ui-report--numbered';
  readonly reportCover: 'ui-report__cover';
  readonly reportCoverCompact: 'ui-report__cover--compact';
  readonly reportHeader: 'ui-report__header';
  readonly reportTitle: 'ui-report__title';
  readonly reportSubtitle: 'ui-report__subtitle';
  readonly reportMeta: 'ui-report__meta';
  readonly reportToc: 'ui-report__toc';
  readonly reportSummary: 'ui-report__summary';
  readonly reportSection: 'ui-report__section';
  readonly reportSectionUnnumbered: 'ui-report__section--unnumbered';
  readonly reportSectionHead: 'ui-report__section-head';
  readonly reportFinding: 'ui-report__finding';
  readonly reportEvidence: 'ui-report__evidence';
  readonly reportFigure: 'ui-report__figure';
  readonly reportCaption: 'ui-report__caption';
  readonly reportSources: 'ui-report__sources';
  readonly reportAppendix: 'ui-report__appendix';
  readonly reportFootnotes: 'ui-report__footnotes';
  readonly chart: 'ui-chart';
  readonly chartCaption: 'ui-chart__caption';
  readonly chartPlot: 'ui-chart__plot';
  readonly chartBar: 'ui-chart__bar';
  readonly chartLabel: 'ui-chart__label';
  readonly chartTrack: 'ui-chart__track';
  readonly chartFill: 'ui-chart__fill';
  readonly chartFallback: 'ui-chart__fallback';
  readonly legend: 'ui-legend';
  readonly legendVertical: 'ui-legend--vertical';
  readonly legendCompact: 'ui-legend--compact';
  readonly legendGradient: 'ui-legend--gradient';
  readonly legendDiverging: 'ui-legend--diverging';
  readonly legendThreshold: 'ui-legend--threshold';
  readonly legendWithValues: 'ui-legend--with-values';
  readonly legendInteractive: 'ui-legend--interactive';
  readonly legendTitle: 'ui-legend__title';
  readonly legendItem: 'ui-legend__item';
  readonly legendSwatch: 'ui-legend__swatch';
  readonly legendSwatchCircle: 'ui-legend__swatch--circle';
  readonly legendSwatchLine: 'ui-legend__swatch--line';
  readonly legendSwatch1: 'ui-legend__swatch--1';
  readonly legendSwatch2: 'ui-legend__swatch--2';
  readonly legendSwatch3: 'ui-legend__swatch--3';
  readonly legendSwatch4: 'ui-legend__swatch--4';
  readonly legendSwatch5: 'ui-legend__swatch--5';
  readonly legendSwatch6: 'ui-legend__swatch--6';
  readonly legendSwatch7: 'ui-legend__swatch--7';
  readonly legendSwatch8: 'ui-legend__swatch--8';
  readonly legendSymbol: 'ui-legend__symbol';
  readonly legendLabel: 'ui-legend__label';
  readonly legendValue: 'ui-legend__value';
  readonly legendCaption: 'ui-legend__caption';
  readonly legendTrack: 'ui-legend__track';
  readonly legendTicks: 'ui-legend__ticks';
  readonly legendTick: 'ui-legend__tick';
  readonly annotation: 'ui-annotation';
  readonly annotationSubject: 'ui-annotation__subject';
  readonly annotationConnector: 'ui-annotation__connector';
  readonly annotationConnectorEnd: 'ui-annotation__connector-end';
  readonly annotationNote: 'ui-annotation__note';
  readonly annotationNoteLine: 'ui-annotation__note-line';
  readonly annotationTitle: 'ui-annotation__title';
  readonly annotationLabel: 'ui-annotation__label';
  readonly annotationBadge: 'ui-annotation__badge';
  readonly annotationLabelVariant: 'ui-annotation--label';
  readonly annotationCallout: 'ui-annotation--callout';
  readonly annotationElbow: 'ui-annotation--elbow';
  readonly annotationCurve: 'ui-annotation--curve';
  readonly annotationCircle: 'ui-annotation--circle';
  readonly annotationRect: 'ui-annotation--rect';
  readonly annotationThreshold: 'ui-annotation--threshold';
  readonly annotationBadgeVariant: 'ui-annotation--badge';
  readonly annotationBracket: 'ui-annotation--bracket';
  readonly annotationBand: 'ui-annotation--band';
  readonly annotationSlope: 'ui-annotation--slope';
  readonly annotationCompare: 'ui-annotation--compare';
  readonly annotationCluster: 'ui-annotation--cluster';
  readonly annotationAxis: 'ui-annotation--axis';
  readonly annotationTimeline: 'ui-annotation--timeline';
  readonly annotationEvidence: 'ui-annotation--evidence';
  readonly annotationAccent: 'ui-annotation--accent';
  readonly annotationMuted: 'ui-annotation--muted';
  readonly annotationSuccess: 'ui-annotation--success';
  readonly annotationWarning: 'ui-annotation--warning';
  readonly annotationDanger: 'ui-annotation--danger';
  readonly annotationInfo: 'ui-annotation--info';
  readonly annotationDraw: 'ui-annotation--draw';
  readonly annotationPulse: 'ui-annotation--pulse';
  readonly annotationReveal: 'ui-annotation--reveal';
  readonly annotationFocus: 'ui-annotation--focus';
  readonly mark: 'ui-mark';
  readonly markEvidence: 'ui-mark--evidence';
  readonly markSuccess: 'ui-mark--success';
  readonly markWarning: 'ui-mark--warning';
  readonly markDanger: 'ui-mark--danger';
  readonly markInfo: 'ui-mark--info';
  readonly markMuted: 'ui-mark--muted';
  readonly markUnderline: 'ui-mark--underline';
  readonly markBox: 'ui-mark--box';
  readonly markStrike: 'ui-mark--strike';
  readonly markDraw: 'ui-mark--draw';
  readonly bracketNote: 'ui-bracket-note';
  readonly bracketNoteLabel: 'ui-bracket-note__label';
  readonly bracketNoteEvidence: 'ui-bracket-note--evidence';
  readonly bracketNoteWarning: 'ui-bracket-note--warning';
  readonly bracketNoteDanger: 'ui-bracket-note--danger';
  readonly bracketNoteInfo: 'ui-bracket-note--info';
  readonly connector: 'ui-connector';
  readonly connectorPath: 'ui-connector__path';
  readonly connectorEnd: 'ui-connector__end';
  readonly connectorDashed: 'ui-connector--dashed';
  readonly connectorAccent: 'ui-connector--accent';
  readonly connectorMuted: 'ui-connector--muted';
  readonly connectorSuccess: 'ui-connector--success';
  readonly connectorWarning: 'ui-connector--warning';
  readonly connectorDanger: 'ui-connector--danger';
  readonly connectorInfo: 'ui-connector--info';
  readonly connectorDraw: 'ui-connector--draw';
  readonly spotlight: 'ui-spotlight';
  readonly spotlightHole: 'ui-spotlight__hole';
  readonly spotlightRing: 'ui-spotlight--ring';
  readonly tourNote: 'ui-tour-note';
  readonly tourNoteStep: 'ui-tour-note__step';
  readonly tourNoteTitle: 'ui-tour-note__title';
  readonly tourNoteBody: 'ui-tour-note__body';
  readonly tourNoteActions: 'ui-tour-note__actions';
  readonly crosshair: 'ui-crosshair';
  readonly crosshairMuted: 'ui-crosshair--muted';
  readonly crosshairLine: 'ui-crosshair__line';
  readonly crosshairLineX: 'ui-crosshair__line--x';
  readonly crosshairLineY: 'ui-crosshair__line--y';
  readonly crosshairBadge: 'ui-crosshair__badge';
  readonly readout: 'ui-readout';
  readonly sel: 'ui-sel';
  readonly selOn: 'ui-sel--on';
  readonly selOff: 'ui-sel--off';
  readonly selMaybe: 'ui-sel--maybe';
  readonly printOnly: 'ui-print-only';
  readonly screenOnly: 'ui-screen-only';
  readonly breakBefore: 'ui-break-before';
  readonly breakAfter: 'ui-break-after';
  readonly keep: 'ui-keep';
  readonly printExact: 'ui-print-exact';
  readonly kbd: 'ui-kbd';
  readonly display: 'ui-display';
  readonly mono: 'ui-mono';
  readonly muted: 'ui-muted';
  readonly visuallyHidden: 'ui-visually-hidden';
  readonly reveal: 'ui-reveal';
  readonly stagger: 'ui-stagger';
  readonly staggerAuto: 'ui-stagger--auto';
  readonly matrix: 'ui-matrix';
  readonly skeleton: 'ui-skeleton';
  readonly spinner: 'ui-spinner';
  readonly caret: 'ui-caret';
  readonly animateIn: 'ui-animate-in';
  readonly animateFade: 'ui-animate-fade';
  readonly animateDot: 'ui-animate-dot';
  readonly animateMatrix: 'ui-animate-matrix';
  readonly scrollProgress: 'ui-scroll-progress';
  readonly scrollReveal: 'ui-scroll-reveal';
  readonly vt: 'ui-vt';
  readonly appShell: 'ui-app-shell';
  readonly appShellFull: 'ui-app-shell--full';
  readonly appRail: 'ui-app-rail';
  readonly appRailBrand: 'ui-app-rail__brand';
  readonly appRailToggle: 'ui-app-rail__toggle';
  readonly appRailFoot: 'ui-app-rail__foot';
  readonly appRailAccount: 'ui-app-rail__account';
  readonly appTopbar: 'ui-app-topbar';
  readonly appTopbarTitle: 'ui-app-topbar__title';
  readonly appToolbar: 'ui-app-toolbar';
  readonly appToolbarGroup: 'ui-app-toolbar__group';
  readonly appNav: 'ui-app-nav';
  readonly appNavSection: 'ui-app-nav__section';
  readonly appMain: 'ui-app-main';
  readonly appContent: 'ui-app-content';
  readonly appPanel: 'ui-app-panel';
  readonly appPanelHead: 'ui-app-panel__head';
  readonly appPanelTitle: 'ui-app-panel__title';
  readonly appMetrics: 'ui-app-metrics';
  readonly appMetric: 'ui-app-metric';
  readonly appMetricLabel: 'ui-app-metric__label';
  readonly appMetricValue: 'ui-app-metric__value';
  readonly appMetricDelta: 'ui-app-metric__delta';
  readonly appEmptyState: 'ui-app-empty-state';
  readonly themetoggleButton: 'ui-themetoggle__button';
  readonly themetogglePrefix: 'ui-themetoggle__prefix';
  readonly themetoggleLabel: 'ui-themetoggle__label';
  readonly themetoggleTrack: 'ui-themetoggle__track';
  readonly themetoggleThumb: 'ui-themetoggle__thumb';
};

/** classnames-style joiner: skips falsy, flattens arrays. */
export declare function cx(...parts: ClassValue[]): string;

export interface ButtonOpts {
  variant?: 'ghost' | 'subtle' | 'danger';
  icon?: boolean;
  size?: 'sm' | 'lg';
}
export interface CardOpts {
  accent?: boolean;
  interactive?: boolean;
}
export interface BadgeOpts {
  tone?: 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'muted';
  dot?: boolean;
}
export interface NumOpts {
  tone?: 'pos' | 'neg' | 'muted';
}
export interface ChipOpts {
  accent?: boolean;
}
export interface LinkOpts {
  arrow?: boolean;
  cta?: boolean;
}
export interface DotOpts {
  tone?: 'accent' | 'success' | 'warning' | 'danger' | 'info';
  live?: boolean;
}
export interface DotgridOpts {
  accent?: boolean;
  dense?: boolean;
}
export interface TableOpts {
  density?: 'dense' | 'comfortable';
  lined?: boolean;
}
export interface EyebrowOpts {
  muted?: boolean;
  sm?: boolean;
}
export interface HintOpts {
  error?: boolean;
}
export interface ClusterOpts {
  between?: boolean;
}
export interface StaggerOpts {
  auto?: boolean;
}
export type Tone = 'accent' | 'success' | 'warning' | 'danger' | 'info';
export interface AlertOpts {
  tone?: Tone;
}
export interface ToastOpts {
  tone?: Tone;
}
export interface ProgressOpts {
  indeterminate?: boolean;
}
export interface MeterOpts {
  tone?: 'accent' | 'success' | 'warning' | 'danger';
}
export interface DotspinnerOpts {
  size?: 'sm' | 'lg';
}
export interface DotbarOpts {
  indeterminate?: boolean;
}
export interface ModalOpts {
  drawer?: boolean;
  /** Controlled non-dialog usage — adds the is-open state (focus-trap is yours). */
  open?: boolean;
}
export interface TabOpts {
  active?: boolean;
}
export interface AvatarOpts {
  size?: 'sm' | 'lg';
}
export interface ProseOpts {
  compact?: boolean;
}
export interface ContainerOpts {
  narrow?: boolean;
  wide?: boolean;
}
export interface TagOpts {
  accent?: boolean;
}
export interface InputIconOpts {
  /** Place the icon at the inline-end instead of the start. */
  end?: boolean;
}
export interface LegendOpts {
  /** Stack entries vertically instead of the wrapping inline row. */
  orient?: 'vertical';
  /** Continuous colour ramp (`gradient`) or binned `threshold` key. Omit for the categorical default. */
  type?: 'gradient' | 'threshold';
  /** Use the 7-stop diverging ramp instead of the sequential one (gradient type). */
  diverging?: boolean;
  compact?: boolean;
  /** Align a trailing `__value` column across rows. */
  withValues?: boolean;
  /** Entries are `<button aria-pressed>` toggles (pair with behaviors/legend.js). */
  interactive?: boolean;
}
export interface LegendItemOpts {
  /** Host-set inactive state. Equivalent to `[aria-pressed="false"]` on an interactive entry. */
  inactive?: boolean;
}
export interface LegendSwatchOpts {
  /** Categorical palette series 1–8 — sets the matching `--chart-N` colour. */
  series?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  shape?: 'circle' | 'line';
}
export interface AnnotationOpts {
  variant?: 'label' | 'callout' | 'elbow' | 'curve' | 'circle' | 'rect' | 'threshold' | 'badge' | 'bracket' | 'band' | 'slope' | 'compare' | 'cluster' | 'axis' | 'timeline' | 'evidence';
  tone?: 'accent' | 'muted' | 'success' | 'warning' | 'danger' | 'info';
  motion?: 'draw' | 'pulse' | 'reveal' | 'focus';
}
export interface MarkOpts {
  /** How the mark is drawn. Omit for the highlight fill. */
  style?: 'underline' | 'box' | 'strike';
  /** `evidence` is the rationed accent; status tones for status-bearing emphasis; `muted` for de-emphasis. */
  tone?: 'evidence' | 'success' | 'warning' | 'danger' | 'info' | 'muted';
  /** Draw-on highlight sweep (respects `prefers-reduced-motion`). */
  motion?: 'draw';
}
export interface BracketNoteOpts {
  tone?: 'evidence' | 'warning' | 'danger' | 'info';
}
export interface ConnectorOpts {
  tone?: 'accent' | 'muted' | 'success' | 'warning' | 'danger' | 'info';
  dashed?: boolean;
  /** Stroke the line in once (respects `prefers-reduced-motion`). */
  motion?: 'draw';
}
export interface SpotlightOpts {
  /** Add a ring around the cutout. */
  ring?: boolean;
}
export interface CrosshairOpts {
  /** A subtler, neutral crosshair instead of the accent. */
  muted?: boolean;
}
export interface SelOpts {
  /** Selection emphasis: `on` (selected), `off` (excluded), `maybe` (live-brush candidate). */
  state?: 'on' | 'off' | 'maybe';
}

export interface Ui {
  button(opts?: ButtonOpts): string;
  card(opts?: CardOpts): string;
  badge(opts?: BadgeOpts): string;
  num(opts?: NumOpts): string;
  chip(opts?: ChipOpts): string;
  link(opts?: LinkOpts): string;
  dot(opts?: DotOpts): string;
  dotgrid(opts?: DotgridOpts): string;
  table(opts?: TableOpts): string;
  eyebrow(opts?: EyebrowOpts): string;
  hint(opts?: HintOpts): string;
  cluster(opts?: ClusterOpts): string;
  stagger(opts?: StaggerOpts): string;
  alert(opts?: AlertOpts): string;
  toast(opts?: ToastOpts): string;
  progress(opts?: ProgressOpts): string;
  meter(opts?: MeterOpts): string;
  dotspinner(opts?: DotspinnerOpts): string;
  dotbar(opts?: DotbarOpts): string;
  modal(opts?: ModalOpts): string;
  tab(opts?: TabOpts): string;
  avatar(opts?: AvatarOpts): string;
  prose(opts?: ProseOpts): string;
  container(opts?: ContainerOpts): string;
  tag(opts?: TagOpts): string;
  inputIcon(opts?: InputIconOpts): string;
  legend(opts?: LegendOpts): string;
  legendItem(opts?: LegendItemOpts): string;
  legendSwatch(opts?: LegendSwatchOpts): string;
  annotation(opts?: AnnotationOpts): string;
  mark(opts?: MarkOpts): string;
  bracketNote(opts?: BracketNoteOpts): string;
  connector(opts?: ConnectorOpts): string;
  spotlight(opts?: SpotlightOpts): string;
  crosshair(opts?: CrosshairOpts): string;
  sel(opts?: SelOpts): string;
}

export declare const ui: Ui;
export default ui;
