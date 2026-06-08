<!-- @ponchia/ui — GENERATED from classes/index.js + tokens/index.js
     by scripts/gen-reference.mjs. Do not edit by hand; run
     `npm run reference:build`. Drift-checked in CI. -->

# Reference

The complete public surface, generated from the typed contract. Live
rendering of every class is the kitchen-sink demo:
**<https://ponchia.github.io/bronto-ui/>**. Theming knobs and the token
contract: [docs/theming.md](theming.md).

- 540 classes across 167 component groups
- Import the typed registry: `import { cls, ui, cx } from '@ponchia/ui/classes'`
- Validate markup as data (no JS/TS): `@ponchia/ui/classes.json` — the same
  vocabulary as language-neutral JSON (`groups`, `classes`, `states`,
  `customProperties`), for an external linter or non-JS host
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

### `.ui-activity`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.activity` | `ui-activity` | base |

### `.ui-alert`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.alert` | `ui-alert` | base |
| `cls.alertBody` | `ui-alert__body` | part |
| `cls.alertClose` | `ui-alert__close` | part |
| `cls.alertTitle` | `ui-alert__title` | part |
| `cls.alertAccent` | `ui-alert--accent` | modifier |
| `cls.alertDanger` | `ui-alert--danger` | modifier |
| `cls.alertInfo` | `ui-alert--info` | modifier |
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

### `.ui-annotation`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.annotation` | `ui-annotation` | base |
| `cls.annotationBadge` | `ui-annotation__badge` | part |
| `cls.annotationConnector` | `ui-annotation__connector` | part |
| `cls.annotationConnectorEnd` | `ui-annotation__connector-end` | part |
| `cls.annotationLabel` | `ui-annotation__label` | part |
| `cls.annotationNote` | `ui-annotation__note` | part |
| `cls.annotationNoteLine` | `ui-annotation__note-line` | part |
| `cls.annotationSubject` | `ui-annotation__subject` | part |
| `cls.annotationTitle` | `ui-annotation__title` | part |
| `cls.annotationAccent` | `ui-annotation--accent` | modifier |
| `cls.annotationAxis` | `ui-annotation--axis` | modifier |
| `cls.annotationBadgeVariant` | `ui-annotation--badge` | modifier |
| `cls.annotationBand` | `ui-annotation--band` | modifier |
| `cls.annotationBracket` | `ui-annotation--bracket` | modifier |
| `cls.annotationCallout` | `ui-annotation--callout` | modifier |
| `cls.annotationCircle` | `ui-annotation--circle` | modifier |
| `cls.annotationCluster` | `ui-annotation--cluster` | modifier |
| `cls.annotationCompare` | `ui-annotation--compare` | modifier |
| `cls.annotationCurve` | `ui-annotation--curve` | modifier |
| `cls.annotationDanger` | `ui-annotation--danger` | modifier |
| `cls.annotationDraw` | `ui-annotation--draw` | modifier |
| `cls.annotationElbow` | `ui-annotation--elbow` | modifier |
| `cls.annotationEvidence` | `ui-annotation--evidence` | modifier |
| `cls.annotationFocus` | `ui-annotation--focus` | modifier |
| `cls.annotationInfo` | `ui-annotation--info` | modifier |
| `cls.annotationLabelVariant` | `ui-annotation--label` | modifier |
| `cls.annotationMuted` | `ui-annotation--muted` | modifier |
| `cls.annotationPulse` | `ui-annotation--pulse` | modifier |
| `cls.annotationRect` | `ui-annotation--rect` | modifier |
| `cls.annotationReveal` | `ui-annotation--reveal` | modifier |
| `cls.annotationSlope` | `ui-annotation--slope` | modifier |
| `cls.annotationSuccess` | `ui-annotation--success` | modifier |
| `cls.annotationThreshold` | `ui-annotation--threshold` | modifier |
| `cls.annotationTimeline` | `ui-annotation--timeline` | modifier |
| `cls.annotationWarning` | `ui-annotation--warning` | modifier |

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
| `cls.appRailAccount` | `ui-app-rail__account` | part |
| `cls.appRailBrand` | `ui-app-rail__brand` | part |
| `cls.appRailFoot` | `ui-app-rail__foot` | part |

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
| `cls.badgeDot` | `ui-badge--dot` | modifier |
| `cls.badgeInfo` | `ui-badge--info` | modifier |
| `cls.badgeMuted` | `ui-badge--muted` | modifier |
| `cls.badgeSuccess` | `ui-badge--success` | modifier |
| `cls.badgeWarning` | `ui-badge--warning` | modifier |

### `.ui-bracket-note`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.bracketNote` | `ui-bracket-note` | base |
| `cls.bracketNoteLabel` | `ui-bracket-note__label` | part |
| `cls.bracketNoteAccent` | `ui-bracket-note--accent` | modifier |
| `cls.bracketNoteDanger` | `ui-bracket-note--danger` | modifier |
| `cls.bracketNoteInfo` | `ui-bracket-note--info` | modifier |
| `cls.bracketNoteSuccess` | `ui-bracket-note--success` | modifier |
| `cls.bracketNoteWarning` | `ui-bracket-note--warning` | modifier |

