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
    note: 'intrinsic aspect ratio of the box (default 16 / 9)',
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
    name: 'data-bronto-dismiss',
    on: 'a button',
    value: 'optional CSS selector of the ancestor to remove',
    behavior: 'initDismissible',
    note: 'click removes the nearest matching ancestor (or, with no value, the nearest [data-bronto-dismissible])',
  },
  {
    name: 'data-bronto-disclosure',
    on: 'a trigger',
    value: 'id of the element it toggles',
    behavior: 'initDisclosure',
    note: 'toggles the named element + keeps aria-expanded in sync',
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
    require: 'role="meter" + aria-valuenow/min/max',
    helper: 'attrs.meter(value)',
  },
  {
    on: '.ui-error-summary',
    require:
      'role="alert" + tabindex="-1" on the hand-authored summary so it is announced and focusable when validation fails',
    helper: 'initForms wires this for the dynamic summary; a static summary needs it hand-set',
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
