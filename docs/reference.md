<!-- @ponchia/ui — GENERATED from classes/index.js + tokens/index.js
     by scripts/gen-reference.mjs. Do not edit by hand; run
     `npm run reference:build`. Drift-checked in CI. -->

# Reference

The complete public surface, generated from the typed contract. Live
rendering of every class is the kitchen-sink demo:
**<https://ponchia.github.io/bronto-ui/>**. Theming knobs and the token
contract: [docs/theming.md](theming.md).

- 183 classes across 90 component groups
- Import the typed registry: `import { cls, ui, cx } from '@ponchia/ui/classes'`
- Tokens as data: `import { cssVars, tokens, themeColor } from '@ponchia/ui/tokens'`

## Classes

Grouped by base class. `--x` = modifier, `__x` = part. Every key is a
member of `cls` and a recipe-emittable string; `check-classes` proves
each one matches a real selector in the stylesheet.

### `.ui-accordion`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.accordion` | `ui-accordion` | base |
| `cls.accordionBody` | `ui-accordion__body` | part |
| `cls.accordionItem` | `ui-accordion__item` | part |
| `cls.accordionSummary` | `ui-accordion__summary` | part |

### `.ui-alert`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.alert` | `ui-alert` | base |
| `cls.alertBody` | `ui-alert__body` | part |
| `cls.alertDismiss` | `ui-alert__dismiss` | part |
| `cls.alertTitle` | `ui-alert__title` | part |
| `cls.alertAccent` | `ui-alert--accent` | modifier |
| `cls.alertDanger` | `ui-alert--danger` | modifier |
| `cls.alertSuccess` | `ui-alert--success` | modifier |
| `cls.alertWarning` | `ui-alert--warning` | modifier |

### `.ui-animate-dot`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.animateDot` | `ui-animate-dot` | base |

### `.ui-animate-fade`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.animateFade` | `ui-animate-fade` | base |

### `.ui-animate-in`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.animateIn` | `ui-animate-in` | base |

### `.ui-animate-matrix`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.animateMatrix` | `ui-animate-matrix` | base |

### `.ui-app-content`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.appContent` | `ui-app-content` | base |

### `.ui-app-empty-state`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.appEmptyState` | `ui-app-empty-state` | base |

### `.ui-app-main`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.appMain` | `ui-app-main` | base |

### `.ui-app-metric`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.appMetric` | `ui-app-metric` | base |
| `cls.appMetricDelta` | `ui-app-metric__delta` | part |
| `cls.appMetricLabel` | `ui-app-metric__label` | part |
| `cls.appMetricValue` | `ui-app-metric__value` | part |

### `.ui-app-metrics`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.appMetrics` | `ui-app-metrics` | base |

### `.ui-app-nav`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.appNav` | `ui-app-nav` | base |
| `cls.appNavSection` | `ui-app-nav__section` | part |

### `.ui-app-panel`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.appPanel` | `ui-app-panel` | base |
| `cls.appPanelHead` | `ui-app-panel__head` | part |
| `cls.appPanelTitle` | `ui-app-panel__title` | part |

### `.ui-app-rail`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.appRail` | `ui-app-rail` | base |
| `cls.appRailBrand` | `ui-app-rail__brand` | part |
| `cls.appRailFoot` | `ui-app-rail__foot` | part |
| `cls.appRailToggle` | `ui-app-rail__toggle` | part |

### `.ui-app-shell`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.appShell` | `ui-app-shell` | base |
| `cls.appShellFull` | `ui-app-shell--full` | modifier |

### `.ui-app-toolbar`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.appToolbar` | `ui-app-toolbar` | base |
| `cls.appToolbarGroup` | `ui-app-toolbar__group` | part |

### `.ui-app-topbar`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.appTopbar` | `ui-app-topbar` | base |
| `cls.appTopbarTitle` | `ui-app-topbar__title` | part |

### `.ui-avatar`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.avatar` | `ui-avatar` | base |
| `cls.avatarLg` | `ui-avatar--lg` | modifier |
| `cls.avatarSm` | `ui-avatar--sm` | modifier |

### `.ui-avatar-group`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.avatarGroup` | `ui-avatar-group` | base |