### `.ui-breadcrumb`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.breadcrumb` | `ui-breadcrumb` | base |
| `cls.breadcrumbItem` | `ui-breadcrumb__item` | part |

### `.ui-break-after`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.breakAfter` | `ui-break-after` | base |

### `.ui-break-before`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.breakBefore` | `ui-break-before` | base |

### `.ui-bullet`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.bullet` | `ui-bullet` | base |
| `cls.bulletLabel` | `ui-bullet__label` | part |
| `cls.bulletMeasure` | `ui-bullet__measure` | part |
| `cls.bulletMeasureAccent` | `ui-bullet__measure--accent` | modifier |
| `cls.bulletMeasureNeg` | `ui-bullet__measure--neg` | modifier |
| `cls.bulletMeasurePos` | `ui-bullet__measure--pos` | modifier |
| `cls.bulletTarget` | `ui-bullet__target` | part |

### `.ui-button`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.button` | `ui-button` | base |
| `cls.buttonDanger` | `ui-button--danger` | modifier |
| `cls.buttonGhost` | `ui-button--ghost` | modifier |
| `cls.buttonIcon` | `ui-button--icon` | modifier |
| `cls.buttonLg` | `ui-button--lg` | modifier |
| `cls.buttonSm` | `ui-button--sm` | modifier |
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

### `.ui-carousel`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.carousel` | `ui-carousel` | base |
| `cls.carouselNext` | `ui-carousel__next` | part |
| `cls.carouselPrev` | `ui-carousel__prev` | part |
| `cls.carouselSlide` | `ui-carousel__slide` | part |
| `cls.carouselStage` | `ui-carousel__stage` | part |
| `cls.carouselStatus` | `ui-carousel__status` | part |
| `cls.carouselThumb` | `ui-carousel__thumb` | part |
| `cls.carouselThumbs` | `ui-carousel__thumbs` | part |
| `cls.carouselViewport` | `ui-carousel__viewport` | part |

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

### `.ui-citation`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.citation` | `ui-citation` | base |
| `cls.citationChip` | `ui-citation--chip` | modifier |

### `.ui-cluster`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.cluster` | `ui-cluster` | base |
| `cls.clusterBetween` | `ui-cluster--between` | modifier |

### `.ui-code`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.code` | `ui-code` | base |
| `cls.codeBody` | `ui-code__body` | part |
| `cls.codeHead` | `ui-code__head` | part |
| `cls.codeLine` | `ui-code__line` | part |
| `cls.codeLineAdd` | `ui-code__line--add` | modifier |
| `cls.codeLineHl` | `ui-code__line--hl` | modifier |
| `cls.codeLineRemove` | `ui-code__line--remove` | modifier |
| `cls.codeNumbered` | `ui-code--numbered` | modifier |

### `.ui-combobox`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.combobox` | `ui-combobox` | base |
| `cls.comboboxEmpty` | `ui-combobox__empty` | part |
| `cls.comboboxInput` | `ui-combobox__input` | part |
| `cls.comboboxList` | `ui-combobox__list` | part |
| `cls.comboboxOption` | `ui-combobox__option` | part |

### `.ui-command`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.command` | `ui-command` | base |
| `cls.commandEmpty` | `ui-command__empty` | part |
| `cls.commandGroup` | `ui-command__group` | part |
| `cls.commandInput` | `ui-command__input` | part |
| `cls.commandItem` | `ui-command__item` | part |
| `cls.commandList` | `ui-command__list` | part |
| `cls.commandMeta` | `ui-command__meta` | part |
| `cls.commandShortcut` | `ui-command__shortcut` | part |

### `.ui-compare`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.compare` | `ui-compare` | base |
| `cls.compareCol` | `ui-compare__col` | part |
| `cls.compareHead` | `ui-compare__head` | part |
| `cls.compare2up` | `ui-compare--2up` | modifier |

### `.ui-connector`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.connector` | `ui-connector` | base |
| `cls.connectorEnd` | `ui-connector__end` | part |
| `cls.connectorPath` | `ui-connector__path` | part |
| `cls.connectorAccent` | `ui-connector--accent` | modifier |
| `cls.connectorDanger` | `ui-connector--danger` | modifier |
| `cls.connectorDashed` | `ui-connector--dashed` | modifier |
| `cls.connectorDraw` | `ui-connector--draw` | modifier |
| `cls.connectorInfo` | `ui-connector--info` | modifier |
| `cls.connectorMuted` | `ui-connector--muted` | modifier |
| `cls.connectorSuccess` | `ui-connector--success` | modifier |
| `cls.connectorWarning` | `ui-connector--warning` | modifier |

### `.ui-container`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.container` | `ui-container` | base |
| `cls.containerNarrow` | `ui-container--narrow` | modifier |
| `cls.containerWide` | `ui-container--wide` | modifier |

### `.ui-cq`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.cq` | `ui-cq` | base |

