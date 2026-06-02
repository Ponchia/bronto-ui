import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildClassesJson } from '../scripts/gen-classes-json.mjs';
import { cls } from '../classes/index.js';

const m = buildClassesJson();
const allClasses = new Set(m.classes);

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
    assert.equal(g.base, base);
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
