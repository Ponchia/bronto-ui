// Gate: every public behavior export has explicit docs, unit-test, and browser
// ownership. `check:contract` proves documented init* names are real; this is
// the inverse guard, so a new behavior export cannot ship as an undocumented or
// untested public surface.
//
// Run: node scripts/check-behavior-matrix.mjs
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverNonPixelE2eSpecs } from './lib/e2e-specs.mjs';
import { reportAndExit } from './lib/gate-report.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const textCache = new Map();
const nonPixelE2eSpecs = new Set(discoverNonPixelE2eSpecs(root));

const BEHAVIORS = [
  behavior('applyStoredTheme', {
    docs: [{ file: 'docs/usage.md', includes: ['applyStoredTheme'] }],
    unit: [{ file: 'test/behaviors.test.mjs', includes: ['applyStoredTheme applies'] }],
    browser: [{ file: 'test/e2e/modes.spec.mjs', includes: ['applyStoredTheme()` intentionally'] }],
  }),
  behavior('initThemeToggle', {
    docs: [{ file: 'docs/usage.md', includes: ['initThemeToggle'] }],
    unit: [{ file: 'test/behaviors.test.mjs', includes: ['initThemeToggle toggles'] }],
    browser: [
      { file: 'test/e2e/behavior.spec.mjs', includes: ['theme toggle updates the root theme'] },
    ],
  }),
  behavior('dismissible', {
    docs: [{ file: 'docs/usage.md', includes: ['dismissible'] }],
    unit: [{ file: 'test/behaviors.test.mjs', includes: ['dismissible removes target'] }],
    browser: [
      { file: 'test/e2e/behavior.spec.mjs', includes: ['dismissible removes the nearest'] },
    ],
  }),
  behavior('initDisabledGuard', {
    docs: [{ file: 'docs/usage.md', includes: ['initDisabledGuard'] }],
    unit: [{ file: 'test/behaviors.test.mjs', includes: ['disabled guard blocks'] }],
    browser: [{ file: 'test/e2e/behavior.spec.mjs', includes: ['aria-disabled guard work'] }],
  }),
  behavior('initTabs', {
    docs: [{ file: 'docs/usage.md', includes: ['initTabs'] }],
    unit: [{ file: 'test/behaviors.test.mjs', includes: ['initTabs: roving'] }],
    browser: [{ file: 'test/e2e/a11y.spec.mjs', includes: ['tabs keyboard pattern'] }],
  }),
  behavior('initDialog', {
    docs: [{ file: 'docs/usage.md', includes: ['initDialog'] }],
    unit: [{ file: 'test/behaviors.test.mjs', includes: ['initDialog opens'] }],
    browser: [
      { file: 'test/e2e/behavior.spec.mjs', includes: ['native <dialog> open/close glue'] },
    ],
  }),
  behavior('initModal', {
    docs: [{ file: 'docs/usage.md', includes: ['initModal'] }],
    unit: [{ file: 'test/behaviors.test.mjs', includes: ['initModal: inert'] }],
    browser: [{ file: 'test/e2e/behavior.spec.mjs', includes: ['controlled modal'] }],
  }),
  behavior('toast', {
    docs: [{ file: 'docs/usage.md', includes: ['toast()'] }],
    unit: [{ file: 'test/behaviors.test.mjs', includes: ['toast mounts'] }],
    browser: [{ file: 'test/e2e/behavior.spec.mjs', includes: ['toast behavior creates'] }],
  }),
  behavior('initDisclosure', {
    docs: [{ file: 'docs/usage.md', includes: ['initDisclosure'] }],
    unit: [{ file: 'test/behaviors.test.mjs', includes: ['initDisclosure keeps'] }],
    browser: [{ file: 'test/e2e/a11y.spec.mjs', includes: ['disclosure toggles'] }],
  }),
  behavior('initMenu', {
    docs: [{ file: 'docs/usage.md', includes: ['initMenu'] }],
    unit: [{ file: 'test/behaviors.test.mjs', includes: ['initMenu closes'] }],
    browser: [{ file: 'test/e2e/behavior.spec.mjs', includes: ['native menu behavior closes'] }],
  }),
  behavior('initFormValidation', {
    docs: [{ file: 'docs/usage.md', includes: ['initFormValidation'] }],
    unit: [{ file: 'test/behaviors.test.mjs', includes: ['initFormValidation: invalid'] }],
    browser: [{ file: 'test/e2e/behavior.spec.mjs', includes: ['form validation uses native'] }],
  }),
  behavior('initCombobox', {
    docs: [{ file: 'docs/usage.md', includes: ['initCombobox'] }],
    unit: [{ file: 'test/behaviors.test.mjs', includes: ['initCombobox: wires'] }],
    browser: [{ file: 'test/e2e/behavior.spec.mjs', includes: ['combobox filters and selects'] }],
  }),
  behavior('initPopover', {
    docs: [{ file: 'docs/usage.md', includes: ['initPopover'] }],
    unit: [{ file: 'test/behaviors.test.mjs', includes: ['initPopover: toggles'] }],
    browser: [{ file: 'test/e2e/behavior.spec.mjs', includes: ['native popover branch'] }],
  }),
  behavior('initTableSort', {
    docs: [{ file: 'docs/usage.md', includes: ['initTableSort'] }],
    unit: [{ file: 'test/behaviors.test.mjs', includes: ['initTableSort: cycles'] }],
    browser: [{ file: 'test/e2e/behavior.spec.mjs', includes: ['sortable selectable table'] }],
  }),
  behavior('initCarousel', {
    docs: [{ file: 'docs/usage.md', includes: ['initCarousel'] }],
    unit: [{ file: 'test/behaviors.test.mjs', includes: ['initCarousel: wires'] }],
    browser: [{ file: 'test/e2e/behavior.spec.mjs', includes: ['carousel controls update'] }],
  }),
  behavior('initDotGlyph', {
    docs: [{ file: 'docs/glyphs.md', includes: ['initDotGlyph'] }],
    unit: [{ file: 'test/glyphs.test.mjs', includes: ['initDotGlyph expands'] }],
    browser: [{ file: 'test/e2e/behavior.spec.mjs', includes: ['one-node glyph mask'] }],
  }),
  behavior('initLegend', {
    docs: [{ file: 'docs/legends.md', includes: ['initLegend'] }],
    unit: [{ file: 'test/behaviors.test.mjs', includes: ['initLegend: click'] }],
    browser: [{ file: 'test/e2e/legends.spec.mjs', includes: ['interactive legend: click'] }],
  }),
  behavior('initConnectors', {
    docs: [{ file: 'docs/connectors.md', includes: ['initConnectors'] }],
    unit: [{ file: 'test/behaviors.test.mjs', includes: ['initConnectors: draws'] }],
    browser: [{ file: 'test/e2e/connectors.spec.mjs', includes: ['initConnectors draws'] }],
  }),
  behavior('initSpotlight', {
    docs: [{ file: 'docs/spotlight.md', includes: ['initSpotlight'] }],
    unit: [{ file: 'test/behaviors.test.mjs', includes: ['initSpotlight: sets'] }],
    browser: [{ file: 'test/e2e/spotlight.spec.mjs', includes: ['initSpotlight sizes'] }],
  }),
  behavior('initCrosshair', {
    docs: [{ file: 'docs/crosshair.md', includes: ['initCrosshair'] }],
    unit: [{ file: 'test/behaviors.test.mjs', includes: ['initCrosshair: emits'] }],
    browser: [{ file: 'test/e2e/crosshair.spec.mjs', includes: ['crosshair activates'] }],
  }),
  behavior('initCommand', {
    docs: [{ file: 'docs/command.md', includes: ['initCommand'] }],
    unit: [{ file: 'test/behaviors.test.mjs', includes: ['initCommand: ARIA'] }],
    browser: [{ file: 'test/e2e/command.spec.mjs', includes: ['bronto:command:select'] }],
  }),
  behavior('initSources', {
    docs: [{ file: 'docs/sources.md', includes: ['initSources'] }],
    unit: [{ file: 'test/behaviors.test.mjs', includes: ['initSources: seeds'] }],
    browser: [{ file: 'test/e2e/sources.spec.mjs', includes: ['initSources seeds'] }],
  }),
  behavior('initSplitter', {
    docs: [{ file: 'docs/workbench.md', includes: ['initSplitter'] }],
    unit: [{ file: 'test/behaviors.test.mjs', includes: ['initSplitter: keyboard'] }],
    browser: [{ file: 'test/e2e/workbench.spec.mjs', includes: ['splitter exposes'] }],
  }),
];

