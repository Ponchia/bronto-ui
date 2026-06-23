/**
 * @ponchia/ui — typed class-name contract.
 *
 * The framework's real API is its class vocabulary. Hand-writing
 * "ui-button ui-button--ghost" everywhere is untyped and typo-prone, so
 * this module turns that contract into data + tiny recipe builders:
 *
 *   import { ui, cx } from '@ponchia/ui/classes';
 *   <button class={ui.button({ variant: 'ghost' })}>
 *   <span class={cx(ui.dot({ tone: 'success' }), 'my-extra')}>
 *
 * Framework-agnostic (returns strings). `cls` is the flat registry of
 * every class the framework defines; recipes only ever emit from it, and
 * scripts/check-classes.mjs fails CI if any entry is missing from the
 * stylesheet — so this file cannot drift from the CSS.
 */

/** Every class @ponchia/ui defines. The single source the recipes draw from. */
export const cls = Object.freeze({
  // primitives
  button: 'ui-button',
  buttonGhost: 'ui-button--ghost',
  buttonSubtle: 'ui-button--subtle',
  buttonDanger: 'ui-button--danger',
  buttonIcon: 'ui-button--icon',
  buttonSm: 'ui-button--sm',
  buttonLg: 'ui-button--lg',
  card: 'ui-card',
  cardHead: 'ui-card__head',
  cardAccent: 'ui-card--accent',
  cardInteractive: 'ui-card--interactive',
  stat: 'ui-stat',
  statgrid: 'ui-statgrid',
  statLabel: 'ui-stat__label',
  statValue: 'ui-stat__value',
  statDelta: 'ui-stat__delta',
  num: 'ui-num',
  numPos: 'ui-num--pos',
  numNeg: 'ui-num--neg',
  numMuted: 'ui-num--muted',
  delta: 'ui-delta',
  deltaUp: 'ui-delta--up',
  deltaDown: 'ui-delta--down',
  deltaFlat: 'ui-delta--flat',
  deltaInvert: 'ui-delta--invert',
  badge: 'ui-badge',
  badgeAccent: 'ui-badge--accent',
  badgeSuccess: 'ui-badge--success',
  badgeWarning: 'ui-badge--warning',
  badgeDanger: 'ui-badge--danger',
  badgeInfo: 'ui-badge--info',
  badgeMuted: 'ui-badge--muted',
  badgeDot: 'ui-badge--dot',
  chip: 'ui-chip',
  chipAccent: 'ui-chip--accent',
  link: 'ui-link',
  linkArrow: 'ui-link--arrow',
  linkCta: 'ui-link--cta',
  keyValue: 'ui-key-value',
  emptyState: 'ui-empty-state',
  // dots
  dot: 'ui-dot',
  dotAccent: 'ui-dot--accent',
  dotSuccess: 'ui-dot--success',
  dotWarning: 'ui-dot--warning',
  dotDanger: 'ui-dot--danger',
  dotInfo: 'ui-dot--info',
  dotLive: 'ui-dot--live',
  dotgrid: 'ui-dotgrid',
  dotgridAccent: 'ui-dotgrid--accent',
  dotgridDense: 'ui-dotgrid--dense',
  dotmatrix: 'ui-dotmatrix',
  dotmatrixCell: 'ui-dotmatrix__cell',
  dotmatrixCellHot: 'ui-dotmatrix__cell--hot',
  dotmatrixCellAccent: 'ui-dotmatrix__cell--accent',
  dotmatrixReveal: 'ui-dotmatrix--reveal',
  dotmatrixPulse: 'ui-dotmatrix--pulse',
  icon: 'ui-icon',
  dotfield: 'ui-dotfield',
  dotrule: 'ui-dotrule',
  dotbar: 'ui-dotbar',
  dotbarIndeterminate: 'ui-dotbar--indeterminate',
  dotloader: 'ui-dotloader',
  dotspinner: 'ui-dotspinner',
  dotspinnerSm: 'ui-dotspinner--sm',
  dotspinnerLg: 'ui-dotspinner--lg',
  // data-bound dot surfaces (reporting/dashboard family)
  waffle: 'ui-waffle',
  activity: 'ui-activity',
  level: 'ui-level',
  levelWarn: 'ui-level--warn',
  levelDanger: 'ui-level--danger',
  dotgauge: 'ui-dotgauge',
  readout: 'ui-readout',
  readoutSpacer: 'ui-readout__spacer',
  halftone: 'ui-halftone',
  dotfit: 'ui-dotfit',
  // forms
  field: 'ui-field',
  label: 'ui-label',
  input: 'ui-input',
  select: 'ui-select',
  textarea: 'ui-textarea',
  search: 'ui-search',
  check: 'ui-check',
  switch: 'ui-switch',
  switchTrack: 'ui-switch__track',
  switchThumb: 'ui-switch__thumb',
  hint: 'ui-hint',
  hintError: 'ui-hint--error',
  inputGroup: 'ui-input-group',
  inputGroupAddon: 'ui-input-group__addon',
  inputIcon: 'ui-input-icon',
  inputIconSlot: 'ui-input-icon__icon',
  inputIconEnd: 'ui-input-icon--end',
  file: 'ui-file',
  range: 'ui-range',
  errorSummary: 'ui-error-summary',
  errorSummaryTitle: 'ui-error-summary__title',
  errorSummaryList: 'ui-error-summary__list',
  // feedback
  alert: 'ui-alert',
  alertTitle: 'ui-alert__title',
  alertBody: 'ui-alert__body',
  alertClose: 'ui-alert__close',
  alertAccent: 'ui-alert--accent',
  alertSuccess: 'ui-alert--success',
  alertWarning: 'ui-alert--warning',
  alertDanger: 'ui-alert--danger',
  alertInfo: 'ui-alert--info',
  toastStack: 'ui-toast-stack',
  toastStackAssertive: 'ui-toast-stack--assertive',
  toast: 'ui-toast',
  toastTitle: 'ui-toast__title',
  toastClose: 'ui-toast__close',
  toastAccent: 'ui-toast--accent',
  toastSuccess: 'ui-toast--success',
  toastWarning: 'ui-toast--warning',
  toastDanger: 'ui-toast--danger',
  toastInfo: 'ui-toast--info',
  tooltip: 'ui-tooltip',
  tooltipBubble: 'ui-tooltip__bubble',
  popover: 'ui-popover',
  progress: 'ui-progress',
  progressBar: 'ui-progress__bar',
  progressIndeterminate: 'ui-progress--indeterminate',
  meter: 'ui-meter',
  meterFill: 'ui-meter__fill',
  meterRow: 'ui-meter__row',
  meterLabel: 'ui-meter__label',
  meterValue: 'ui-meter__value',
  meterAccent: 'ui-meter--accent',
  meterSuccess: 'ui-meter--success',
  meterWarning: 'ui-meter--warning',
  meterDanger: 'ui-meter--danger',
  meterInfo: 'ui-meter--info',
  steps: 'ui-steps',
  stepsItem: 'ui-steps__item',
  stepsItemDone: 'ui-steps__item--done',
  // overlay
  modal: 'ui-modal',
  modalHead: 'ui-modal__head',
  modalTitle: 'ui-modal__title',
  modalBody: 'ui-modal__body',
  modalFoot: 'ui-modal__foot',
  modalClose: 'ui-modal__close',
  modalDrawer: 'ui-modal--drawer',
  menuHost: 'ui-menu-host',
  menu: 'ui-menu',
  menuLabel: 'ui-menu__label',
  menuItem: 'ui-menu__item',
  menuSep: 'ui-menu__sep',
  combobox: 'ui-combobox',
  comboboxInput: 'ui-combobox__input',
  comboboxList: 'ui-combobox__list',
  comboboxOption: 'ui-combobox__option',
  comboboxEmpty: 'ui-combobox__empty',
  lightbox: 'ui-lightbox',
  lightboxClose: 'ui-lightbox__close',
  // disclosure
  tabs: 'ui-tabs',
  tabsList: 'ui-tabs__list',
  tab: 'ui-tab',
  tabsPanel: 'ui-tabs__panel',
  accordion: 'ui-accordion',
  accordionItem: 'ui-accordion__item',
  accordionSummary: 'ui-accordion__summary',
  accordionBody: 'ui-accordion__body',
  segmented: 'ui-segmented',
  segmentedOption: 'ui-segmented__option',
  breadcrumb: 'ui-breadcrumb',
  breadcrumbItem: 'ui-breadcrumb__item',
  pagination: 'ui-pagination',
  paginationItem: 'ui-pagination__item',
  avatar: 'ui-avatar',
  avatarSm: 'ui-avatar--sm',
  avatarLg: 'ui-avatar--lg',
  avatarGroup: 'ui-avatar-group',
  carousel: 'ui-carousel',
  carouselStage: 'ui-carousel__stage',
  carouselViewport: 'ui-carousel__viewport',
  carouselSlide: 'ui-carousel__slide',
  carouselPrev: 'ui-carousel__prev',
  carouselNext: 'ui-carousel__next',
  carouselStatus: 'ui-carousel__status',
  carouselThumbs: 'ui-carousel__thumbs',
  carouselThumb: 'ui-carousel__thumb',
  // table
  table: 'ui-table',
  tableDense: 'ui-table--dense',
  tableComfortable: 'ui-table--comfortable',
  tableLined: 'ui-table--lined',
  tableBreakAnywhere: 'ui-table--break-anywhere',
  tableWrap: 'ui-table-wrap',
  // Loading state goes on the wrap, so the modifier is named for the wrap.
  tableLoading: 'ui-table-wrap--loading',
  tableEmpty: 'ui-table__empty',
  tableSort: 'ui-table__sort',
  tableSelect: 'ui-table__select',
  tableToolbar: 'ui-table__toolbar',
  tableSelectable: 'ui-table--selectable',
  // shell / layout
  panel: 'ui-panel',
  panelHead: 'ui-panel__head',
  surface: 'ui-surface',
  stack: 'ui-stack',
  cluster: 'ui-cluster',
  clusterBetween: 'ui-cluster--between',
  grid: 'ui-grid',
  sidebar: 'ui-sidebar',
  switcher: 'ui-switcher',
  center: 'ui-center',
  ratio: 'ui-ratio',
  cq: 'ui-cq',
  divider: 'ui-divider',
  status: 'ui-status',
  // typography / utilities
  eyebrow: 'ui-eyebrow',
  eyebrowMuted: 'ui-eyebrow--muted',
  eyebrowSm: 'ui-eyebrow--sm',
  prose: 'ui-prose',
  proseCompact: 'ui-prose--compact',
  quote: 'ui-quote',
  quoteCite: 'ui-quote__cite',
  // site shell
  container: 'ui-container',
  containerNarrow: 'ui-container--narrow',
  containerWide: 'ui-container--wide',
  skiplink: 'ui-skiplink',
  siteheader: 'ui-siteheader',
  siteheaderSticky: 'ui-siteheader--sticky',
  siteheaderBrand: 'ui-siteheader__brand',
  siteheaderActions: 'ui-siteheader__actions',
  pagehead: 'ui-pagehead',
  pageheadTitle: 'ui-pagehead__title',
  pageheadActions: 'ui-pagehead__actions',
  sitenav: 'ui-sitenav',
  sitemenu: 'ui-sitemenu',
  sitemenuPanel: 'ui-sitemenu__panel',
  sitefooter: 'ui-sitefooter',
  sitefooterLinks: 'ui-sitefooter__links',
  tags: 'ui-tags',
  tag: 'ui-tag',
  tagAccent: 'ui-tag--accent',
  meta: 'ui-meta',
  metaItem: 'ui-meta__item',
  timeline: 'ui-timeline',
  timelineItem: 'ui-timeline__item',
  timelineTime: 'ui-timeline__time',
  // report kit (opt-in css/report.css)
  report: 'ui-report',
  reportCompact: 'ui-report--compact',
  reportNumbered: 'ui-report--numbered',
  reportCover: 'ui-report__cover',
  reportCoverCompact: 'ui-report__cover--compact',
  reportHead: 'ui-report__head',
  reportTitle: 'ui-report__title',
  reportSubtitle: 'ui-report__subtitle',
  reportMeta: 'ui-report__meta',
  reportToc: 'ui-report__toc',
  reportSummary: 'ui-report__summary',
  reportDecision: 'ui-report__decision',
  reportDecisionKicker: 'ui-report__decision-kicker',
  reportDecisionTitle: 'ui-report__decision-title',
  reportDecisionBody: 'ui-report__decision-body',
  reportDecisionMeta: 'ui-report__decision-meta',
  reportDecisionGrid: 'ui-report__decision-grid',
  reportDecisionItem: 'ui-report__decision-item',
  reportDecisionLabel: 'ui-report__decision-label',
  reportDecisionValue: 'ui-report__decision-value',
  reportSection: 'ui-report__section',
  reportSectionUnnumbered: 'ui-report__section--unnumbered',
  reportSectionHead: 'ui-report__section-head',
  reportFinding: 'ui-report__finding',
  reportFindingCritical: 'ui-report__finding--critical',
  reportFindingMajor: 'ui-report__finding--major',
  reportFindingMinor: 'ui-report__finding--minor',
  reportFindingResolved: 'ui-report__finding--resolved',
  reportFindingTitle: 'ui-report__finding-title',
  reportFindingClaim: 'ui-report__finding-claim',
  reportFindingImpact: 'ui-report__finding-impact',
  reportFindingRemediation: 'ui-report__finding-remediation',
  reportFindingEvidence: 'ui-report__finding-evidence',
  reportFindingCaveat: 'ui-report__finding-caveat',
  reportEvidence: 'ui-report__evidence',
  reportFigure: 'ui-report__figure',
  reportCaption: 'ui-report__caption',
  reportSources: 'ui-report__sources',
  reportAppendix: 'ui-report__appendix',
  reportFootnotes: 'ui-report__footnotes',
  reportActions: 'ui-report__actions',
  reportAction: 'ui-report__action',
  reportActionStatus: 'ui-report__action-status',
  reportActionTitle: 'ui-report__action-title',
  reportActionOwner: 'ui-report__action-owner',
  reportActionDue: 'ui-report__action-due',
  reportActionPriority: 'ui-report__action-priority',
  reportActionCriteria: 'ui-report__action-criteria',
  reportActionSource: 'ui-report__action-source',
  claim: 'ui-claim',
  claimSupported: 'ui-claim--supported',
  claimPartial: 'ui-claim--partial',
  claimDisputed: 'ui-claim--disputed',
  claimUnsupported: 'ui-claim--unsupported',
  claimUnknown: 'ui-claim--unknown',
  claimStatement: 'ui-claim__statement',
  claimStatus: 'ui-claim__status',
  claimScope: 'ui-claim__scope',
  claimBasis: 'ui-claim__basis',
  claimLimits: 'ui-claim__limits',
  claimRefs: 'ui-claim__refs',
  claimCaveat: 'ui-claim__caveat',
  evidenceGrid: 'ui-evidence-grid',
  evidenceLedger: 'ui-evidence-ledger',
  evidenceItem: 'ui-evidence-item',
  evidenceItemTitle: 'ui-evidence-item__title',
  evidenceItemMeta: 'ui-evidence-item__meta',
  evidenceItemBody: 'ui-evidence-item__body',
  evidenceItemKind: 'ui-evidence-item__kind',
  evidenceItemMethod: 'ui-evidence-item__method',
  evidenceItemWindow: 'ui-evidence-item__window',
  evidenceItemValue: 'ui-evidence-item__value',
  evidenceItemSource: 'ui-evidence-item__source',
  evidenceItemCaveat: 'ui-evidence-item__caveat',
  compare: 'ui-compare',
  compare2up: 'ui-compare--2up',
  compareCol: 'ui-compare__col',
  compareHead: 'ui-compare__head',
  // figure — analytical/report figure stage (css/figure.css)
  figure: 'ui-figure',
  figureCaption: 'ui-figure__caption',
  figureBody: 'ui-figure__body',
  figureBodyKeyRight: 'ui-figure__body--key-right',
  figureStage: 'ui-figure__stage',
  figureMedia: 'ui-figure__media',
  figureOverlay: 'ui-figure__overlay',
  figureKey: 'ui-figure__key',
  figureData: 'ui-figure__data',
  // legend (standalone data keys — css/legend.css)
  legend: 'ui-legend',
  legendVertical: 'ui-legend--vertical',
  legendCompact: 'ui-legend--compact',
  legendGradient: 'ui-legend--gradient',
  legendDiverging: 'ui-legend--diverging',
  legendThreshold: 'ui-legend--threshold',
  legendWithValues: 'ui-legend--with-values',
  legendInteractive: 'ui-legend--interactive',
  legendTitle: 'ui-legend__title',
  legendItem: 'ui-legend__item',
  legendSwatch: 'ui-legend__swatch',
  legendSwatchCircle: 'ui-legend__swatch--circle',
  legendSwatchLine: 'ui-legend__swatch--line',
  legendSwatch1: 'ui-legend__swatch--1',
  legendSwatch2: 'ui-legend__swatch--2',
  legendSwatch3: 'ui-legend__swatch--3',
  legendSwatch4: 'ui-legend__swatch--4',
  legendSwatch5: 'ui-legend__swatch--5',
  legendSwatch6: 'ui-legend__swatch--6',
  legendSwatch7: 'ui-legend__swatch--7',
  legendSwatch8: 'ui-legend__swatch--8',
  legendSymbol: 'ui-legend__symbol',
  legendLabel: 'ui-legend__label',
  legendValue: 'ui-legend__value',
  legendCaption: 'ui-legend__caption',
  legendTrack: 'ui-legend__track',
  legendTicks: 'ui-legend__ticks',
  legendTick: 'ui-legend__tick',
  annotation: 'ui-annotation',
  annotationSubject: 'ui-annotation__subject',
  annotationConnector: 'ui-annotation__connector',
  annotationConnectorEnd: 'ui-annotation__connector-end',
  annotationNote: 'ui-annotation__note',
  annotationNoteLine: 'ui-annotation__note-line',
  annotationTitle: 'ui-annotation__title',
  annotationLabel: 'ui-annotation__label',
  annotationBadge: 'ui-annotation__badge',
  annotationLabelVariant: 'ui-annotation--label',
  annotationCallout: 'ui-annotation--callout',
  annotationElbow: 'ui-annotation--elbow',
  annotationCurve: 'ui-annotation--curve',
  annotationCircle: 'ui-annotation--circle',
  annotationRect: 'ui-annotation--rect',
  annotationThreshold: 'ui-annotation--threshold',
  annotationBadgeVariant: 'ui-annotation--badge',
  annotationBracket: 'ui-annotation--bracket',
  annotationBand: 'ui-annotation--band',
  annotationSlope: 'ui-annotation--slope',
  annotationCompare: 'ui-annotation--compare',
  annotationCluster: 'ui-annotation--cluster',
  annotationAxis: 'ui-annotation--axis',
  annotationTimeline: 'ui-annotation--timeline',
  annotationEvidence: 'ui-annotation--evidence',
  annotationAccent: 'ui-annotation--accent',
  annotationMuted: 'ui-annotation--muted',
  annotationSuccess: 'ui-annotation--success',
  annotationWarning: 'ui-annotation--warning',
  annotationDanger: 'ui-annotation--danger',
  annotationInfo: 'ui-annotation--info',
  annotationDraw: 'ui-annotation--draw',
  annotationPulse: 'ui-annotation--pulse',
  annotationReveal: 'ui-annotation--reveal',
  annotationFocus: 'ui-annotation--focus',
  // marks (evidence/emphasis for running text — css/marks.css)
  mark: 'ui-mark',
  markAccent: 'ui-mark--accent',
  markSuccess: 'ui-mark--success',
  markWarning: 'ui-mark--warning',
  markDanger: 'ui-mark--danger',
  markInfo: 'ui-mark--info',
  markMuted: 'ui-mark--muted',
  markUnderline: 'ui-mark--underline',
  markBox: 'ui-mark--box',
  markStrike: 'ui-mark--strike',
  markDraw: 'ui-mark--draw',
  bracketNote: 'ui-bracket-note',
  bracketNoteLabel: 'ui-bracket-note__label',
  bracketNoteAccent: 'ui-bracket-note--accent',
  bracketNoteSuccess: 'ui-bracket-note--success',
  bracketNoteWarning: 'ui-bracket-note--warning',
  bracketNoteDanger: 'ui-bracket-note--danger',
  bracketNoteInfo: 'ui-bracket-note--info',
  // connectors (leader lines — css/connectors.css)
  connector: 'ui-connector',
  connectorPath: 'ui-connector__path',
  connectorEnd: 'ui-connector__end',
  connectorDashed: 'ui-connector--dashed',
  connectorAccent: 'ui-connector--accent',
  connectorMuted: 'ui-connector--muted',
  connectorSuccess: 'ui-connector--success',
  connectorWarning: 'ui-connector--warning',
  connectorDanger: 'ui-connector--danger',
  connectorInfo: 'ui-connector--info',
  connectorDraw: 'ui-connector--draw',
  // spotlight (guided-focus overlay — css/spotlight.css)
  spotlight: 'ui-spotlight',
  spotlightHole: 'ui-spotlight__hole',
  spotlightRing: 'ui-spotlight--ring',
  tourNote: 'ui-tour-note',
  tourNoteStep: 'ui-tour-note__step',
  tourNoteTitle: 'ui-tour-note__title',
  tourNoteBody: 'ui-tour-note__body',
  tourNoteActions: 'ui-tour-note__actions',
  // crosshair (plot ruler + readout — css/crosshair.css)
  crosshair: 'ui-crosshair',
  crosshairMuted: 'ui-crosshair--muted',
  crosshairLine: 'ui-crosshair__line',
  crosshairLineX: 'ui-crosshair__line--x',
  crosshairLineY: 'ui-crosshair__line--y',
  crosshairBadge: 'ui-crosshair__badge',
  // selection-state vocabulary (cross-cutting — css/selection.css)
  sel: 'ui-sel',
  selOn: 'ui-sel--on',
  selOff: 'ui-sel--off',
  selMaybe: 'ui-sel--maybe',
  // source / citation / provenance — the trust layer (css/sources.css)
  citation: 'ui-citation',
  citationChip: 'ui-citation--chip',
  sourceList: 'ui-source-list',
  sourceListItem: 'ui-source-list__item',
  sourceCard: 'ui-source-card',
  sourceCardTitle: 'ui-source-card__title',
  sourceCardOrigin: 'ui-source-card__origin',
  sourceCardTime: 'ui-source-card__time',
  sourceCardExcerpt: 'ui-source-card__excerpt',
  sourceCardActions: 'ui-source-card__actions',
  provenance: 'ui-provenance',
  provenanceItem: 'ui-provenance__item',
  src: 'ui-src',
  srcVerified: 'ui-src--verified',
  srcUnverified: 'ui-src--unverified',
  srcGenerated: 'ui-src--generated',
  srcReviewed: 'ui-src--reviewed',
  srcStale: 'ui-src--stale',
  srcConflict: 'ui-src--conflict',
  // interval — low/high uncertainty span (css/interval.css)
  interval: 'ui-interval',
  intervalTrack: 'ui-interval__track',
  intervalRange: 'ui-interval__range',
  intervalPoint: 'ui-interval__point',
  intervalLabel: 'ui-interval__label',
  intervalBounds: 'ui-interval__bounds',
  // clamp — bounded excerpt + reveal (css/clamp.css)
  clamp: 'ui-clamp',
  clampBody: 'ui-clamp__body',
  clampToggle: 'ui-clamp__toggle',
  clampControl: 'ui-clamp__control',
  clampMore: 'ui-clamp__more',
  clampLess: 'ui-clamp__less',
  // highlights — CSS Custom Highlight API paint host (css/highlights.css)
  highlights: 'ui-highlights',
  // diff — line/row change-review grammar (css/diff.css)
  diff: 'ui-diff',
  diffSplit: 'ui-diff--split',
  diffPane: 'ui-diff__pane',
  diffHunk: 'ui-diff__hunk',
  diffHead: 'ui-diff__head',
  diffRow: 'ui-diff__row',
  diffRowAdd: 'ui-diff__row--add',
  diffRowRemove: 'ui-diff__row--remove',
  diffRowContext: 'ui-diff__row--context',
  diffLn: 'ui-diff__ln',
  diffCode: 'ui-diff__code',
  // code — fenced-code evidence chrome (css/code.css)
  code: 'ui-code',
  codeNumbered: 'ui-code--numbered',
  codeHead: 'ui-code__head',
  codeBody: 'ui-code__body',
  codeLine: 'ui-code__line',
  codeLineAdd: 'ui-code__line--add',
  codeLineRemove: 'ui-code__line--remove',
  codeLineHl: 'ui-code__line--hl',
  // spark — inline datawords / microcharts (css/spark.css)
  spark: 'ui-spark',
  sparkDots: 'ui-spark--dots',
  sparkBar: 'ui-spark__bar',
  sparkBarAccent: 'ui-spark__bar--accent',
  sparkBarPos: 'ui-spark__bar--pos',
  sparkBarNeg: 'ui-spark__bar--neg',
  // sidenote — Tufte margin notes (css/sidenote.css)
  sidenote: 'ui-sidenote',
  marginnote: 'ui-marginnote',
  sidenoteRef: 'ui-sidenote__ref',
  // textref — deep-link-to-cited-text provenance link (css/textref.css)
  textref: 'ui-textref',
  // bullet — Stephen-Few bullet graph: measure vs target vs bands (css/bullet.css)
  bullet: 'ui-bullet',
  bulletMeasure: 'ui-bullet__measure',
  bulletMeasureAccent: 'ui-bullet__measure--accent',
  bulletMeasurePos: 'ui-bullet__measure--pos',
  bulletMeasureNeg: 'ui-bullet__measure--neg',
  bulletTarget: 'ui-bullet__target',
  bulletLabel: 'ui-bullet__label',
  // term — inline glossary term + definition popover + glossary <dl> (css/term.css)
  term: 'ui-term',
  def: 'ui-def',
  glossary: 'ui-glossary',
  glossaryTerm: 'ui-glossary__term',
  glossaryDef: 'ui-glossary__def',
  // toc — scrollspy table-of-contents rail (css/toc.css)
  toc: 'ui-toc',
  tocTitle: 'ui-toc__title',
  tocList: 'ui-toc__list',
  tocLink: 'ui-toc__link',
  // tree — hierarchy outline on nested <details> (css/tree.css)
  tree: 'ui-tree',
  treeBranch: 'ui-tree__branch',
  treeLeaf: 'ui-tree__leaf',
  treeSummary: 'ui-tree__summary',
  treeLabel: 'ui-tree__label',
  // lifecycle / system state (css/state.css)
  state: 'ui-state',
  stateLabel: 'ui-state__label',
  stateDetail: 'ui-state__detail',
  stateBusy: 'ui-state--busy',
  stateSaving: 'ui-state--saving',
  stateSaved: 'ui-state--saved',
  stateQueued: 'ui-state--queued',
  stateOffline: 'ui-state--offline',
  stateStale: 'ui-state--stale',
  stateConflict: 'ui-state--conflict',
  stateError: 'ui-state--error',
  stateLocked: 'ui-state--locked',
  stateReviewed: 'ui-state--reviewed',
  stateNeedsReview: 'ui-state--needs-review',
  syncbar: 'ui-syncbar',
  job: 'ui-job',
  jobHead: 'ui-job__head',
  jobTitle: 'ui-job__title',
  jobMeta: 'ui-job__meta',
  jobBody: 'ui-job__body',
  jobProgress: 'ui-job__progress',
  jobBar: 'ui-job__bar',
  jobActions: 'ui-job__actions',
  jobCompact: 'ui-job--compact',
  jobQueued: 'ui-job--queued',
  jobRunning: 'ui-job--running',
  jobBlocked: 'ui-job--blocked',
  jobFailed: 'ui-job--failed',
  jobComplete: 'ui-job--complete',
  // generated content / AI-trust surfaces (css/generated.css)
  generated: 'ui-generated',
  generatedLabel: 'ui-generated__label',
  originLabel: 'ui-origin-label',
  originLabelAi: 'ui-origin-label--ai',
  reasoning: 'ui-reasoning',
  reasoningBody: 'ui-reasoning__body',
  toolLog: 'ui-tool-log',
  toolCall: 'ui-tool-call',
  toolCallName: 'ui-tool-call__name',
  toolCallStatus: 'ui-tool-call__status',
  toolCallBody: 'ui-tool-call__body',
  // workbench — inspector / property / toolstrip / selection bar / splitter (css/workbench.css)
  inspector: 'ui-inspector',
  inspectorHead: 'ui-inspector__head',
  inspectorBody: 'ui-inspector__body',
  toolstrip: 'ui-toolstrip',
  toolstripFloating: 'ui-toolstrip--floating',
  toolstripCompact: 'ui-toolstrip--compact',
  toolstripBrand: 'ui-toolstrip__brand',
  toolstripContext: 'ui-toolstrip__context',
  toolstripGroup: 'ui-toolstrip__group',
  toolstripActions: 'ui-toolstrip__actions',
  toolstripSearch: 'ui-toolstrip__search',
  segmentedButtons: 'ui-segmented-buttons',
  segmentedButtonsButton: 'ui-segmented-buttons__button',
  property: 'ui-property',
  propertyLabel: 'ui-property__label',
  propertyValue: 'ui-property__value',
  selectionbar: 'ui-selectionbar',
  selectionbarCount: 'ui-selectionbar__count',
  selectionbarActions: 'ui-selectionbar__actions',
  splitter: 'ui-splitter',
  splitterVertical: 'ui-splitter--vertical',
  splitterHorizontal: 'ui-splitter--horizontal',
  splitterPane: 'ui-splitter__pane',
  splitterHandle: 'ui-splitter__handle',
  // command palette shell (css/command.css + initCommand)
  command: 'ui-command',
  commandInput: 'ui-command__input',
  commandList: 'ui-command__list',
  commandGroup: 'ui-command__group',
  commandItem: 'ui-command__item',
  commandShortcut: 'ui-command__shortcut',
  commandMeta: 'ui-command__meta',
  commandEmpty: 'ui-command__empty',
  printOnly: 'ui-print-only',
  screenOnly: 'ui-screen-only',
  breakBefore: 'ui-break-before',
  breakAfter: 'ui-break-after',
  keep: 'ui-keep',
  printExact: 'ui-print-exact',
  kbd: 'ui-kbd',
  shortcut: 'ui-shortcut',
  shortcutSep: 'ui-shortcut__sep',
  display: 'ui-display',
  mono: 'ui-mono',
  muted: 'ui-muted',
  visuallyHidden: 'ui-visually-hidden',
  // motion
  reveal: 'ui-reveal',
  stagger: 'ui-stagger',
  staggerAuto: 'ui-stagger--auto',
  matrix: 'ui-matrix',
  skeleton: 'ui-skeleton',
  spinner: 'ui-spinner',
  caret: 'ui-caret',
  animateIn: 'ui-animate-in',
  animateFade: 'ui-animate-fade',
  animateDot: 'ui-animate-dot',
  animateMatrix: 'ui-animate-matrix',
  scrollProgress: 'ui-scroll-progress',
  scrollReveal: 'ui-scroll-reveal',
  vt: 'ui-vt',
  // admin shell (was the legacy .app-* vocabulary; promoted in 0.3.0)
  appShell: 'ui-app-shell',
  appShellFull: 'ui-app-shell--full',
  appRail: 'ui-app-rail',
  appRailBrand: 'ui-app-rail__brand',
  appRailFoot: 'ui-app-rail__foot',
  appRailAccount: 'ui-app-rail__account',
  appTopbar: 'ui-app-topbar',
  appTopbarTitle: 'ui-app-topbar__title',
  appToolbar: 'ui-app-toolbar',
  appToolbarGroup: 'ui-app-toolbar__group',
  appNav: 'ui-app-nav',
  appNavSection: 'ui-app-nav__section',
  appMain: 'ui-app-main',
  appContent: 'ui-app-content',
  appPanel: 'ui-app-panel',
  appPanelHead: 'ui-app-panel__head',
  appPanelTitle: 'ui-app-panel__title',
  appMetrics: 'ui-app-metrics',
  appMetric: 'ui-app-metric',
  appMetricLabel: 'ui-app-metric__label',
  appMetricValue: 'ui-app-metric__value',
  appMetricDelta: 'ui-app-metric__delta',
  appEmptyState: 'ui-app-empty-state',
  // theme toggle (was the legacy .theme-toggle__* vocabulary)
  themetoggleButton: 'ui-themetoggle__button',
  themetogglePrefix: 'ui-themetoggle__prefix',
  themetoggleLabel: 'ui-themetoggle__label',
  themetoggleTrack: 'ui-themetoggle__track',
  themetoggleThumb: 'ui-themetoggle__thumb',
});

