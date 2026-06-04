import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildClassesJson } from '../scripts/gen-classes-json.mjs';
import { cls } from '../classes/index.js';
import * as behaviors from '../behaviors/index.js';

const m = buildClassesJson();
const allClasses = new Set(m.classes);
const behaviorExports = new Set(Object.keys(behaviors));

test('classes.json: counts match the data', () => {
  assert.equal(m.counts.classes, m.classes.length);
  assert.equal(m.counts.groups, Object.keys(m.groups).length);
});

test('classes.json: the flat list is exactly the cls values, sorted and unique', () => {
  const fromCls = [...new Set(Object.values(cls))].sort();
  assert.deepEqual(m.classes, fromCls);
});

test('classes.json: every group member is a real class under its base', () => {
  // Classification is coarse BEM: a member with `--` is a modifier (including
  // a part-modifier like `ui-crosshair__line--x`); a member with `__` and no
  // `--` is a part. Every member shares the base prefix by construction.
  for (const [base, g] of Object.entries(m.groups)) {
    // `g.base` is the standalone base class when it exists, else null for a
    // parts-only namespace (e.g. ui-themetoggle — __button/__track but no bare
    // .ui-themetoggle). Members still share the `base` key prefix either way. (C11.)
    if (g.base === null) {
      assert.ok(!allClasses.has(base), `group "${base}" has base:null but ${base} IS a real class`);
    } else {
      assert.equal(g.base, base);
      assert.ok(allClasses.has(base), `non-null base "${base}" must be in classes[]`);
    }
    for (const mod of g.modifiers) {
      assert.ok(allClasses.has(mod), `modifier ${mod} (group ${base}) not in classes[]`);
      assert.ok(mod.startsWith(base), `modifier ${mod} not under base ${base}`);
      assert.ok(mod.includes('--'), `modifier ${mod} has no -- separator`);
    }
    for (const part of g.parts) {
      assert.ok(allClasses.has(part), `part ${part} (group ${base}) not in classes[]`);
      assert.ok(part.startsWith(`${base}__`), `part ${part} not under base ${base}`);
      assert.ok(!part.includes('--'), `part ${part} should be a plain part (no --)`);
    }
  }
});

test('classes.json: output is byte-stable regardless of cls insertion order', () => {
  // The arrays sort by value, so a reorder of `cls` must not change output.
  assert.equal(JSON.stringify(buildClassesJson()), JSON.stringify(buildClassesJson()));
});

test('classes.json: states and customProperties are well-formed', () => {
  for (const s of m.states) {
    assert.match(s.class, /^is-[a-z-]+$/, `state ${s.class} is not an is-* hook`);
    assert.ok(s.scope && s.effect, `state ${s.class} missing scope/effect`);
    // A state hook must NOT also be a cls entry (it lives outside cls by design).
    assert.ok(!allClasses.has(s.class), `state ${s.class} should not be in cls`);
  }
  for (const p of m.customProperties) {
    assert.match(p.name, /^--[a-z-]+$/, `custom property ${p.name} is malformed`);
    assert.ok(p.on && p.example, `custom property ${p.name} missing on/example`);
  }
});

test('classes.json: rootAttributes are well-formed', () => {
  assert.ok(Array.isArray(m.rootAttributes) && m.rootAttributes.length, 'rootAttributes present');
  for (const a of m.rootAttributes) {
    assert.ok(a.name, 'rootAttribute missing name');
    assert.ok(a.on, `rootAttribute ${a.name} missing on`);
    assert.ok(Array.isArray(a.values) && a.values.length, `rootAttribute ${a.name} missing values`);
    assert.ok(a.note, `rootAttribute ${a.name} missing note`);
  }
  const byName = Object.fromEntries(m.rootAttributes.map((a) => [a.name, a]));
  assert.ok(byName['data-theme'], 'data-theme documented');
  assert.ok(byName['data-bronto-skin'], 'data-bronto-skin documented');
});

test('classes.json: behaviorAttributes + requiredAria are well-formed (C14/C18)', () => {
  assert.ok(
    Array.isArray(m.behaviorAttributes) && m.behaviorAttributes.length,
    'behaviorAttributes present',
  );
  for (const a of m.behaviorAttributes) {
    assert.match(a.name, /^data-bronto-[a-z-]+$/, `behaviorAttribute ${a.name} malformed`);
    assert.ok(a.on && a.behavior && a.note, `behaviorAttribute ${a.name} missing on/behavior/note`);
    // The named behavior must be a REAL export of the barrel — not just init*-shaped.
    // (The old /^init/ regex passed `initDismissible`, which doesn't exist; the
    // real export is `dismissible`. That is the initForms→initFormValidation class
    // of contract lie this manifest must not ship — component audit C2/C32.)
    assert.ok(
      behaviorExports.has(a.behavior),
      `behaviorAttribute ${a.name} names "${a.behavior}()" — not an export of behaviors/index.js`,
    );
  }
  const hooks = new Set(m.behaviorAttributes.map((a) => a.name));
  for (const h of ['data-bronto-open', 'data-bronto-popover', 'data-bronto-dismiss']) {
    assert.ok(hooks.has(h), `${h} documented`);
  }

  assert.ok(Array.isArray(m.requiredAria) && m.requiredAria.length, 'requiredAria present');
  for (const r of m.requiredAria) {
    assert.match(r.on, /^\.ui-/, `requiredAria entry ${r.on} should target a .ui- class`);
    assert.ok(r.require, `requiredAria ${r.on} missing require`);
  }
  const ariaFor = new Set(m.requiredAria.map((r) => r.on));
  for (const c of ['.ui-progress', '.ui-meter', '.ui-error-summary']) {
    assert.ok(ariaFor.has(c), `${c} requiredAria documented`);
  }
});