function behavior(name, options) {
  return { name, ...options };
}

function text(rel) {
  if (!textCache.has(rel)) textCache.set(rel, readFileSync(resolve(root, rel), 'utf8'));
  return textCache.get(rel);
}

function proof(kind, name, items) {
  if (!items?.length) {
    errors.push(`${name} has no ${kind} owner`);
    return;
  }
  for (const item of items) {
    if (kind === 'browser' && !nonPixelE2eSpecs.has(item.file)) {
      errors.push(
        `${name} browser owner ${item.file} is not a non-pixel Playwright spec discovered by scripts/test-e2e-nonpixel.mjs`,
      );
    }
    const abs = resolve(root, item.file);
    if (!existsSync(abs)) {
      errors.push(`${name} ${kind} owner is missing: ${item.file}`);
      continue;
    }
    const body = text(item.file);
    for (const needle of item.includes ?? [name]) {
      if (!body.includes(needle)) {
        errors.push(`${name} ${kind} owner ${item.file} does not contain "${needle}"`);
      }
    }
  }
}

function behaviorExports() {
  const barrel = text('behaviors/index.js');
  const names = new Set();
  for (const match of barrel.matchAll(/export\s*\{([^}]+)\}/g)) {
    for (const raw of match[1].split(',')) {
      const name = raw
        .trim()
        .split(/\s+as\s+/)
        .pop()
        .trim();
      if (name) names.add(name);
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

const exported = new Set(behaviorExports());
const owned = new Set(BEHAVIORS.map((entry) => entry.name));

for (const name of exported) {
  if (!owned.has(name)) errors.push(`${name} is exported from behaviors/index.js but not owned`);
}
for (const entry of BEHAVIORS) {
  if (!exported.has(entry.name)) {
    errors.push(`${entry.name} is owned by the behavior matrix but not exported`);
    continue;
  }
  proof('docs', entry.name, entry.docs);
  proof('unit', entry.name, entry.unit);
  proof('browser', entry.name, entry.browser);
}

reportAndExit(errors, {
  label: 'behavior matrix',
  ok: `${BEHAVIORS.length} public behavior export(s) have docs, unit, and browser ownership`,
});