### `.ui-crosshair`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.crosshair` | `ui-crosshair` | base |
| `cls.crosshairBadge` | `ui-crosshair__badge` | part |
| `cls.crosshairLine` | `ui-crosshair__line` | part |
| `cls.crosshairLineX` | `ui-crosshair__line--x` | modifier |
| `cls.crosshairLineY` | `ui-crosshair__line--y` | modifier |
| `cls.crosshairMuted` | `ui-crosshair--muted` | modifier |

### `.ui-def`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.def` | `ui-def` | base |

### `.ui-delta`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.delta` | `ui-delta` | base |
| `cls.deltaDown` | `ui-delta--down` | modifier |
| `cls.deltaFlat` | `ui-delta--flat` | modifier |
| `cls.deltaInvert` | `ui-delta--invert` | modifier |
| `cls.deltaUp` | `ui-delta--up` | modifier |

### `.ui-diff`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.diff` | `ui-diff` | base |
| `cls.diffCode` | `ui-diff__code` | part |
| `cls.diffHead` | `ui-diff__head` | part |
| `cls.diffHunk` | `ui-diff__hunk` | part |
| `cls.diffLn` | `ui-diff__ln` | part |
| `cls.diffPane` | `ui-diff__pane` | part |
| `cls.diffRow` | `ui-diff__row` | part |
| `cls.diffRowAdd` | `ui-diff__row--add` | modifier |
| `cls.diffRowContext` | `ui-diff__row--context` | modifier |
| `cls.diffRowRemove` | `ui-diff__row--remove` | modifier |
| `cls.diffSplit` | `ui-diff--split` | modifier |

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
| `cls.dotInfo` | `ui-dot--info` | modifier |
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

### `.ui-dotfit`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.dotfit` | `ui-dotfit` | base |

### `.ui-dotgauge`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.dotgauge` | `ui-dotgauge` | base |

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

### `.ui-dotmatrix`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.dotmatrix` | `ui-dotmatrix` | base |
| `cls.dotmatrixCell` | `ui-dotmatrix__cell` | part |
| `cls.dotmatrixCellAccent` | `ui-dotmatrix__cell--accent` | modifier |
| `cls.dotmatrixCellHot` | `ui-dotmatrix__cell--hot` | modifier |
| `cls.dotmatrixPulse` | `ui-dotmatrix--pulse` | modifier |
| `cls.dotmatrixReveal` | `ui-dotmatrix--reveal` | modifier |

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

### `.ui-empty-state`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.emptyState` | `ui-empty-state` | base |

### `.ui-error-summary`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.errorSummary` | `ui-error-summary` | base |
| `cls.errorSummaryList` | `ui-error-summary__list` | part |
| `cls.errorSummaryTitle` | `ui-error-summary__title` | part |

### `.ui-eyebrow`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.eyebrow` | `ui-eyebrow` | base |
| `cls.eyebrowMuted` | `ui-eyebrow--muted` | modifier |
| `cls.eyebrowSm` | `ui-eyebrow--sm` | modifier |

### `.ui-field`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.field` | `ui-field` | base |

### `.ui-file`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.file` | `ui-file` | base |

### `.ui-generated`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.generated` | `ui-generated` | base |
| `cls.generatedLabel` | `ui-generated__label` | part |

### `.ui-glossary`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.glossary` | `ui-glossary` | base |
| `cls.glossaryDef` | `ui-glossary__def` | part |
| `cls.glossaryTerm` | `ui-glossary__term` | part |

### `.ui-grid`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.grid` | `ui-grid` | base |

### `.ui-halftone`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.halftone` | `ui-halftone` | base |

### `.ui-hint`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.hint` | `ui-hint` | base |
| `cls.hintError` | `ui-hint--error` | modifier |

### `.ui-icon`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.icon` | `ui-icon` | base |

### `.ui-input`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.input` | `ui-input` | base |

### `.ui-input-group`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.inputGroup` | `ui-input-group` | base |
| `cls.inputGroupAddon` | `ui-input-group__addon` | part |

### `.ui-input-icon`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.inputIcon` | `ui-input-icon` | base |
| `cls.inputIconSlot` | `ui-input-icon__icon` | part |
| `cls.inputIconEnd` | `ui-input-icon--end` | modifier |

### `.ui-inspector`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.inspector` | `ui-inspector` | base |
| `cls.inspectorBody` | `ui-inspector__body` | part |
| `cls.inspectorHead` | `ui-inspector__head` | part |

### `.ui-kbd`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.kbd` | `ui-kbd` | base |

### `.ui-keep`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.keep` | `ui-keep` | base |

### `.ui-key-value`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.keyValue` | `ui-key-value` | base |

### `.ui-label`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.label` | `ui-label` | base |