/** classnames-style joiner: skips falsy, flattens nested arrays of any depth. */
export function cx(...parts) {
  const out = [];
  for (const p of parts.flat(Infinity)) if (p) out.push(p);
  return out.join(' ');
}

const j = (...p) => p.filter(Boolean).join(' ');

// Lifecycle state → canonical tone class.
const stateTone = (state) =>
  ({
    saving: cls.stateSaving,
    saved: cls.stateSaved,
    queued: cls.stateQueued,
    offline: cls.stateOffline,
    stale: cls.stateStale,
    conflict: cls.stateConflict,
    error: cls.stateError,
    locked: cls.stateLocked,
    reviewed: cls.stateReviewed,
    'needs-review': cls.stateNeedsReview,
  })[state] || '';

const jobTone = (state) =>
  ({
    queued: cls.jobQueued,
    running: cls.jobRunning,
    blocked: cls.jobBlocked,
    failed: cls.jobFailed,
    complete: cls.jobComplete,
  })[state] || '';

// Trust-state → tone class, shared by the source/citation/provenance recipes.
// Object-literal lookup to match stateTone above (shorter, greppable, one idiom).
const srcTone = (state) =>
  ({
    verified: cls.srcVerified,
    unverified: cls.srcUnverified,
    generated: cls.srcGenerated,
    reviewed: cls.srcReviewed,
    stale: cls.srcStale,
    conflict: cls.srcConflict,
  })[state] || '';