### `.ui-badge`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.badge` | `ui-badge` | base |
| `cls.badgeAccent` | `ui-badge--accent` | modifier |
| `cls.badgeDanger` | `ui-badge--danger` | modifier |
| `cls.badgeSuccess` | `ui-badge--success` | modifier |
| `cls.badgeWarning` | `ui-badge--warning` | modifier |

### `.ui-breadcrumb`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.breadcrumb` | `ui-breadcrumb` | base |
| `cls.breadcrumbItem` | `ui-breadcrumb__item` | part |

### `.ui-button`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.button` | `ui-button` | base |
| `cls.buttonDanger` | `ui-button--danger` | modifier |
| `cls.buttonGhost` | `ui-button--ghost` | modifier |
| `cls.buttonIcon` | `ui-button--icon` | modifier |
| `cls.buttonSubtle` | `ui-button--subtle` | modifier |

### `.ui-card`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.card` | `ui-card` | base |
| `cls.cardHead` | `ui-card__head` | part |
| `cls.cardAccent` | `ui-card--accent` | modifier |
| `cls.cardInteractive` | `ui-card--interactive` | modifier |

### `.ui-caret`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.caret` | `ui-caret` | base |

### `.ui-center`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.center` | `ui-center` | base |

### `.ui-check`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.check` | `ui-check` | base |

### `.ui-chip`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.chip` | `ui-chip` | base |
| `cls.chipAccent` | `ui-chip--accent` | modifier |

### `.ui-cluster`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.cluster` | `ui-cluster` | base |
| `cls.clusterBetween` | `ui-cluster--between` | modifier |

### `.ui-container`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.container` | `ui-container` | base |
| `cls.containerNarrow` | `ui-container--narrow` | modifier |

### `.ui-cq`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.cq` | `ui-cq` | base |

### `.ui-display`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.display` | `ui-display` | base |

### `.ui-divider`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.divider` | `ui-divider` | base |

### `.ui-dot`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.dot` | `ui-dot` | base |
| `cls.dotAccent` | `ui-dot--accent` | modifier |
| `cls.dotDanger` | `ui-dot--danger` | modifier |
| `cls.dotLive` | `ui-dot--live` | modifier |
| `cls.dotSuccess` | `ui-dot--success` | modifier |
| `cls.dotWarning` | `ui-dot--warning` | modifier |

### `.ui-dotbar`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.dotbar` | `ui-dotbar` | base |
| `cls.dotbarIndeterminate` | `ui-dotbar--indeterminate` | modifier |

### `.ui-dotfield`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.dotfield` | `ui-dotfield` | base |

### `.ui-dotgrid`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.dotgrid` | `ui-dotgrid` | base |
| `cls.dotgridAccent` | `ui-dotgrid--accent` | modifier |
| `cls.dotgridDense` | `ui-dotgrid--dense` | modifier |

### `.ui-dotloader`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.dotloader` | `ui-dotloader` | base |

### `.ui-dotrule`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.dotrule` | `ui-dotrule` | base |

### `.ui-dotspinner`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.dotspinner` | `ui-dotspinner` | base |
| `cls.dotspinnerLg` | `ui-dotspinner--lg` | modifier |
| `cls.dotspinnerSm` | `ui-dotspinner--sm` | modifier |

### `.ui-eyebrow`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.eyebrow` | `ui-eyebrow` | base |
| `cls.eyebrowMuted` | `ui-eyebrow--muted` | modifier |

### `.ui-field`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.field` | `ui-field` | base |

### `.ui-grid`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.grid` | `ui-grid` | base |

### `.ui-hint`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.hint` | `ui-hint` | base |
| `cls.hintError` | `ui-hint--error` | modifier |

### `.ui-input`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.input` | `ui-input` | base |

### `.ui-key-value`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.keyValue` | `ui-key-value` | base |

### `.ui-label`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.label` | `ui-label` | base |

### `.ui-link`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.link` | `ui-link` | base |
| `cls.linkArrow` | `ui-link--arrow` | modifier |

### `.ui-matrix`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.matrix` | `ui-matrix` | base |

### `.ui-menu`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.menu` | `ui-menu` | base |
| `cls.menuItem` | `ui-menu__item` | part |
| `cls.menuLabel` | `ui-menu__label` | part |
| `cls.menuSep` | `ui-menu__sep` | part |

### `.ui-menu-host`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.menuHost` | `ui-menu-host` | base |

### `.ui-meta`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.meta` | `ui-meta` | base |
| `cls.metaItem` | `ui-meta__item` | part |