### `.ui-legend`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.legend` | `ui-legend` | base |
| `cls.legendCaption` | `ui-legend__caption` | part |
| `cls.legendItem` | `ui-legend__item` | part |
| `cls.legendLabel` | `ui-legend__label` | part |
| `cls.legendSwatch` | `ui-legend__swatch` | part |
| `cls.legendSwatch1` | `ui-legend__swatch--1` | modifier |
| `cls.legendSwatch2` | `ui-legend__swatch--2` | modifier |
| `cls.legendSwatch3` | `ui-legend__swatch--3` | modifier |
| `cls.legendSwatch4` | `ui-legend__swatch--4` | modifier |
| `cls.legendSwatch5` | `ui-legend__swatch--5` | modifier |
| `cls.legendSwatch6` | `ui-legend__swatch--6` | modifier |
| `cls.legendSwatch7` | `ui-legend__swatch--7` | modifier |
| `cls.legendSwatch8` | `ui-legend__swatch--8` | modifier |
| `cls.legendSwatchCircle` | `ui-legend__swatch--circle` | modifier |
| `cls.legendSwatchLine` | `ui-legend__swatch--line` | modifier |
| `cls.legendSymbol` | `ui-legend__symbol` | part |
| `cls.legendTick` | `ui-legend__tick` | part |
| `cls.legendTicks` | `ui-legend__ticks` | part |
| `cls.legendTitle` | `ui-legend__title` | part |
| `cls.legendTrack` | `ui-legend__track` | part |
| `cls.legendValue` | `ui-legend__value` | part |
| `cls.legendCompact` | `ui-legend--compact` | modifier |
| `cls.legendDiverging` | `ui-legend--diverging` | modifier |
| `cls.legendGradient` | `ui-legend--gradient` | modifier |
| `cls.legendInteractive` | `ui-legend--interactive` | modifier |
| `cls.legendThreshold` | `ui-legend--threshold` | modifier |
| `cls.legendVertical` | `ui-legend--vertical` | modifier |
| `cls.legendWithValues` | `ui-legend--with-values` | modifier |

### `.ui-level`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.level` | `ui-level` | base |
| `cls.levelDanger` | `ui-level--danger` | modifier |
| `cls.levelWarn` | `ui-level--warn` | modifier |

### `.ui-lightbox`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.lightbox` | `ui-lightbox` | base |
| `cls.lightboxClose` | `ui-lightbox__close` | part |

### `.ui-link`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.link` | `ui-link` | base |
| `cls.linkArrow` | `ui-link--arrow` | modifier |
| `cls.linkCta` | `ui-link--cta` | modifier |

### `.ui-marginnote`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.marginnote` | `ui-marginnote` | base |

### `.ui-mark`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.mark` | `ui-mark` | base |
| `cls.markAccent` | `ui-mark--accent` | modifier |
| `cls.markBox` | `ui-mark--box` | modifier |
| `cls.markDanger` | `ui-mark--danger` | modifier |
| `cls.markDraw` | `ui-mark--draw` | modifier |
| `cls.markInfo` | `ui-mark--info` | modifier |
| `cls.markMuted` | `ui-mark--muted` | modifier |
| `cls.markStrike` | `ui-mark--strike` | modifier |
| `cls.markSuccess` | `ui-mark--success` | modifier |
| `cls.markUnderline` | `ui-mark--underline` | modifier |
| `cls.markWarning` | `ui-mark--warning` | modifier |

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

### `.ui-meter`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.meter` | `ui-meter` | base |
| `cls.meterFill` | `ui-meter__fill` | part |
| `cls.meterLabel` | `ui-meter__label` | part |
| `cls.meterRow` | `ui-meter__row` | part |
| `cls.meterValue` | `ui-meter__value` | part |
| `cls.meterAccent` | `ui-meter--accent` | modifier |
| `cls.meterDanger` | `ui-meter--danger` | modifier |
| `cls.meterInfo` | `ui-meter--info` | modifier |
| `cls.meterSuccess` | `ui-meter--success` | modifier |
| `cls.meterWarning` | `ui-meter--warning` | modifier |

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

### `.ui-num`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.num` | `ui-num` | base |
| `cls.numMuted` | `ui-num--muted` | modifier |
| `cls.numNeg` | `ui-num--neg` | modifier |
| `cls.numPos` | `ui-num--pos` | modifier |

### `.ui-origin-label`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.originLabel` | `ui-origin-label` | base |
| `cls.originLabelAi` | `ui-origin-label--ai` | modifier |

### `.ui-pagehead`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.pagehead` | `ui-pagehead` | base |
| `cls.pageheadActions` | `ui-pagehead__actions` | part |
| `cls.pageheadTitle` | `ui-pagehead__title` | part |

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

### `.ui-popover`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.popover` | `ui-popover` | base |

### `.ui-print-exact`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.printExact` | `ui-print-exact` | base |

### `.ui-print-only`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.printOnly` | `ui-print-only` | base |

### `.ui-progress`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.progress` | `ui-progress` | base |
| `cls.progressBar` | `ui-progress__bar` | part |
| `cls.progressIndeterminate` | `ui-progress--indeterminate` | modifier |

### `.ui-property`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.property` | `ui-property` | base |
| `cls.propertyLabel` | `ui-property__label` | part |
| `cls.propertyValue` | `ui-property__value` | part |

### `.ui-prose`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.prose` | `ui-prose` | base |
| `cls.proseCompact` | `ui-prose--compact` | modifier |

### `.ui-provenance`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.provenance` | `ui-provenance` | base |
| `cls.provenanceItem` | `ui-provenance__item` | part |

### `.ui-quote`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.quote` | `ui-quote` | base |
| `cls.quoteCite` | `ui-quote__cite` | part |

