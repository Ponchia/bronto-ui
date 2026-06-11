/**
 * Generate classes/classes.json — the class vocabulary as language-neutral
 * data, so an external system (a Python/Go pipeline, an LLM tool-runner, a
 * linter) can validate emitted markup WITHOUT executing the ESM `cls` map or
 * parsing the TypeScript `.d.ts`. Every other data contract in the package
 * (tokens.json, charts.json, mermaid.json, d2.json) ships a `.json`; this is
 * the same for the framework's primary API, its class names.
 *
 *   classes/classes.json ← classes/index.js `cls`
 *
 * Shape:
 *   - `groups`  base class → { base, modifiers[], parts[] } (the BEM grammar:
 *               which `--modifier`/`__part` belong to which base — the coarse
 *               structure contract an author needs).
 *   - `classes` the flat sorted list of every `ui-*` class (the `cls` values).
 *   - `states`  the sanctioned `is-*` state hooks that live OUTSIDE `cls` by
 *               design (so a validator linting only `classes` doesn't false-flag
 *               them) — with the scope each one is valid in.
 *   - `customProperties` the author-set CSS custom properties (legend/meter
 *               knobs) — the inline-style contract that is otherwise prose-only.
 *
 * Pure function of committed source (no Date/now/random) → drift-checked by
 * scripts/check-fresh.mjs via the registry, exactly like reference.md and the
 * .d.ts. Run: node scripts/gen-classes-json.mjs
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cls } from '../classes/index.js';

import { repoRoot as root, isMain } from './lib/emit.mjs';

// Base = the class up to the first BEM separator (`--` modifier / `__` part).
const baseOf = (v) => v.split('--')[0].split('__')[0];

const all = [...new Set(Object.values(cls))].sort();

const allSet = new Set(all);

const groups = {};
for (const value of all) {
  const prefix = baseOf(value);
  // `base` is the standalone base class ONLY when it actually exists in `cls`
  // (and therefore the CSS). A parts-only namespace — e.g. `ui-themetoggle` has
  // `__button`/`__track` but NO bare `.ui-themetoggle` rule — gets `base: null`,
  // so a contract-driven generator never emits a phantom unstyled
  // `class="ui-themetoggle"`. A CSS-presence gate (check-classes.mjs) enforces
  // that every non-null `base` resolves to a real selector. (component audit C11.)
  groups[prefix] ??= { base: allSet.has(prefix) ? prefix : null, modifiers: [], parts: [] };
  if (value === prefix) continue;
  if (value.includes('--')) groups[prefix].modifiers.push(value);
  else if (value.includes('__')) groups[prefix].parts.push(value);
}

// Sorted-key object so the JSON is byte-stable regardless of `cls` order.
const sortedGroups = Object.fromEntries(
  Object.keys(groups)
    .sort()
    .map((k) => [k, groups[k]]),
);

/** State hooks that are valid but live OUTSIDE `cls` by design (see reference.md
 *  §"Table-local state classes" / §"Composition & state"). A validator should
 *  treat every entry here as known, not as an invented class. Entries flagged
 *  `managed: 'runtime'` are toggled by JS or a data binding — discoverable so a
 *  validator never false-flags them, but an author normally does NOT hand-write
 *  them (component-audit C25, which found `is-on`/`is-visible` were only in this
 *  comment, so valid markup validated as "unknown"). `is-on` is the exception:
 *  it is author-writable to light a static `.ui-dotbar` segment. */
const states = [
  {
    class: 'is-num',
    scope: '.ui-table cell',
    effect: 'tabular figures, end-aligned (the canonical numeric cell)',
  },
  {
    class: 'is-pos',
    scope: '.ui-table cell, .ui-stat__delta, .ui-app-metric__delta',
    effect: 'positive-delta tone',
  },
  {
    class: 'is-neg',
    scope: '.ui-table cell, .ui-stat__delta, .ui-app-metric__delta',
    effect: 'negative-delta tone',
  },
  { class: 'is-key', scope: '.ui-table cell', effect: 'emphasised key column' },
  {
    class: 'is-open',
    scope: 'controlled .ui-modal / .ui-popover',
    effect: "open state (focus-trap is the host's)",
  },
  {
    class: 'is-active',
    scope: '.ui-tab and other selectable items',
    effect: 'active/selected state',
  },
  {
    class: 'is-source-active',
    scope: '.ui-source-card',
    effect: 'temporary source highlight after a citation/backref activation',
    managed: 'runtime',
  },
  {
    class: 'is-inactive',
    scope: 'interactive .ui-legend__item',
    effect: 'host-set toggled-off state',
  },
  {
    class: 'is-on',
    scope: '.ui-dotbar segment (<i>)',
    effect: 'lit segment — author-writable for a static bar, or set by a data binding',
  },
  {
    class: 'is-visible',
    scope: '.ui-reveal',
    effect: 'revealed state',
    managed: 'runtime',
  },
  {
    class: 'is-in',
    scope: '.ui-matrix',
    effect: 'reveal-complete state',
    managed: 'runtime',
  },
  {
    class: 'is-leaving',
    scope: '.ui-toast',
    effect: 'exit-animation state',
    managed: 'runtime',
  },
];