// Component tone → modifier class. Same object-literal idiom as srcTone/stateTone
// while keeping modifier classes grep-friendly.
//
// The set differs PER COMPONENT on purpose — `muted` is a badge/num tone, not an
// alert/toast/meter/dot one — so a caller extrapolating a universal tone (e.g.
// `ui.alert({ tone: 'muted' })`) used to get a silent no-op: a bare, untoned
// element with no signal that the tone was dropped. Warn at dev time instead, so
// that "validates-but-no-ops" trap is loud rather than invisible. An omitted tone
// is fine and returns no modifier.
const toneClass = (component, map, tone) => {
  if (tone == null) return '';
  const hit = map[tone];
  if (!hit && typeof console !== 'undefined') {
    console.warn(
      `[bronto] ui.${component}(): "${tone}" is not a ${component} tone (use one of: ${Object.keys(map).join(', ')}).`,
    );
  }
  return hit || '';
};

const badgeTone = (tone) =>
  toneClass(
    'badge',
    {
      accent: cls.badgeAccent,
      success: cls.badgeSuccess,
      warning: cls.badgeWarning,
      danger: cls.badgeDanger,
      info: cls.badgeInfo,
      muted: cls.badgeMuted,
    },
    tone,
  );

const numTone = (tone) =>
  toneClass('num', { pos: cls.numPos, neg: cls.numNeg, muted: cls.numMuted }, tone);

