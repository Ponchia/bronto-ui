import { test } from 'node:test';
import assert from 'node:assert/strict';
import ui, { ui as uiNamed, cls, cx } from '../classes/index.js';

test('cx flattens nested arrays at any depth and skips falsy', () => {
  assert.equal(cx(['a', [false, 'b'], [['c']]]), 'a b c');
  assert.equal(cx('x', null, undefined, false, 0, '', 'y'), 'x y');
  assert.equal(cx(), '');
});

test('cls is the frozen registry', () => {
  assert.ok(Object.isFrozen(cls));
  assert.equal(cls.button, 'ui-button');
  assert.equal(cls.report, 'ui-report');
  assert.equal(cls.reportSection, 'ui-report__section');
  assert.equal(cls.reportSectionUnnumbered, 'ui-report__section--unnumbered');
  assert.equal(cls.compare, 'ui-compare');
  assert.equal(cls.legend, 'ui-legend');
  assert.equal(cls.legendSwatch, 'ui-legend__swatch');
  assert.equal(cls.annotation, 'ui-annotation');
  assert.equal(cls.annotationSubject, 'ui-annotation__subject');
  assert.equal(cls.annotationConnector, 'ui-annotation__connector');
  assert.equal(cls.annotationNote, 'ui-annotation__note');
  assert.equal(cls.annotationCallout, 'ui-annotation--callout');
  assert.equal(cls.annotationBracket, 'ui-annotation--bracket');
  assert.equal(cls.annotationBand, 'ui-annotation--band');
  assert.equal(cls.annotationDraw, 'ui-annotation--draw');
  assert.equal(cls.annotationAccent, 'ui-annotation--accent');
  assert.equal(cls.printOnly, 'ui-print-only');
});

test('default export === named ui', () => {
  assert.equal(ui, uiNamed);
});

test('recipes emit only registry classes', () => {
  assert.equal(ui.button(), 'ui-button');
  assert.equal(ui.button({ variant: 'ghost' }), 'ui-button ui-button--ghost');
  assert.equal(
    ui.button({ variant: 'danger', icon: true }),
    'ui-button ui-button--danger ui-button--icon',
  );
  assert.equal(ui.badge({ tone: 'success' }), 'ui-badge ui-badge--success');
  assert.equal(ui.dot({ tone: 'accent', live: true }), 'ui-dot ui-dot--accent ui-dot--live');
  assert.equal(
    ui.table({ density: 'dense', lined: true }),
    'ui-table ui-table--dense ui-table--lined',
  );
  assert.equal(
    ui.card({ accent: true, interactive: true }),
    'ui-card ui-card--accent ui-card--interactive',
  );
});

test('unknown option values are ignored, not emitted', () => {
  assert.equal(ui.button({ variant: 'bogus' }), 'ui-button');
  assert.equal(ui.badge({ tone: 'bogus' }), 'ui-badge');
});

