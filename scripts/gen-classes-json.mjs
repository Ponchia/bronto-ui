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
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cls } from '../classes/index.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Base = the class up to the first BEM separator (`--` modifier / `__` part).
const baseOf = (v) => v.split('--')[0].split('__')[0];

const all = [...new Set(Object.values(cls))].sort();

const groups = {};
for (const value of all) {
  const base = baseOf(value);
  groups[base] ??= { base, modifiers: [], parts: [] };
  if (value === base) continue;
  if (value.includes('--')) groups[base].modifiers.push(value);
  else if (value.includes('__')) groups[base].parts.push(value);
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
    on: '.ui-meter__fill, .ui-progress__bar',
    type: 'number 0..100',
    example: '92',
    note: 'measured value as a percentage — set on the fill element, not its track parent',
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
];

export function buildClassesJson() {
  return {
    $comment:
      '@ponchia/ui class vocabulary as language-neutral data — validate emitted markup without executing the ESM cls map or parsing the .d.ts. Generated from classes/index.js — do not edit by hand; run `npm run classes:json:build`. Drift-checked in CI. `states` is the author-applied `is-*` hooks (runtime/behavior-managed hooks are excluded); `states` + `customProperties` are documented in docs/reference.md and ship outside `cls` by design.',
    counts: { classes: all.length, groups: Object.keys(sortedGroups).length },
    groups: sortedGroups,
    classes: all,
    states,
    customProperties,
  };
}

export const CLASSES_JSON_PATH = resolve(root, 'classes/classes.json');
export const classesJson = () => JSON.stringify(buildClassesJson(), null, 2) + '\n';

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  writeFileSync(CLASSES_JSON_PATH, classesJson());
  console.log(
    `✓ wrote classes/classes.json (${all.length} classes, ${Object.keys(sortedGroups).length} groups)`,
  );
}
