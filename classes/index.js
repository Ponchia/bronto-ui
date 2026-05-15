/**
 * @bronto/ui — typed class-name contract.
 *
 * The framework's real API is its class vocabulary. Hand-writing
 * "ui-button ui-button--ghost" everywhere is untyped and typo-prone, so
 * this module turns that contract into data + tiny recipe builders:
 *
 *   import { ui, cx } from '@bronto/ui/classes';
 *   <button class={ui.button({ variant: 'ghost' })}>
 *   <span class={cx(ui.dot({ tone: 'success' }), 'my-extra')}>
 *
 * Framework-agnostic (returns strings). `cls` is the flat registry of
 * every class the framework defines; recipes only ever emit from it, and
 * scripts/check-classes.mjs fails CI if any entry is missing from the
 * stylesheet — so this file cannot drift from the CSS.
 */

/** Every class @bronto/ui defines. The single source the recipes draw from. */
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
  dotloader: 'ui-dotloader',
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
  divider: 'ui-divider',
  status: 'ui-status',
  // typography / utilities
  eyebrow: 'ui-eyebrow',
  eyebrowMuted: 'ui-eyebrow--muted',
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
});

/** classnames-style joiner: skips falsy, flattens arrays. */
export function cx(...parts) {
  const out = [];
  for (const p of parts.flat()) if (p) out.push(p);
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
      icon && cls.buttonIcon
    ),
  card: ({ accent, interactive } = {}) =>
    j(cls.card, accent && cls.cardAccent, interactive && cls.cardInteractive),
  badge: ({ tone } = {}) =>
    j(
      cls.badge,
      tone === 'accent' && cls.badgeAccent,
      tone === 'success' && cls.badgeSuccess,
      tone === 'warning' && cls.badgeWarning,
      tone === 'danger' && cls.badgeDanger
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
      live && cls.dotLive
    ),
  dotgrid: ({ accent, dense } = {}) =>
    j(cls.dotgrid, accent && cls.dotgridAccent, dense && cls.dotgridDense),
  table: ({ density, lined } = {}) =>
    j(
      cls.table,
      density === 'dense' && cls.tableDense,
      density === 'comfortable' && cls.tableComfortable,
      lined && cls.tableLined
    ),
  eyebrow: ({ muted } = {}) => j(cls.eyebrow, muted && cls.eyebrowMuted),
  hint: ({ error } = {}) => j(cls.hint, error && cls.hintError),
  cluster: ({ between } = {}) => j(cls.cluster, between && cls.clusterBetween),
  stagger: ({ auto } = {}) => j(cls.stagger, auto && cls.staggerAuto),
};

export default ui;
