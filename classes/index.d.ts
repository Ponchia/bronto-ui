/** @ponchia/ui — GENERATED from classes/index.js by scripts/gen-dts.mjs.
 *  Do not edit by hand; run `npm run dts:build`. Drift-checked in CI. */

export type ClassValue = string | false | null | undefined | ClassValue[];

/** The flat registry of every class @ponchia/ui defines (literal). */
export declare const cls: {
  readonly button: 'ui-button';
  readonly buttonGhost: 'ui-button--ghost';
  readonly buttonSubtle: 'ui-button--subtle';
  readonly buttonDanger: 'ui-button--danger';
  readonly buttonIcon: 'ui-button--icon';
  readonly card: 'ui-card';
  readonly cardHead: 'ui-card__head';
  readonly cardAccent: 'ui-card--accent';
  readonly cardInteractive: 'ui-card--interactive';
  readonly badge: 'ui-badge';
  readonly badgeAccent: 'ui-badge--accent';
  readonly badgeSuccess: 'ui-badge--success';
  readonly badgeWarning: 'ui-badge--warning';
  readonly badgeDanger: 'ui-badge--danger';
  readonly chip: 'ui-chip';
  readonly chipAccent: 'ui-chip--accent';
  readonly link: 'ui-link';
  readonly linkArrow: 'ui-link--arrow';
  readonly keyValue: 'ui-key-value';
  readonly dot: 'ui-dot';
  readonly dotAccent: 'ui-dot--accent';
  readonly dotSuccess: 'ui-dot--success';
  readonly dotWarning: 'ui-dot--warning';
  readonly dotDanger: 'ui-dot--danger';
  readonly dotLive: 'ui-dot--live';
  readonly dotgrid: 'ui-dotgrid';
  readonly dotgridAccent: 'ui-dotgrid--accent';
  readonly dotgridDense: 'ui-dotgrid--dense';
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
  readonly toastStack: 'ui-toast-stack';
  readonly toastStackAssertive: 'ui-toast-stack--assertive';
  readonly toast: 'ui-toast';
  readonly toastTitle: 'ui-toast__title';
  readonly toastClose: 'ui-toast__close';
  readonly toastAccent: 'ui-toast--accent';
  readonly toastSuccess: 'ui-toast--success';
  readonly toastWarning: 'ui-toast--warning';
  readonly toastDanger: 'ui-toast--danger';
  readonly tooltip: 'ui-tooltip';
  readonly tooltipBubble: 'ui-tooltip__bubble';
  readonly progress: 'ui-progress';
  readonly progressBar: 'ui-progress__bar';
  readonly progressIndeterminate: 'ui-progress--indeterminate';
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
  readonly table: 'ui-table';
  readonly tableDense: 'ui-table--dense';
  readonly tableComfortable: 'ui-table--comfortable';
  readonly tableLined: 'ui-table--lined';
  readonly tableWrap: 'ui-table-wrap';
  readonly tableEmpty: 'ui-table__empty';
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
  readonly prose: 'ui-prose';
  readonly proseCompact: 'ui-prose--compact';
  readonly quote: 'ui-quote';
  readonly quoteCite: 'ui-quote__cite';
  readonly container: 'ui-container';
  readonly containerNarrow: 'ui-container--narrow';
  readonly skiplink: 'ui-skiplink';
  readonly siteheader: 'ui-siteheader';
  readonly siteheaderBrand: 'ui-siteheader__brand';
  readonly siteheaderActions: 'ui-siteheader__actions';
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
  readonly appShell: 'ui-app-shell';
  readonly appShellFull: 'ui-app-shell--full';
  readonly appRail: 'ui-app-rail';
  readonly appRailBrand: 'ui-app-rail__brand';
  readonly appRailToggle: 'ui-app-rail__toggle';
  readonly appRailFoot: 'ui-app-rail__foot';
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
}
export interface CardOpts {
  accent?: boolean;
  interactive?: boolean;
}
export interface BadgeOpts {
  tone?: 'accent' | 'success' | 'warning' | 'danger';
}
export interface ChipOpts {
  accent?: boolean;
}
export interface LinkOpts {
  arrow?: boolean;
}
export interface DotOpts {
  tone?: 'accent' | 'success' | 'warning' | 'danger';
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
export type Tone = 'accent' | 'success' | 'warning' | 'danger';
export interface AlertOpts {
  tone?: Tone;
}
export interface ToastOpts {
  tone?: Tone;
}
export interface ProgressOpts {
  indeterminate?: boolean;
}
export interface DotspinnerOpts {
  size?: 'sm' | 'lg';
}
export interface DotbarOpts {
  indeterminate?: boolean;
}
export interface ModalOpts {
  drawer?: boolean;
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
}
export interface TagOpts {
  accent?: boolean;
}

export interface Ui {
  button(opts?: ButtonOpts): string;
  card(opts?: CardOpts): string;
  badge(opts?: BadgeOpts): string;
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
  dotspinner(opts?: DotspinnerOpts): string;
  dotbar(opts?: DotbarOpts): string;
  modal(opts?: ModalOpts): string;
  tab(opts?: TabOpts): string;
  avatar(opts?: AvatarOpts): string;
  prose(opts?: ProseOpts): string;
  container(opts?: ContainerOpts): string;
  tag(opts?: TagOpts): string;
}

export declare const ui: Ui;
export default ui;