test('the recipes added this cycle emit only registry classes', () => {
  assert.equal(ui.alert(), 'ui-alert');
  assert.equal(ui.alert({ tone: 'danger' }), 'ui-alert ui-alert--danger');
  assert.equal(ui.toast({ tone: 'success' }), 'ui-toast ui-toast--success');
  assert.equal(ui.progress({ indeterminate: true }), 'ui-progress ui-progress--indeterminate');
  assert.equal(ui.dotspinner({ size: 'lg' }), 'ui-dotspinner ui-dotspinner--lg');
  assert.equal(ui.dotbar({ indeterminate: true }), 'ui-dotbar ui-dotbar--indeterminate');
  assert.equal(ui.modal({ drawer: true }), 'ui-modal ui-modal--drawer');
  assert.equal(ui.tab({ active: true }), 'ui-tab is-active');
  assert.equal(ui.avatar({ size: 'sm' }), 'ui-avatar ui-avatar--sm');
  assert.equal(ui.prose({ compact: true }), 'ui-prose ui-prose--compact');
  assert.equal(ui.alert({ tone: 'bogus' }), 'ui-alert');
  assert.equal(ui.dotspinner({ size: 'bogus' }), 'ui-dotspinner');
  assert.equal(ui.meter(), 'ui-meter');
  assert.equal(ui.meter({ tone: 'success' }), 'ui-meter ui-meter--success');
  assert.equal(ui.meter({ tone: 'bogus' }), 'ui-meter');
  assert.equal(ui.delta(), 'ui-delta');
  assert.equal(ui.delta({ dir: 'up' }), 'ui-delta ui-delta--up');
  assert.equal(ui.delta({ dir: 'down', invert: true }), 'ui-delta ui-delta--down ui-delta--invert');
  assert.equal(ui.delta({ dir: 'flat' }), 'ui-delta ui-delta--flat');
  assert.equal(ui.delta({ dir: 'bogus' }), 'ui-delta');
  assert.equal(ui.compare(), 'ui-compare');
  assert.equal(ui.compare({ cols: 2 }), 'ui-compare ui-compare--2up');
  assert.equal(ui.compare({ cols: 3 }), 'ui-compare');
  assert.equal(ui.inputIcon(), 'ui-input-icon');
  assert.equal(ui.inputIcon({ end: true }), 'ui-input-icon ui-input-icon--end');
  assert.equal(ui.annotation(), 'ui-annotation ui-annotation--callout ui-annotation--accent');
  assert.equal(
    ui.annotation({ variant: 'circle', tone: 'warning' }),
    'ui-annotation ui-annotation--circle ui-annotation--warning',
  );
  assert.equal(
    ui.annotation({ variant: 'bracket', tone: 'info', motion: 'draw' }),
    'ui-annotation ui-annotation--bracket ui-annotation--info ui-annotation--draw',
  );
  assert.equal(
    ui.annotation({ variant: 'evidence', motion: 'focus' }),
    'ui-annotation ui-annotation--evidence ui-annotation--accent ui-annotation--focus',
  );
  assert.equal(ui.annotation({ variant: 'bogus', tone: 'bogus' }), 'ui-annotation');
  assert.equal(ui.legend(), 'ui-legend');
  assert.equal(
    ui.legend({ orient: 'vertical', type: 'gradient', diverging: true }),
    'ui-legend ui-legend--vertical ui-legend--gradient ui-legend--diverging',
  );
  assert.equal(
    ui.legend({ compact: true, withValues: true, interactive: true }),
    'ui-legend ui-legend--compact ui-legend--with-values ui-legend--interactive',
  );
  assert.equal(ui.legend({ type: 'threshold' }), 'ui-legend ui-legend--threshold');
  assert.equal(ui.legendItem(), 'ui-legend__item');
  assert.equal(ui.legendItem({ inactive: true }), 'ui-legend__item is-inactive');
  assert.equal(ui.legendSwatch(), 'ui-legend__swatch');
  assert.equal(ui.legendSwatch({ series: 3 }), 'ui-legend__swatch ui-legend__swatch--3');
  assert.equal(
    ui.legendSwatch({ series: 8, shape: 'circle' }),
    'ui-legend__swatch ui-legend__swatch--8 ui-legend__swatch--circle',
  );
  assert.equal(ui.legendSwatch({ series: 99, shape: 'bogus' }), 'ui-legend__swatch');
  assert.equal(ui.mark(), 'ui-mark');
  assert.equal(
    ui.mark({ style: 'underline', tone: 'accent', motion: 'draw' }),
    'ui-mark ui-mark--underline ui-mark--accent ui-mark--draw',
  );
  assert.equal(ui.mark({ style: 'box', tone: 'danger' }), 'ui-mark ui-mark--box ui-mark--danger');
  assert.equal(ui.mark({ style: 'bogus', tone: 'bogus' }), 'ui-mark');
  assert.equal(ui.bracketNote(), 'ui-bracket-note');
  assert.equal(ui.bracketNote({ tone: 'warning' }), 'ui-bracket-note ui-bracket-note--warning');
  assert.equal(ui.bracketNote({ tone: 'bogus' }), 'ui-bracket-note');
  assert.equal(ui.connector(), 'ui-connector');
  assert.equal(
    ui.connector({ tone: 'accent', dashed: true, motion: 'draw' }),
    'ui-connector ui-connector--accent ui-connector--dashed ui-connector--draw',
  );
  assert.equal(ui.connector({ tone: 'bogus' }), 'ui-connector');
  assert.equal(ui.spotlight(), 'ui-spotlight');
  assert.equal(ui.spotlight({ ring: true }), 'ui-spotlight ui-spotlight--ring');
  assert.equal(ui.crosshair(), 'ui-crosshair');
  assert.equal(ui.crosshair({ muted: true }), 'ui-crosshair ui-crosshair--muted');
  assert.equal(ui.sel(), 'ui-sel');
  assert.equal(ui.sel({ state: 'on' }), 'ui-sel ui-sel--on');
  assert.equal(ui.sel({ state: 'maybe' }), 'ui-sel ui-sel--maybe');
  assert.equal(ui.sel({ state: 'bogus' }), 'ui-sel');
});