const dotTone = (tone) =>
  toneClass(
    'dot',
    {
      accent: cls.dotAccent,
      success: cls.dotSuccess,
      warning: cls.dotWarning,
      danger: cls.dotDanger,
      info: cls.dotInfo,
    },
    tone,
  );

const alertTone = (tone) =>
  toneClass(
    'alert',
    {
      accent: cls.alertAccent,
      success: cls.alertSuccess,
      warning: cls.alertWarning,
      danger: cls.alertDanger,
      info: cls.alertInfo,
    },
    tone,
  );

const toastTone = (tone) =>
  toneClass(
    'toast',
    {
      accent: cls.toastAccent,
      success: cls.toastSuccess,
      warning: cls.toastWarning,
      danger: cls.toastDanger,
      info: cls.toastInfo,
    },
    tone,
  );

const meterTone = (tone) =>
  toneClass(
    'meter',
    {
      accent: cls.meterAccent,
      success: cls.meterSuccess,
      warning: cls.meterWarning,
      danger: cls.meterDanger,
      info: cls.meterInfo,
    },
    tone,
  );

const reportFindingSeverity = (severity) =>
  toneClass(
    'reportFinding',
    {
      critical: cls.reportFindingCritical,
      major: cls.reportFindingMajor,
      minor: cls.reportFindingMinor,
      resolved: cls.reportFindingResolved,
    },
    severity,
  );