/** Author-set CSS custom properties — the inline-style knobs that drive the
 *  legend swatch / meter primitives. Otherwise documented only in prose. */
const customProperties = [
  {
    name: '--chart-color',
    on: '.ui-legend__swatch',
    type: 'color',
    example: 'var(--chart-1)',
    note: 'legend-key series colour — use a --chart-* token, never a raw hex',
  },
  {
    name: '--chart-pattern',
    on: '.ui-legend__swatch',
    type: 'image',
    example: 'var(--chart-pattern-1)',
    note: 'redundant non-colour channel — pair pattern N with colour N (WCAG 1.4.1)',
  },
  {
    name: '--value',
    on: '.ui-meter, .ui-progress',
    type: 'number 0..100',
    example: '92',
    note: 'measured value as a UNITLESS number 0..100 (registered <number>, never a %). Set it on the meter/progress host — it inherits to the __fill/__bar. Prefer attrs.meter(value)/attrs.progress(value) from @ponchia/ui/classes, which sets it plus role + aria-valuenow/min/max together.',
  },
  {
    name: '--icon-mask',
    on: '.ui-icon',
    type: 'image',
    // A real, resolvable mask `url()` — there is NO `--glyph-*` token, so the
    // old `var(--glyph-check)` example silently no-opped to a solid square
    // (component-audit C1). In JS, `renderGlyph(name, { render: 'mask' })` from
    // @ponchia/ui/glyphs builds this value for any of the 43 named glyphs.
    example:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='4'/%3E%3C/svg%3E\")",
    required: true,
    note: "REQUIRED — the bitmap masked into the icon; a bare .ui-icon with no --icon-mask paints a solid currentColor square, not a glyph. The value is an image (a mask url(); there is no --glyph-* token). Use renderGlyph(name, { render: 'mask' }) to build it from a named glyph.",
  },
  {
    name: '--icon-size',
    on: '.ui-icon',
    type: 'length',
    example: '1.25rem',
    note: 'icon box size (default 1em)',
  },
  {
    name: '--i',
    on: '.ui-stagger > *',
    type: 'integer',
    example: '2',
    note: "per-child stagger index — sets each child's animation-delay (× 60ms). Omit and use `.ui-stagger--auto` to derive it from :nth-child instead.",
  },
  {
    name: '--ui-vt-name',
    on: '.ui-vt',
    type: 'custom-ident',
    example: 'hero-image',
    required: true,
    note: 'REQUIRED — the view-transition-name; .ui-vt is inert (no transition) without it',
  },
  {
    name: '--v',
    on: '.ui-spark__bar',
    type: 'number 0..1',
    example: '0.7',
    required: true,
    note: 'REQUIRED — the normalised bar height (0..1). The host normalises; Bronto only paints. A bar with no --v collapses to the 1px floor. Pair every spark with a host-written role="img" + aria-label.',
  },
  {
    name: '--sidenote-width',
    on: '.ui-sidenote, .ui-marginnote',
    type: 'length',
    example: '12rem',
    note: 'width of the floated margin note on wide viewports (default 12rem). The container must reserve a matching inline-end gutter — see docs/sidenote.md.',
  },
  {
    name: '--textref-highlight',
    on: '.ui-textref',
    type: 'color',
    example: 'var(--accent-soft)',
    note: 'the ::target-text highlight wash for the matched cited sentence (default var(--accent-soft)). The host builds the #:~:text= href; Bronto owns the paint — see docs/textref.md.',
  },
  {
    name: '--figure-max-inline',
    on: '.ui-figure__stage',
    type: 'length',
    example: '32rem',
    note: 'maximum inline size of the centered figure stage (default 42rem). The host still owns chart/media dimensions and data mapping.',
  },
  {
    name: '--figure-min-block',
    on: '.ui-figure__stage',
    type: 'length',
    example: '16rem',
    note: 'minimum block size reserved for a live or late-rendered figure stage (default 0px).',
  },
  {
    name: '--figure-key-width',
    on: '.ui-figure__body--key-right',
    type: 'length',
    example: '12rem',
    note: 'width of the right-side key column before the figure body collapses to one column (default 14rem).',
  },
  {
    name: '--v',
    on: '.ui-bullet__measure',
    type: 'number 0..1',
    example: '0.62',
    required: true,
    note: 'REQUIRED — the normalised measure (0..1). The host normalises; Bronto only paints. A measure with no --v collapses to the 2px floor. Pair every bullet with a host-written role="img" + aria-label.',
  },
  {
    name: '--t',
    on: '.ui-bullet__target',
    type: 'number 0..1',
    example: '0.9',
    note: 'the normalised target tick position (0..1). Omit to drop the target mark.',
  },
  {
    name: '--band-lo',
    on: '.ui-bullet',
    type: 'number 0..1',
    example: '0.5',
    note: 'the lower qualitative-band boundary (0..1, default 0.5). Bands are grayscale by Few-design — meaning lives in the required aria-label.',
  },
  {
    name: '--band-hi',
    on: '.ui-bullet',
    type: 'number 0..1',
    example: '0.8',
    note: 'the upper qualitative-band boundary (0..1, default 0.8). Must be ≥ --band-lo.',
  },
  {
    name: '--toc-top',
    on: '.ui-toc',
    type: 'length',
    example: '1rem',
    note: 'the sticky inset from the top of the scroll container (default var(--space-md)).',
  },
  {
    name: '--lo',
    on: '.ui-interval',
    type: 'number 0..1',
    example: '0.22',
    required: true,
    note: 'REQUIRED — normalised lower bound of the interval. The host normalises; Bronto only paints.',
  },
  {
    name: '--hi',
    on: '.ui-interval',
    type: 'number 0..1',
    example: '0.68',
    required: true,
    note: 'REQUIRED — normalised upper bound of the interval. The host normalises; Bronto only paints.',
  },
  {
    name: '--v',
    on: '.ui-interval__point',
    type: 'number 0..1',
    example: '0.52',
    note: 'optional normalised point estimate inside the interval. Omit the point element when there is no point estimate.',
  },
  {
    name: '--clamp-lines',
    on: '.ui-clamp',
    type: 'integer',
    example: '3',
    note: 'number of lines shown before the optional reveal control expands the excerpt (default 4).',
  },
  {
    name: '--highlight-evidence',
    on: '.ui-highlights',
    type: 'color',
    example: 'var(--accent-soft)',
    note: 'CSS Custom Highlight API wash for host-registered bronto-evidence ranges.',
  },
  {
    name: '--highlight-search',
    on: '.ui-highlights',
    type: 'color',
    example: 'var(--warning-soft)',
    note: 'CSS Custom Highlight API wash for host-registered bronto-search ranges.',
  },
  {
    name: '--highlight-current',
    on: '.ui-highlights',
    type: 'color',
    example: 'color-mix(in srgb, var(--accent) 22%, transparent)',
    note: 'CSS Custom Highlight API wash for the host-registered bronto-current range.',
  },

  // Layout-primitive tuning knobs — the Every-Layout intrinsics + app-shell.
  // Undiscoverable before (prose-only / not even prose) so an author couldn't
  // set a column min, sidebar width, ratio, or rail width from the contract
  // (component-audit C18). Each falls back to the listed default when unset.
  {
    name: '--stack-gap',
    on: '.ui-stack',
    type: 'length',
    example: '1.5rem',
    note: 'vertical rhythm between stacked children (default var(--space-md))',
  },
  {
    name: '--cluster-gap',
    on: '.ui-cluster',
    type: 'length',
    example: '0.75rem',
    note: 'gap between clustered inline items (default var(--space-xs))',
  },
  {
    name: '--grid-min',
    on: '.ui-grid',
    type: 'length',
    example: '12rem',
    note: 'minimum column width before the auto-fit grid wraps (default 16rem)',
  },
  {
    name: '--grid-gap',
    on: '.ui-grid',
    type: 'length',
    example: '1rem',
    note: 'gap between grid cells (default var(--space-md))',
  },
  {
    name: '--sidebar-width',
    on: '.ui-sidebar',
    type: 'length',
    example: '18rem',
    note: 'natural width of the sidebar child (default 16rem)',
  },
  {
    name: '--sidebar-min',
    on: '.ui-sidebar',
    type: 'percentage | length',
    example: '50%',
    note: 'min width of the main child before the two stack (default 60%)',
  },
  // Gap knobs for the two flex Every-Layout primitives. Every sibling layout
  // (--stack-gap/--cluster-gap/--grid-gap) was already discoverable; these two
  // were the only gaps an author had to guess, so an LLM hand-rolled a margin.
  // (component audit C13.)
  {
    name: '--sidebar-gap',
    on: '.ui-sidebar',
    type: 'length',
    example: '1.5rem',
    note: 'gap between the sidebar and the main child (default var(--space-md))',
  },
  {
    name: '--switcher-gap',
    on: '.ui-switcher',
    type: 'length',
    example: '1.5rem',
    note: 'gap between switcher children in both row and column states (default var(--space-md))',
  },
  {
    name: '--switcher-min',
    on: '.ui-switcher',
    type: 'length',
    example: '20rem',
    note: 'threshold below which all children switch from row to column together (default 24rem)',
  },
  {
    name: '--center-max',
    on: '.ui-center',
    type: 'length',
    example: '70ch',
    note: 'max measure of the centred column — the INNER width; gutters add to the total (content-box) (default 64rem)',
  },
  {
    name: '--center-gutter',
    on: '.ui-center',
    type: 'length',
    example: '2rem',
    note: 'inline padding either side of the centred column (default var(--space-md))',
  },
  {
    name: '--ratio',
    on: '.ui-ratio',
    type: 'ratio',
    example: '4 / 3',
    note: 'intrinsic aspect ratio of the box (default 16 / 9). Give .ui-ratio EXACTLY ONE child — only :first-child is sized to fill; a second child silently breaks the ratio. For a caption/overlay, position it absolutely inside the single child',
  },
  {
    name: '--app-rail',
    on: '.ui-app-shell',
    type: 'length',
    example: '16rem',
    note: 'width of the app-shell sidebar rail column (default 14rem)',
  },
  // Page-frame container caps (component-audit C20 — these were real, working
  // sizing knobs the manifest never surfaced). `.ui-container` is a border-box
  // page frame; `.ui-center` is a content-box measure — see usage.md.
  {
    name: '--container',
    on: '.ui-container',
    type: 'length',
    example: '72rem',
    note: 'max inline width of the default page frame, border-box (default 72rem)',
  },
  {
    name: '--container-narrow',
    on: '.ui-container--narrow',
    type: 'length',
    example: '44rem',
    note: 'max inline width of the narrow page frame (default 44rem)',
  },
  {
    name: '--container-wide',
    on: '.ui-container--wide',
    type: 'length',
    example: '82rem',
    note: 'max inline width of the wide page frame (default 82rem)',
  },
  {
    name: '--av-size',
    on: '.ui-avatar',
    type: 'length',
    example: '2.6rem',
    note: 'avatar box size; the initials font-size derives from it (default 2.2rem; --sm 1.5rem, --lg 3.2rem)',
  },
  {
    name: '--dotmatrix-cols',
    on: '.ui-dotmatrix',
    type: 'number',
    example: '8',
    note: 'columns in the dot grid — the density knob (default 12)',
  },
  {
    name: '--dotmatrix-gap',
    on: '.ui-dotmatrix',
    type: 'length',
    example: '0.3rem',
    note: 'gap between dots (default 0.5rem; set 0 with --dotmatrix-dot-radius:0 to fuse the dots)',
  },
  {
    name: '--dotmatrix-dot',
    on: '.ui-dotmatrix',
    type: 'length',
    example: '0.5rem',
    note: 'fixed dot length for intrinsic sizing (default minmax(0, 1fr) — fluid to the container)',
  },
  {
    name: '--dotmatrix-dot-radius',
    on: '.ui-dotmatrix',
    type: 'length',
    example: '0',
    note: 'dot corner radius (default 50% = round; 0 = square pixels)',
  },
  {
    name: '--dotmatrix-glow',
    on: '.ui-dotmatrix',
    type: 'length',
    example: '2px',
    note: 'phosphor bloom radius around lit cells (default 0 = off)',
  },
  {
    name: '--dotmatrix-pulse-min',
    on: '.ui-dotmatrix',
    type: 'number',
    example: '0.4',
    note: 'opacity floor the --pulse animation dips to (default 0.55)',
  },
  {
    name: '--dotmatrix-reveal-step',
    on: '.ui-dotmatrix',
    type: 'time',
    example: '5ms',
    note: 'per-cell scan cadence for the reveal animation (default 3ms)',
  },
  {
    name: '--ds-box',
    on: '.ui-dotspinner',
    type: 'length',
    example: '2.6rem',
    note: 'dot-spinner box size (default 1.6rem; the --lg modifier sets 2.6rem)',
  },
  {
    name: '--ds-dot',
    on: '.ui-dotspinner',
    type: 'length',
    example: '0.42rem',
    note: 'dot-spinner dot size (default 0.26rem)',
  },
  {
    name: '--crosshair-color',
    on: '.ui-crosshair',
    type: 'color',
    example: 'var(--accent)',
    note: 'crosshair rule + badge colour (default var(--accent); the --muted modifier uses --line-strong)',
  },
  {
    name: '--connector-color',
    on: '.ui-connector',
    type: 'color',
    example: 'var(--accent)',
    note: 'leader-line stroke + label colour (default var(--line-strong); the --muted/--accent modifiers reset it)',
  },
  {
    name: '--connector-width',
    on: '.ui-connector',
    type: 'number',
    example: '2',
    note: 'leader-line stroke width (default 1.5)',
  },
  {
    name: '--mark-color',
    on: '.ui-mark',
    type: 'color',
    example: 'var(--accent)',
    note: 'hand-drawn mark colour; a tone modifier sets it (no base default — each draw style falls back to --line-strong)',
  },
  {
    name: '--spot-pad',
    on: '.ui-spotlight',
    type: 'length',
    example: '12px',
    note: 'padding between the spotlit target and the cutout edge (default 8px)',
  },
  {
    name: '--spot-radius',
    on: '.ui-spotlight',
    type: 'length',
    example: '12px',
    note: 'spotlight cutout corner radius (default var(--radius-md))',
  },
  {
    name: '--spot-backdrop',
    on: '.ui-spotlight',
    type: 'color',
    example: 'color-mix(in srgb, #000 70%, transparent)',
    note: 'the dimming backdrop colour outside the cutout (default 55% black)',
  },
];