test('sources/citation/provenance recipes', () => {
  assert.equal(ui.citation(), 'ui-citation');
  assert.equal(
    ui.citation({ chip: true, state: 'verified' }),
    'ui-citation ui-citation--chip ui-src--verified',
  );
  assert.equal(ui.citation({ state: 'bogus' }), 'ui-citation');
  assert.equal(ui.source(), 'ui-source-card');
  assert.equal(ui.source({ state: 'generated' }), 'ui-source-card ui-src--generated');
  assert.equal(ui.provenance({ state: 'reviewed' }), 'ui-provenance ui-src--reviewed');
  assert.equal(ui.provenance({ state: 'conflict' }), 'ui-provenance ui-src--conflict');
});

test('lifecycle state recipe', () => {
  assert.equal(ui.state(), 'ui-state');
  assert.equal(
    ui.state({ state: 'saving', busy: true }),
    'ui-state ui-state--saving ui-state--busy',
  );
  assert.equal(ui.state({ state: 'conflict' }), 'ui-state ui-state--conflict');
  assert.equal(ui.state({ state: 'needs-review' }), 'ui-state ui-state--needs-review');
  assert.equal(ui.state({ state: 'bogus' }), 'ui-state');
});

test('originLabel recipe (AI-trust)', () => {
  assert.equal(ui.originLabel(), 'ui-origin-label');
  assert.equal(ui.originLabel({ ai: true }), 'ui-origin-label ui-origin-label--ai');
});

test('every ui.* recipe is declared on the Ui interface in index.d.ts', async () => {
  const { readFileSync } = await import('node:fs');
  const dts = readFileSync(new URL('../classes/index.d.ts', import.meta.url), 'utf8');
  const declared = new Set([...dts.matchAll(/^\s*(\w+)\s*\(opts\?:/gm)].map((m) => m[1]));
  for (const name of Object.keys(ui)) {
    assert.ok(declared.has(name), `ui.${name} missing from Ui in index.d.ts`);
  }
});

// Closes the drift the method-presence check above can't see: the
// `Ui`/`*Opts` interface shapes in classes/index.d.ts are curated (not
// generated from the runtime), so an option could be declared in the
// type but silently unwired in the recipe — a consumer sets a typed
// option that does nothing. This parses every declared option and
// asserts the runtime recipe actually reacts to it.
test('every declared *Opts option is wired in its runtime recipe', async () => {
  const { readFileSync } = await import('node:fs');
  const dts = readFileSync(new URL('../classes/index.d.ts', import.meta.url), 'utf8');

  const recipeToOpts = Object.fromEntries(
    [...dts.matchAll(/^\s*(\w+)\(opts\?:\s*(\w+)\)/gm)].map((m) => [m[1], m[2]]),
  );

  const optionsOf = (iface) => {
    const m = dts.match(new RegExp(`export interface ${iface} \\{([\\s\\S]*?)\\n\\}`));
    if (!m) return [];
    return [...m[1].matchAll(/^\s*(\w+)\??:\s*([^;]+);/gm)].map(([, name, type]) => {
      const lits = [...type.matchAll(/'([^']+)'/g)].map((x) => x[1]); // every union literal
      const probes = lits.length ? lits : /boolean/.test(type) ? [true] : [];
      return { name, probes, isEnum: lits.length > 1 };
    });
  };

  let checked = 0;
  for (const [recipe, iface] of Object.entries(recipeToOpts)) {
    const base = ui[recipe]();
    for (const { name, probes, isEnum } of optionsOf(iface)) {
      if (probes.length === 0) continue; // non-enum/non-boolean: skip (none today)
      const outputs = probes.map((probe) => [probe, ui[recipe]({ [name]: probe })]);
      checked += outputs.length;
      // Wiring: at least one declared value must change the output from the
      // default — otherwise the option does nothing.
      assert.ok(
        outputs.some(([, out]) => out !== base),
        `${recipe}: declared option "${name}" (values ${JSON.stringify(probes)}) changes ` +
          `nothing — index.d.ts ${iface} and classes/index.js drifted`,
      );
      // Per-variant: distinct enum literals must map to distinct output, so an
      // unwired variant (silently collapsing to another) is caught — not just
      // the first literal, which an earlier version of this test only probed.
      if (isEnum) {
        const distinct = new Set(outputs.map(([, out]) => out));
        assert.equal(
          distinct.size,
          outputs.length,
          `${recipe}: enum option "${name}" has variants that collide to identical ` +
            `classes (${JSON.stringify(outputs)}) — a declared variant is unwired`,
        );
      }
    }
  }
  assert.ok(checked >= 40, `expected to exercise the option surface, only checked ${checked}`);
});
