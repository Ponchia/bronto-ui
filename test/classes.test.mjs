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
  assert.equal(ui.inputIcon(), 'ui-input-icon');
  assert.equal(ui.inputIcon({ end: true }), 'ui-input-icon ui-input-icon--end');
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
      const lit = type.match(/'([^']+)'/); // first union literal, e.g. 'ghost'
      return { name, probe: lit ? lit[1] : /boolean/.test(type) ? true : null };
    });
  };

  let checked = 0;
  for (const [recipe, iface] of Object.entries(recipeToOpts)) {
    const base = ui[recipe]();
    for (const { name, probe } of optionsOf(iface)) {
      if (probe === null) continue; // non-enum/non-boolean: skip (none today)
      const withOpt = ui[recipe]({ [name]: probe });
      assert.notEqual(
        withOpt,
        base,
        `${recipe}: declared option "${name}" (= ${JSON.stringify(probe)}) is not wired ` +
          `in the runtime recipe — index.d.ts ${iface} and classes/index.js drifted`,
      );
      checked++;
    }
  }
  assert.ok(checked >= 25, `expected to exercise the option surface, only checked ${checked}`);
});