### `.ui-range`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.range` | `ui-range` | base |

### `.ui-ratio`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.ratio` | `ui-ratio` | base |

### `.ui-readout`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.readout` | `ui-readout` | base |
| `cls.readoutSpacer` | `ui-readout__spacer` | part |

### `.ui-reasoning`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.reasoning` | `ui-reasoning` | base |
| `cls.reasoningBody` | `ui-reasoning__body` | part |

### `.ui-report`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.report` | `ui-report` | base |
| `cls.reportAppendix` | `ui-report__appendix` | part |
| `cls.reportCaption` | `ui-report__caption` | part |
| `cls.reportCover` | `ui-report__cover` | part |
| `cls.reportCoverCompact` | `ui-report__cover--compact` | modifier |
| `cls.reportEvidence` | `ui-report__evidence` | part |
| `cls.reportFigure` | `ui-report__figure` | part |
| `cls.reportFinding` | `ui-report__finding` | part |
| `cls.reportFootnotes` | `ui-report__footnotes` | part |
| `cls.reportHead` | `ui-report__head` | part |
| `cls.reportMeta` | `ui-report__meta` | part |
| `cls.reportSection` | `ui-report__section` | part |
| `cls.reportSectionUnnumbered` | `ui-report__section--unnumbered` | modifier |
| `cls.reportSectionHead` | `ui-report__section-head` | part |
| `cls.reportSources` | `ui-report__sources` | part |
| `cls.reportSubtitle` | `ui-report__subtitle` | part |
| `cls.reportSummary` | `ui-report__summary` | part |
| `cls.reportTitle` | `ui-report__title` | part |
| `cls.reportToc` | `ui-report__toc` | part |
| `cls.reportCompact` | `ui-report--compact` | modifier |
| `cls.reportNumbered` | `ui-report--numbered` | modifier |

### `.ui-reveal`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.reveal` | `ui-reveal` | base |

### `.ui-screen-only`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.screenOnly` | `ui-screen-only` | base |

### `.ui-scroll-progress`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.scrollProgress` | `ui-scroll-progress` | base |

### `.ui-scroll-reveal`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.scrollReveal` | `ui-scroll-reveal` | base |

### `.ui-search`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.search` | `ui-search` | base |

### `.ui-segmented`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.segmented` | `ui-segmented` | base |
| `cls.segmentedOption` | `ui-segmented__option` | part |

### `.ui-sel`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.sel` | `ui-sel` | base |
| `cls.selMaybe` | `ui-sel--maybe` | modifier |
| `cls.selOff` | `ui-sel--off` | modifier |
| `cls.selOn` | `ui-sel--on` | modifier |

### `.ui-select`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.select` | `ui-select` | base |

### `.ui-selectionbar`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.selectionbar` | `ui-selectionbar` | base |
| `cls.selectionbarActions` | `ui-selectionbar__actions` | part |
| `cls.selectionbarCount` | `ui-selectionbar__count` | part |

### `.ui-shortcut`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.shortcut` | `ui-shortcut` | base |
| `cls.shortcutSep` | `ui-shortcut__sep` | part |

### `.ui-sidebar`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.sidebar` | `ui-sidebar` | base |

### `.ui-sidenote`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.sidenote` | `ui-sidenote` | base |
| `cls.sidenoteRef` | `ui-sidenote__ref` | part |

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
| `cls.siteheaderSticky` | `ui-siteheader--sticky` | modifier |

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

### `.ui-source-card`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.sourceCard` | `ui-source-card` | base |
| `cls.sourceCardActions` | `ui-source-card__actions` | part |
| `cls.sourceCardExcerpt` | `ui-source-card__excerpt` | part |
| `cls.sourceCardOrigin` | `ui-source-card__origin` | part |
| `cls.sourceCardTime` | `ui-source-card__time` | part |
| `cls.sourceCardTitle` | `ui-source-card__title` | part |

### `.ui-source-list`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.sourceList` | `ui-source-list` | base |
| `cls.sourceListItem` | `ui-source-list__item` | part |

### `.ui-spark`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.spark` | `ui-spark` | base |
| `cls.sparkBar` | `ui-spark__bar` | part |
| `cls.sparkBarAccent` | `ui-spark__bar--accent` | modifier |
| `cls.sparkBarNeg` | `ui-spark__bar--neg` | modifier |
| `cls.sparkBarPos` | `ui-spark__bar--pos` | modifier |
| `cls.sparkDots` | `ui-spark--dots` | modifier |

### `.ui-spinner`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.spinner` | `ui-spinner` | base |

### `.ui-spotlight`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.spotlight` | `ui-spotlight` | base |
| `cls.spotlightHole` | `ui-spotlight__hole` | part |
| `cls.spotlightRing` | `ui-spotlight--ring` | modifier |

### `.ui-src`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.src` | `ui-src` | base |
| `cls.srcConflict` | `ui-src--conflict` | modifier |
| `cls.srcGenerated` | `ui-src--generated` | modifier |
| `cls.srcReviewed` | `ui-src--reviewed` | modifier |
| `cls.srcStale` | `ui-src--stale` | modifier |
| `cls.srcUnverified` | `ui-src--unverified` | modifier |
| `cls.srcVerified` | `ui-src--verified` | modifier |