### `.ui-modal`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.modal` | `ui-modal` | base |
| `cls.modalBody` | `ui-modal__body` | part |
| `cls.modalClose` | `ui-modal__close` | part |
| `cls.modalFoot` | `ui-modal__foot` | part |
| `cls.modalHead` | `ui-modal__head` | part |
| `cls.modalTitle` | `ui-modal__title` | part |
| `cls.modalDrawer` | `ui-modal--drawer` | modifier |

### `.ui-mono`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.mono` | `ui-mono` | base |

### `.ui-muted`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.muted` | `ui-muted` | base |

### `.ui-pagination`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.pagination` | `ui-pagination` | base |
| `cls.paginationItem` | `ui-pagination__item` | part |

### `.ui-panel`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.panel` | `ui-panel` | base |
| `cls.panelHead` | `ui-panel__head` | part |

### `.ui-progress`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.progress` | `ui-progress` | base |
| `cls.progressBar` | `ui-progress__bar` | part |
| `cls.progressIndeterminate` | `ui-progress--indeterminate` | modifier |

### `.ui-prose`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.prose` | `ui-prose` | base |
| `cls.proseCompact` | `ui-prose--compact` | modifier |

### `.ui-quote`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.quote` | `ui-quote` | base |
| `cls.quoteCite` | `ui-quote__cite` | part |

### `.ui-ratio`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.ratio` | `ui-ratio` | base |

### `.ui-reveal`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.reveal` | `ui-reveal` | base |

### `.ui-search`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.search` | `ui-search` | base |

### `.ui-segmented`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.segmented` | `ui-segmented` | base |
| `cls.segmentedOption` | `ui-segmented__option` | part |

### `.ui-select`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.select` | `ui-select` | base |

### `.ui-sidebar`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.sidebar` | `ui-sidebar` | base |

### `.ui-sitefooter`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.sitefooter` | `ui-sitefooter` | base |
| `cls.sitefooterLinks` | `ui-sitefooter__links` | part |

### `.ui-siteheader`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.siteheader` | `ui-siteheader` | base |
| `cls.siteheaderActions` | `ui-siteheader__actions` | part |
| `cls.siteheaderBrand` | `ui-siteheader__brand` | part |

### `.ui-sitemenu`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.sitemenu` | `ui-sitemenu` | base |
| `cls.sitemenuPanel` | `ui-sitemenu__panel` | part |

### `.ui-sitenav`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.sitenav` | `ui-sitenav` | base |

### `.ui-skeleton`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.skeleton` | `ui-skeleton` | base |

### `.ui-skiplink`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.skiplink` | `ui-skiplink` | base |

### `.ui-spinner`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.spinner` | `ui-spinner` | base |

### `.ui-stack`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.stack` | `ui-stack` | base |

### `.ui-stagger`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.stagger` | `ui-stagger` | base |
| `cls.staggerAuto` | `ui-stagger--auto` | modifier |

### `.ui-status`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.status` | `ui-status` | base |

### `.ui-surface`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.surface` | `ui-surface` | base |

### `.ui-switch`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.switch` | `ui-switch` | base |
| `cls.switchThumb` | `ui-switch__thumb` | part |
| `cls.switchTrack` | `ui-switch__track` | part |

### `.ui-switcher`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.switcher` | `ui-switcher` | base |

### `.ui-tab`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.tab` | `ui-tab` | base |

### `.ui-table`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.table` | `ui-table` | base |
| `cls.tableEmpty` | `ui-table__empty` | part |
| `cls.tableComfortable` | `ui-table--comfortable` | modifier |
| `cls.tableDense` | `ui-table--dense` | modifier |
| `cls.tableLined` | `ui-table--lined` | modifier |

### `.ui-table-wrap`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.tableWrap` | `ui-table-wrap` | base |

### `.ui-tabs`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.tabs` | `ui-tabs` | base |
| `cls.tabsList` | `ui-tabs__list` | part |
| `cls.tabsPanel` | `ui-tabs__panel` | part |

### `.ui-tag`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.tag` | `ui-tag` | base |
| `cls.tagAccent` | `ui-tag--accent` | modifier |

### `.ui-tags`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.tags` | `ui-tags` | base |

### `.ui-textarea`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.textarea` | `ui-textarea` | base |