// Root-level attributes that switch the whole theme/skin/density/surface. An
// LLM consuming only the manifest had no signal that theming existed or how to
// opt into a skin/OLED/density (component-audit C21). Set on :root / <html>.
const rootAttributes = [
  {
    name: 'data-theme',
    on: ':root',
    values: ['light', 'dark'],
    note: 'colour theme. Unset follows the OS via prefers-color-scheme; set it to force one.',
  },
  {
    name: 'data-density',
    on: ':root or any subtree',
    values: ['compact', 'comfortable'],
    note: 'spacing-scale preset (the middle scale is the default when unset). Scoped per-subtree, unlike the others.',
  },
  {
    name: 'data-surface',
    on: ':root',
    values: ['oled'],
    note: 'opt into a true-black surface ramp for OLED. Unset = the standard elevated dark base.',
  },
  {
    name: 'data-contrast',
    on: ':root',
    values: ['high'],
    note: 'raise contrast of lines/text for low-vision or glare. Unset = the standard ramp.',
  },
  {
    name: 'data-bronto-skin',
    on: ':root',
    values: ['amber-crt', 'phosphor-green', 'e-ink'],
    note: 'opt-in display colorway — requires @ponchia/ui/css/skins.css. Unset (the design target) = the default Nothing aesthetic.',
  },
  {
    name: '--accent',
    on: ':root or a theme root',
    values: ['<color>'],
    note: 'the single brand knob; the accent family derives from it. Re-brand at :root/[data-theme] (a subtree override is only a partial re-brand). See docs/theming.md.',
  },
];