### `.ui-stack`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.stack` | `ui-stack` | base |

### `.ui-stagger`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.stagger` | `ui-stagger` | base |
| `cls.staggerAuto` | `ui-stagger--auto` | modifier |

### `.ui-stat`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.stat` | `ui-stat` | base |
| `cls.statDelta` | `ui-stat__delta` | part |
| `cls.statLabel` | `ui-stat__label` | part |
| `cls.statValue` | `ui-stat__value` | part |

### `.ui-state`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.state` | `ui-state` | base |
| `cls.stateDetail` | `ui-state__detail` | part |
| `cls.stateLabel` | `ui-state__label` | part |
| `cls.stateBusy` | `ui-state--busy` | modifier |
| `cls.stateConflict` | `ui-state--conflict` | modifier |
| `cls.stateError` | `ui-state--error` | modifier |
| `cls.stateLocked` | `ui-state--locked` | modifier |
| `cls.stateNeedsReview` | `ui-state--needs-review` | modifier |
| `cls.stateOffline` | `ui-state--offline` | modifier |
| `cls.stateQueued` | `ui-state--queued` | modifier |
| `cls.stateReviewed` | `ui-state--reviewed` | modifier |
| `cls.stateSaved` | `ui-state--saved` | modifier |
| `cls.stateSaving` | `ui-state--saving` | modifier |
| `cls.stateStale` | `ui-state--stale` | modifier |

### `.ui-statgrid`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.statgrid` | `ui-statgrid` | base |

### `.ui-status`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.status` | `ui-status` | base |

### `.ui-steps`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.steps` | `ui-steps` | base |
| `cls.stepsItem` | `ui-steps__item` | part |
| `cls.stepsItemDone` | `ui-steps__item--done` | modifier |

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

### `.ui-syncbar`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.syncbar` | `ui-syncbar` | base |

### `.ui-tab`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.tab` | `ui-tab` | base |

### `.ui-table`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.table` | `ui-table` | base |
| `cls.tableEmpty` | `ui-table__empty` | part |
| `cls.tableSelect` | `ui-table__select` | part |
| `cls.tableSort` | `ui-table__sort` | part |
| `cls.tableToolbar` | `ui-table__toolbar` | part |
| `cls.tableBreakAnywhere` | `ui-table--break-anywhere` | modifier |
| `cls.tableComfortable` | `ui-table--comfortable` | modifier |
| `cls.tableDense` | `ui-table--dense` | modifier |
| `cls.tableLined` | `ui-table--lined` | modifier |
| `cls.tableSelectable` | `ui-table--selectable` | modifier |

### `.ui-table-wrap`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.tableWrap` | `ui-table-wrap` | base |
| `cls.tableLoading` | `ui-table-wrap--loading` | modifier |

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

### `.ui-term`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.term` | `ui-term` | base |

### `.ui-textarea`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.textarea` | `ui-textarea` | base |

### `.ui-textref`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.textref` | `ui-textref` | base |

### `.ui-themetoggle`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.themetoggleButton` | `ui-themetoggle__button` | part |
| `cls.themetoggleLabel` | `ui-themetoggle__label` | part |
| `cls.themetogglePrefix` | `ui-themetoggle__prefix` | part |
| `cls.themetoggleThumb` | `ui-themetoggle__thumb` | part |
| `cls.themetoggleTrack` | `ui-themetoggle__track` | part |

### `.ui-timeline`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.timeline` | `ui-timeline` | base |
| `cls.timelineItem` | `ui-timeline__item` | part |
| `cls.timelineTime` | `ui-timeline__time` | part |

### `.ui-toast`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.toast` | `ui-toast` | base |
| `cls.toastClose` | `ui-toast__close` | part |
| `cls.toastTitle` | `ui-toast__title` | part |
| `cls.toastAccent` | `ui-toast--accent` | modifier |
| `cls.toastDanger` | `ui-toast--danger` | modifier |
| `cls.toastInfo` | `ui-toast--info` | modifier |
| `cls.toastSuccess` | `ui-toast--success` | modifier |
| `cls.toastWarning` | `ui-toast--warning` | modifier |

### `.ui-toast-stack`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.toastStack` | `ui-toast-stack` | base |
| `cls.toastStackAssertive` | `ui-toast-stack--assertive` | modifier |

### `.ui-toc`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.toc` | `ui-toc` | base |
| `cls.tocLink` | `ui-toc__link` | part |
| `cls.tocList` | `ui-toc__list` | part |
| `cls.tocTitle` | `ui-toc__title` | part |

### `.ui-tool-call`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.toolCall` | `ui-tool-call` | base |
| `cls.toolCallBody` | `ui-tool-call__body` | part |
| `cls.toolCallName` | `ui-tool-call__name` | part |
| `cls.toolCallStatus` | `ui-tool-call__status` | part |

### `.ui-tool-log`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.toolLog` | `ui-tool-log` | base |

### `.ui-tooltip`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.tooltip` | `ui-tooltip` | base |
| `cls.tooltipBubble` | `ui-tooltip__bubble` | part |