### `.ui-themetoggle`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.themetoggleButton` | `ui-themetoggle__button` | part |
| `cls.themetoggleLabel` | `ui-themetoggle__label` | part |
| `cls.themetogglePrefix` | `ui-themetoggle__prefix` | part |
| `cls.themetoggleThumb` | `ui-themetoggle__thumb` | part |
| `cls.themetoggleTrack` | `ui-themetoggle__track` | part |

### `.ui-toast`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.toast` | `ui-toast` | base |
| `cls.toastTitle` | `ui-toast__title` | part |
| `cls.toastAccent` | `ui-toast--accent` | modifier |
| `cls.toastDanger` | `ui-toast--danger` | modifier |
| `cls.toastSuccess` | `ui-toast--success` | modifier |
| `cls.toastWarning` | `ui-toast--warning` | modifier |

### `.ui-toast-stack`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.toastStack` | `ui-toast-stack` | base |

### `.ui-tooltip`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.tooltip` | `ui-tooltip` | base |
| `cls.tooltipBubble` | `ui-tooltip__bubble` | part |

### `.ui-visually-hidden`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.visuallyHidden` | `ui-visually-hidden` | base |

## Tokens

Exact mirror of the `:root` blocks in `css/tokens.css`
(`check-tokens` enforces parity). DTCG export:
[`@ponchia/ui/tokens.dtcg.json`](../tokens/tokens.dtcg.json).

### Global (scales — shared by both themes)

| Token | Value |
| --- | --- |
| `--radius-xl` | `4px` |
| `--radius-lg` | `3px` |
| `--radius-md` | `2px` |
| `--radius-sm` | `1px` |
| `--radius-pill` | `999px` |
| `--space-2xs` | `0.25rem` |
| `--space-xs` | `0.5rem` |
| `--space-sm` | `0.75rem` |
| `--space-md` | `1rem` |
| `--space-lg` | `1.35rem` |
| `--space-xl` | `1.75rem` |
| `--space-2xl` | `2.5rem` |
| `--mono` | `'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'SF Mono', ui-monospace, monospace` |
| `--sans` | `'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif` |
| `--display` | `'Doto', var(--mono)` |
| `--dot-font` | `'Doto', var(--mono)` |
| `--text-2xs` | `0.68rem` |
| `--text-xs` | `0.76rem` |
| `--text-sm` | `0.86rem` |
| `--text-base` | `0.95rem` |
| `--text-lg` | `1.15rem` |
| `--text-xl` | `1.45rem` |
| `--tracking-wide` | `0.14em` |
| `--tracking-wider` | `0.22em` |
| `--ease-standard` | `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| `--ease-spring` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--ease-out` | `cubic-bezier(0.33, 1, 0.68, 1)` |
| `--duration-fast` | `130ms` |
| `--duration-base` | `200ms` |
| `--duration-slow` | `360ms` |
| `--dot-size` | `2px` |
| `--dot-gap` | `14px` |
| `--z-base` | `0` |
| `--z-raised` | `10` |
| `--z-sticky` | `20` |
| `--z-overlay` | `30` |
| `--z-popover` | `50` |
| `--z-toast` | `60` |
| `--accent-1` | `color-mix(in srgb, var(--accent) 8%, var(--bg))` |
| `--accent-2` | `color-mix(in srgb, var(--accent) 16%, var(--bg))` |
| `--accent-3` | `color-mix(in srgb, var(--accent) 32%, var(--bg))` |
| `--accent-4` | `color-mix(in srgb, var(--accent) 60%, var(--bg))` |
| `--accent-5` | `var(--accent)` |
| `--accent-6` | `var(--accent-strong)` |
| `--surface-1` | `var(--bg)` |
| `--surface-2` | `var(--bg-elevated)` |
| `--surface-3` | `var(--panel)` |
| `--surface-4` | `var(--panel-soft)` |
| `--surface-5` | `var(--line)` |
| `--surface-6` | `var(--line-strong)` |
| `--bronto-color-bg` | `var(--bg)` |
| `--bronto-color-surface` | `var(--panel)` |
| `--bronto-color-surface-raised` | `var(--panel-strong)` |
| `--bronto-color-border` | `var(--line)` |
| `--bronto-color-border-strong` | `var(--line-strong)` |
| `--bronto-color-text` | `var(--text)` |
| `--bronto-color-text-muted` | `var(--text-dim)` |
| `--bronto-color-action` | `var(--accent)` |
| `--bronto-color-on-action` | `var(--button-text)` |
| `--bronto-color-focus` | `var(--focus-ring)` |
| `--bronto-color-success` | `var(--success)` |
| `--bronto-color-warning` | `var(--warning)` |
| `--bronto-color-danger` | `var(--danger)` |
| `--surface` | `var(--panel)` |
| `--surface-raised` | `var(--panel-strong)` |
| `--surface-muted` | `var(--panel-soft)` |
| `--border` | `var(--line)` |
| `--border-strong` | `var(--line-strong)` |

