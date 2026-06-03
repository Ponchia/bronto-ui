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

/** Author-set state hooks that are valid but deliberately NOT in `cls` (see
 *  reference.md §"Table-local state classes" / §"Composition & state"). A
 *  validator should treat these as known, not as invented classes. This is the
 *  author-applied set only; purely behavior-managed hooks (e.g. `is-leaving`,
 *  `is-visible`) are set at runtime by the optional behaviors, not hand-written,
 *  so they are out of scope here. */
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