const claimStatus = (status) =>
  toneClass(
    'claim',
    {
      supported: cls.claimSupported,
      partial: cls.claimPartial,
      disputed: cls.claimDisputed,
      unsupported: cls.claimUnsupported,
      unknown: cls.claimUnknown,
    },
    status,
  );

const valueClass = (map, value) => (value == null ? '' : map[value] || '');

const annotationVariants = Object.freeze({
  label: cls.annotationLabelVariant,
  callout: cls.annotationCallout,
  elbow: cls.annotationElbow,
  curve: cls.annotationCurve,
  circle: cls.annotationCircle,
  rect: cls.annotationRect,
  threshold: cls.annotationThreshold,
  badge: cls.annotationBadgeVariant,
  bracket: cls.annotationBracket,
  band: cls.annotationBand,
  slope: cls.annotationSlope,
  compare: cls.annotationCompare,
  cluster: cls.annotationCluster,
  axis: cls.annotationAxis,
  timeline: cls.annotationTimeline,
  evidence: cls.annotationEvidence,
});

const annotationTones = Object.freeze({
  accent: cls.annotationAccent,
  muted: cls.annotationMuted,
  success: cls.annotationSuccess,
  warning: cls.annotationWarning,
  danger: cls.annotationDanger,
  info: cls.annotationInfo,
});