// Behaviour-wiring attributes (`data-bronto-*`) — the open/close/dismiss hooks
// the optional behaviors delegate on. classes/rootAttributes are about painting
// and theming; this is the OTHER half a contract-driven generator needs: how to
// wire an overlay up. Without it the open/close contract lived only in JSDoc, so
// a tool reading the manifest could emit a `.ui-modal` but had no way to open it.
// (component audit C14.)
const behaviorAttributes = [
  {
    name: 'data-bronto-open',
    on: 'a trigger (button/link)',
    value: 'id of the target <dialog>',
    behavior: 'initDialog',
    note: 'click calls showModal() on the named <dialog>; focus returns to the trigger on every close path',
  },
  {
    name: 'data-bronto-close',
    on: 'a button inside a <dialog>',
    behavior: 'initDialog',
    note: 'click closes the nearest enclosing <dialog>',
  },
  {
    name: 'data-bronto-dialog-light',
    on: 'a <dialog>',
    behavior: 'initDialog',
    note: 'opt into backdrop light-dismiss (click the backdrop to close)',
  },
  {
    name: 'data-bronto-modal',
    on: 'a controlled (non-<dialog>) .ui-modal overlay',
    behavior: 'initModal',
    note: 'inert focus-trap + .is-open toggling for a modal that is not a native <dialog>; needs an accessible name',
  },
  {
    name: 'data-bronto-menu',
    on: 'a native <details> dropdown',
    behavior: 'initMenu',
    note: 'adds outside-click / Escape close affordances to a <details>-based .ui-menu',
  },
  {
    name: 'data-bronto-popover',
    on: 'a trigger',
    value: 'id of the .ui-popover panel',
    behavior: 'initPopover',
    note: 'collision-aware NON-modal popover (no focus trap); top-layer via the native popover attr when present, else an .is-open class. Author an accessible name on the panel.',
  },
  {
    name: 'data-bronto-command',
    on: 'a .ui-command palette host wrapping its input',
    behavior: 'initCommand',
    note: 'wires the filter input + active-option keyboard model',
  },
  {
    name: 'data-bronto-sources',
    on: 'a source/citation island',
    behavior: 'initSources',
    note: 'scopes citation preview metadata and source-card focus/highlight behavior; the host still owns numbering, fetching, and trust decisions.',
  },
  {
    name: 'data-bronto-source-ref',
    on: 'a button/control that references a source card',
    value: 'id of the source card, with or without a leading #',
    behavior: 'initSources',
    note: 'button/control equivalent of a .ui-citation[href="#source-id"]; activation focuses and highlights the referenced source.',
  },
  {
    name: 'data-bronto-dismiss',
    on: 'a button',
    value: 'optional CSS selector of the ancestor to remove',
    behavior: 'dismissible',
    note: 'click removes the nearest matching ancestor (or, with no value, the nearest [data-bronto-dismissible])',
  },
  {
    name: 'data-bronto-disclosure',
    on: 'a trigger',
    value: 'id of the element it toggles',
    behavior: 'initDisclosure',
    note: 'toggles the named element + keeps aria-expanded in sync',
  },
  {
    name: 'data-bronto-tabs',
    on: 'a .ui-tabs group host',
    behavior: 'initTabs',
    note: 'adds the WAI-ARIA Tabs keyboard model (roving tabindex, Arrow/Home/End, aria-selected, panel hidden sync) over .ui-tab[data-tab] / .ui-tabs__panel[data-panel]. Without it the CSS tabs are mouse-only with no roving focus.',
  },
  {
    name: 'data-bronto-theme-toggle',
    on: 'a .ui-themetoggle__button (or any control)',
    value: "optional 'light' | 'dark' to force a specific theme instead of toggling",
    behavior: 'initThemeToggle',
    note: 'click toggles or sets data-theme on <html> and persists it; without it the button is inert. Pair with applyStoredTheme() before paint to avoid a flash.',
  },
  {
    name: 'data-bronto-validate',
    on: 'a <form>',
    behavior: 'initFormValidation',
    note: 'progressive-enhancement validation: suppresses native bubbles, writes validationMessage into the field error slot, builds the error summary. With JS off the form still validates natively.',
  },
  {
    name: 'data-bronto-error',
    on: 'an empty error slot inside a .ui-field (canonical: <p class="ui-hint" data-bronto-error>)',
    behavior: 'initFormValidation',
    note: 'the dedicated per-field error node initFormValidation fills + links via aria-describedby (and unlinks when the field is valid). Preferred over borrowing the .ui-hint help slot.',
  },
  {
    name: 'data-bronto-error-summary',
    on: 'a .ui-error-summary inside the form',
    behavior: 'initFormValidation',
    note: 'on an invalid submit, filled with role=alert + tabindex=-1 in-page links to each bad field and focused.',
  },
  {
    name: 'data-bronto-combobox',
    on: 'a .ui-combobox host (wrapping the input + listbox)',
    behavior: 'initCombobox',
    note: 'editable combobox with a filtered listbox (APG pattern). The input needs a real accessible name (a placeholder does not count — it warns).',
  },
  {
    name: 'data-bronto-combobox-live',
    on: 'the [data-bronto-combobox] host',
    behavior: 'initCombobox',
    note: 'opt-in: a MutationObserver re-reads option nodes in place for async/replaced results, instead of a full re-init. Off by default.',
  },
  {
    name: 'data-bronto-sortable',
    on: 'a .ui-table <table>',
    behavior: 'initTableSort',
    note: 'click a header .ui-table__sort button to sort; numeric columns via data-sort="num" or .is-num cells. Use data-sort-value on a cell for a canonical sort key (accepts a European decimal comma).',
  },
  {
    name: 'data-bronto-select',
    on: 'a row checkbox inside a [data-bronto-sortable] table',
    behavior: 'initTableSort',
    note: 'toggling it sets the row aria-selected and syncs the header select-all state; emits bronto:selectionchange.',
  },
  {
    name: 'data-bronto-select-all',
    on: 'the header checkbox of a [data-bronto-sortable] table',
    behavior: 'initTableSort',
    note: 'toggles every [data-bronto-select] row box; goes indeterminate on a partial selection.',
  },
  {
    name: 'data-bronto-dismissible',
    on: 'the ancestor a [data-bronto-dismiss] button removes',
    behavior: 'dismissible',
    note: 'marks the default removal target when the dismiss button has no selector value. A cancelable bronto:dismiss fires first.',
  },
  {
    name: 'data-bronto-legend',
    on: 'a .ui-legend host',
    behavior: 'initLegend',
    note: 'each .ui-legend__item is a <button aria-pressed>; clicking flips aria-pressed + .is-inactive and dispatches bronto:legend:toggle { series, active }. The host runs the actual series show/hide.',
  },
  {
    name: 'data-bronto-crosshair',
    on: 'a plot containing a .ui-crosshair overlay',
    behavior: 'initCrosshair',
    note: 'tracks the pointer, sets --crosshair-x/y on the overlay, and emits bronto:crosshair:move { x, y, fx, fy }. Reports WHERE the pointer is — it does not map pixels to data.',
  },
  {
    name: 'data-bronto-connector',
    on: 'a .ui-connector SVG overlay',
    value: 'via child data-from / data-to (element ids), optional data-shape / data-*-side',
    behavior: 'initConnectors',
    note: 'draws + keeps leader lines in sync between the referenced elements; re-routes on resize/scroll.',
  },
  {
    name: 'data-bronto-spotlight',
    on: 'a .ui-spotlight overlay',
    value: 'via data-target (id of the element to highlight)',
    behavior: 'initSpotlight',
    note: 'measures the target and sets --spot-x/y/w/h on the overlay, re-placing on resize/scroll. Positioning only — not a tour engine.',
  },
  {
    name: 'data-bronto-carousel',
    on: 'a carousel host containing a .ui-carousel__viewport',
    behavior: 'initCarousel',
    note: 'scroll-snap carousel with prev/next + a status counter; the lightbox dialog uses it too.',
  },
  {
    name: 'data-bronto-carousel-prev',
    on: 'a control inside [data-bronto-carousel]',
    behavior: 'initCarousel',
    note: 'the previous-slide button.',
  },
  {
    name: 'data-bronto-carousel-next',
    on: 'a control inside [data-bronto-carousel]',
    behavior: 'initCarousel',
    note: 'the next-slide button.',
  },
  {
    name: 'data-bronto-carousel-loop',
    on: 'the [data-bronto-carousel] host',
    behavior: 'initCarousel',
    note: 'wrap from the last slide back to the first (and vice-versa).',
  },
  {
    name: 'data-bronto-carousel-label',
    on: 'the [data-bronto-carousel] host',
    value: 'accessible name for the carousel region',
    behavior: 'initCarousel',
    note: 'names the scroll region (defaults to "Carousel").',
  },
  {
    name: 'data-bronto-carousel-current',
    on: 'a .ui-carousel__slide',
    behavior: 'initCarousel',
    note: 'marks the slide to start on (defaults to the first).',
  },
  {
    name: 'data-bronto-glyph',
    on: 'a placeholder element',
    value: 'glyph name (see GLYPH_NAMES)',
    behavior: 'initDotGlyph',
    note: 'expands into a .ui-dotmatrix dot grid; an unknown name is left untouched + warns.',
  },
  {
    name: 'data-bronto-glyph-label',
    on: 'a [data-bronto-glyph] placeholder',
    value: 'accessible label',
    behavior: 'initDotGlyph',
    note: 'exposes the glyph as role="img" with this name; omit for a decorative (aria-hidden) glyph.',
  },
  {
    name: 'data-bronto-glyph-solid',
    on: 'a [data-bronto-glyph] placeholder',
    behavior: 'initDotGlyph',
    note: 'render a square, gapless pixel glyph (more legible at small sizes) instead of the dot look.',
  },
  {
    name: 'data-bronto-glyph-anim',
    on: 'a [data-bronto-glyph] placeholder',
    value: "'reveal' | 'pulse'",
    behavior: 'initDotGlyph',
    note: 'decorative entrance/idle animation (honours prefers-reduced-motion).',
  },
  {
    name: 'data-bronto-glyph-render',
    on: 'a [data-bronto-glyph] placeholder',
    value: "'mask'",
    behavior: 'initDotGlyph',
    note: 'take the one-node .ui-icon mask path (inherits currentColor, scales with text) instead of the 256-cell grid — the icon-at-scale path.',
  },
  {
    name: 'data-bronto-glyph-size',
    on: "a [data-bronto-glyph-render='mask'] placeholder",
    value: 'CSS length',
    behavior: 'initDotGlyph',
    note: 'sets --icon-size on the masked glyph (sanitized to a length/calc allowlist).',
  },
];