### Light theme

| Token | Value |
| --- | --- |
| `--bg` | `#f4f4f2` |
| `--bg-elevated` | `#fbfbfa` |
| `--bg-accent` | `color-mix(in srgb, var(--accent) 6%, transparent)` |
| `--panel` | `#ffffff` |
| `--panel-strong` | `#ffffff` |
| `--panel-soft` | `#ececea` |
| `--line` | `#d8d8d4` |
| `--line-strong` | `#a8a8a2` |
| `--text` | `#0a0a0a` |
| `--text-soft` | `#353533` |
| `--text-dim` | `#686863` |
| `--accent` | `#d71921` |
| `--accent-strong` | `color-mix(in srgb, var(--accent) 83%, #000)` |
| `--accent-text` | `var(--accent-strong)` |
| `--accent-soft` | `color-mix(in srgb, var(--accent) 10%, transparent)` |
| `--success` | `#2f7d4f` |
| `--success-soft` | `rgb(47, 125, 79, 0.12)` |
| `--warning` | `#806414` |
| `--warning-soft` | `rgb(128, 100, 20, 0.13)` |
| `--orange` | `#a85f32` |
| `--orange-soft` | `rgb(168, 95, 50, 0.13)` |
| `--danger` | `#c01622` |
| `--danger-soft` | `rgb(192, 22, 34, 0.1)` |
| `--code-bg` | `rgb(10, 10, 10, 0.05)` |
| `--button-text` | `#ffffff` |
| `--field-dot` | `rgb(10, 10, 10, 0.16)` |
| `--field-dot-hot` | `rgb(10, 10, 10, 0.4)` |
| `--field-dot-accent` | `color-mix(in srgb, var(--accent) 78%, transparent)` |
| `--focus-ring` | `var(--accent)` |
| `--shadow` | `none` |
| `--shadow-raised` | `0 0 0 1px var(--line-strong)` |

### Dark theme

| Token | Value |
| --- | --- |
| `--bg` | `#000000` |
| `--bg-elevated` | `#0a0a0a` |
| `--bg-accent` | `color-mix(in srgb, var(--accent) 8%, transparent)` |
| `--panel` | `#0c0c0c` |
| `--panel-strong` | `#141414` |
| `--panel-soft` | `#1a1a1a` |
| `--line` | `#2a2a2a` |
| `--line-strong` | `#444444` |
| `--text` | `#f2f2f2` |
| `--text-soft` | `#c4c4c4` |
| `--text-dim` | `#858585` |
| `--accent` | `#ff3b41` |
| `--accent-strong` | `color-mix(in srgb, var(--accent) 84%, #fff)` |
| `--accent-text` | `var(--accent-strong)` |
| `--accent-soft` | `color-mix(in srgb, var(--accent) 14%, transparent)` |
| `--success` | `#4ec27e` |
| `--success-soft` | `rgb(78, 194, 126, 0.14)` |
| `--warning` | `#d8bd72` |
| `--warning-soft` | `rgb(216, 189, 114, 0.14)` |
| `--orange` | `#d08c5b` |
| `--orange-soft` | `rgb(208, 140, 91, 0.15)` |
| `--danger` | `#ff4d54` |
| `--danger-soft` | `rgb(255, 77, 84, 0.15)` |
| `--code-bg` | `rgb(255, 255, 255, 0.05)` |
| `--button-text` | `#000000` |
| `--field-dot` | `rgb(242, 242, 242, 0.14)` |
| `--field-dot-hot` | `rgb(242, 242, 242, 0.36)` |
| `--field-dot-accent` | `color-mix(in srgb, var(--accent) 82%, transparent)` |
| `--focus-ring` | `var(--accent)` |
| `--shadow` | `none` |
| `--shadow-raised` | `0 0 0 1px var(--line-strong)` |