const annotationMotions = Object.freeze({
  draw: cls.annotationDraw,
  pulse: cls.annotationPulse,
  reveal: cls.annotationReveal,
  focus: cls.annotationFocus,
});

export const ui = {
  button: ({ variant, icon, size } = {}) =>
    j(
      cls.button,
      variant === 'ghost' && cls.buttonGhost,
      variant === 'subtle' && cls.buttonSubtle,
      variant === 'danger' && cls.buttonDanger,
      icon && cls.buttonIcon,
      size === 'sm' && cls.buttonSm,
      size === 'lg' && cls.buttonLg,
    ),
  card: ({ accent, interactive } = {}) =>
    j(cls.card, accent && cls.cardAccent, interactive && cls.cardInteractive),
  badge: ({ tone, dot } = {}) => j(cls.badge, badgeTone(tone), dot && cls.badgeDot),
  num: ({ tone } = {}) => j(cls.num, numTone(tone)),
  delta: ({ dir, invert } = {}) =>
    j(
      cls.delta,
      dir === 'up' && cls.deltaUp,
      dir === 'down' && cls.deltaDown,
      dir === 'flat' && cls.deltaFlat,
      invert && cls.deltaInvert,
    ),
  compare: ({ cols } = {}) => j(cls.compare, cols === 2 && cls.compare2up),
  reportFinding: ({ severity } = {}) => j(cls.reportFinding, reportFindingSeverity(severity)),
  claim: ({ status } = {}) => j(cls.claim, claimStatus(status)),
  chip: ({ accent } = {}) => j(cls.chip, accent && cls.chipAccent),
  link: ({ arrow, cta } = {}) => j(cls.link, arrow && cls.linkArrow, cta && cls.linkCta),
  dot: ({ tone, live } = {}) => j(cls.dot, dotTone(tone), live && cls.dotLive),
  dotgrid: ({ accent, dense } = {}) =>
    j(cls.dotgrid, accent && cls.dotgridAccent, dense && cls.dotgridDense),
  table: ({ density, lined, breakAnywhere } = {}) =>
    j(
      cls.table,
      density === 'dense' && cls.tableDense,
      density === 'comfortable' && cls.tableComfortable,
      lined && cls.tableLined,
      breakAnywhere && cls.tableBreakAnywhere,
    ),
  eyebrow: ({ muted, sm } = {}) => j(cls.eyebrow, muted && cls.eyebrowMuted, sm && cls.eyebrowSm),
  hint: ({ error } = {}) => j(cls.hint, error && cls.hintError),
  cluster: ({ between } = {}) => j(cls.cluster, between && cls.clusterBetween),
  stagger: ({ auto } = {}) => j(cls.stagger, auto && cls.staggerAuto),
  alert: ({ tone } = {}) => j(cls.alert, alertTone(tone)),
  toast: ({ tone } = {}) => j(cls.toast, toastTone(tone)),
  progress: ({ indeterminate } = {}) => j(cls.progress, indeterminate && cls.progressIndeterminate),
  meter: ({ tone } = {}) => j(cls.meter, meterTone(tone)),
  dotspinner: ({ size } = {}) =>
    j(cls.dotspinner, size === 'sm' && cls.dotspinnerSm, size === 'lg' && cls.dotspinnerLg),
  dotbar: ({ indeterminate } = {}) => j(cls.dotbar, indeterminate && cls.dotbarIndeterminate),
  modal: ({ drawer, open } = {}) => j(cls.modal, drawer && cls.modalDrawer, open && 'is-open'),
  tab: ({ active } = {}) => j(cls.tab, active && 'is-active'),
  avatar: ({ size } = {}) =>
    j(cls.avatar, size === 'sm' && cls.avatarSm, size === 'lg' && cls.avatarLg),
  prose: ({ compact } = {}) => j(cls.prose, compact && cls.proseCompact),
  container: ({ narrow, wide } = {}) =>
    j(cls.container, narrow && cls.containerNarrow, wide && cls.containerWide),
  tag: ({ accent } = {}) => j(cls.tag, accent && cls.tagAccent),
  inputIcon: ({ end } = {}) => j(cls.inputIcon, end && cls.inputIconEnd),
  legend: ({ orient, type, diverging, compact, withValues, interactive } = {}) =>
    j(
      cls.legend,
      orient === 'vertical' && cls.legendVertical,
      type === 'gradient' && cls.legendGradient,
      type === 'threshold' && cls.legendThreshold,
      diverging && cls.legendDiverging,
      compact && cls.legendCompact,
      withValues && cls.legendWithValues,
      interactive && cls.legendInteractive,
    ),
  legendItem: ({ inactive } = {}) => j(cls.legendItem, inactive && 'is-inactive'),
  legendSwatch: ({ series, shape } = {}) =>
    j(
      cls.legendSwatch,
      // Series 1–8 map to ui-legend__swatch--N; the explicit bounds-check keeps a
      // 0/9/non-integer from coining a class the stylesheet never defines.
      Number.isInteger(series) && series >= 1 && series <= 8 && cls[`legendSwatch${series}`],
      shape === 'circle' && cls.legendSwatchCircle,
      shape === 'line' && cls.legendSwatchLine,
    ),
  annotation: ({ variant = 'callout', tone = 'accent', motion } = {}) =>
    j(
      cls.annotation,
      valueClass(annotationVariants, variant),
      valueClass(annotationTones, tone),
      valueClass(annotationMotions, motion),
    ),
  mark: ({ style, tone, motion } = {}) =>
    j(
      cls.mark,
      style === 'underline' && cls.markUnderline,
      style === 'box' && cls.markBox,
      style === 'strike' && cls.markStrike,
      tone === 'accent' && cls.markAccent,
      tone === 'success' && cls.markSuccess,
      tone === 'warning' && cls.markWarning,
      tone === 'danger' && cls.markDanger,
      tone === 'info' && cls.markInfo,
      tone === 'muted' && cls.markMuted,
      motion === 'draw' && cls.markDraw,
    ),
  bracketNote: ({ tone } = {}) =>
    j(
      cls.bracketNote,
      tone === 'accent' && cls.bracketNoteAccent,
      tone === 'success' && cls.bracketNoteSuccess,
      tone === 'warning' && cls.bracketNoteWarning,
      tone === 'danger' && cls.bracketNoteDanger,
      tone === 'info' && cls.bracketNoteInfo,
    ),
  connector: ({ tone, dashed, motion } = {}) =>
    j(
      cls.connector,
      tone === 'accent' && cls.connectorAccent,
      tone === 'muted' && cls.connectorMuted,
      tone === 'success' && cls.connectorSuccess,
      tone === 'warning' && cls.connectorWarning,
      tone === 'danger' && cls.connectorDanger,
      tone === 'info' && cls.connectorInfo,
      dashed && cls.connectorDashed,
      motion === 'draw' && cls.connectorDraw,
    ),
  spotlight: ({ ring } = {}) => j(cls.spotlight, ring && cls.spotlightRing),
  crosshair: ({ muted } = {}) => j(cls.crosshair, muted && cls.crosshairMuted),
  sel: ({ state } = {}) =>
    j(
      cls.sel,
      state === 'on' && cls.selOn,
      state === 'off' && cls.selOff,
      state === 'maybe' && cls.selMaybe,
    ),
  citation: ({ chip, state } = {}) => j(cls.citation, chip && cls.citationChip, srcTone(state)),
  source: ({ state } = {}) => j(cls.sourceCard, srcTone(state)),
  provenance: ({ state } = {}) => j(cls.provenance, srcTone(state)),
  diff: ({ split } = {}) => j(cls.diff, split && cls.diffSplit),
  diffRow: ({ change } = {}) =>
    j(
      cls.diffRow,
      change === 'add' && cls.diffRowAdd,
      change === 'remove' && cls.diffRowRemove,
      change === 'context' && cls.diffRowContext,
    ),
  code: ({ numbered } = {}) => j(cls.code, numbered && cls.codeNumbered),
  codeLine: ({ change } = {}) =>
    j(
      cls.codeLine,
      change === 'add' && cls.codeLineAdd,
      change === 'remove' && cls.codeLineRemove,
      change === 'hl' && cls.codeLineHl,
    ),
  sparkBar: ({ tone } = {}) =>
    j(
      cls.sparkBar,
      tone === 'accent' && cls.sparkBarAccent,
      tone === 'pos' && cls.sparkBarPos,
      tone === 'neg' && cls.sparkBarNeg,
    ),
  bulletMeasure: ({ tone } = {}) =>
    j(
      cls.bulletMeasure,
      tone === 'accent' && cls.bulletMeasureAccent,
      tone === 'pos' && cls.bulletMeasurePos,
      tone === 'neg' && cls.bulletMeasureNeg,
    ),
  state: ({ state, busy } = {}) => j(cls.state, stateTone(state), busy && cls.stateBusy),
  job: ({ state, compact } = {}) => j(cls.job, jobTone(state), compact && cls.jobCompact),
  originLabel: ({ ai } = {}) => j(cls.originLabel, ai && cls.originLabelAi),
};