### `.ui-tour-note`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.tourNote` | `ui-tour-note` | base |
| `cls.tourNoteActions` | `ui-tour-note__actions` | part |
| `cls.tourNoteBody` | `ui-tour-note__body` | part |
| `cls.tourNoteStep` | `ui-tour-note__step` | part |
| `cls.tourNoteTitle` | `ui-tour-note__title` | part |

### `.ui-tree`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.tree` | `ui-tree` | base |
| `cls.treeBranch` | `ui-tree__branch` | part |
| `cls.treeLabel` | `ui-tree__label` | part |
| `cls.treeLeaf` | `ui-tree__leaf` | part |
| `cls.treeSummary` | `ui-tree__summary` | part |

### `.ui-visually-hidden`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.visuallyHidden` | `ui-visually-hidden` | base |

### `.ui-vt`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.vt` | `ui-vt` | base |

### `.ui-waffle`

| Registry key | Class | Kind |
| --- | --- | --- |
| `cls.waffle` | `ui-waffle` | base |

## Table-local state classes

Not in `cls` by design — these are plain `is-*` state hooks scoped to
`.ui-table` (the same convention as `is-active` on tabs), so they never
collide with global classes. Apply them on `<td>`/`<th>`. A typed
registry consumer should reach for these instead of re-implementing
`text-align` / tabular figures by hand.

| Class | Where | Effect |
| --- | --- | --- |
| `.ui-table .is-num` | numeric `<td>`/`<th>` | tabular figures + end-aligned (the canonical numeric cell) |
| `.ui-table .is-pos` | numeric `<td>`, `.ui-stat__delta` | positive-delta tone |
| `.ui-table .is-neg` | numeric `<td>`, `.ui-stat__delta` | negative-delta tone |
| `.ui-table .is-key` | `<td>`/`<th>` | emphasised key column |

For numeric text *outside* a table, use the `ui-num` primitive
(`ui.num({ tone })`), which carries the same tabular/aligned/tone intent; for
a trend figure use `ui-delta` (`ui.delta({ dir, invert })`). The full,
machine-readable list of these `is-*` state hooks — and the author-set inline
custom properties (`--chart-color`, `--chart-pattern`, `--value`, and the
**required** `--icon-mask` on `.ui-icon` and `--ui-vt-name` on `.ui-vt` —
without which those classes render a solid square / do nothing) — is in
[`@ponchia/ui/classes.json`](../classes/classes.json)
(`states` / `customProperties`).

## Composition & state (read before re-implementing glue)

The agnostic surface is class- and string-recipe-only; **stateful and
relational wiring is ARIA-driven, not class-driven** — by design, so it
works in any framework without a binding layer:

- **Form field** — compose `ui-field` > `ui-label` + control +
  `ui-hint`. Invalid state is the native `aria-invalid="true"` on the
  control (styles `ui-input`/`ui-select`/`ui-textarea` red); associate
  the hint with `aria-describedby`. There is deliberately no
  `ui-field--invalid` class.
- **Button loading** — set `aria-busy="true"` (and `disabled`) on
  `ui-button`; the leading spinner is injected by CSS with no extra
  markup or class. `ui-button--sm`/`--lg` size it.
- **Badge tone** — `ui.badge({ tone })` emits the badge tone
  (`accent|success|warning|danger|info|muted`). The set is badge-specific, not a
  universal vocabulary — `muted` is a badge/neutral tone, absent from the status
  families (`ui-alert`/`ui-toast`/`ui-meter`/`ui-dot`); the builders warn on an
  out-of-set tone (see usage.md). Mapping an app's own variant
  vocabulary onto a tone is application logic, not a framework class.
- **Modal** — native `<dialog>` gets backdrop + top-layer + focus-trap
  free. For a controlled/portal modal, add `is-open`
  (`ui.modal({ open: true })`) for the same skin/layout; the
  backdrop, top-layer stacking AND focus-trap are then yours (`.is-open`
  is a bare grid — it does not float or stack on its own).
- **Current page** — mark the active link with `aria-current="page"`; it is
  the programmatic cue the navs honour (`ui-sitenav`, `ui-app-nav`). The
  `.is-active` class is the visual-only equivalent on `ui-app-nav`/`ui-tab`;
  prefer `aria-current` so assistive tech announces the current page.
