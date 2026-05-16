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
  card: 'ui-card',
  cardHead: 'ui-card__head',
  cardAccent: 'ui-card--accent',
  cardInteractive: 'ui-card--interactive',
  badge: 'ui-badge',
  badgeAccent: 'ui-badge--accent',
  badgeSuccess: 'ui-badge--success',
  badgeWarning: 'ui-badge--warning',
  badgeDanger: 'ui-badge--danger',
  chip: 'ui-chip',
  chipAccent: 'ui-chip--accent',
  link: 'ui-link',
  linkArrow: 'ui-link--arrow',
  keyValue: 'ui-key-value',
  // dots
  dot: 'ui-dot',
  dotAccent: 'ui-dot--accent',
  dotSuccess: 'ui-dot--success',
  dotWarning: 'ui-dot--warning',
  dotDanger: 'ui-dot--danger',
  dotLive: 'ui-dot--live',
  dotgrid: 'ui-dotgrid',
  dotgridAccent: 'ui-dotgrid--accent',
  dotgridDense: 'ui-dotgrid--dense',
  dotfield: 'ui-dotfield',
  dotrule: 'ui-dotrule',
  dotbar: 'ui-dotbar',
  dotbarIndeterminate: 'ui-dotbar--indeterminate',
  dotloader: 'ui-dotloader',
  dotspinner: 'ui-dotspinner',
  dotspinnerSm: 'ui-dotspinner--sm',
  dotspinnerLg: 'ui-dotspinner--lg',
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
  file: 'ui-file',
  range: 'ui-range',
  errorSummary: 'ui-error-summary',
  errorSummaryTitle: 'ui-error-summary__title',
  errorSummaryList: 'ui-error-summary__list',
  // feedback
  alert: 'ui-alert',
  alertTitle: 'ui-alert__title',
  alertBody: 'ui-alert__body',
  alertDismiss: 'ui-alert__dismiss',
  alertAccent: 'ui-alert--accent',
  alertSuccess: 'ui-alert--success',
  alertWarning: 'ui-alert--warning',
  alertDanger: 'ui-alert--danger',
  toastStack: 'ui-toast-stack',
  toastStackAssertive: 'ui-toast-stack--assertive',
  toast: 'ui-toast',
  toastTitle: 'ui-toast__title',
  toastClose: 'ui-toast__close',
  toastAccent: 'ui-toast--accent',
  toastSuccess: 'ui-toast--success',
  toastWarning: 'ui-toast--warning',
  toastDanger: 'ui-toast--danger',
  tooltip: 'ui-tooltip',
  tooltipBubble: 'ui-tooltip__bubble',
  progress: 'ui-progress',
  progressBar: 'ui-progress__bar',
  progressIndeterminate: 'ui-progress--indeterminate',
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
  // table
  table: 'ui-table',
  tableDense: 'ui-table--dense',
  tableComfortable: 'ui-table--comfortable',
  tableLined: 'ui-table--lined',
  tableWrap: 'ui-table-wrap',
  tableEmpty: 'ui-table__empty',
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
  prose: 'ui-prose',
  proseCompact: 'ui-prose--compact',
  quote: 'ui-quote',
  quoteCite: 'ui-quote__cite',
  // site shell
  container: 'ui-container',
  containerNarrow: 'ui-container--narrow',
  skiplink: 'ui-skiplink',
  siteheader: 'ui-siteheader',
  siteheaderBrand: 'ui-siteheader__brand',
  siteheaderActions: 'ui-siteheader__actions',
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
  // admin shell (was the legacy .app-* vocabulary; promoted in 0.3.0)
  appShell: 'ui-app-shell',
  appShellFull: 'ui-app-shell--full',
  appRail: 'ui-app-rail',
  appRailBrand: 'ui-app-rail__brand',
  appRailToggle: 'ui-app-rail__toggle',
  appRailFoot: 'ui-app-rail__foot',
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

export const ui = {
  button: ({ variant, icon } = {}) =>
    j(
      cls.button,
      variant === 'ghost' && cls.buttonGhost,
      variant === 'subtle' && cls.buttonSubtle,
      variant === 'danger' && cls.buttonDanger,
      icon && cls.buttonIcon,
    ),
  card: ({ accent, interactive } = {}) =>
    j(cls.card, accent && cls.cardAccent, interactive && cls.cardInteractive),
  badge: ({ tone } = {}) =>
    j(
      cls.badge,
      tone === 'accent' && cls.badgeAccent,
      tone === 'success' && cls.badgeSuccess,
      tone === 'warning' && cls.badgeWarning,
      tone === 'danger' && cls.badgeDanger,
    ),
  chip: ({ accent } = {}) => j(cls.chip, accent && cls.chipAccent),
  link: ({ arrow } = {}) => j(cls.link, arrow && cls.linkArrow),
  dot: ({ tone, live } = {}) =>
    j(
      cls.dot,
      tone === 'accent' && cls.dotAccent,
      tone === 'success' && cls.dotSuccess,
      tone === 'warning' && cls.dotWarning,
      tone === 'danger' && cls.dotDanger,
      live && cls.dotLive,
    ),
  dotgrid: ({ accent, dense } = {}) =>
    j(cls.dotgrid, accent && cls.dotgridAccent, dense && cls.dotgridDense),
  table: ({ density, lined } = {}) =>
    j(
      cls.table,
      density === 'dense' && cls.tableDense,
      density === 'comfortable' && cls.tableComfortable,
      lined && cls.tableLined,
    ),
  eyebrow: ({ muted } = {}) => j(cls.eyebrow, muted && cls.eyebrowMuted),
  hint: ({ error } = {}) => j(cls.hint, error && cls.hintError),
  cluster: ({ between } = {}) => j(cls.cluster, between && cls.clusterBetween),
  stagger: ({ auto } = {}) => j(cls.stagger, auto && cls.staggerAuto),
  alert: ({ tone } = {}) =>
    j(
      cls.alert,
      tone === 'accent' && cls.alertAccent,
      tone === 'success' && cls.alertSuccess,
      tone === 'warning' && cls.alertWarning,
      tone === 'danger' && cls.alertDanger,
    ),
  toast: ({ tone } = {}) =>
    j(
      cls.toast,
      tone === 'accent' && cls.toastAccent,
      tone === 'success' && cls.toastSuccess,
      tone === 'warning' && cls.toastWarning,
      tone === 'danger' && cls.toastDanger,
    ),
  progress: ({ indeterminate } = {}) => j(cls.progress, indeterminate && cls.progressIndeterminate),
  dotspinner: ({ size } = {}) =>
    j(cls.dotspinner, size === 'sm' && cls.dotspinnerSm, size === 'lg' && cls.dotspinnerLg),
  dotbar: ({ indeterminate } = {}) => j(cls.dotbar, indeterminate && cls.dotbarIndeterminate),
  modal: ({ drawer } = {}) => j(cls.modal, drawer && cls.modalDrawer),
  tab: ({ active } = {}) => j(cls.tab, active && 'is-active'),
  avatar: ({ size } = {}) =>
    j(cls.avatar, size === 'sm' && cls.avatarSm, size === 'lg' && cls.avatarLg),
  prose: ({ compact } = {}) => j(cls.prose, compact && cls.proseCompact),
  container: ({ narrow } = {}) => j(cls.container, narrow && cls.containerNarrow),
  tag: ({ accent } = {}) => j(cls.tag, accent && cls.tagAccent),
};

export default ui;