// Per-component ARIA a generator MUST emit for the role to mean anything — the
// class paints, but a `.ui-meter`/`.ui-progress`/`.ui-error-summary` with no role
// is invisible to AT. The `attrs.*` helpers from @ponchia/ui/classes set these for
// you; this is the language-neutral statement of the same contract. (audit C18.)
const requiredAria = [
  {
    on: '.ui-progress',
    require:
      'role="progressbar" + aria-valuenow/min/max (determinate); role="progressbar" + aria-busy="true" and NO aria-valuenow (indeterminate)',
    helper: 'attrs.progress(value) / attrs.progress()',
  },
  {
    on: '.ui-meter',
    require:
      'role="meter" + aria-valuenow/min/max. Caveat: role="meter" has uneven AT support (notably older Safari/VoiceOver), so do NOT rely on it alone — the visible .ui-meter__label + .ui-meter__value carry the meaning and are the real channel (REQUIRED for a labelled meter)',
    helper: 'attrs.meter(value)',
  },
  {
    on: '.ui-dotbar',
    require:
      'role="progressbar" + aria-valuenow/min/max (determinate); role="progressbar" + aria-busy="true" and NO aria-valuenow (indeterminate). The <i> segments are decorative — mark the host or segments aria-hidden so AT reads the value, not eight empty spans',
    helper: 'attrs.dotbar(value) / attrs.dotbar()',
  },
  {
    on: '.ui-error-summary',
    require:
      'role="alert" + tabindex="-1" on the hand-authored summary so it is announced and focusable when validation fails',
    helper:
      'initFormValidation wires this for the dynamic summary; a static summary needs it hand-set',
  },
];