// Attribute + style bundle for the data-bearing fills (`ui-meter`/`ui-progress`).
// The class string alone paints a 0-width, unannounced bar: the fill width is a
// UNITLESS `--value` (0–100) and AT needs role + aria-valuenow/min/max. This sets
// the painted value and its announced value together so they can't drift, and
// normalizes an arbitrary {min,max} to the 0–100 `--value` the CSS expects while
// keeping aria-valuenow in the caller's real units.
// `busyWhenIndeterminate` — a progressbar advertises aria-busy when its value is
// unknown; a meter is never indeterminate so it passes false. (Kept a boolean
// flag rather than testing the role string, so check:recipe-types doesn't read it
// as a recipe option literal.)
const valueAttrs = (role, value, min, max, busyWhenIndeterminate) => {
  const lo = Number(min);
  const hi = Number(max);
  const raw = Number(value);
  // Indeterminate: an omitted/unknown value (attrs.progress() with no argument).
  // ARIA requires aria-valuenow be OMITTED here — emitting 0 announces "0%",
  // indistinguishable from a real stalled-at-zero bar. A progressbar instead
  // advertises aria-busy; a meter has no indeterminate state, so a non-finite
  // value there is a caller error we still fail safe on by omitting the
  // misleading 0. Pair with `ui.progress({ indeterminate: true })` for the CSS
  // sweep.
  if (!Number.isFinite(raw)) {
    return busyWhenIndeterminate ? { role, 'aria-busy': 'true' } : { role };
  }
  const now = Math.min(hi, Math.max(lo, raw));
  const pct = hi > lo ? ((now - lo) / (hi - lo)) * 100 : 0;
  return {
    role,
    'aria-valuenow': now,
    'aria-valuemin': lo,
    'aria-valuemax': hi,
    style: { '--value': Math.round(pct * 100) / 100 },
  };
};

/**
 * ARIA + style bundles for the value-bearing fills. Spread onto the host:
 *   <div class={ui.meter({ tone: 'warning' })} {...attrs.meter(72)}>
 *     <span class={cls.meterFill} />
 *   </div>
 * `value` is in your own units; pass `{ min, max }` (default 0–100) and the
 * `--value` width is normalized for you. Call `attrs.progress()` with no value
 * for an indeterminate bar (omits aria-valuenow, sets aria-busy).
 *
 * `attrs.dotbar(value)` is the segmented analogue of `attrs.progress`: a
 * determinate `.ui-dotbar` carries the same progress data as `.ui-progress` but,
 * without this, was eight empty `<span>`s to AT (the segments are decorative —
 * mark them `aria-hidden`). Same progressbar role + aria-valuenow/min/max;
 * call with no value for the indeterminate sweep.
 */
export const attrs = Object.freeze({
  meter: (value, { min = 0, max = 100 } = {}) => valueAttrs('meter', value, min, max, false),
  progress: (value, { min = 0, max = 100 } = {}) =>
    valueAttrs('progressbar', value, min, max, true),
  dotbar: (value, { min = 0, max = 100 } = {}) => valueAttrs('progressbar', value, min, max, true),
});

export default ui;