- **Form validation wiring** — `initFormValidation` (`@ponchia/ui/behaviors`)
  reads these attributes; they ARE the contract, not styling. Markup that omits
  them renders but the behavior silently no-ops: `data-bronto-validate` on the
  `<form>`; an optional empty `[data-bronto-error]` node per field (it falls
  back to the field's `.ui-hint`, restoring the help text when valid again); a
  `[data-bronto-error-summary]` (`.ui-error-summary`) block. The combobox
  reads `[data-bronto-combobox]` + per-option `data-value` and emits
  `bronto:change` (`{ detail: { value, label } }`) on selection — `label` is the
  chosen option's text, so a live region can announce it without re-reading the DOM;
  the interactive
  legend emits `bronto:legend:toggle` (`{ detail: { series, active } }`).
- **Status indicator** — `ui-status` carries no dot of its own: compose it with
  a `.ui-dot` child + a text label, e.g.
  `<span class="ui-status"><span class="ui-dot ui-dot--success"></span> Live</span>`.
  (`ui-state` instead bakes in its own dot + the full tone vocabulary — pick
  one.) A semantic `ui-dot--success|warning|danger|info` is colour-only outside
  forced-colors, so it ALWAYS needs an adjacent text/aria label — never ship a
  bare coloured dot as the sole signal.
- **Opt-in component CSS** — a few classes are not in the core bundle and need
  their leaf imported, or they render unstyled: `ui-property`/`ui-readout` →
  `@ponchia/ui/css/workbench.css`; `ui-mark`/`ui-bracket-note` →
  `@ponchia/ui/css/marks.css`; the analytical leaves (`ui-annotations`,
  `ui-crosshair`, `ui-spotlight`, …) → their matching leaf.
- **Loaders need their children** — `ui-dotspinner` requires exactly eight
  `<i>` children, `ui-dotloader` three `<span>`, and a static `ui-dotbar`
  lights a segment with `<i class="is-on">`. A childless
  `<span class="ui-dotspinner">` renders nothing.
- **`ui-caret` is a typing cursor**, not a dropdown chevron — a blinking block
  caret. It is **pure CSS** (a `uiBlink` keyframe on `::after`); it needs no
  behavior — do NOT call `initDotGlyph` to animate it — and it is decorative, so
  keep it out of the a11y tree (`aria-hidden`). For a disclosure/affordance arrow
  use `ui-link--arrow` (`ui.link({ arrow: true })`).

## Tokens

Exact mirror of the `:root` blocks in `css/tokens.css`
(`check-fresh` enforces parity). DTCG export:
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
| `--dot-font` | `'Doto', var(--mono)` |
| `--display` | `var(--dot-font)` |
| `--display-weight` | `700` |
| `--display-weight-strong` | `800` |
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
| `--accent-1` | `color-mix(in oklch, var(--accent) 8%, var(--accent-ramp-end))` |
| `--accent-2` | `color-mix(in oklch, var(--accent) 16%, var(--accent-ramp-end))` |
| `--accent-3` | `color-mix(in oklch, var(--accent) 32%, var(--accent-ramp-end))` |
| `--accent-4` | `color-mix(in oklch, var(--accent) 60%, var(--accent-ramp-end))` |
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
| `--bronto-color-info` | `var(--info)` |
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
| `--accent-ramp-end` | `#ffffff` |
| `--accent-strong` | `color-mix(in srgb, var(--accent) 83%, #000)` |
| `--accent-text` | `var(--accent-strong)` |
| `--on-accent` | `var(--button-text)` |
| `--accent-soft` | `color-mix(in srgb, var(--accent) 10%, transparent)` |
| `--success` | `#2f7d4f` |
| `--success-soft` | `rgb(47, 125, 79, 0.12)` |
| `--warning` | `#806414` |
| `--warning-soft` | `rgb(128, 100, 20, 0.13)` |
| `--danger` | `#c01622` |
| `--danger-soft` | `rgb(192, 22, 34, 0.1)` |
| `--info` | `#1f63c4` |
| `--info-soft` | `rgb(31, 99, 196, 0.12)` |
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
| `--bg` | `#121212` |
| `--bg-elevated` | `#181818` |
| `--bg-accent` | `color-mix(in srgb, var(--accent) 8%, transparent)` |
| `--panel` | `#1c1c1c` |
| `--panel-strong` | `#222222` |
| `--panel-soft` | `#242424` |
| `--line` | `#383838` |
| `--line-strong` | `#555555` |
| `--text` | `#e6e6e6` |
| `--text-soft` | `#c8c8c8` |
| `--text-dim` | `#a0a0a0` |
| `--accent` | `#ff3b41` |
| `--accent-ramp-end` | `#000000` |
| `--accent-strong` | `color-mix(in srgb, var(--accent) 84%, #fff)` |
| `--accent-text` | `var(--accent-strong)` |
| `--on-accent` | `var(--button-text)` |
| `--accent-soft` | `color-mix(in srgb, var(--accent) 14%, transparent)` |
| `--success` | `#4ec27e` |
| `--success-soft` | `rgb(78, 194, 126, 0.14)` |
| `--warning` | `#d8bd72` |
| `--warning-soft` | `rgb(216, 189, 114, 0.14)` |
| `--danger` | `#ff4d54` |
| `--danger-soft` | `rgb(255, 77, 84, 0.15)` |
| `--info` | `#6fb0e6` |
| `--info-soft` | `rgb(111, 176, 230, 0.14)` |
| `--code-bg` | `rgb(255, 255, 255, 0.05)` |
| `--button-text` | `#000000` |
| `--field-dot` | `rgb(242, 242, 242, 0.14)` |
| `--field-dot-hot` | `rgb(242, 242, 242, 0.36)` |
| `--field-dot-accent` | `color-mix(in srgb, var(--accent) 82%, transparent)` |
| `--focus-ring` | `var(--accent)` |
| `--shadow` | `none` |
| `--shadow-raised` | `0 0 0 1px var(--line-strong)` |