export function buildClassesJson() {
  return {
    $comment:
      '@ponchia/ui class vocabulary as language-neutral data — validate emitted markup without executing the ESM cls map or parsing the .d.ts. Generated from classes/index.js — do not edit by hand; run `npm run classes:json:build`. Drift-checked in CI. `groups[].base` is null for a parts-only namespace (no standalone base class — do NOT emit it). A modifier whose name contains `__` (e.g. `ui-spark__bar--pos`) attaches to THAT part, not the base host. `states` is the author-applied `is-*` hooks (runtime/behavior-managed hooks are excluded); `behaviorAttributes` are the `data-bronto-*` wiring hooks the optional behaviors delegate on; `requiredAria` is the role/aria a generator must emit per component. `states` + `customProperties` are documented in docs/reference.md and ship outside `cls` by design.',
    counts: { classes: all.length, groups: Object.keys(sortedGroups).length },
    groups: sortedGroups,
    classes: all,
    states,
    customProperties,
    rootAttributes,
    behaviorAttributes,
    requiredAria,
  };
}

export const CLASSES_JSON_PATH = resolve(root, 'classes/classes.json');
export const classesJson = () => JSON.stringify(buildClassesJson(), null, 2) + '\n';

if (isMain(import.meta.url)) {
  writeFileSync(CLASSES_JSON_PATH, classesJson());
  console.log(
    `✓ wrote classes/classes.json (${all.length} classes, ${Object.keys(sortedGroups).length} groups)`,
  );
}
